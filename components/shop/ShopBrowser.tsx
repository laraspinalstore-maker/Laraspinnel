"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR, { SWRConfig } from "swr";
import PremiumCard from "@/components/home/PremiumCard";
import SkeletonCard from "@/components/shared/SkeletonCard";
import CustomSelect from "@/components/shared/CustomSelect";
import StickyBox from "@/components/shared/StickyBox";
import { sortInStockFirst } from "@/lib/utils";
import { Search, ShoppingBag, SlidersHorizontal } from "lucide-react";
import type { CategoryDTO, ProductCardDTO } from "@/lib/data/types";
import {
  PAGE_SIZE,
  buildShopUrl,
  clampPage,
  pageSlice,
  parsePage,
  totalPages,
} from "@/lib/shop/params";

/**
 * The interactive shop listing.
 *
 * This is the former app/shop/page.tsx body, moved here so the route itself can
 * be a server component that fetches the first page of products and renders them
 * into the HTML. It stays a client component because the filters, the search
 * suggestions, and the sort control are all client state.
 *
 * ## Why the page was invisible to crawlers, and what actually fixed it
 *
 * Not the "use client" directive — client components do server-render. The
 * problem was that SWR had no data until after mount, so the server-rendered
 * output was a spinner. Seeding SWR's cache with data the server already fetched
 * is what puts product names, prices and links into the initial HTML. The
 * homepage's HeroSlider already used this pattern.
 *
 * ## Seeding via SWRConfig.fallback rather than fallbackData
 *
 * `fallbackData` is per-hook, not per-key: it would seed whatever the products
 * hook currently asks for, so as soon as the user changed a filter the new,
 * unrelated key would be served the server's original result. `fallback` is
 * keyed, so it only applies to the exact query the server ran.
 *
 * `revalidateOnMount: false` is deliberately NOT set (unlike HeroSlider): SWR's
 * default `revalidateIfStale` still refetches on mount, which preserves the
 * freshness behaviour this page had before.
 */

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const SORT_OPTIONS = [
  { label: "Latest Arrivals", value: "latest" },
  { label: "Price (Low to High)", value: "price-asc" },
  { label: "Price (High to Low)", value: "price-desc" },
];

export interface ShopBrowserProps {
  initialCategories: CategoryDTO[];
  /** The full match set the server resolved, already sortInStockFirst-ordered. */
  initialProducts: ProductCardDTO[];
  /** The exact SWR key the server's query corresponds to. */
  initialProductsKey: string;
  /** True when the server's database query threw, so the error copy still shows. */
  initialLoadFailed: boolean;
}

export default function ShopBrowser(props: ShopBrowserProps) {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/categories": props.initialCategories,
          [props.initialProductsKey]: props.initialProducts,
        },
      }}
    >
      {/* Retained as a safety net. With the route dynamically rendered this
          fallback never renders, but it means an accidental force-static in
          future degrades to a spinner instead of throwing a CSR bailout. */}
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <ShopBrowserInner {...props} />
      </Suspense>
    </SWRConfig>
  );
}

function ShopBrowserInner({ initialLoadFailed }: ShopBrowserProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Parse initial query params
  const initialCategory = searchParams.get("category") || "all";
  const initialSearch = searchParams.get("search") || "";
  const initialSort = searchParams.get("sort") || "latest";

  const [category, setCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [sort, setSort] = useState(initialSort);
  const [showDesktopSuggestions, setShowDesktopSuggestions] = useState(false);
  const [showMobileSuggestions, setShowMobileSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  // The current page is read from the URL rather than held in its own state.
  // Pagination navigates with history.pushState, which the App Router feeds back
  // through useSearchParams — so there is exactly one source of truth and no way
  // for local state and the URL to disagree.
  const page = parsePage(searchParams.get("page") ?? undefined);

  // Re-sync the controls whenever the URL changes underneath them — a back/forward
  // navigation, or a category link clicked from elsewhere on the site.
  //
  // The comparison happens during render, which is React's documented way to
  // reset state when an input changes, rather than in an effect. An effect renders
  // the stale filter values first and corrects them a frame later (and is what
  // `react-hooks/set-state-in-effect` reports). The guard is the serialized query
  // string, so this runs once per actual URL change and not on every render.
  const currentQuery = searchParams.toString();
  const [syncedQuery, setSyncedQuery] = useState(currentQuery);
  if (syncedQuery !== currentQuery) {
    setSyncedQuery(currentQuery);
    setCategory(searchParams.get("category") || "all");
    setSearchTerm(searchParams.get("search") || "");
    setSort(searchParams.get("sort") || "latest");
  }

  // Fetch Categories
  const { data: categories = [] } = useSWR<CategoryDTO[]>("/api/categories", fetcher);

  // Reflect the selected category in the page header
  const selectedCategory =
    category !== "all"
      ? categories.find((c) => c.slug === category)
      : undefined;
  const pageTitle = selectedCategory ? selectedCategory.name : "Shop Handmade Gifts";
  const pageSubtitle =
    selectedCategory?.description?.trim() ||
    "Explore our collection of custom crochet bouquets, frames, keychains, and hampers.";

  // Fetch Products. The key is assembled in this exact order — category, search,
  // sort — because lib/shop/params.ts#buildProductsKey has to reproduce it byte
  // for byte for the server's seed to match.
  const queryParams = new URLSearchParams();
  if (category && category !== "all") queryParams.append("category", category);
  if (searchTerm) queryParams.append("search", searchTerm);
  if (sort) queryParams.append("sort", sort);

  const {
    data: rawProducts = [],
    isLoading,
    error,
  } = useSWR<ProductCardDTO[]>(`/api/products?${queryParams.toString()}`, fetcher);
  // Out-of-stock items fall to the end; they return to their normal spot once restocked.
  const products = sortInStockFirst(rawProducts);

  // Full product list (unfiltered by search) to power search-bar suggestions.
  // Deliberately not seeded from the server: suggestions only appear on focus, so
  // seeding would push up to 200 documents into the initial payload for a feature
  // no crawler and no first paint ever needs.
  const { data: allProducts = [] } = useSWR<ProductCardDTO[]>("/api/products", fetcher);
  const productNames: string[] = Array.from(
    new Set(allProducts.map((p) => p.name).filter(Boolean))
  );
  const suggestions = searchTerm
    ? productNames
        .filter(
          (name) =>
            name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            name.toLowerCase() !== searchTerm.toLowerCase()
        )
        .slice(0, 5)
    : [];

  const pageCount = totalPages(products.length);
  const currentPage = clampPage(page, products.length);
  const visibleProducts = pageSlice(products, currentPage);

  /**
   * Show the skeleton grid only when there is genuinely nothing to show.
   *
   * `isLoading` alone is not the right condition. SWR treats a key seeded via
   * `fallback` as "not yet fetched", so `isLoading` is true on the very first
   * render even though `data` is already populated — which meant the
   * server-rendered HTML was eight skeleton cards sitting on top of eight real
   * products. (HeroSlider sidesteps this with `revalidateOnMount: false`, but
   * that would trade away the background refresh this page relies on.)
   *
   * Gating on "loading AND empty" keeps the seeded first paint, still shows
   * skeletons when the user switches to a filter combination that has no seed,
   * and never covers content the visitor can already see.
   */
  const hasProducts = products.length > 0;
  const showSkeleton = isLoading && !hasProducts;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({ search: searchTerm });
  };

  const handleSuggestionSelect = (name: string) => {
    setSearchTerm(name);
    updateUrlParams({ search: name });
    setShowDesktopSuggestions(false);
    setShowMobileSuggestions(false);
    setActiveSuggestion(-1);
  };

  /**
   * Keyboard handling for the suggestion list.
   *
   * The list previously responded only to onMouseDown, which meant keyboard and
   * screen-reader users could not reach it at all.
   */
  const handleSuggestionKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    close: (open: boolean) => void
  ) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeSuggestion >= 0) {
      e.preventDefault();
      handleSuggestionSelect(suggestions[activeSuggestion]);
    } else if (e.key === "Escape") {
      close(false);
      setActiveSuggestion(-1);
    }
  };

  const updateUrlParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === "" || val === "all") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    // Any filter change invalidates the current page number — page 4 of the old
    // result set is meaningless in the new one.
    params.delete("page");
    router.push(`/shop?${params.toString()}`);
  };

  /**
   * Page links are real anchors so crawlers can follow them to a server-rendered
   * page, but a click is intercepted: the whole match set is already in memory,
   * so changing page is pure client work. pushState keeps the URL and
   * useSearchParams in step without a server round-trip, and therefore without
   * the root loading spinner flashing.
   */
  const handlePageClick = (e: React.MouseEvent, target: number) => {
    // Let modified clicks (new tab, new window) behave normally.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (target > 1) params.set("page", String(target));
    else params.delete("page");
    const qs = params.toString();
    window.history.pushState(null, "", qs ? `/shop?${qs}` : "/shop");
    // pushState does not scroll, and the previous behaviour of a full navigation
    // did land the user at the top of the grid.
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showError = error || initialLoadFailed;

  const suggestionList = (
    idPrefix: string,
    show: boolean,
    onSelect: (name: string) => void
  ) =>
    show && suggestions.length > 0 ? (
      <ul
        id={`${idPrefix}-suggestions`}
        role="listbox"
        aria-label="Product suggestions"
        className="absolute z-30 w-full mt-1 bg-white border border-brand-border rounded-lg shadow-lg max-h-60 overflow-auto"
      >
        {suggestions.map((name, index) => (
          <li
            key={name}
            id={`${idPrefix}-suggestion-${index}`}
            role="option"
            aria-selected={index === activeSuggestion}
            tabIndex={-1}
            className={`px-3.5 py-2 text-sm text-brand-black cursor-pointer ${
              index === activeSuggestion ? "bg-brand-light-gray" : "hover:bg-brand-light-gray"
            }`}
            onMouseDown={() => onSelect(name)}
          >
            {name}
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-7 md:py-12 w-full animate-in fade-in">
      {/* Page Header */}
      <div className="space-y-3 pb-6 md:pb-10 text-center">
        <span className="flex items-center justify-center gap-2 text-xs font-semibold text-primary-text uppercase tracking-wider">
          <ShoppingBag size={14} className="text-primary" aria-hidden="true" /> Gift Catalog
        </span>
        <h1 className="font-display text-3xl sm:text-5xl text-brand-black tracking-wide uppercase">
          {pageTitle}
        </h1>
        <p className="text-sm font-medium text-brand-gray">{pageSubtitle}</p>
      </div>

      <div className="relative lg:grid lg:grid-cols-[16rem_1fr] xl:grid-cols-[18rem_1fr] lg:items-start lg:gap-8 lg:pt-8">
        {/* Desktop Sidebar — detailed filters */}
        <StickyBox topOffset={112} enableFrom={1024} className="hidden lg:block">
          <aside aria-labelledby="shop-filters-heading" className="space-y-7">
            {/* sr-only so the outline reads h1 -> h2 -> h3 without a level skip,
                and so the aside has an accessible name. Re-tagging the two
                filter <h3>s to <h2> was rejected: it would make two widget
                labels the page's only h2s while the product grid, the actual
                content, still had none. */}
            <h2 id="shop-filters-heading" className="sr-only">
              Filter and search products
            </h2>

            {/* Search */}
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold text-brand-black uppercase tracking-wider mb-3">
                <Search size={14} className="text-primary" aria-hidden="true" /> Search
              </h3>
              <form onSubmit={handleSearchSubmit} role="search" className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setActiveSuggestion(-1);
                  }}
                  onFocus={() => setShowDesktopSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowDesktopSuggestions(false), 200)}
                  onKeyDown={(e) => handleSuggestionKeyDown(e, setShowDesktopSuggestions)}
                  placeholder="Search products..."
                  autoComplete="off"
                  aria-label="Search products"
                  role="combobox"
                  aria-expanded={showDesktopSuggestions && suggestions.length > 0}
                  aria-controls="shop-desktop-suggestions"
                  aria-autocomplete="list"
                  aria-activedescendant={
                    activeSuggestion >= 0
                      ? `shop-desktop-suggestion-${activeSuggestion}`
                      : undefined
                  }
                  className="w-full h-11 px-3.5 bg-brand-light-gray/50 border border-brand-border rounded-lg text-sm text-brand-black outline-none focus:ring-2 focus:ring-primary transition-all"
                />
                <button type="submit" className="sr-only">
                  Search
                </button>
                {suggestionList(
                  "shop-desktop",
                  showDesktopSuggestions,
                  handleSuggestionSelect
                )}
              </form>
            </div>

            {/* Categories */}
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold text-brand-black uppercase tracking-wider mb-3">
                <SlidersHorizontal size={14} className="text-primary" aria-hidden="true" />{" "}
                Categories
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setCategory("all");
                    updateUrlParams({ category: "all" });
                  }}
                  aria-current={category === "all" ? "true" : undefined}
                  className={`w-full text-left px-3 py-2 min-h-11 flex items-center rounded-lg text-sm font-semibold transition-colors ${
                    category === "all"
                      ? "bg-primary-tint text-primary"
                      : "text-brand-gray hover:bg-brand-light-gray hover:text-brand-black"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => {
                      setCategory(c.slug);
                      updateUrlParams({ category: c.slug });
                    }}
                    aria-current={category === c.slug ? "true" : undefined}
                    className={`w-full text-left px-3 py-2 min-h-11 flex items-center rounded-lg text-sm font-semibold transition-colors ${
                      category === c.slug
                        ? "bg-primary-tint text-primary"
                        : "text-brand-gray hover:bg-brand-light-gray hover:text-brand-black"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </StickyBox>

        {/* Main content column */}
        <div className="min-w-0 space-y-6 md:space-y-8">
          {/* Mobile / tablet compact filter bar */}
          <div className="lg:hidden space-y-4">
            <div className="flex flex-col sm:flex-row gap-2.5 md:gap-3 items-center">
              <form
                onSubmit={handleSearchSubmit}
                role="search"
                className="relative w-full sm:flex-1"
              >
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-gray">
                  <Search size={16} aria-hidden="true" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setActiveSuggestion(-1);
                  }}
                  onFocus={() => setShowMobileSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowMobileSuggestions(false), 200)}
                  onKeyDown={(e) => handleSuggestionKeyDown(e, setShowMobileSuggestions)}
                  placeholder="Search products by name..."
                  autoComplete="off"
                  aria-label="Search products"
                  role="combobox"
                  aria-expanded={showMobileSuggestions && suggestions.length > 0}
                  aria-controls="shop-mobile-suggestions"
                  aria-autocomplete="list"
                  aria-activedescendant={
                    activeSuggestion >= 0
                      ? `shop-mobile-suggestion-${activeSuggestion}`
                      : undefined
                  }
                  className="w-full h-11 pl-10 pr-4 bg-brand-light-gray/50 border border-brand-border rounded-lg md:rounded-xl text-sm text-brand-black outline-none focus:ring-2 focus:ring-primary transition-all"
                />
                <button type="submit" className="sr-only">
                  Search
                </button>
                {suggestionList(
                  "shop-mobile",
                  showMobileSuggestions,
                  handleSuggestionSelect
                )}
              </form>

              <div className="flex w-full sm:w-auto items-center gap-2 md:gap-3">
                <div className="flex-1 min-w-0 sm:flex-none sm:w-44">
                  <CustomSelect
                    options={[
                      { label: "All Categories", value: "all" },
                      ...categories.map((c) => ({
                        label: c.name,
                        value: c.slug,
                      })),
                    ]}
                    value={category}
                    onChange={(val) => {
                      setCategory(val);
                      updateUrlParams({ category: val });
                    }}
                    theme="primary"
                  />
                </div>

                <div className="flex-1 min-w-0 sm:flex-none sm:w-44">
                  <CustomSelect
                    options={SORT_OPTIONS}
                    value={sort}
                    onChange={(val) => {
                      setSort(val);
                      updateUrlParams({ sort: val });
                    }}
                    theme="primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar — results count left, sort dropdown right */}
          <div className="flex items-center justify-between gap-4">
            {!showSkeleton && !showError ? (
              <p className="text-xs font-semibold text-brand-gray uppercase tracking-wide">
                {products.length} {products.length === 1 ? "product" : "products"} found
              </p>
            ) : (
              <span />
            )}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-brand-black uppercase tracking-wider">
                Sort by
              </span>
              <div className="w-48">
                <CustomSelect
                  options={SORT_OPTIONS}
                  value={sort}
                  onChange={(val) => {
                    setSort(val);
                    updateUrlParams({ sort: val });
                  }}
                  theme="primary"
                />
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <h2 className="sr-only">{pageTitle} products</h2>

          {showSkeleton ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
              {[...Array(8)].map((_, idx) => (
                <div key={idx} className="block">
                  <SkeletonCard />
                </div>
              ))}
            </div>
          ) : showError ? (
            <p className="text-center text-red-600 text-sm font-semibold py-8">
              Failed to load products list.
            </p>
          ) : products.length === 0 ? (
            <div className="text-center text-brand-gray py-20 border border-brand-border border-dashed rounded-3xl bg-brand-light-gray/20">
              <ShoppingBag
                className="mx-auto mb-3 text-neutral-300 animate-bounce"
                size={48}
                aria-hidden="true"
              />
              <p className="text-sm font-semibold text-brand-black">No products found</p>
              <p className="text-xs mt-1">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                {visibleProducts.map((product) => (
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
                  aria-label="Product pages"
                  className="flex flex-wrap items-center justify-center gap-2 pt-4"
                >
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => {
                    const isCurrent = n === currentPage;
                    return (
                      <Link
                        key={n}
                        href={buildShopUrl({ category, search: searchTerm, sort, page: n })}
                        onClick={(e) => handlePageClick(e, n)}
                        aria-current={isCurrent ? "page" : undefined}
                        aria-label={`Page ${n}`}
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

              {products.length > PAGE_SIZE && (
                <p className="text-center text-xs text-brand-gray">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, products.length)} of{" "}
                  {products.length}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
