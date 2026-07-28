"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useSWR from "swr";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PremiumCard from "@/components/home/PremiumCard";
import SkeletonCard from "@/components/shared/SkeletonCard";
import CustomSelect from "@/components/shared/CustomSelect";
import StickyBox from "@/components/shared/StickyBox";
import { sortInStockFirst } from "@/lib/utils";
import { Search, ShoppingBag, SlidersHorizontal } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const SORT_OPTIONS = [
  { label: "Latest Arrivals", value: "latest" },
  { label: "Price (Low to High)", value: "price-asc" },
  { label: "Price (High to Low)", value: "price-desc" },
];

function ShopPageContent() {
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

  // Sync state with URL search params
  useEffect(() => {
    setCategory(searchParams.get("category") || "all");
    setSearchTerm(searchParams.get("search") || "");
    setSort(searchParams.get("sort") || "latest");
  }, [searchParams]);

  // Fetch Categories
  const { data: categories = [] } = useSWR("/api/categories", fetcher);

  // Reflect the selected category in the page header
  const selectedCategory =
    category !== "all" ? categories.find((c: any) => c.slug === category) : undefined;
  const pageTitle = selectedCategory ? selectedCategory.name : "Shop Handmade Gifts";
  const pageSubtitle =
    selectedCategory?.description?.trim() ||
    "Explore our collection of custom crochet bouquets, frames, keychains, and hampers.";

  // Fetch Products
  const queryParams = new URLSearchParams();
  if (category && category !== "all") queryParams.append("category", category);
  if (searchTerm) queryParams.append("search", searchTerm);
  if (sort) queryParams.append("sort", sort);

  const { data: rawProducts = [], isLoading, error } = useSWR(
    `/api/products?${queryParams.toString()}`,
    fetcher
  );
  // Out-of-stock items fall to the end; they return to their normal spot once restocked.
  const products = sortInStockFirst(rawProducts);

  // Full product list (unfiltered by search) to power search-bar suggestions
  const { data: allProducts = [] } = useSWR("/api/products", fetcher);
  const productNames: string[] = Array.from(
    new Set(allProducts.map((p: any) => p.name).filter(Boolean))
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({ search: searchTerm });
  };

  const handleSuggestionSelect = (name: string) => {
    setSearchTerm(name);
    updateUrlParams({ search: name });
    setShowDesktopSuggestions(false);
    setShowMobileSuggestions(false);
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
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-7 md:py-12 w-full animate-in fade-in">
        {/* Page Header */}
        <div className="space-y-3 pb-6 md:pb-10 text-center">
          <span className="flex items-center justify-center gap-2 text-xs font-semibold text-goat-text uppercase tracking-wider">
            <ShoppingBag size={14} className="text-goat-primary" /> Gift Catalog
          </span>
          <h1 className="font-display text-3xl sm:text-5xl text-brand-black tracking-wide uppercase">
            {pageTitle}
          </h1>
          <p className="text-sm font-medium text-brand-gray">
            {pageSubtitle}
          </p>
        </div>

        <div className="relative lg:grid lg:grid-cols-[16rem_1fr] xl:grid-cols-[18rem_1fr] lg:items-start lg:gap-8 lg:pt-8">
          {/* Desktop Sidebar — detailed filters */}
          <StickyBox topOffset={112} enableFrom={1024} className="hidden lg:block">
          <aside className="space-y-7">
            {/* Search */}
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold text-brand-black uppercase tracking-wider mb-3">
                <Search size={14} className="text-goat-primary" /> Search
              </h3>
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowDesktopSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowDesktopSuggestions(false), 200)}
                  placeholder="Search products..."
                  autoComplete="off"
                  className="w-full h-11 px-3.5 bg-brand-light-gray/50 border border-brand-border rounded-lg text-sm text-brand-black outline-none focus:ring-2 focus:ring-goat-primary transition-all"
                />
                <button type="submit" className="sr-only">Search</button>
                {showDesktopSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-brand-border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((name) => (
                      <div
                        key={name}
                        className="px-3.5 py-2 text-sm text-brand-black hover:bg-brand-light-gray cursor-pointer"
                        onMouseDown={() => handleSuggestionSelect(name)}
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </form>
            </div>

            {/* Categories */}
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold text-brand-black uppercase tracking-wider mb-3">
                <SlidersHorizontal size={14} className="text-goat-primary" /> Categories
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setCategory("all");
                    updateUrlParams({ category: "all" });
                  }}
                  className={`w-full text-left px-3 py-2 min-h-11 flex items-center rounded-lg text-sm font-semibold transition-colors ${
                    category === "all"
                      ? "bg-goat-tint text-goat-primary"
                      : "text-brand-gray hover:bg-brand-light-gray hover:text-brand-black"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((c: any) => (
                  <button
                    key={c.slug}
                    onClick={() => {
                      setCategory(c.slug);
                      updateUrlParams({ category: c.slug });
                    }}
                    className={`w-full text-left px-3 py-2 min-h-11 flex items-center rounded-lg text-sm font-semibold transition-colors ${
                      category === c.slug
                        ? "bg-goat-tint text-goat-primary"
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
                <form onSubmit={handleSearchSubmit} className="relative w-full sm:flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-gray">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowMobileSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowMobileSuggestions(false), 200)}
                    placeholder="Search products by name..."
                    autoComplete="off"
                    className="w-full h-11 pl-10 pr-4 bg-brand-light-gray/50 border border-brand-border rounded-lg md:rounded-xl text-sm text-brand-black outline-none focus:ring-2 focus:ring-goat-primary transition-all"
                  />
                  <button type="submit" className="sr-only">Search</button>
                  {showMobileSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-30 w-full mt-1 bg-white border border-brand-border rounded-lg shadow-lg max-h-60 overflow-auto">
                      {suggestions.map((name) => (
                        <div
                          key={name}
                          className="px-4 py-2 text-sm text-brand-black hover:bg-brand-light-gray cursor-pointer"
                          onMouseDown={() => handleSuggestionSelect(name)}
                        >
                          {name}
                        </div>
                      ))}
                    </div>
                  )}
                </form>

                <div className="flex w-full sm:w-auto items-center gap-2 md:gap-3">
                  <div className="flex-1 min-w-0 sm:flex-none sm:w-44">
                    <CustomSelect
                      options={[
                        { label: "All Categories", value: "all" },
                        ...categories.map((c: any) => ({ label: c.name, value: c.slug })),
                      ]}
                      value={category}
                      onChange={(val) => {
                        setCategory(val);
                        updateUrlParams({ category: val });
                      }}
                      theme="goat"
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
                      theme="goat"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Toolbar — results count left, sort dropdown right (desktop; mobile has its own bar above) */}
            <div className="flex items-center justify-between gap-4">
              {!isLoading && !error ? (
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
                    theme="goat"
                  />
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                {[...Array(8)].map((_, idx) => (
                  <div key={idx} className="block"><SkeletonCard key={idx} /></div>
                ))}
              </div>
            ) : error ? (
              <p className="text-center text-red-600 text-sm font-semibold py-8">
                Failed to load products list.
              </p>
            ) : products.length === 0 ? (
              <div className="text-center text-brand-gray py-20 border border-brand-border border-dashed rounded-3xl bg-brand-light-gray/20">
                <ShoppingBag className="mx-auto mb-3 text-neutral-300 animate-bounce" size={48} />
                <p className="text-sm font-semibold text-brand-black">No products found</p>
                <p className="text-xs mt-1">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                {products.map((product: any) => (
                  <div key={product._id}>
                    <PremiumCard
                      id={product._id}
                      name={product.name}
                      price={product.discountPrice ? `₹${product.discountPrice}` : `₹${product.price}`}
                      tag={product.discountPrice ? `SAVE ₹${product.price - product.discountPrice}` : undefined}
                      image={product.images?.[0]}
                      slug={product.slug}
                      theme="goat"
                      stock={product.stock}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-goat-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ShopPageContent />
    </Suspense>
  );
}
