import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { timingSafeEqual, createHash } from "crypto";
import { headers } from "next/headers";
import { connectToDatabase } from "./db";
import AdminUser from "../models/AdminUser";
import { assertSecureEnv, IS_PRODUCTION, USE_SECURE_COOKIES } from "@/lib/security/env";
import { checkRateLimit, resetRateLimit } from "@/lib/security/rateLimit";
import { logSecurityEvent, maskEmail } from "@/lib/security/audit";

/** Cost factor for new hashes. 12 is the current sensible floor for bcrypt. */
const BCRYPT_ROUNDS = 12;

/**
 * Single message for every failure mode, so responses can't be used to tell
 * "no such account" from "wrong password".
 */
const GENERIC_AUTH_ERROR = "Invalid email or password";

/**
 * Length-independent, constant-time string comparison.
 *
 * `timingSafeEqual` throws on length mismatch and comparing raw buffers would
 * leak length, so both sides are hashed to a fixed 32 bytes first.
 */
function secureCompare(a: string, b: string): boolean {
  const digestA = createHash("sha256").update(a, "utf8").digest();
  const digestB = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(digestA, digestB);
}

/**
 * Best-effort client IP for login throttling.
 *
 * NextAuth's credentials `authorize` callback doesn't receive the raw request,
 * so the incoming headers are read from the request context instead. See
 * getClientIp() in lib/security/http.ts for why the LAST forwarded hop is used.
 */
async function getLoginIp(): Promise<string> {
  try {
    const headerList = await headers();
    const realIp = headerList.get("x-real-ip")?.trim();
    if (realIp) return realIp;
    const forwarded = headerList.get("x-forwarded-for");
    if (forwarded) {
      const hops = forwarded.split(",").map((h) => h.trim()).filter(Boolean);
      if (hops.length > 0) return hops[hops.length - 1];
    }
  } catch {
    // Outside a request scope (e.g. a script importing authOptions).
  }
  return "unknown";
}

/**
 * Bootstrap login via SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
 *
 * This path exists so a fresh deployment can get its first admin created
 * without shell access, but it used to behave as a permanent master password:
 * it matched with `===`, and on every successful use it silently overwrote the
 * stored bcrypt hash to match the env value. That made an env-var leak an
 * unrevocable backdoor, and it made rotating the real admin password in the
 * database impossible while the env var remained set.
 *
 * It is now strictly a bootstrap:
 *   - compared in constant time;
 *   - only honoured while NO admin account exists yet (it creates the first
 *     one), so it can neither log into nor reset an existing account;
 *   - refused in production unless ALLOW_ADMIN_BOOTSTRAP=true is set, making
 *     the window explicit and closable.
 */
async function tryBootstrapAdmin(email: string, password: string) {
  const seedEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const seedPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!seedEmail || !seedPassword) return null;

  const emailMatches = secureCompare(email, seedEmail);
  const passwordMatches = secureCompare(password, seedPassword);
  if (!emailMatches || !passwordMatches) return null;

  if (IS_PRODUCTION && process.env.ALLOW_ADMIN_BOOTSTRAP !== "true") {
    logSecurityEvent("auth.login.blocked", {
      actor: maskEmail(email),
      reason: "bootstrap_disabled_in_production",
    });
    return null;
  }

  await connectToDatabase();

  const adminCount = await AdminUser.countDocuments({});
  if (adminCount > 0) {
    // An admin already exists, so the bootstrap credential is spent — that
    // account's own password is the only way in from here.
    logSecurityEvent("auth.login.blocked", {
      actor: maskEmail(email),
      reason: "bootstrap_refused_admin_already_exists",
    });
    return null;
  }

  const passwordHash = await bcrypt.hash(seedPassword, BCRYPT_ROUNDS);
  const created = await AdminUser.create({
    name: "System Admin",
    email: seedEmail,
    passwordHash,
    role: "superadmin",
  });

  logSecurityEvent("auth.bootstrap.admin_created", {
    actor: maskEmail(seedEmail),
    reason: "first_admin_created_via_env_bootstrap",
  });

  return {
    id: created._id.toString(),
    email: created.email,
    name: created.name,
    role: created.role,
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validated per request rather than at import time: module scope is also
        // evaluated by `next build`, where deployment secrets aren't present.
        // In production a missing/weak NEXTAUTH_SECRET throws here, so logins
        // fail loudly instead of minting weakly-signed session tokens.
        assertSecureEnv();

        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter email and password");
        }

        const email = credentials.email.trim().toLowerCase();
        const ip = await getLoginIp();

        // Brute-force gate, per source IP. Consumed BEFORE any bcrypt work, so a
        // flood can't burn CPU or database connections.
        const ipLimit = await checkRateLimit("login", ip, { route: "/api/auth/callback/credentials" });
        if (!ipLimit.success) {
          logSecurityEvent("auth.login.blocked", { ip, actor: maskEmail(email), reason: "ip_rate_limited" });
          throw new Error("Too many login attempts. Please try again later.");
        }

        /**
         * Records a failed attempt and returns the generic error to throw.
         *
         * The per-account budget is consumed HERE — after verification, and only
         * on failure. An earlier version checked it before verifying the
         * password, which handed any anonymous caller a denial-of-service against
         * the administrator: ~20 wrong guesses for a known admin address locked
         * the real admin out of the panel for the whole window, repeatable
         * indefinitely. Counting only failures keeps the brute-force bound while
         * guaranteeing that a CORRECT password is never rejected by a counter.
         */
        const recordFailure = async (reason: string) => {
          const budget = await checkRateLimit("loginFailuresPerAccount", email, {
            route: "/api/auth/callback/credentials",
          });
          logSecurityEvent(budget.success ? "auth.login.failure" : "auth.login.blocked", {
            ip,
            actor: maskEmail(email),
            reason: budget.success ? reason : `${reason}:account_failure_budget_exhausted`,
          });
          return new Error(GENERIC_AUTH_ERROR);
        };

        const bootstrapped = await tryBootstrapAdmin(email, credentials.password);
        if (bootstrapped) {
          await resetRateLimit("login", ip);
          await resetRateLimit("loginFailuresPerAccount", email);
          logSecurityEvent("auth.login.success", { ip, actor: maskEmail(email), reason: "bootstrap" });
          return bootstrapped;
        }

        await connectToDatabase();
        const user = await AdminUser.findOne({ email });

        if (!user) {
          // Spend comparable time on a missing account so response timing can't
          // distinguish it from a wrong password (user enumeration).
          await bcrypt.compare(
            credentials.password,
            "$2a$12$rHquKZFbYtNjRQTFCcKcteI3JQwLJcHXvpS7HFXTPmiIkMmwuMy9C"
          );
          throw await recordFailure("unknown_account");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isPasswordValid) {
          throw await recordFailure("bad_password");
        }

        // A successful login clears the throttle so an admin who mistyped a few
        // times isn't left throttled for the rest of the window.
        await resetRateLimit("login", ip);
        await resetRateLimit("loginFailuresPerAccount", email);
        logSecurityEvent("auth.login.success", { ip, actor: maskEmail(email) });

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    // Shorter than the previous 24h: this token is the only thing between a
    // stolen cookie and full admin access.
    maxAge: 8 * 60 * 60,
    updateAge: 60 * 60,
  },
  jwt: {
    maxAge: 8 * 60 * 60,
  },
  cookies: {
    // Pinned explicitly rather than left to defaults, so the flags are
    // auditable here. httpOnly keeps the token away from any XSS payload;
    // SameSite=Lax is what blocks cross-site state-changing requests to the
    // admin API (this app has no other CSRF token on those routes).
    sessionToken: {
      name: USE_SECURE_COOKIES ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: USE_SECURE_COOKIES,
      },
    },
    callbackUrl: {
      name: USE_SECURE_COOKIES ? "__Secure-next-auth.callback-url" : "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: USE_SECURE_COOKIES,
      },
    },
    csrfToken: {
      // __Host- requires secure + path=/ + no Domain, all of which hold here.
      name: USE_SECURE_COOKIES ? "__Host-next-auth.csrf-token" : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: USE_SECURE_COOKIES,
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: unknown }).id = token.id;
        (session.user as { role?: unknown }).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  // NextAuth's debug output includes token and callback details — never on.
  debug: false,
  secret: process.env.NEXTAUTH_SECRET,
};
