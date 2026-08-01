/**
 * Cache purges for catalog mutations.
 *
 * SERVER ONLY — `revalidatePath` throws outside a request scope.
 *
 * The public catalog surfaces are now cached rather than client-fetched:
 * `/shop/[slug]` is statically generated with ISR (`revalidate = 300`), `/` is
 * ISR (`revalidate = 60`), and `/sitemap.xml` is generated at build time. That is
 * what makes a real 404 and server-rendered product HTML possible, but it also
 * means an admin edit would sit invisible for up to five minutes unless the
 * mutating route says otherwise. These helpers are that "otherwise".
 *
 * `/shop` and `/search` are `force-dynamic`, so purging them is a no-op — they
 * are listed anyway so that the set of surfaces stays honest if either route ever
 * gains caching.
 */

import { revalidatePath } from "next/cache";

/** Surfaces that list products or categories. */
const CATALOG_PATHS = ["/", "/shop", "/categories", "/search", "/sitemap.xml"];

/**
 * Purge every catalog surface, plus one product page when a slug is given.
 *
 * Both the old and the new slug must be passed when a rename is possible: a
 * renamed product leaves a stale cache entry under its previous URL, which would
 * keep answering 200 with the old content instead of the 404 the route now
 * returns for a slug that no longer resolves.
 */
export function revalidateCatalog(...slugs: (string | null | undefined)[]): void {
  for (const path of CATALOG_PATHS) revalidatePath(path);

  const unique = new Set(slugs.filter((s): s is string => Boolean(s)));
  for (const slug of unique) revalidatePath(`/shop/${slug}`);
}

/**
 * Purge every cached product page at once.
 *
 * Passing the route pattern with `type: "page"` invalidates all ISR entries of
 * the dynamic segment, which is the only way to reach products whose slugs the
 * caller does not know. Used for category edits: each product page renders its
 * category name in the breadcrumb, the BreadcrumbList node and the Product
 * schema, so a rename makes all of them stale, not just the listing.
 */
export function revalidateAllProductPages(): void {
  revalidatePath("/shop/[slug]", "page");
}
