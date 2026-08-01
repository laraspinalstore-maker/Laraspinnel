/**
 * SEO constants.
 *
 * Dependency-free and safe to import anywhere, including client components.
 *
 * Note the split between BRAND and the admin-editable `farm_name` setting.
 * BRAND is the fixed brand token used in `<title>` suffixes and the Product
 * `brand` node — it must stay stable, because changing the string every page
 * title ends with would churn every indexed title. `farm_name` drives the
 * schema `name` and the visible chrome, and an admin may legitimately tweak it.
 */

export const BRAND = "Lara's Pinnal";

/** Appended to every page title except the ones that opt out. */
export const TITLE_TEMPLATE = `%s | ${BRAND}`;

export const LOCALE = "en_IN";
export const LANG = "en-IN";
export const CURRENCY = "INR";
export const COUNTRY = "IN";

export const DEFAULT_TITLE = `${BRAND} | Handmade Crochet Gifts & Flowers in Tamil Nadu`;

export const DEFAULT_DESCRIPTION =
  "Shop handmade crochet gifts from Lara's Pinnal, Tamil Nadu. Crochet flower bouquets, amigurumi plushies, custom frames, keychains & gift hampers shipped across India.";

/**
 * How long a listed price is asserted to be valid for, in days.
 *
 * Google warns when `priceValidUntil` is absent from an Offer, but a fabricated
 * near-term date reads as a sale deadline that does not exist. This is a
 * validity horizon, not a promotion end date: it is measured from the product's
 * own `updatedAt`, so editing a price moves it forward.
 */
export const PRICE_VALIDITY_DAYS = 365;

/**
 * Handling time before dispatch, in days.
 *
 * Sourced from the crafting time already published on the homepage
 * ("Ready to Ship in 2-4 days"). Transit time is deliberately NOT modelled —
 * no courier integration exists (`Order.status` has no in-transit state), so
 * any transit figure would be invented.
 */
export const HANDLING_TIME_MIN_DAYS = 2;
export const HANDLING_TIME_MAX_DAYS = 4;

/** Fallback OG image dimensions, matching app/opengraph-image.tsx. */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
