/**
 * Schema.org JSON-LD node generators.
 *
 * Pure functions — no database, no I/O. Callers fetch the facts and pass them
 * in, which keeps the shapes unit-reasonable and stops schema code from
 * quietly opening a connection.
 *
 * Nodes are emitted CONTEXT-FREE. `<JsonLd>` wraps them in a single
 * `{"@context": ..., "@graph": [...]}` document, so one page emits one script
 * instead of five, and cross-references resolve by `@id` inside the graph.
 *
 * ## The node identity scheme
 *
 * `#organization` is a single `LocalBusiness` node. LocalBusiness is a subclass
 * of Organization, so it satisfies every consumer that wants an Organization —
 * `WebSite.publisher` and `Product.offers.seller` both point at it. The previous
 * arrangement had a separate `Organization` and `LocalBusiness` duplicating
 * name/url/logo/sameAs, with a `#localbusiness` id nothing referenced.
 *
 * ## On aggregateRating
 *
 * There is deliberately no `aggregateRating` generator, on any node.
 *
 * A hardcoded 4.9 / 128 previously shipped on LocalBusiness on every page,
 * matching no document in any collection. Reinstating a rating requires all of:
 *   1. `models/Testimonial.ts` gaining a `product` reference (it has none, so no
 *      rating can be attributed to a product today);
 *   2. emitting it on `Product` only — reviews about the business itself, on the
 *      business's own site, are self-serving and ineligible for rich results;
 *   3. a threshold of at least 3 approved reviews, with `reviewCount` equal to
 *      the actual document count;
 *   4. those same reviews rendered VISIBLY on the product page. Marking up
 *      content that is not on the page is the violation, not the rating itself.
 * Until (1) and (4) exist, emitting one would just move the problem.
 */

import {
  BRAND,
  COUNTRY,
  CURRENCY,
  HANDLING_TIME_MAX_DAYS,
  HANDLING_TIME_MIN_DAYS,
  LANG,
  PRICE_VALIDITY_DAYS,
} from "./config";
import { absoluteUrl } from "./url";
import type { ParsedAddress } from "./settings";

/** A context-free JSON-LD node. */
export type SchemaNode = Record<string, unknown> & {
  "@type": string | string[];
  "@id"?: string;
};

/**
 * A fragment `@id` for a page, e.g. "https://laraspinal.in/faq#webpage".
 *
 * `absoluteUrl("/")` has no trailing slash, so the root case needs one added
 * explicitly — otherwise the homepage's ids come out as
 * "https://laraspinal.in#webpage", inconsistent with the "/#organization" ids
 * that other nodes already use and that external references depend on.
 */
function fragmentId(path: string, fragment: string): string {
  const base = absoluteUrl(path);
  return `${base}${path === "/" ? "/" : ""}#${fragment}`;
}

/** Fragment id on the site root, e.g. "https://laraspinal.in/#organization". */
function rootId(fragment: string): string {
  return fragmentId("/", fragment);
}

/** `#organization` keeps its existing value so nothing that references it breaks. */
export const ORG_ID = rootId("organization");
export const WEBSITE_ID = rootId("website");
export const LOGO_ID = rootId("logo");
export const SHIPPING_ID = rootId("shipping-in");
export const RETURN_POLICY_ID = `${absoluteUrl("/refund-policy")}#returnpolicy`;

/** Villupuram, Tamil Nadu — the studio's coordinates. */
const STUDIO_GEO = { latitude: "11.9401", longitude: "79.4861" };
const STUDIO_LOCALITY = "villupuram";

export interface BusinessFacts {
  farmName: string;
  phone?: string;
  email?: string;
  address: ParsedAddress;
  socialLinks: string[];
}

export function logoNode(): SchemaNode {
  // Real dimensions of public/logo.png. Declaring 1200x630 here (as the OG tags
  // once did) is a false claim that social scrapers act on.
  return {
    "@type": "ImageObject",
    "@id": LOGO_ID,
    url: absoluteUrl("/logo.png"),
    width: 453,
    height: 358,
    caption: BRAND,
  };
}

export function localBusinessNode(facts: BusinessFacts): SchemaNode {
  const { farmName, phone, email, address, socialLinks } = facts;

  const hasAddress = Object.keys(address).length > 0;

  // Geo is only asserted while the parsed locality still matches the coordinates
  // these constants describe. If an admin moves the studio, a stale lat/long is
  // worse for local search than none at all.
  const localityMatchesGeo =
    address.addressLocality?.trim().toLowerCase() === STUDIO_LOCALITY;

  return {
    "@type": "LocalBusiness",
    "@id": ORG_ID,
    name: farmName,
    url: absoluteUrl("/"),
    image: { "@id": LOGO_ID },
    logo: { "@id": LOGO_ID },
    priceRange: "₹₹",
    ...(phone ? { telephone: phone } : {}),
    ...(email ? { email } : {}),
    ...(hasAddress ? { address: { "@type": "PostalAddress", ...address, addressCountry: COUNTRY } } : {}),
    ...(localityMatchesGeo ? { geo: { "@type": "GeoCoordinates", ...STUDIO_GEO } } : {}),
    // Was a four-item list of Tamil Nadu towns, which contradicted the
    // pan-India claim everywhere else on the site and the checkout, which
    // accepts any Indian PIN code but no foreign address at all.
    areaServed: { "@type": "Country", name: "India" },
    ...(socialLinks.length ? { sameAs: socialLinks } : {}),
    ...(phone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            telephone: phone,
            contactType: "customer service",
            areaServed: COUNTRY,
            availableLanguage: ["English", "Tamil"],
          },
        }
      : {}),
    founder: {
      "@type": "Person",
      name: "Senthil Ragu",
      jobTitle: "Lead Artisan & Founder",
      knowsAbout: ["Crochet", "Amigurumi", "Handicrafts", "Fibre Arts"],
    },
    knowsAbout: [
      "Crochet Gifts",
      "Crochet Flowers",
      "Amigurumi Plush Toys",
      "Handmade Handicrafts",
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "06:00",
        closes: "20:00",
      },
    ],
  };
}

export function webSiteNode(name: string): SchemaNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: absoluteUrl("/"),
    name,
    inLanguage: LANG,
    publisher: { "@id": ORG_ID },
    // `dateModified: new Date()` used to sit here. It changed on every render
    // and asserted nothing verifiable, so it was noise at best.
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export interface Crumb {
  name: string;
  /** Root-relative path. Omitted on the final crumb. */
  path?: string;
}

/**
 * A BreadcrumbList for one page.
 *
 * Returns null for a trail of fewer than two items — a breadcrumb consisting of
 * just "Home" describes nothing.
 *
 * The final item omits `item`, per Google's guidance that the current page needs
 * no URL of its own in the trail.
 */
export function breadcrumbNode(crumbs: Crumb[], pagePath: string): SchemaNode | null {
  if (crumbs.length < 2) return null;
  return {
    "@type": "BreadcrumbList",
    "@id": fragmentId(pagePath, "breadcrumb"),
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      ...(index < crumbs.length - 1 && crumb.path
        ? { item: absoluteUrl(crumb.path) }
        : {}),
    })),
  };
}

export type WebPageType =
  | "WebPage"
  | "AboutPage"
  | "ContactPage"
  | "CollectionPage"
  | "FAQPage";

export function webPageNode(options: {
  path: string;
  name: string;
  description: string;
  type?: WebPageType;
  dateModified?: Date | null;
}): SchemaNode {
  const { path, name, description, type = "WebPage", dateModified } = options;
  return {
    "@type": type,
    "@id": fragmentId(path, "webpage"),
    url: absoluteUrl(path),
    name,
    description,
    inLanguage: LANG,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
    ...(dateModified ? { dateModified: dateModified.toISOString() } : {}),
  };
}

export function itemListNode(options: {
  path: string;
  items: { name: string; url: string }[];
}): SchemaNode {
  const { path, items } = options;
  return {
    "@type": "ItemList",
    "@id": fragmentId(path, "itemlist"),
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.url),
    })),
  };
}

/**
 * The return policy, as actually published on /refund-policy.
 *
 * `MerchantReturnNotPermitted` is the accurate category: every item is
 * hand-knitted to order and the policy states returns cannot be accepted for
 * custom or personalised orders once work has begun.
 *
 * The 48-hour damaged-goods remedy is deliberately NOT modelled as
 * `MerchantReturnFiniteReturnWindow` with `merchantReturnDays: 2`. That remedy
 * is a warranty replacement for a defective item, not a change-of-mind return
 * window, and schema.org has no field for it — describing it as a return window
 * would misrepresent the policy in the direction of promising more than is
 * offered. With `NotPermitted`, `merchantReturnDays`, `returnFees` and
 * `returnMethod` are not required, so this validates without warnings.
 */
export function returnPolicyNode(): SchemaNode {
  return {
    "@type": "MerchantReturnPolicy",
    "@id": RETURN_POLICY_ID,
    applicableCountry: COUNTRY,
    returnPolicyCountry: COUNTRY,
    returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    merchantReturnLink: absoluteUrl("/refund-policy"),
  };
}

/**
 * Shipping terms.
 *
 * Every field here is derived from something the application actually enforces:
 *   - `shippingRate` is the live `delivery_fee` setting. The fee logic in
 *     /api/orders is a flat amount with no zone or weight variation, so one node
 *     is truthful for every destination.
 *   - `shippingDestination` is India because checkout physically cannot accept
 *     anything else: Order has no country field and the phone is validated
 *     against an Indian mobile pattern.
 *   - `handlingTime` is the crafting window already published on the homepage.
 *
 * `transitTime` is omitted on purpose. There is no carrier integration — the
 * order status enum has no in-transit state — so any figure would be invented.
 * Google accepts partial shippingDetails.
 */
export function shippingDetailsNode(feeInInr: number): SchemaNode {
  return {
    "@type": "OfferShippingDetails",
    "@id": SHIPPING_ID,
    shippingRate: {
      "@type": "MonetaryAmount",
      value: feeInInr,
      currency: CURRENCY,
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: COUNTRY,
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: HANDLING_TIME_MIN_DAYS,
        maxValue: HANDLING_TIME_MAX_DAYS,
        unitCode: "DAY",
      },
    },
  };
}

export interface ProductFacts {
  name: string;
  slug: string;
  /** Plain text, already stripped of markup. */
  description: string;
  images: string[];
  price: number;
  discountPrice?: number;
  stock: number;
  categoryName?: string;
  /** ISO string; drives priceValidUntil. */
  updatedAt: string;
}

function priceValidUntil(updatedAtIso: string): string {
  const base = new Date(updatedAtIso);
  const valid = Number.isNaN(base.getTime()) ? new Date() : base;
  const until = new Date(valid);
  until.setDate(until.getDate() + PRICE_VALIDITY_DAYS);
  return until.toISOString().slice(0, 10);
}

export function productNode(product: ProductFacts): SchemaNode {
  const path = `/shop/${product.slug}`;
  const url = absoluteUrl(path);

  return {
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: product.description.slice(0, 500),
    ...(product.images.length ? { image: product.images } : {}),
    url,
    // `slug` is the SKU: unique and indexed on the model, already the public
    // identifier for the item, and stable. `_id` would be opaque and would
    // change if the catalogue were reseeded. No gtin/mpn — handmade one-offs
    // have none, and inventing an identifier is the same class of problem as
    // inventing a rating.
    sku: product.slug,
    ...(product.categoryName ? { category: product.categoryName } : {}),
    brand: { "@type": "Brand", name: BRAND },
    offers: {
      "@type": "Offer",
      "@id": `${url}#offer`,
      url,
      priceCurrency: CURRENCY,
      price: product.discountPrice ?? product.price,
      priceValidUntil: priceValidUntil(product.updatedAt),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": ORG_ID },
      hasMerchantReturnPolicy: { "@id": RETURN_POLICY_ID },
      shippingDetails: { "@id": SHIPPING_ID },
    },
  };
}

/**
 * A FAQPage.
 *
 * Callers must pass the same questions and answers that are rendered visibly on
 * the page. The previous FAQPage node lived in the root layout — on every route
 * — with two questions whose text appeared in no UI at all.
 *
 * Answers are plain text. They are not HTML, so nothing needs sanitising and
 * there is no way for the visible copy and the marked-up copy to diverge.
 */
export function faqPageNode(
  path: string,
  qa: { question: string; answer: string }[]
): SchemaNode {
  return {
    "@type": "FAQPage",
    "@id": fragmentId(path, "faq"),
    url: absoluteUrl(path),
    inLanguage: LANG,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: qa.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/** Strip HTML tags and collapse whitespace, for schema `description` fields. */
export function toPlainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
