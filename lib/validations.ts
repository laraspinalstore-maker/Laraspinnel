import { z } from "zod";
// Imports ONLY from ./url, never from ./sanitize: this module is shared with the
// public contact form (a client component), and ./sanitize pulls in sanitize-html.
// Markup sanitizing for the one field rendered as HTML (product description)
// happens server-side in the route — see app/api/admin/products/route.ts.
import { stripMarkupText, safeUrl, isOwnImageKitUrl, isStorableImageUrl } from "@/lib/security/url";

// Phone number regex for 10-digit Indian phone numbers (optionally prefix with +91 or 0)
const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
const pincodeRegex = /^\d{6}$/;

/**
 * Upper bounds on every free-text field.
 *
 * These schemas previously set minimum lengths but no maximums, so a single
 * request could store an arbitrarily large document — and, for the rich-text
 * fields, an arbitrarily large payload that is later rendered as HTML.
 */
const LIMITS = {
  name: 200,
  shortText: 300,
  richText: 100_000,
  url: 2_048,
} as const;

/** Plain text: markup stripped, trimmed, length-capped. */
const plainText = (max: number) =>
  z.preprocess((val) => (typeof val === "string" ? stripMarkupText(val).slice(0, max) : val), z.string());

/**
 * Admin rich text (product descriptions): length-bounded only.
 *
 * The actual HTML sanitizing is applied in the route handler with
 * sanitizeRichText(), because that needs sanitize-html and this module is
 * imported by client components. Sanitizing at the route is also the correct
 * boundary — it cannot be bypassed by a caller that posts directly to the API.
 */
const richText = (max: number) =>
  z.preprocess((val) => (typeof val === "string" ? val.slice(0, max) : val), z.string());

/**
 * An image URL an admin may store.
 *
 * Constrained to the hosts in `next.config.ts` remotePatterns (this project's
 * ImageKit account and images.unsplash.com) or a local /public path — so an
 * arbitrary third-party host can't be stored and then rendered as an <img src>
 * on public pages, turning every visitor into a beacon for that host.
 *
 * NOT restricted to own-ImageKit-only: the seeded catalog legitimately uses
 * Unsplash URLs, and rejecting those would make every existing product,
 * category and banner unsavable in the admin panel. Values arriving from
 * UNAUTHENTICATED callers use the stricter isOwnImageKitUrl instead.
 */
const storableImageUrl = z
  .string()
  .max(LIMITS.url)
  .refine(isStorableImageUrl, "Image must be an uploaded file, an approved image host, or a local asset path");

/**
 * A link target, normalised through safeUrl — which drops `javascript:`,
 * `data:` and protocol-relative values. These end up in `href` attributes.
 */
const linkUrl = z.preprocess(
  (val) => (typeof val === "string" && val.trim() ? safeUrl(val, "") : val),
  z.string().max(LIMITS.url)
);

export const categorySchema = z.object({
  name: plainText(LIMITS.name).pipe(z.string().min(2, "Name must be at least 2 characters")),
  description: plainText(LIMITS.richText).pipe(
    z.string().min(10, "Description must be at least 10 characters")
  ),
  image: storableImageUrl.min(1, "Category image is required"),
  isActive: z.boolean().default(true),
});

export const productSchema = z.object({
  name: plainText(LIMITS.name).pipe(z.string().min(2, "Name must be at least 2 characters")),
  category: z
    .string()
    // Must be a Mongo ObjectId, otherwise a CastError surfaces as a 500.
    .regex(/^[a-f0-9]{24}$/i, "Please select a valid category"),
  price: z.preprocess(
    (val) => Number(val),
    z.number().positive("Price must be a positive number").max(10_000_000)
  ),
  discountPrice: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().positive("Discount price must be positive").max(10_000_000).optional()
  ),
  description: richText(LIMITS.richText).pipe(
    z.string().min(10, "Description must be at least 10 characters")
  ),
  images: z.array(storableImageUrl).min(1, "At least one image is required").max(12),
  stock: z.preprocess(
    (val) => Number(val),
    z.number().int().nonnegative("Stock cannot be negative").max(1_000_000)
  ),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const orderSchema = z.object({
  customerName: plainText(LIMITS.name).pipe(z.string().min(2, "Name must be at least 2 characters")),
  phone: z.string().regex(phoneRegex, "Please enter a valid 10-digit phone number"),
  email: z.string().email("Invalid email address").max(254).optional().or(z.literal("")),
  address: plainText(500).pipe(z.string().min(10, "Address must be at least 10 characters")),
  city: plainText(120).pipe(z.string().min(2, "City must be at least 2 characters")),
  pincode: z.string().regex(pincodeRegex, "Please enter a valid 6-digit pin code"),
  notes: plainText(1000).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        // Validated as an ObjectId here as well as in the route, so a malformed
        // id is a 400 rather than a CastError-driven 500.
        productId: z.string().regex(/^[a-f0-9]{24}$/i, "Invalid product"),
        name: z.string().min(1).max(LIMITS.name),
        // Accepted but IGNORED: app/api/orders/route.ts recomputes every price
        // from the database. Kept only for compatibility with the existing
        // client payload.
        price: z.number().positive(),
        quantity: z.number().int().min(1).max(100),
        image: z.string().min(1).max(LIMITS.url),
        customText: plainText(LIMITS.shortText).optional().or(z.literal("")),
        // A reference image must be one of our own uploads; the value is
        // rendered as a link on the admin order page.
        customImage: z
          .string()
          .max(LIMITS.url)
          .refine((v) => !v || isOwnImageKitUrl(v), "Invalid image URL")
          .optional()
          .or(z.literal("")),
      })
    )
    .min(1, "Cart cannot be empty")
    .max(50),
});

export const contactMessageSchema = z.object({
  name: plainText(LIMITS.name).pipe(z.string().min(2, "Name must be at least 2 characters")),
  phone: z.string().regex(phoneRegex, "Please enter a valid 10-digit phone number"),
  email: z.string().email("Invalid email address").max(254).optional().or(z.literal("")),
  subject: plainText(200).pipe(z.string().min(3, "Subject must be at least 3 characters")),
  message: plainText(5000).pipe(z.string().min(10, "Message must be at least 10 characters")),
});

export const bannerSchema = z.object({
  imageUrl: storableImageUrl.min(1, "Image is required"),
  headline: plainText(200).pipe(z.string().min(5, "Headline must be at least 5 characters")),
  subtext: plainText(500).optional(),
  buttonText: plainText(80).optional(),
  buttonLink: linkUrl.optional(),
  buttonTheme: z.enum(["green", "red"]).default("green"),
  order: z.number().int().min(-1000).max(1000).default(0),
  isActive: z.boolean().default(true),
});

export type OrderFormData = z.infer<typeof orderSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
