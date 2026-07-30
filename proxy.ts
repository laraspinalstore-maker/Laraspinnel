import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { logSecurityEvent } from "@/lib/security/audit";
import { USE_SECURE_COOKIES } from "@/lib/security/env";
import { isAdminRole } from "@/lib/security/roles";

/**
 * Edge proxy (Next 16's replacement for middleware.ts).
 *
 * Two jobs: gate /admin pages behind an admin session, and apply a coarse
 * per-IP rate limit to /api as a backstop under the per-route policies.
 *
 * This is a convenience gate, NOT the security boundary. Middleware/proxy
 * bypasses are a recurring class of Next.js advisory (see SECURITY.md), so
 * every admin page and every /api/admin route independently verifies the
 * session server-side. Deleting this file must not grant anyone access.
 */

/**
 * Resolves the client IP.
 *
 * `x-forwarded-for` is client-prependable, so its LAST hop (appended by the
 * platform) is the only entry that can't be forged. Keep in sync with
 * getClientIp() in lib/security/http.ts.
 */
function getClientIp(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }
  return "unknown";
}

/** Exactly /admin/login (or a subpath), not /admin/login-backdoor. */
function isLoginPath(path: string): boolean {
  return path === "/admin/login" || path.startsWith("/admin/login/");
}

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect admin pages, except the login screen itself.
  if (path.startsWith("/admin") && !isLoginPath(path)) {
    let token: Awaited<ReturnType<typeof getToken>> = null;
    try {
      token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        // Pinned to the same names lib/auth.ts sets, rather than left to
        // getToken's own inference. It normally infers `secureCookie` from
        // NEXTAUTH_URL while lib/auth.ts derives the name from NODE_ENV — if
        // those two ever disagree, getToken looks for a cookie that was never
        // set and this gate silently sees "no session" for every request,
        // locking out the real admin.
        secureCookie: USE_SECURE_COOKIES,
        cookieName: USE_SECURE_COOKIES ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      });
    } catch (error) {
      // getToken has historically thrown on malformed Authorization headers.
      // An exception here must deny access rather than bubble out as a 500 —
      // or, worse, be mistaken for "the check passed".
      console.error("[proxy] getToken failed", error);
      token = null;
    }

    const role = token?.role;

    if (!token || !isAdminRole(role)) {
      logSecurityEvent("authz.denied", {
        ip: getClientIp(request),
        action: `page:${path}`,
        reason: !token ? "no_session" : "insufficient_role",
      });
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Coarse backstop for the whole API surface. The per-route policies in
  // lib/security/rateLimit.ts do the real work; this only blunts broad floods.
  if (path.startsWith("/api/")) {
    const ip = getClientIp(request);
    const { success, retryAfterSeconds } = await checkRateLimit("apiGlobal", ip, { route: path });

    if (!success) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, retryAfterSeconds || 60)) },
      });
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-DNS-Prefetch-Control", "on");
  return response;
}

export const config = {
  matcher: [
    "/admin",
    // Lookahead pinned to a full segment so /admin/login-backdoor stays gated.
    "/admin/((?!login$|login/).*)",
    "/api/:path*",
  ],
};
