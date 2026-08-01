/**
 * URL helpers for canonicals, schema and OG images.
 *
 * Dependency-free; safe to import from client components.
 *
 * The division of labour is deliberate:
 *   - `alternates.canonical` and `openGraph.url` take ROOT-RELATIVE paths and
 *     let Next resolve them against `metadataBase`. That keeps one absolute
 *     origin in one place, and it is why a stray localhost value in the
 *     environment can only ever go wrong in `lib/siteUrl.ts` (which guards
 *     against it) rather than in 20 hand-written strings.
 *   - JSON-LD has no base URL concept, so every `@id`, `url` and `item` there
 *     must be absolute. Use `absoluteUrl()`.
 */

import { SITE_URL } from "@/lib/siteUrl";
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "./config";

/**
 * Normalise to a leading-slash, no-trailing-slash root-relative path.
 * A query string is preserved — `/shop?category=x` is a distinct canonical.
 */
export function canonicalPath(path: string): string {
  if (!path || path === "/") return "/";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  const [pathname, query] = withSlash.split("?");
  const trimmed = pathname.replace(/\/+$/, "") || "/";
  return query ? `${trimmed}?${query}` : trimmed;
}

/** Absolute URL for JSON-LD, robots and the sitemap. */
export function absoluteUrl(path = "/"): string {
  const normalized = canonicalPath(path);
  return normalized === "/" ? SITE_URL : `${SITE_URL}${normalized}`;
}

export interface OgImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

/**
 * A 1200x630 OG variant of a product photo.
 *
 * ImageKit URLs get a real server-side transform, so the declared dimensions are
 * true — the same technique the root layout uses to stop a full-size favicon
 * being downloaded on every page load. Anything hosted elsewhere returns null so
 * the caller falls back to the generated site OG image; returning an
 * untransformed foreign URL alongside a hardcoded 1200x630 would be exactly the
 * false `og:image:width` this replaces.
 */
export function productOgImage(url: string | undefined, alt: string): OgImage | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, SITE_URL);
    if (parsed.hostname !== "ik.imagekit.io") return null;
    parsed.searchParams.set(
      "tr",
      `w-${OG_IMAGE_WIDTH},h-${OG_IMAGE_HEIGHT},cm-pad_resize,bg-FFFFFF`
    );
    return {
      url: parsed.toString(),
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      alt,
    };
  } catch {
    return null;
  }
}

/**
 * Request an icon at its display size.
 *
 * Favicons never pass through /_next/image, so an ImageKit-hosted icon would
 * otherwise be fetched at full upload size on every page load — an
 * admin-configured favicon was once a 2K ~147KB JPEG, the single heaviest
 * resource on the page. Any other host is returned untouched.
 */
export function iconAtSize(url: string, size: number): string {
  try {
    const parsed = new URL(url, SITE_URL);
    if (parsed.hostname === "ik.imagekit.io") {
      parsed.searchParams.set("tr", `w-${size},h-${size},f-png`);
      return parsed.toString();
    }
  } catch {
    // Relative or malformed value — leave as-is.
  }
  return url;
}
