import { NextRequest, NextResponse } from "next/server";
import { uploadImageToImageKit, deleteImageByUrl } from "@/lib/imagekit";
import {
  requireAdmin,
  isDenied,
  getClientIp,
  serverError,
  badRequest,
  tooManyRequests,
  readJsonBody,
} from "@/lib/security/http";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { validateUpload, buildSafeFileName } from "@/lib/security/files";
import { logSecurityEvent, maskEmail } from "@/lib/security/audit";
import { isOwnImageKitUrl } from "@/lib/security/sanitize";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  try {
    // 1. Verify admin session AND role.
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    const ip = getClientIp(req);
    const { success, retryAfterSeconds } = await checkRateLimit("adminUpload", auth.admin.id || ip, {
      route: "/api/admin/upload",
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

    // 3. Validate by magic bytes rather than the client-declared MIME type, and
    //    cap size per detected kind (videos keep the larger allowance).
    const validated = await validateUpload(file, {
      allow: ["image", "video"],
      maxImageBytes: MAX_IMAGE_BYTES,
      maxVideoBytes: MAX_VIDEO_BYTES,
    });

    if (!validated.ok) {
      logSecurityEvent("upload.rejected", {
        ip,
        actor: maskEmail(auth.admin.email),
        route: "/api/admin/upload",
        reason: validated.reason,
        declaredType: file.type,
      });
      return NextResponse.json({ error: validated.error }, { status: validated.status });
    }

    // 4. Upload under a server-generated filename.
    const uploadResponse = await uploadImageToImageKit(
      validated.buffer,
      buildSafeFileName(file.name, validated.type.extension, "media")
    );

    logSecurityEvent("upload.accepted", {
      ip,
      actor: maskEmail(auth.admin.email),
      route: "/api/admin/upload",
      mime: validated.type.mime,
      bytes: validated.buffer.length,
    });

    return NextResponse.json({
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
    });
  } catch (error) {
    return serverError("admin-upload:POST", error, "Failed to upload file.");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    const body = await readJsonBody<{ url?: unknown }>(req, 4 * 1024);
    if (!body.ok) return body.response;

    const url = typeof body.data?.url === "string" ? body.data.url : "";
    if (!url) {
      return badRequest("No image URL provided");
    }

    // Even for an admin, restrict deletion to this account's own storage so a
    // malformed or hostile value can't be aimed at an unrelated URL.
    if (!isOwnImageKitUrl(url)) {
      return badRequest("That image URL is not hosted on this account.");
    }

    const deleted = await deleteImageByUrl(url);

    logSecurityEvent("upload.deleted", {
      actor: maskEmail(auth.admin.email),
      route: "/api/admin/upload",
      reason: deleted ? "deleted" : "no_exact_match",
    });

    return NextResponse.json({ message: deleted ? "Image deleted" : "Image not found in storage" });
  } catch (error) {
    return serverError("admin-upload:DELETE", error, "Failed to delete image.");
  }
}
