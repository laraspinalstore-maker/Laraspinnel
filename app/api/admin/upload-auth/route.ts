import { NextRequest, NextResponse } from "next/server";
import imagekit from "@/lib/imagekit";
import { requireAdmin, isDenied, getClientIp, serverError, tooManyRequests } from "@/lib/security/http";
import { checkRateLimit } from "@/lib/security/rateLimit";

/**
 * Issues short-lived ImageKit client-upload credentials so the admin browser
 * can upload large files (reel videos) DIRECTLY to ImageKit, bypassing the
 * hosting platform's request-body size limit (~4.5 MB on Vercel) that a
 * proxied upload through /api/admin/upload is subject to.
 *
 * Admin-only: the signature is derived from the private key, so this must
 * never be exposed to unauthenticated callers.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    const ip = getClientIp(req);
    const { success, retryAfterSeconds } = await checkRateLimit("adminUpload", auth.admin.id || ip, {
      route: "/api/admin/upload-auth",
    });
    if (!success) {
      return tooManyRequests("Too many uploads. Please slow down.", retryAfterSeconds);
    }

    const { token, expire, signature } = imagekit.getAuthenticationParameters();

    return NextResponse.json({
      token,
      expire,
      signature,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
    });
  } catch (error) {
    return serverError("admin-upload-auth:GET", error, "Failed to prepare upload.");
  }
}
