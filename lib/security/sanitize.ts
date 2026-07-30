/**
 * Server-side markup sanitizing.
 *
 * Imports `sanitize-html`, so this module must only be imported from server code
 * (route handlers, server components). Client components import the
 * dependency-free helpers from ./url.ts instead — see the note there.
 *
 * The URL/encoding helpers are re-exported here so existing server imports keep
 * working from a single place.
 */
import sanitizeHtml from "sanitize-html";

export {
  escapeHtml,
  serializeJsonLd,
  safeUrl,
  isHttpUrl,
  imageKitUrlPrefix,
  isOwnImageKitUrl,
  isStorableImageUrl,
  safeImageUrl,
  escapeRegex,
} from "./url";

/**
 * Allowlist sanitizer for admin-authored rich text (product descriptions and
 * the policy pages, which are written in the Tiptap editor and rendered with
 * `dangerouslySetInnerHTML`).
 *
 * Formatting the editor can produce is preserved; scripts, event handlers,
 * iframes, form controls, and style/`srcset` vectors are removed. Applied on
 * write *and* on read, so content stored before this audit is also cleaned.
 */
const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr", "div", "span",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "b", "em", "i", "u", "s", "strike", "sub", "sup", "small", "mark",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "a", "img", "figure", "figcaption",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    th: ["colspan", "rowspan", "scope"],
    td: ["colspan", "rowspan"],
    col: ["span"],
    "*": ["class"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https"] },
  // Bare `//host/path` in an href would otherwise survive as off-origin.
  allowProtocolRelative: false,
  // Drop the contents of anything removed, so `<script>alert(1)</script>`
  // doesn't leave `alert(1)` behind as visible text.
  nonTextTags: ["style", "script", "textarea", "option", "noscript"],
  transformTags: {
    // Any link that survives sanitising opens safely.
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, rel: "noopener noreferrer nofollow" },
    }),
  },
};

export function sanitizeRichText(html: unknown): string {
  if (typeof html !== "string" || !html) return "";
  return sanitizeHtml(html, RICH_TEXT_OPTIONS);
}

/**
 * Strips markup entirely, for fields that are rendered as plain text but were
 * historically stored with whatever the client sent (settings values, names).
 */
export function stripTags(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
}
