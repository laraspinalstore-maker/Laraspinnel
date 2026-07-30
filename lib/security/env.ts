/**
 * Startup validation for security-critical environment variables.
 *
 * The app previously trusted `process.env` blindly, so a deploy that was
 * missing NEXTAUTH_SECRET (or shipped a placeholder one) would still boot and
 * silently issue session tokens signed with a weak/derived key. This module
 * turns those into loud failures in production while keeping local dev usable.
 *
 * Import it from anywhere that touches auth or the database — `lib/auth.ts`
 * and `lib/db.ts` both do, which covers every server entry point in practice.
 */

const MIN_SECRET_LENGTH = 32;
const MIN_ADMIN_PASSWORD_LENGTH = 12;

/** Obvious placeholders that must never reach production. */
const PLACEHOLDER_PATTERNS = [
  /^<.*>$/,
  /^changeme$/i,
  /^secret$/i,
  /^password$/i,
  /^generate-with/i,
  /^your[-_]/i,
  /^admin$/i,
  /^test$/i,
];

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * True while `next build` is collecting page data.
 *
 * The build evaluates route modules with NODE_ENV=production but without the
 * deployment's runtime secrets, so validation must never throw here — that would
 * turn a missing env var into a failed build instead of a clear runtime error.
 * Checks still run (and warn) at build time; they only become fatal on a real
 * request.
 */
export const IS_BUILD_PHASE =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-export";

/** True for a loopback host — i.e. a developer machine, not a deployment. */
function isLocalUrl(value: string): boolean {
  if (!value) return false;
  try {
    const { hostname } = new URL(value);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1";
  } catch {
    return false;
  }
}

/**
 * True when this is a production BUILD being served from localhost.
 *
 * `npm run start` sets NODE_ENV=production, so NODE_ENV alone cannot tell a real
 * deployment apart from a developer testing a production build. Treating the
 * latter as production made the checks below fatal on a normal local workflow.
 * Problems are still reported here — just as warnings rather than a hard stop.
 */
export const IS_LOCAL_DEPLOYMENT = isLocalUrl(process.env.NEXTAUTH_URL ?? "");

/**
 * Whether session cookies get the `__Secure-`/`__Host-` prefix and the `secure`
 * flag.
 *
 * Derived from the actual URL scheme, not from NODE_ENV. Browsers silently drop a
 * `Secure` cookie sent over plain HTTP, so keying this off NODE_ENV meant
 * `npm run start` on http://localhost issued a cookie the browser threw away —
 * login would appear to succeed and then immediately log you out.
 */
export const USE_SECURE_COOKIES = (process.env.NEXTAUTH_URL ?? "").startsWith("https://")
  ? true
  : IS_PRODUCTION && !IS_LOCAL_DEPLOYMENT && !process.env.NEXTAUTH_URL;

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some((re) => re.test(value.trim()));
}

/** Shannon-entropy floor, to reject `aaaaaaaa…`-style "long" secrets. */
function hasSufficientEntropy(value: string): boolean {
  const unique = new Set(value).size;
  return unique >= 12;
}

export interface EnvIssue {
  variable: string;
  message: string;
  severity: "error" | "warning";
}

/**
 * Collects every problem rather than throwing on the first one, so an operator
 * fixing a bad deploy sees the whole list at once.
 */
export function collectEnvIssues(): EnvIssue[] {
  const issues: EnvIssue[] = [];

  const secret = process.env.NEXTAUTH_SECRET ?? "";
  if (!secret) {
    issues.push({
      variable: "NEXTAUTH_SECRET",
      message: "is not set. Session tokens cannot be signed securely. Generate one with: openssl rand -hex 32",
      severity: "error",
    });
  } else if (secret.length < MIN_SECRET_LENGTH) {
    issues.push({
      variable: "NEXTAUTH_SECRET",
      message: `is only ${secret.length} characters. Use at least ${MIN_SECRET_LENGTH} (openssl rand -hex 32).`,
      severity: "error",
    });
  } else if (isPlaceholder(secret) || !hasSufficientEntropy(secret)) {
    issues.push({
      variable: "NEXTAUTH_SECRET",
      message: "looks like a placeholder or has too little entropy. Generate a fresh one: openssl rand -hex 32",
      severity: "error",
    });
  }

  if (!process.env.MONGODB_URI) {
    issues.push({
      variable: "MONGODB_URI",
      message: "is not set. The application cannot reach its database.",
      severity: "error",
    });
  }

  if (IS_PRODUCTION) {
    const nextAuthUrl = process.env.NEXTAUTH_URL ?? "";
    if (!nextAuthUrl) {
      issues.push({
        variable: "NEXTAUTH_URL",
        message: "is not set. Required in production so callback URLs and cookies resolve to the real origin.",
        severity: "error",
      });
    } else if (!nextAuthUrl.startsWith("https://")) {
      // Plain HTTP on localhost is a normal `npm run start` check, not a
      // misconfigured deployment — report it without failing the run.
      issues.push({
        variable: "NEXTAUTH_URL",
        message: isLocalUrl(nextAuthUrl)
          ? "is http://localhost. Fine for a local production build; a real deployment must use https:// or the browser will reject the session cookie."
          : "must use https:// in production — secure cookies are rejected over plain HTTP.",
        severity: isLocalUrl(nextAuthUrl) ? "warning" : "error",
      });
    }

    // The bootstrap admin credentials are a break-glass mechanism, not a
    // long-lived login. If they are present in production they must at least
    // be strong; see lib/auth.ts for how narrowly they are honoured.
    const seedPassword = process.env.SEED_ADMIN_PASSWORD;
    if (seedPassword) {
      // On localhost this is a dev convenience, so it warns. On a real
      // deployment a weak bootstrap credential is a genuine way in — see
      // SECURITY.md §2 — so it stays fatal there.
      const seedSeverity = IS_LOCAL_DEPLOYMENT ? "warning" : "error";
      if (seedPassword.length < MIN_ADMIN_PASSWORD_LENGTH) {
        issues.push({
          variable: "SEED_ADMIN_PASSWORD",
          message: `is shorter than ${MIN_ADMIN_PASSWORD_LENGTH} characters. Use a long, unique password, or unset it once a real admin exists.`,
          severity: seedSeverity,
        });
      } else if (isPlaceholder(seedPassword)) {
        issues.push({
          variable: "SEED_ADMIN_PASSWORD",
          message: "is a placeholder value. Set a real password or unset it.",
          severity: seedSeverity,
        });
      }
    }

    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      issues.push({
        variable: "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN",
        message:
          "are not both set. Rate limiting will fall back to per-instance memory, which does not hold across serverless instances.",
        severity: "warning",
      });
    }
  }

  return issues;
}

let hasLoggedIssues = false;

/**
 * Validates the environment.
 *
 * Call this at REQUEST time (see lib/auth.ts's authorize() and requireAdmin()),
 * not at module scope — module scope is also evaluated during `next build`,
 * where the deployment's secrets legitimately aren't present.
 *
 * Throws in production when anything is an error, so a misconfigured deploy
 * fails visibly instead of silently issuing weakly-signed sessions. Warns
 * instead during development and during the build phase.
 */
export function assertSecureEnv(): void {
  const issues = collectEnvIssues();
  if (issues.length === 0) return;

  const format = (i: EnvIssue) => `  - ${i.variable} ${i.message}`;
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  // Logged once per process; the throw below still happens on every request.
  if (!hasLoggedIssues) {
    hasLoggedIssues = true;
    if (warnings.length > 0) {
      console.warn(`[env] Security warnings:\n${warnings.map(format).join("\n")}`);
    }
    if (errors.length > 0) {
      console.error(`[env] Insecure environment configuration:\n${errors.map(format).join("\n")}`);
    }
  }

  if (errors.length === 0) return;

  const message = `Insecure environment configuration:\n${errors.map(format).join("\n")}`;

  // Fatal only for a real deployment. A production build served from localhost
  // (`npm run start`) reports and continues — otherwise a routine local check of
  // the production bundle would be unable to log in at all.
  if (IS_PRODUCTION && !IS_BUILD_PHASE && !IS_LOCAL_DEPLOYMENT) {
    throw new Error(message);
  }
}
