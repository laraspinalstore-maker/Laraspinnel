/**
 * One place to read and normalise the /shop and /search query strings.
 *
 * Safe to import from client components: no database, no mongoose, no
 * sanitize-html. The server page and the client browser both derive their state
 * from these helpers so the two cannot drift.
 */

/** Products per page. 24 divides evenly by the grid's 2, 3 and 4 columns. */
export const PAGE_SIZE = 24;

/** Raw searchParams as Next hands them over. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface ShopParams {
  /** Category slug, or "all". */
  category: string;
  /** The search term exactly as it appeared in the URL, untrimmed. */
  search: string;
  /** One of the sort keys; "latest" when absent. */
  sort: string;
  /** 1-based, never below 1. Not yet clamped to the result count. */
  page: number;
}

/** A repeated query param arrives as an array; take the first occurrence. */
function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function parsePage(value: string | string[] | undefined): number {
  const parsed = Number.parseInt(first(value), 10);
  return Number.isFinite(parsed) && parsed > 1 ? parsed : 1;
}

/** Longest search term accepted, mirroring lib/data/products.ts. */
export const MAX_QUERY_LENGTH = 80;

/**
 * A trimmed, length-capped search term for /search's `?q=`.
 *
 * Capped here as well as in the data layer so the value that appears in the page
 * title, the `<h1>`, and the canonical is the same bounded string that was
 * queried — otherwise a 5,000-character `?q=` would be echoed into the document.
 */
export function normalizeQuery(value: string | string[] | undefined): string {
  return first(value).trim().slice(0, MAX_QUERY_LENGTH);
}

/**
 * Defaults mirror `ShopBrowser`'s initial state: category "all", empty search,
 * sort "latest".
 */
export function parseShopParams(raw: RawSearchParams): ShopParams {
  return {
    category: first(raw.category) || "all",
    search: first(raw.search),
    sort: first(raw.sort) || "latest",
    page: parsePage(raw.page),
  };
}

/**
 * The SWR cache key for a given filter combination.
 *
 * This must match the key the client builds byte for byte, or seeding does
 * nothing and the grid flashes empty on first paint. Two details matter:
 *   - append order is category, then search, then sort;
 *   - `search` goes in raw, exactly as it came out of the URL. The client's
 *     input state is the untrimmed param value, so trimming here would produce
 *     a different key even though both would query the same products.
 * `sort` is always present because it defaults to "latest", so the unfiltered
 * key is "/api/products?sort=latest" rather than "/api/products".
 */
export function buildProductsKey({ category, search, sort }: Omit<ShopParams, "page">): string {
  const query = new URLSearchParams();
  if (category && category !== "all") query.append("category", category);
  if (search) query.append("search", search);
  if (sort) query.append("sort", sort);
  return `/api/products?${query.toString()}`;
}

/** Total pages for a result count, never below 1 so page 1 always exists. */
export function totalPages(resultCount: number): number {
  return Math.max(1, Math.ceil(resultCount / PAGE_SIZE));
}

/** Clamp a requested page into range. */
export function clampPage(page: number, resultCount: number): number {
  return Math.min(Math.max(1, page), totalPages(resultCount));
}

/** The slice of results shown on a given page. */
export function pageSlice<T>(items: T[], page: number): T[] {
  const start = (page - 1) * PAGE_SIZE;
  return items.slice(start, start + PAGE_SIZE);
}

/**
 * Build a /shop URL for a filter combination. `page` is omitted when it is 1 and
 * empty values are dropped, so the canonical form of an unfiltered listing stays
 * exactly "/shop" and every URL that already exists keeps working.
 */
export function buildShopUrl(params: Partial<ShopParams>, basePath = "/shop"): string {
  const query = new URLSearchParams();
  if (params.category && params.category !== "all") query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  if (params.sort && params.sort !== "latest") query.set("sort", params.sort);
  if (params.page && params.page > 1) query.set("page", String(params.page));
  const qs = query.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
