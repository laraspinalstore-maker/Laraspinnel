/**
 * URL and text-encoding helpers with NO third-party dependencies.
 *
 * Split out from ./sanitize.ts deliberately. That module imports `sanitize-html`
 * at the top level, so any client component that needed only `safeUrl` pulled the
 * entire HTML sanitizer (~200 KB) into the browser bundle. Everything here is
 * safe to import from client components; import from ./sanitize.ts only on the
 * server, where the markup sanitizer is actually needed.
 */

/** HTML-escapes text destined for an element body or a quoted attribute. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escapes a value for embedding inside a `<script>` block.
 *
 * `JSON.stringify` alone is not enough: it leaves `<`, `>` and U+2028/U+2029
 * intact, so a stored value containing `</script>` closes the block early and
 * everything after it is parsed as HTML.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** Schemes that are safe to place in an `href`. Anything else is dropped. */
const SAFE_URL_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Normalises a URL for use in `href`.
 *
 * Returns `fallback` for anything that isn't a same-origin path or an
 * http/https/mailto/tel absolute URL — which is what keeps `javascript:`,
 * `data:` and `vbscript:` payloads out of admin-editable link fields.
 *
 * Protocol-relative input (`//host/path`) is deliberately NOT treated as a
 * relative path: it is resolved to an explicit `https://host/path`. Callers that
 * branch on "does this look internal" must therefore call safeUrl FIRST and test
 * the result, or `//evil.com` would be routed as an internal link.
 */
export function safeUrl(value: unknown, fallback = "#"): string {
  if (typeof value !== "string") return fallback;
  const raw = value.trim();
  if (!raw) return fallback;

  // Relative same-origin paths / fragments / query-only links.
  // `//evil.com` is protocol-relative, i.e. off-origin — reject it.
  if (/^[?#]/.test(raw)) return raw;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;

  try {
    // A base is required so bare paths don't throw; absolute inputs ignore it.
    const parsed = new URL(raw, "https://placeholder.invalid");
    if (!SAFE_URL_SCHEMES.has(parsed.protocol)) return fallback;
    if (parsed.hostname === "placeholder.invalid") return fallback;
    return parsed.toString();
  } catch {
    return fallback;
  }
}

/** True when `value` is an absolute http(s) URL. */
export function isHttpUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * The ImageKit URL prefix that uploads from this account are served from.
 * Falls back to the public host so the check still constrains the origin when
 * only the public env var is configured.
 */
export function imageKitUrlPrefix(): string {
  const endpoint =
    process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "";
  return endpoint.replace(/\/$/, "");
}

/**
 * True only for URLs served by this project's own ImageKit endpoint.
 *
 * Uses parsed-origin comparison rather than `startsWith`, because
 * `startsWith("https://ik.imagekit.io/acct")` also matches
 * `https://ik.imagekit.io/acct-attacker/...` and
 * `https://ik.imagekit.io.evil.com/...`.
 */
export function isOwnImageKitUrl(value: unknown): boolean {
  if (typeof value !== "string" || !value) return false;
  const prefix = imageKitUrlPrefix();
  if (!prefix) return false;

  try {
    const url = new URL(value);
    const base = new URL(prefix);
    if (url.protocol !== "https:") return false;
    if (url.host !== base.host) return false;

    // Path must sit inside the endpoint's path (the account id segment).
    const basePath = base.pathname.replace(/\/$/, "");
    return url.pathname === basePath || url.pathname.startsWith(`${basePath}/`);
  } catch {
    return false;
  }
}

/**
 * Image `src` allowlist mirroring `next.config.ts` `images.remotePatterns`, so
 * a raw `<img>` can't be pointed at an arbitrary third-party host by whoever
 * controls the database value.
 */
const ALLOWED_IMAGE_HOSTS = new Set(["ik.imagekit.io", "images.unsplash.com"]);

/**
 * Whether a value is acceptable to STORE as an image reference.
 *
 * Deliberately wider than isOwnImageKitUrl: the seeded catalog uses
 * `images.unsplash.com` URLs, so requiring own-ImageKit-only would make every
 * pre-existing product, category and banner unsavable in the admin panel. This
 * is still a closed allowlist — it matches `next.config.ts` remotePatterns
 * exactly, so nothing here can be optimized-proxied or rendered from a host the
 * image pipeline doesn't already trust.
 *
 * Use isOwnImageKitUrl (stricter) for values that arrive from UNAUTHENTICATED
 * callers, where the only legitimate source is this app's own upload endpoint.
 */
export function isStorableImageUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const raw = value.trim();
  if (!raw) return false;

  // Local asset under /public.
  if (raw.startsWith("/") && !raw.startsWith("//")) return true;

  try {
    const url = new URL(raw);
    return url.protocol === "https:" && ALLOWED_IMAGE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function safeImageUrl(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const raw = value.trim();
  if (!raw) return fallback;

  // Local assets under /public.
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return fallback;
    if (!ALLOWED_IMAGE_HOSTS.has(url.hostname)) return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}

/**
 * Escapes a string for safe use inside a MongoDB `$regex`.
 *
 * Without this, a search term like `(a+)+$` is compiled as a real regex and
 * evaluated per document, which is a catastrophic-backtracking DoS.
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Removes markup from a value that is meant to be plain text.
 *
 * Dependency-free on purpose: this module is imported by client components (the
 * contact form shares its zod schema with the server), so it must not pull in
 * `sanitize-html`.
 *
 * IMPORTANT — this is normalization, not the XSS control. Every field it is
 * applied to is rendered either as a React text node (escaped by React) or via
 * escapeHtml() into an email. Stripping tags here just stops markup being stored
 * and shown as literal noise; it is deliberately not load-bearing. Anything
 * genuinely rendered as HTML must go through sanitizeRichText() on the server.
 */
export function stripMarkupText(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  return value
    // Drop whole script/style elements including their contents.
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    // Drop any remaining tag, complete or truncated.
    .replace(/<[^>]*>/g, "")
    .replace(/<[^>]*$/g, "")
    // Collapse the whitespace the removals leave behind.
    .replace(/\s+/g, " ")
    .trim();
}
