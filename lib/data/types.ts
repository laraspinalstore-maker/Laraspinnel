/**
 * Serializable shapes for data crossing the server → client boundary.
 *
 * These exist because a Mongoose `.lean()` document cannot be handed to a
 * client component: `_id` is an ObjectId and the timestamps are Date objects,
 * and React throws "Only plain objects can be passed to Client Components".
 * `app/page.tsx` already hand-maps banners for exactly this reason; these types
 * make that mapping the rule rather than a one-off.
 *
 * The mappers in ./products.ts and ./categories.ts are the only place a lean
 * document is allowed to become a DTO. Nothing else should export raw documents.
 */

export interface CategoryRef {
  _id: string;
  name: string;
  slug: string;
}

export interface CategoryDTO extends CategoryRef {
  description: string;
  image: string;
}

/**
 * Exactly the fields components/home/PremiumCard.tsx consumes.
 *
 * This is a strict subset of what `GET /api/products` returns, which is what
 * makes it safe to use as SWR seed data: the components only read these fields,
 * and the extra fields the API sends are inert.
 */
export interface ProductCardDTO {
  _id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  images: string[];
  stock: number;
}

export interface ProductDetailDTO extends ProductCardDTO {
  /** Sanitized rich-text HTML, or plain text for descriptions saved before the
   *  formatting editor existed. Sanitized server-side, always. */
  description: string;
  /** `null` when the referenced Category document has been deleted. The product
   *  page must not assume this is present — see /api/products/[slug]. */
  category: CategoryRef | null;
  isFeatured: boolean;
  /** ISO 8601. Date objects cannot cross the client boundary. */
  createdAt: string;
  updatedAt: string;
}

/**
 * A homepage hero banner, as HeroSlider consumes it.
 *
 * Mirrors what `GET /api/banners` returns, so the same shape works both as SWR
 * seed data from the server render and as the client's own fetch result.
 */
export interface BannerDTO {
  _id: string;
  imageUrl: string;
  headline: string;
  subtext: string;
  buttonText: string;
  buttonLink: string;
  buttonTheme: string;
}

/**
 * A published customer review, as `GET /api/testimonials` returns it.
 *
 * Every field is optional because the collection predates several of them and
 * older rows genuinely lack values — which is why both consumers default each
 * field as they read it. Reviews carrying an `imageUrl` are screenshots rendered
 * in the About page gallery; the rest are text reviews rendered as the home page
 * chat section.
 */
export interface TestimonialDTO {
  _id?: string;
  name?: string;
  location?: string;
  goal?: string;
  outcome?: string;
  rating?: number;
  avatarUrl?: string;
  imageUrl?: string;
  orderImageUrl?: string;
  createdAt?: string;
}

/** Sort keys accepted from the query string. Anything else falls back to name. */
export type SortKey = "latest" | "price-asc" | "price-desc";

export const SORT_KEYS: readonly SortKey[] = ["latest", "price-asc", "price-desc"];

export function isSortKey(value: unknown): value is SortKey {
  return typeof value === "string" && (SORT_KEYS as readonly string[]).includes(value);
}
