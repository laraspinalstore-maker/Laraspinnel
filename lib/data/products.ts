/**
 * Server-side product queries.
 *
 * SERVER ONLY. This module imports mongoose and sanitize-html transitively;
 * importing it from a "use client" file would fail the build.
 *
 * Every export is wrapped in React `cache()` so that `generateMetadata`, the
 * page body, and the JSON-LD generator can each ask for the same product and
 * share a single database round-trip. Before this existed, the product route
 * queried the same document twice per request (once in generateMetadata, once
 * in the layout body) on top of the two queries the API route made.
 *
 * `cache()` compares arguments with `Object.is`, so every parameter here is a
 * primitive. An object-literal argument would produce a fresh reference on each
 * call and never dedupe.
 *
 * The filter/sort/cap semantics below intentionally mirror
 * `app/api/products/route.ts` field for field. The shop page seeds SWR with the
 * result of these functions and SWR then refetches the same query through the
 * API, so any divergence shows up as content changing under the user after
 * hydration.
 */

import { cache } from "react";
import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { escapeRegex } from "@/lib/security/url";
import { sanitizeRichText } from "@/lib/security/sanitize";
import type { CategoryRef, ProductCardDTO, ProductDetailDTO } from "./types";

/** Longest search term accepted. Beyond this it's a scan, not a search. */
export const MAX_SEARCH_LENGTH = 80;

/** Cap on returned documents so one call can't pull the whole table. */
export const MAX_RESULTS = 200;

/** Upper bound on a slug, so an absurd path segment never reaches the query. */
const MAX_SLUG_LENGTH = 200;

/** Upper bound on a category slug, matching app/api/products/route.ts. */
const MAX_CATEGORY_SLUG_LENGTH = 120;

type PopulatedCategory = { _id: Types.ObjectId; name: string; slug: string };

interface LeanProduct {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  images?: string[];
  stock: number;
  isFeatured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface LeanProductDetail extends LeanProduct {
  description: string;
  /** Populated object, a bare ObjectId when the Category row is gone, or absent. */
  category?: PopulatedCategory | Types.ObjectId | null;
}

/**
 * Sort allowlist. An arbitrary field from the query string would let a caller
 * sort on an unindexed column.
 *
 * `_id: 1` is appended to every option as a deterministic tiebreaker. MongoDB's
 * sort is not stable for equal keys, so two products at the same price could
 * come back in one order for the server render and a different order for the
 * client's refetch — which the user sees as the grid reshuffling itself.
 */
export function resolveSort(sort: unknown): Record<string, 1 | -1> {
  if (sort === "price-asc") return { price: 1, _id: 1 };
  if (sort === "price-desc") return { price: -1, _id: 1 };
  if (sort === "latest") return { createdAt: -1, _id: 1 };
  return { name: 1, _id: 1 };
}

/** Trim and cap a raw search term. Returns "" when there is nothing to search. */
export function normalizeSearch(search: unknown): string {
  return typeof search === "string" ? search.trim().slice(0, MAX_SEARCH_LENGTH) : "";
}

function isPopulatedCategory(value: unknown): value is PopulatedCategory {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "slug" in value &&
    typeof (value as { slug: unknown }).slug === "string"
  );
}

/**
 * A product whose category document was deleted leaves `category` as a bare
 * ObjectId rather than a populated object. Reading `.slug` off that is the
 * TypeError that `app/api/products/[slug]/route.ts` documents having surfaced
 * as a 500, so it is narrowed to null here instead.
 */
function toCategoryRef(value: unknown): CategoryRef | null {
  if (!isPopulatedCategory(value)) return null;
  return { _id: String(value._id), name: value.name, slug: value.slug };
}

function toCard(doc: LeanProduct): ProductCardDTO {
  return {
    _id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    price: doc.price,
    ...(typeof doc.discountPrice === "number" ? { discountPrice: doc.discountPrice } : {}),
    images: doc.images ?? [],
    stock: doc.stock,
  };
}

function toDetail(doc: LeanProductDetail): ProductDetailDTO {
  return {
    ...toCard(doc),
    // Sanitized here rather than in the page: the product page renders this with
    // dangerouslySetInnerHTML, and keeping the sanitizer on the server means it
    // cannot be skipped and sanitize-html stays out of the browser bundle.
    description: sanitizeRichText(doc.description),
    category: toCategoryRef(doc.category),
    isFeatured: Boolean(doc.isFeatured),
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

/**
 * Resolve an active category slug to its ObjectId string.
 *
 * Lives here rather than in ./categories.ts so that this module has a genuine
 * use for the Category model import. `app/api/products/[slug]/route.ts` calls
 * `.populate("category", ...)` without importing Category, which only works
 * because some other module happened to register the schema in the same Node
 * isolate — a cold isolate serving just that route can throw MissingSchemaError.
 */
const resolveCategoryId = cache(async (categorySlug: string): Promise<string | null> => {
  const doc = await Category.findOne({
    slug: categorySlug.slice(0, MAX_CATEGORY_SLUG_LENGTH),
    isActive: true,
  })
    .select("_id")
    .lean<{ _id: Types.ObjectId }>();
  return doc ? String(doc._id) : null;
});

/** A single active product with its category populated, or null. */
export const getProductBySlug = cache(
  async (slug: string): Promise<ProductDetailDTO | null> => {
    if (!slug || slug.length > MAX_SLUG_LENGTH) return null;
    try {
      await connectToDatabase();
      const doc = await Product.findOne({ slug, isActive: true })
        .populate("category", "name slug")
        .lean<LeanProductDetail>();
      return doc ? toDetail(doc) : null;
    } catch (error) {
      console.error("[data] getProductBySlug failed:", error);
      return null;
    }
  }
);

/** Other active products in the same category. */
export const getRelatedProducts = cache(
  async (categoryId: string, excludeSlug: string, limit = 4): Promise<ProductCardDTO[]> => {
    if (!categoryId) return [];
    try {
      await connectToDatabase();
      const docs = await Product.find({
        category: categoryId,
        slug: { $ne: excludeSlug },
        isActive: true,
      })
        .sort({ name: 1, _id: 1 })
        .limit(limit)
        .lean<LeanProduct[]>();
      return docs.map(toCard);
    } catch (error) {
      console.error("[data] getRelatedProducts failed:", error);
      return [];
    }
  }
);

/**
 * The active product list, filtered and sorted the same way `/api/products`
 * does it.
 *
 * Throws on database failure rather than returning `[]`, because the caller has
 * to be able to tell "no products match" from "the query failed" — the shop page
 * renders different copy for each.
 *
 * An unknown or inactive `categorySlug` yields `[]`, matching the API route.
 */
export const listProducts = cache(
  async (
    categorySlug: string,
    search: string,
    sort: string,
    featuredOnly: boolean
  ): Promise<ProductCardDTO[]> => {
    await connectToDatabase();

    const query: Record<string, unknown> = { isActive: true };

    if (featuredOnly) query.isFeatured = true;

    if (categorySlug && categorySlug !== "all") {
      const categoryId = await resolveCategoryId(categorySlug);
      if (!categoryId) return [];
      query.category = categoryId;
    }

    // Escaped to a literal substring match and length-capped. Interpolating the
    // raw term into $regex was an unauthenticated CPU denial of service — see
    // the note in app/api/products/route.ts.
    const term = normalizeSearch(search);
    if (term) {
      query.name = { $regex: escapeRegex(term), $options: "i" };
    }

    const docs = await Product.find(query)
      .sort(resolveSort(sort))
      .limit(MAX_RESULTS)
      .lean<LeanProduct[]>();

    return docs.map(toCard);
  }
);

/** Slugs and modification times for every active product. Used by the sitemap. */
export const getActiveProductSlugs = cache(
  async (): Promise<{ slug: string; updatedAt: Date }[]> => {
    await connectToDatabase();
    const docs = await Product.find({ isActive: true })
      .select("slug updatedAt")
      .sort({ updatedAt: -1 })
      .lean<{ slug: string; updatedAt?: Date }[]>();
    return docs.map((d) => ({ slug: d.slug, updatedAt: d.updatedAt ?? new Date(0) }));
  }
);
