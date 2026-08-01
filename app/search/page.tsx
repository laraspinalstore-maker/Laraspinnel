import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PremiumCard from "@/components/home/PremiumCard";
import EmptyState from "@/components/shared/EmptyState";
import { listProducts } from "@/lib/data/products";
import { listActiveCategories } from "@/lib/data/categories";
import { sortInStockFirst } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  PAGE_SIZE,
  clampPage,
  normalizeQuery,
  pageSlice,
  parsePage,
  totalPages,
  type RawSearchParams,
} from "@/lib/shop/params";

/**
 * Site search.
 *
 * This is the URL the `WebSite` → `SearchAction` in the schema graph advertises
 * (`/search?q={search_term_string}`). It previously 404'd, so Google was being
 * told about a sitebox endpoint that did not exist.
 *
 * ## Indexing
 *
 * Every response is `noindex, follow` with a SELF-referencing canonical.
 *
 * Internal search result pages are explicitly low-value for the index — an
 * unbounded query space generates unbounded near-duplicate URLs — so Google's
 * guidance is to keep them out. `follow` is retained so the product links here
 * still pass signal, and the page is not disallowed in robots.txt because a
 * crawler has to be able to fetch it to see the noindex at all.
 *
 * The canonical is self-referencing rather than pointing at `/shop?search=…`.
 * `noindex` already removes the URL; adding a cross-URL canonical on top would be
 * two contradictory instructions about the same page, which Google warns against.
 * `/search` is also deliberately absent from the sitemap.
 *
 * ## Query safety
 *
 * The database query goes through `lib/data/products.ts`, so it inherits
 * `escapeRegex` and the 80-character cap. Writing the `$regex` inline here would
 * silently reintroduce the unauthenticated CPU denial of service that
 * app/api/products/route.ts documents having fixed. It also does not fetch its
 * own API over HTTP — that would be a pointless round-trip through the same
 * process.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}): Promise<Metadata> {
  const raw = await searchParams;
  const query = normalizeQuery(raw.q);
  const page = parsePage(raw.page);

  const suffix = page > 1 ? ` — page ${page}` : "";
  const canonical = query
    ? `/search?q=${encodeURIComponent(query)}${page > 1 ? `&page=${page}` : ""}`
    : "/search";

  return buildMetadata({
    title: query ? `Search results for “${query}”${suffix}` : "Search",
    description: query
      ? `Handmade crochet gifts matching “${query}” at Lara's Pinnal — crochet bouquets, plushies, frames, keychains and hampers, hand-knitted to order.`
      : "Search Lara's Pinnal for handmade crochet bouquets, amigurumi plushies, custom frames, keychains and gift hampers.",
    path: canonical,
    robots: "noindex",
  });
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const raw = await searchParams;
  const query = normalizeQuery(raw.q);
  const requestedPage = parsePage(raw.page);

  let results: Awaited<ReturnType<typeof listProducts>> = [];
  let failed = false;

  if (query) {
    try {
      // Empty category, "latest" sort, not featured-only — the same code path the
      // shop listing uses, so results and ordering match.
      results = sortInStockFirst(await listProducts("", query, "latest", false));
    } catch (error) {
      console.error("[search] product query failed:", error);
      failed = true;
    }
  }

  let categories: Awaited<ReturnType<typeof listActiveCategories>> = [];
  if (!query) {
    try {
      categories = await listActiveCategories();
    } catch (error) {
      console.error("[search] category load failed:", error);
    }
  }

  const pageCount = totalPages(results.length);
  const page = clampPage(requestedPage, results.length);
  const visible = pageSlice(results, page);

  return (
    <div className="min-h-screen bg-white flex flex-col font-body">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-7 md:py-12 w-full">
        <div className="space-y-3 pb-6 md:pb-10 text-center">
          <span className="flex items-center justify-center gap-2 text-xs font-semibold text-primary-text uppercase tracking-wider">
            <SearchIcon size={14} className="text-primary" aria-hidden="true" /> Search
          </span>
          <h1 className="font-display text-3xl sm:text-5xl text-brand-black tracking-wide uppercase">
            {query ? <>Results for &ldquo;{query}&rdquo;</> : "Search Handmade Gifts"}
          </h1>
          <p className="text-sm font-medium text-brand-gray">
            {query
              ? `${results.length} ${results.length === 1 ? "product" : "products"} found`
              : "Find crochet bouquets, plushies, frames, keychains and hampers."}
          </p>
        </div>

        {/* A plain GET form: works with no JavaScript, and the resulting URL is
            exactly the one the SearchAction schema advertises. */}
        <form
          role="search"
          action="/search"
          method="get"
          className="mx-auto max-w-xl mb-10 flex gap-2"
        >
          <label htmlFor="search-q" className="sr-only">
            Search products
          </label>
          <input
            id="search-q"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search products..."
            autoComplete="off"
            className="flex-1 h-11 px-3.5 bg-brand-light-gray/50 border border-brand-border rounded-lg text-sm text-brand-black outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          <button
            type="submit"
            className="h-11 px-5 rounded-lg bg-brand-black hover:bg-primary text-white text-sm font-bold transition-colors"
          >
            Search
          </button>
        </form>

        <h2 className="sr-only">{query ? "Search results" : "Browse by collection"}</h2>

        {failed ? (
          <p className="text-center text-red-600 text-sm font-semibold py-8">
            Failed to load search results. Please try again.
          </p>
        ) : !query ? (
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/shop?category=${encodeURIComponent(category.slug)}`}
                className="px-4 py-2 min-h-11 inline-flex items-center rounded-xl border border-brand-border bg-white hover:border-primary hover:text-primary text-sm font-semibold text-brand-black transition-colors"
              >
                {category.name}
              </Link>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="py-10">
            <EmptyState
              title="No products matched your search"
              description="Try a shorter or more general term, or browse the full catalogue."
            />
            <p className="text-center mt-6">
              <Link
                href="/shop"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Browse all handmade gifts
              </Link>
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {visible.map((product) => (
                <div key={product._id}>
                  <PremiumCard
                    id={product._id}
                    name={product.name}
                    price={
                      product.discountPrice
                        ? `₹${product.discountPrice}`
                        : `₹${product.price}`
                    }
                    tag={
                      product.discountPrice
                        ? `SAVE ₹${product.price - product.discountPrice}`
                        : undefined
                    }
                    image={product.images?.[0]}
                    slug={product.slug}
                    stock={product.stock}
                  />
                </div>
              ))}
            </div>

            {pageCount > 1 && (
              <nav
                aria-label="Search results pages"
                className="mt-10 flex items-center justify-center gap-2"
              >
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((n) => {
                  const href = `/search?q=${encodeURIComponent(query)}${n > 1 ? `&page=${n}` : ""}`;
                  const isCurrent = n === page;
                  return (
                    <Link
                      key={n}
                      href={href}
                      aria-current={isCurrent ? "page" : undefined}
                      className={`min-w-11 h-11 inline-flex items-center justify-center rounded-xl border text-sm font-semibold transition-colors ${
                        isCurrent
                          ? "border-primary bg-primary-tint text-primary"
                          : "border-brand-border bg-white text-brand-black hover:border-primary hover:text-primary"
                      }`}
                    >
                      {n}
                    </Link>
                  );
                })}
              </nav>
            )}

            <p className="mt-4 text-center text-xs text-brand-gray">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, results.length)} of {results.length}
            </p>
          </>
        )}
      </main>

      <Footer />
      {/* No structured data: a search results page has no stable content to
          describe, and it is noindex. The SearchAction that points here lives on
          the WebSite node in the root layout. */}
    </div>
  );
}
