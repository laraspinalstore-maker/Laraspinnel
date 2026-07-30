import { NextRequest, NextResponse } from "next/server";
import { uploadImageToImageKit } from "@/lib/imagekit";
import {
  requireAdmin,
  isDenied,
  getClientIp,
  serverError,
  badRequest,
  tooManyRequests,
} from "@/lib/security/http";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { validateUpload, buildSafeFileName } from "@/lib/security/files";
import { logSecurityEvent, maskEmail } from "@/lib/security/audit";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

// Legacy image-upload endpoint kept for backward compatibility with any admin
// form still pointing at /api/upload. Same guarantees as /api/admin/upload:
// admin role required, content verified by magic bytes, filename generated
// server-side. Images only.
export async function POST(req: NextRequest) {
  try {
    // 1. Require an authenticated admin session with an admin role.
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    const ip = getClientIp(req);
    const { success, retryAfterSeconds } = await checkRateLimit("adminUpload", auth.admin.id || ip, {
      route: "/api/upload",
    });
    if (!success) {
      return tooManyRequests("Too many uploads. Please slow down.", retryAfterSeconds);
    }

    // 2. Parse FormData
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return badRequest("No file uploaded");
    }

    // 3. Validate real content type and size.
    const validated = await validateUpload(file, {
      allow: ["image"],
      maxImageBytes: MAX_IMAGE_BYTES,
      maxVideoBytes: MAX_IMAGE_BYTES,
    });

    if (!validated.ok) {
      logSecurityEvent("upload.rejected", {
        ip,
        actor: maskEmail(auth.admin.email),
        route: "/api/upload",
        reason: validated.reason,
        declaredType: file.type,
      });
      return NextResponse.json({ error: validated.error }, { status: validated.status });
    }

    // 4. Upload under a server-generated filename.
    const uploadResponse = await uploadImageToImageKit(
      validated.buffer,
      buildSafeFileName(file.name, validated.type.extension, "image")
    );

    logSecurityEvent("upload.accepted", {
      ip,
      actor: maskEmail(auth.admin.email),
      route: "/api/upload",
      mime: validated.type.mime,
      bytes: validated.buffer.length,
    });

    return NextResponse.json({
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
    });
  } catch (error) {
    return serverError("upload:POST", error, "Failed to upload image.");
  }
}
