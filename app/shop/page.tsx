import React from "react";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ShopBrowser from "@/components/shop/ShopBrowser";
import JsonLd from "@/lib/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbNode, itemListNode, webPageNode } from "@/lib/seo/schema";
import { listActiveCategories } from "@/lib/data/categories";
import { listProducts } from "@/lib/data/products";
import { sortInStockFirst } from "@/lib/utils";
import type { CategoryDTO, ProductCardDTO } from "@/lib/data/types";
import {
  buildProductsKey,
  buildShopUrl,
  parseShopParams,
  type RawSearchParams,
} from "@/lib/shop/params";

/**
 * The shop listing.
 *
 * A server component that fetches the matching products and hands them to the
 * client browser as SWR seed data, so product names, prices and /shop/<slug>
 * links are all present in the server-rendered HTML. Previously this route
 * prerendered to a spinner and a crawler saw zero products.
 *
 * `await searchParams` makes the route dynamically rendered, which is also what
 * keeps `useSearchParams()` safe inside ShopBrowser — the client-side-rendering
 * bailout only applies to prerendered routes. `force-dynamic` pins that so a
 * future change cannot silently turn it static and break the filters.
 */

export const dynamic = "force-dynamic";

const BASE_DESCRIPTION =
  "Shop handmade crochet gifts from Lara's Pinnal — crochet flower bouquets, amigurumi plushies, custom photo frames, keychains, and curated gift hampers, hand-knitted to order in Tamil Nadu and shipped across India.";

/** Categories, tolerating a database failure so metadata never throws. */
async function safeCategories(): Promise<CategoryDTO[]> {
  try {
    return await listActiveCategories();
  } catch (error) {
    console.error("[shop] category load failed:", error);
    return [];
  }
}

/**
 * Canonical and robots policy for a /shop URL.
 *
 * The canonical carries `category` and `page` only. Anything else present —
 * `search`, `sort`, or an unknown category — collapses to `/shop` and the page is
 * marked `noindex, follow`.
 *
 * Category views being self-canonical and indexable is an intentional change.
 * The old shop layout set `canonical: "/shop"` for every /shop URL while the
 * sitemap simultaneously submitted `/shop?category=<slug>` as indexable — the
 * site was telling Google to index URLs whose own canonical disowned them. Now
 * that the page server-renders, a category view is genuinely distinct content
 * with its own title, H1 and product set, so it can stand on its own.
 */
function resolveIndexing(
  params: ReturnType<typeof parseShopParams>,
  categories: CategoryDTO[]
): { canonical: string; robots: "index" | "noindex"; category?: CategoryDTO } {
  const category =
    params.category !== "all"
      ? categories.find((c) => c.slug === params.category)
      : undefined;

  const hasNoisyParams = Boolean(params.search) || params.sort !== "latest";
  const unknownCategory = params.category !== "all" && !category;

  if (hasNoisyParams || unknownCategory) {
    return { canonical: "/shop", robots: "noindex", category };
  }

  return {
    canonical: buildShopUrl({ category: params.category, page: params.page }),
    // Page 2+ of a listing is thin, duplicative content; the links on it are
    // still followed so deeper products stay discoverable.
    robots: params.page > 1 ? "noindex" : "index",
    category,
  };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}): Promise<Metadata> {
  const params = parseShopParams(await searchParams);
  const categories = await safeCategories();
  const { canonical, robots, category } = resolveIndexing(params, categories);

  const pageSuffix = params.page > 1 ? ` — page ${params.page}` : "";

  // A category view's <h1> has always been the category name; leaving the title
  // generic was a pure loss.
  const title = category
    ? `${category.name}${pageSuffix}`
    : `Shop Handmade Crochet Gifts${pageSuffix}`;

  const description =
    category && category.description?.trim()
      ? `${category.description.trim()} Hand-knitted to order by Lara's Pinnal and shipped across India.`
      : BASE_DESCRIPTION;

  return buildMetadata({ title, description, path: canonical, robots });
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = parseShopParams(await searchParams);
  const categories = await safeCategories();
  const { canonical, category } = resolveIndexing(params, categories);

  let initialProducts: ProductCardDTO[] = [];
  let initialLoadFailed = false;

  try {
    // Same ordering the client applies, so the grid does not reshuffle when SWR
    // replaces the seed with its own fetch.
    initialProducts = sortInStockFirst(
      await listProducts(params.category, params.search, params.sort, false)
    );
  } catch (error) {
    console.error("[shop] product query failed:", error);
    // The server cannot produce SWR's `error` state, so this flag reproduces the
    // same "Failed to load products list." copy the page showed before.
    initialLoadFailed = true;
  }

  const heading = category ? category.name : "Shop Handmade Gifts";

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <Navbar />

      <ShopBrowser
        initialCategories={categories}
        initialProducts={initialProducts}
        initialProductsKey={buildProductsKey(params)}
        initialLoadFailed={initialLoadFailed}
      />

      <Footer />

      <JsonLd
        graph={[
          webPageNode({
            path: canonical,
            name: heading,
            description: category?.description?.trim() || BASE_DESCRIPTION,
            type: "CollectionPage",
          }),
          initialProducts.length
            ? itemListNode({
                path: canonical,
                items: initialProducts.map((p) => ({
                  name: p.name,
                  url: `/shop/${p.slug}`,
                })),
              })
            : null,
          breadcrumbNode(
            category
              ? [
                  { name: "Home", path: "/" },
                  { name: "Shop", path: "/shop" },
                  { name: category.name },
                ]
              : [{ name: "Home", path: "/" }, { name: "Shop" }],
            canonical
          ),
        ]}
      />
    </div>
  );
}
