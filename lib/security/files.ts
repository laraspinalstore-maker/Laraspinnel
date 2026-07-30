/**
 * Upload validation.
 *
 * The upload routes previously trusted two client-supplied values: `file.type`
 * (the multipart Content-Type, which the client writes) and `file.name`. So a
 * request could declare `image/png` while carrying HTML, SVG or a script, and
 * could choose the stored filename. This module verifies the *bytes* and
 * generates the stored name server-side.
 */
import { randomUUID } from "crypto";

export type UploadKind = "image" | "video";

export interface DetectedType {
  mime: string;
  extension: string;
  kind: UploadKind;
}

/**
 * Magic-number signatures for the formats this app accepts.
 *
 * SVG is deliberately absent: it is an XML document that can carry <script>
 * and event handlers, and ImageKit serves uploads from a host that is inside
 * this app's CSP `img-src`. Accepting it would be a stored-XSS vector.
 */
const SIGNATURES: Array<{
  mime: string;
  extension: string;
  kind: UploadKind;
  test: (bytes: Uint8Array) => boolean;
}> = [
  {
    mime: "image/jpeg",
    extension: "jpg",
    kind: "image",
    test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: "image/png",
    extension: "png",
    kind: "image",
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    mime: "image/gif",
    extension: "gif",
    kind: "image",
    test: (b) => ascii(b, 0, 6) === "GIF87a" || ascii(b, 0, 6) === "GIF89a",
  },
  {
    // RIFF....WEBP
    mime: "image/webp",
    extension: "webp",
    kind: "image",
    test: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP",
  },
  {
    // ISO-BMFF with an AVIF brand.
    mime: "image/avif",
    extension: "avif",
    kind: "image",
    test: (b) => ascii(b, 4, 4) === "ftyp" && ["avif", "avis"].includes(ascii(b, 8, 4)),
  },
  {
    mime: "video/mp4",
    extension: "mp4",
    kind: "video",
    test: (b) =>
      ascii(b, 4, 4) === "ftyp" &&
      ["isom", "iso2", "mp41", "mp42", "avc1", "M4V ", "mmp4"].includes(ascii(b, 8, 4)),
  },
  {
    mime: "video/quicktime",
    extension: "mov",
    kind: "video",
    test: (b) => ascii(b, 4, 4) === "ftyp" && ["qt  ", "moov"].includes(ascii(b, 8, 4)),
  },
  {
    // RIFF....WEBM is not a thing; WebM is Matroska/EBML.
    mime: "video/webm",
    extension: "webm",
    kind: "video",
    test: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
  },
];

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  let out = "";
  for (let i = offset; i < offset + length; i += 1) {
    const code = bytes[i];
    if (code === undefined) return "";
    out += String.fromCharCode(code);
  }
  return out;
}

/** Identifies content by its leading bytes, ignoring any declared MIME type. */
export function detectFileType(buffer: Buffer): DetectedType | null {
  if (buffer.length < 16) return null;
  const head = new Uint8Array(buffer.subarray(0, 32));
  const match = SIGNATURES.find((sig) => sig.test(head));
  return match ? { mime: match.mime, extension: match.extension, kind: match.kind } : null;
}

export interface ValidateUploadOptions {
  /** Which kinds the endpoint accepts. */
  allow: UploadKind[];
  maxImageBytes: number;
  maxVideoBytes: number;
}

export type ValidateUploadResult =
  | { ok: true; type: DetectedType; buffer: Buffer }
  | { ok: false; status: number; error: string; reason: string };

/**
 * Validates size, then true content type, then size again against the
 * kind-specific cap.
 *
 * Size is checked before the bytes are read so an oversized body isn't buffered
 * into memory first, and re-derived from the buffer afterwards because
 * `File.size` is metadata rather than a measurement of what arrived.
 */
export async function validateUpload(
  file: File,
  { allow, maxImageBytes, maxVideoBytes }: ValidateUploadOptions
): Promise<ValidateUploadResult> {
  const absoluteMax = allow.includes("video") ? maxVideoBytes : maxImageBytes;

  if (file.size > absoluteMax) {
    return {
      ok: false,
      status: 413,
      error: `File too large. Maximum size is ${Math.floor(absoluteMax / (1024 * 1024))} MB.`,
      reason: "declared_size_exceeded",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.length === 0) {
    return { ok: false, status: 400, error: "The uploaded file is empty.", reason: "empty" };
  }
  if (buffer.length > absoluteMax) {
    return {
      ok: false,
      status: 413,
      error: `File too large. Maximum size is ${Math.floor(absoluteMax / (1024 * 1024))} MB.`,
      reason: "actual_size_exceeded",
    };
  }

  const type = detectFileType(buffer);
  if (!type) {
    return {
      ok: false,
      status: 415,
      error: "Unsupported or unrecognised file. Allowed: JPEG, PNG, WebP, AVIF, GIF" +
        (allow.includes("video") ? ", MP4, WebM, MOV." : "."),
      reason: "signature_unrecognised",
    };
  }

  if (!allow.includes(type.kind)) {
    return {
      ok: false,
      status: 415,
      error: type.kind === "video" ? "Video uploads are not allowed here." : "Unsupported file type.",
      reason: `kind_not_allowed:${type.kind}`,
    };
  }

  const kindMax = type.kind === "video" ? maxVideoBytes : maxImageBytes;
  if (buffer.length > kindMax) {
    return {
      ok: false,
      status: 413,
      error: `File too large. Maximum size for ${type.kind}s is ${Math.floor(kindMax / (1024 * 1024))} MB.`,
      reason: "kind_size_exceeded",
    };
  }

  return { ok: true, type, buffer };
}

/**
 * Builds the stored filename from scratch.
 *
 * Client filenames are never reused: they can carry path traversal (`../`),
 * null bytes, RTL-override characters that disguise the real extension, or a
 * double extension like `payload.png.html`. Only a short slug of the original
 * is kept, for human recognisability in the media library.
 */
export function buildSafeFileName(originalName: unknown, extension: string, prefix = "upload"): string {
  const base = typeof originalName === "string" ? originalName.replace(/\.[^.]*$/, "") : "";
  const slug = base
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  const stem = slug || prefix;
  return `${stem}-${randomUUID()}.${extension}`;
}
