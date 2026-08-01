import type { MetadataRoute } from "next";
import { getActiveCategorySlugs } from "@/lib/data/categories";
import { getActiveProductSlugs } from "@/lib/data/products";
import { absoluteUrl } from "@/lib/seo/url";

/**
 * XML sitemap.
 *
 * ## What changed and why
 *
 * The previous version submitted `/cart` and `/checkout` — both of which now
 * carry `noindex` — so the sitemap was asking Google to index URLs the pages
 * themselves refuse. Submitting a noindex URL is a "Submitted URL marked
 * noindex" error in Search Console, not a neutral no-op. It also omitted `/faq`,
 * `/editorial-policy` and `/track-order`, and stamped `lastModified: new Date()`
 * on every static route — with `revalidate = 0` that meant every fetch reported
 * every page as modified this second, which trains Google to ignore the field.
 *
 * Static routes now carry a fixed `CONTENT_VERSION` date, bumped by hand when the
 * copy actually changes. Product and category entries use their real `updatedAt`.
 *
 * ## Excluded on purpose
 *
 * `/cart`, `/checkout`, `/admin/*`, `/api/*` — noindex or private.
 * `/search` — `noindex, follow` by design (unbounded query space).
 * `/shop?search=`, `?sort=`, `?page=2+` — noindex; only the bare listing and
 * `?category=` views are indexable, and those are the ones listed here.
 *
 * ## Caching
 *
 * `revalidate = 0` regenerated the whole sitemap, two collection scans included,
 * on every crawler fetch. It is cached for an hour instead, and every route that
 * mutates the catalog purges `/sitemap.xml` explicitly via
 * `lib/data/revalidate.ts` — so freshness comes from the write side rather than
 * from re-querying on every read.
 */

export const revalidate = 3600;

/**
 * Bump when the wording of the static pages below changes. A hand-maintained
 * date is honest; `new Date()` is not.
 */
const CONTENT_VERSION = new Date("2026-08-01T00:00:00.000Z");

type Entry = MetadataRoute.Sitemap[number];

/** Indexable routes with fixed content, ordered roughly by importance. */
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: Entry["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" },
  { path: "/categories", priority: 0.8, changeFrequency: "weekly" },
  { path: "/custom-order", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/shipping-policy", priority: 0.5, changeFrequency: "yearly" },
  { path: "/refund-policy", priority: 0.5, changeFrequency: "yearly" },
  { path: "/track-order", priority: 0.5, changeFrequency: "yearly" },
  { path: "/editorial-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms-of-service", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: Entry[] = STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: absoluteUrl(path),
    lastModified: CONTENT_VERSION,
    changeFrequency,
    priority,
  }));

  // A database outage must not take the sitemap down with it: serving the static
  // half is strictly better than serving a 500, which Google retries and
  // eventually reports as a fetch error.
  const [products, categories] = await Promise.all([
    getActiveProductSlugs().catch((error) => {
      console.error("[sitemap] product slugs failed:", error);
      return [];
    }),
    getActiveCategorySlugs().catch((error) => {
      console.error("[sitemap] category slugs failed:", error);
      return [];
    }),
  ]);

  const productEntries: Entry[] = products.map((p) => ({
    url: absoluteUrl(`/shop/${p.slug}`),
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // `/shop?category=<slug>` is self-canonical and indexable now that the listing
  // server-renders its own H1, title and product set — see the note in
  // app/shop/page.tsx. Submitting these while the old shop layout canonicalised
  // them all to `/shop` was the contradiction this depends on having been fixed.
  const categoryEntries: Entry[] = categories.map((c) => ({
    url: absoluteUrl(`/shop?category=${c.slug}`),
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...productEntries, ...categoryEntries];
}
