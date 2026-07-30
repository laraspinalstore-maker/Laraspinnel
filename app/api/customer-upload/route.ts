import { NextRequest, NextResponse } from "next/server";
import {
  uploadImageToImageKit,
  deleteCustomerUploadByUrl,
  CUSTOMER_UPLOAD_FOLDER,
} from "@/lib/imagekit";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { getClientIp, serverError, badRequest, tooManyRequests, readJsonBody } from "@/lib/security/http";
import { validateUpload, buildSafeFileName } from "@/lib/security/files";
import { logSecurityEvent } from "@/lib/security/audit";
import { isOwnImageKitUrl } from "@/lib/security/sanitize";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

// Public endpoint — customers use this to attach a reference image to their
// order customization request (e.g. a photo to recreate, a color swatch).
//
// It is unauthenticated by design, so it treats its input as hostile: the file's
// real bytes are checked (not the client-declared Content-Type), the stored
// filename is generated server-side, and everything lands in a dedicated folder
// that the matching DELETE is pinned to.
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { success, retryAfterSeconds } = await checkRateLimit("customerUpload", ip, {
      route: "/api/customer-upload",
    });
    if (!success) {
      return tooManyRequests(
        "Too many uploads. Please wait a moment and try again.",
        retryAfterSeconds
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return badRequest("No file uploaded");
    }

    const validated = await validateUpload(file, {
      allow: ["image"],
      maxImageBytes: MAX_IMAGE_BYTES,
      maxVideoBytes: MAX_IMAGE_BYTES,
    });

    if (!validated.ok) {
      logSecurityEvent("upload.rejected", {
        ip,
        route: "/api/customer-upload",
        reason: validated.reason,
        declaredType: file.type,
        declaredSize: file.size,
      });
      return NextResponse.json({ error: validated.error }, { status: validated.status });
    }

    const uploadResponse = await uploadImageToImageKit(
      validated.buffer,
      buildSafeFileName(file.name, validated.type.extension, "customization"),
      CUSTOMER_UPLOAD_FOLDER
    );

    logSecurityEvent("upload.accepted", {
      ip,
      route: "/api/customer-upload",
      mime: validated.type.mime,
      bytes: validated.buffer.length,
    });

    return NextResponse.json({
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
    });
  } catch (error) {
    return serverError("customer-upload:POST", error, "Failed to upload image. Please try again.");
  }
}

// Lets a customer remove a reference image they just uploaded (before placing
// the order) without leaving an orphaned file in ImageKit storage.
//
// SECURITY: this route is unauthenticated, so deletion is confined to the
// customer-uploads folder. Previously it forwarded any URL to a helper that fell
// back to matching on filename alone, which allowed anonymous destruction of
// product and banner images.
export async function DELETE(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { success, retryAfterSeconds } = await checkRateLimit("customerUploadDelete", ip, {
      route: "/api/customer-upload",
    });
    if (!success) {
      return tooManyRequests("Too many requests. Please wait a moment.", retryAfterSeconds);
    }

    const body = await readJsonBody<{ url?: unknown }>(req, 4 * 1024);
    if (!body.ok) return body.response;

    const url = typeof body.data?.url === "string" ? body.data.url : "";
    if (!url) {
      return badRequest("No image URL provided");
    }

    if (!isOwnImageKitUrl(url)) {
      logSecurityEvent("upload.rejected", {
        ip,
        route: "/api/customer-upload",
        action: "DELETE",
        reason: "url_not_own_imagekit",
      });
      return badRequest("That image URL is not recognised.");
    }

    const deleted = await deleteCustomerUploadByUrl(url);

    if (deleted) {
      logSecurityEvent("upload.deleted", { ip, route: "/api/customer-upload" });
    } else {
      logSecurityEvent("upload.rejected", {
        ip,
        route: "/api/customer-upload",
        action: "DELETE",
        reason: "not_found_or_outside_customer_folder",
      });
    }

    // The response is intentionally identical either way: a customer removing
    // their own draft image gets the same answer as a probe for someone else's
    // file, so this can't be used to test which assets exist.
    return NextResponse.json({ message: "Image removed" });
  } catch (error) {
    return serverError("customer-upload:DELETE", error, "Failed to remove image.");
  }
}
