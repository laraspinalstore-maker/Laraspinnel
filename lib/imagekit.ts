import ImageKit from "imagekit";
import { isOwnImageKitUrl } from "@/lib/security/sanitize";

const publicFolder = "laraspinnal";

/** Folder that unauthenticated customer uploads are confined to. */
export const CUSTOMER_UPLOAD_FOLDER = "laraspinnal/customer-uploads";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "",
});

export async function uploadImageToImageKit(
  fileBuffer: Buffer,
  fileName: string,
  folder = publicFolder
): Promise<{ url: string; fileId: string }> {
  try {
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: fileName,
      folder: folder,
    });
    return {
      url: response.url,
      fileId: response.fileId,
    };
  } catch (error) {
    console.error("ImageKit upload error:", error);
    throw new Error("Failed to upload image to ImageKit");
  }
}

export async function deleteImageFromImageKit(fileId: string): Promise<void> {
  try {
    await imagekit.deleteFile(fileId);
  } catch (error) {
    console.error("ImageKit delete error:", error);
  }
}

export interface DeleteByUrlOptions {
  /**
   * When set, the file's stored path must sit under this folder or the delete
   * is refused. Used to confine unauthenticated callers to their own folder.
   */
  requireFolderPrefix?: string;
}

/**
 * Deletes an uploaded file from ImageKit given its public URL.
 *
 * The upload response's fileId isn't persisted anywhere (only the URL is stored,
 * on products/categories/banners/orders), so removal flows only ever have the
 * URL to work with — this looks the file up by name first.
 *
 * SECURITY: two flaws in the previous implementation turned this into a
 * destructive primitive once it was reachable from an unauthenticated route:
 *
 *  1. Ownership was checked with `url.startsWith(urlEndpoint)`, which also
 *     accepts lookalike hosts and neighbouring account ids.
 *  2. When no file's URL matched exactly it fell back to `matches[0]` — the
 *     first file sharing the same *name*. Combined with the unauthenticated
 *     DELETE /api/customer-upload route, that let anyone destroy arbitrary
 *     product/banner assets by guessing a filename.
 *
 * Now: the origin is parsed and compared, only an exact URL match is deleted,
 * and callers can pin the folder. Returns whether anything was deleted.
 */
export async function deleteImageByUrl(
  url: string,
  { requireFolderPrefix }: DeleteByUrlOptions = {}
): Promise<boolean> {
  try {
    if (!isOwnImageKitUrl(url)) return false;

    const fileName = decodeURIComponent(url.split("/").pop()?.split("?")[0] || "");
    if (!fileName) return false;

    const matches = await imagekit.listFiles({ name: fileName, limit: 20 });

    // Exact URL match only — never a name-based guess.
    const match = matches.find((f) => "url" in f && f.url === url);
    if (!match || !("fileId" in match)) return false;

    if (requireFolderPrefix) {
      const storedPath = "filePath" in match ? String(match.filePath) : "";
      const normalized = storedPath.replace(/^\//, "");
      if (!normalized.startsWith(requireFolderPrefix.replace(/^\//, ""))) {
        console.warn(
          `[imagekit] Refused delete outside '${requireFolderPrefix}' for filePath '${storedPath}'`
        );
        return false;
      }
    }

    await imagekit.deleteFile(match.fileId);
    return true;
  } catch (error) {
    console.error("ImageKit delete-by-url error:", error);
    return false;
  }
}

/**
 * Deletion path for the public customer-upload endpoint: identical to
 * deleteImageByUrl but hard-pinned to the customer-uploads folder, so an
 * unauthenticated caller cannot touch catalog or banner assets.
 */
export async function deleteCustomerUploadByUrl(url: string): Promise<boolean> {
  return deleteImageByUrl(url, { requireFolderPrefix: CUSTOMER_UPLOAD_FOLDER });
}

export default imagekit;
