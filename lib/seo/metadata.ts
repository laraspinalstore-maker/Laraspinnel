/**
 * The single metadata factory every page and layout goes through.
 *
 * Before this existed, 16 files hand-rolled their own `Metadata` object, each
 * repeating the title suffix, `siteName`, `locale`, and a near-identical
 * `openGraph`/`twitter` pair. Four of them exported an untyped object, so they
 * were never checked against Next's `Metadata` shape at all.
 *
 * Two Next behaviours drive the design and are easy to get wrong:
 *
 *   1. `openGraph` and `twitter` are NOT deep-merged across route segments. A
 *      child segment's object REPLACES the parent's wholesale. That is the
 *      actual reason every file used to re-declare `siteName` and `locale` —
 *      omitting them dropped them. So this factory always emits both blocks
 *      complete.
 *
 *   2. Metadata is shallow-merged root → leaf, and an omitted field is
 *      INHERITED rather than cleared. There is no documented `null` opt-out for
 *      `alternates.canonical`. Hence `path` is a required, explicitly-nullable
 *      field: a new page cannot forget its canonical and silently inherit a
 *      parent's. This is not hypothetical — the product not-found branch used to
 *      inherit `canonical: "/shop"` from the shop layout.
 */

import type { Metadata } from "next";
import { SITE_URL } from "@/lib/siteUrl";
import { BRAND, LOCALE, TITLE_TEMPLATE } from "./config";
import { canonicalPath, iconAtSize, type OgImage } from "./url";

export type RobotsPolicy = "index" | "noindex" | "noindex-nofollow";

export interface BuildMetadataInput {
  /** Page title WITHOUT the brand suffix — the root template appends it. */
  title?: string;
  /** Title that must bypass the root template entirely (the homepage). */
  titleAbsolute?: string;
  description: string;
  /**
   * Root-relative canonical path, or `null` to emit no canonical at all.
   * Required so it can never be forgotten. `null` is correct for the root
   * layout (a canonical there is inherited by every page that doesn't override
   * it, which once pointed the whole site at the homepage) and for /admin.
   */
  path: string | null;
  /** Defaults to "index". */
  robots?: RobotsPolicy;
  /**
   * Omit to inherit the generated `app/opengraph-image.tsx`. Passing a value
   * OVERRIDES the file convention, so only pages with a genuinely better image
   * — product pages, with a real photo — should pass one.
   */
  images?: OgImage[];
  ogType?: "website" | "article";
  /** Only when the OG copy must differ from `description`. */
  ogDescription?: string;
  twitterDescription?: string;
  twitterCard?: "summary" | "summary_large_image";
  /**
   * Deliberately unused by every current caller.
   *
   * Google has ignored `<meta name="keywords">` since 2009 and Bing treats it
   * as a spam signal. Roughly 50 lines of curated keyword arrays across five
   * files produced no effect. The field is kept so reinstating them is a
   * one-line change rather than an archaeology exercise.
   */
  keywords?: string[];
  /** Root-layout-only extras: icons, authors, metadataBase, `other`. */
  extend?: Metadata;
}

/**
 * Strip a trailing brand suffix.
 *
 * Defensive: the four policy pages hardcoded "… | Lara's Pinnal" in their
 * titles, and with a root `title.template` in place that would render as
 * "Privacy Policy | Lara's Pinnal | Lara's Pinnal".
 */
function stripBrandSuffix(title: string): string {
  const suffix = ` | ${BRAND}`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
}

function resolveRobots(policy: RobotsPolicy | undefined): Metadata["robots"] {
  switch (policy) {
    case "noindex":
      // `follow` keeps the outbound links on the page carrying signal.
      return { index: false, follow: true };
    case "noindex-nofollow":
      return { index: false, follow: false };
    default:
      // Inherit the root's index/follow plus its googleBot preview directives.
      return undefined;
  }
}

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const {
    title,
    titleAbsolute,
    description,
    path,
    robots,
    images,
    ogType = "website",
    ogDescription,
    twitterDescription,
    twitterCard = "summary_large_image",
    extend,
  } = input;

  const bareTitle = title ? stripBrandSuffix(title) : undefined;

  // OG and Twitter titles are composed here rather than relying on inheritance:
  // `title.template` applies only to `metadata.title`. `openGraph.title` has a
  // separate template field, and a plain string child value is used verbatim.
  const socialTitle = titleAbsolute ?? (bareTitle ? `${bareTitle} | ${BRAND}` : BRAND);

  const url = path === null ? undefined : canonicalPath(path);

  const metadata: Metadata = {
    ...(titleAbsolute
      ? { title: { absolute: titleAbsolute } }
      : bareTitle
        ? { title: bareTitle }
        : {}),
    description,
    ...(path === null ? {} : { alternates: { canonical: canonicalPath(path) } }),
    openGraph: {
      type: ogType,
      locale: LOCALE,
      siteName: BRAND,
      title: socialTitle,
      description: ogDescription ?? description,
      ...(url ? { url } : {}),
      ...(images && images.length ? { images } : {}),
    },
    twitter: {
      card: twitterCard,
      title: socialTitle,
      description: twitterDescription ?? ogDescription ?? description,
      ...(images && images.length ? { images } : {}),
    },
  };

  const resolvedRobots = resolveRobots(robots);
  if (resolvedRobots) metadata.robots = resolvedRobots;

  return extend ? { ...metadata, ...extend } : metadata;
}

export interface RootMetadataInput {
  /** From the `seo_title` setting, already defaulted. */
  title: string;
  /** From the `seo_description` setting, already defaulted. */
  description: string;
  /** From `favicon_url` || `logo_url`. Undefined ⇒ use the app/icon.png file. */
  faviconUrl?: string;
  /** Parsed locality, used to decide whether the geo meta tags are still true. */
  addressLocality?: string;
}

/** Villupuram, Tamil Nadu — must stay in step with schema.ts's STUDIO_GEO. */
const STUDIO_META = {
  locality: "Villupuram",
  region: "IN-TN",
  position: "11.9401;79.4861",
  icbm: "11.9401, 79.4861",
};

/**
 * Root layout metadata.
 *
 * Deliberately emits NO `alternates`. A canonical declared here is inherited by
 * every page that does not override it, which once pointed the whole site's
 * canonical at the homepage. Every page supplies its own via `buildMetadata`'s
 * required `path`.
 *
 * Also emits no `openGraph.images`, so `app/opengraph-image.tsx` supplies the
 * image and its true dimensions. Setting `images` here would override the file
 * convention and make it dead code.
 */
export function buildRootMetadata(input: RootMetadataInput): Metadata {
  const { title, description, faviconUrl, addressLocality } = input;

  // Only assert coordinates while the configured address still matches them. A
  // stale lat/long is worse for local search than none. (These `geo.*` tags are
  // legacy and Google does not use them, but a wrong value costs nothing to
  // avoid.)
  const geoIsCurrent =
    addressLocality?.trim().toLowerCase() === STUDIO_META.locality.toLowerCase();

  return {
    title: { default: title, template: TITLE_TEMPLATE },
    description,
    metadataBase: new URL(SITE_URL),
    authors: [{ name: BRAND, url: SITE_URL }],
    creator: BRAND,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: LOCALE,
      url: "/",
      siteName: BRAND,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    // Only when an admin has actually configured one. Otherwise omitted so the
    // app/icon.png and app/apple-icon.png file conventions serve a real square
    // icon — the previous hardcoded fallback pointed every favicon at the
    // 453x358 logo.
    ...(faviconUrl
      ? {
          icons: {
            icon: iconAtSize(faviconUrl, 64),
            apple: iconAtSize(faviconUrl, 180),
            shortcut: iconAtSize(faviconUrl, 64),
          },
        }
      : {}),
    ...(geoIsCurrent
      ? {
          other: {
            "geo.region": STUDIO_META.region,
            "geo.placename": STUDIO_META.locality,
            "geo.position": STUDIO_META.position,
            ICBM: STUDIO_META.icbm,
          },
        }
      : {}),
  };
}
