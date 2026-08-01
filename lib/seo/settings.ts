/**
 * Cached SiteSettings reads for metadata and structured data.
 *
 * SERVER ONLY — imports mongoose.
 *
 * `getSeoSettings` is wrapped in React `cache()` because the root layout needs
 * these values twice per request: once in `generateMetadata` for the title and
 * favicon, once in the layout body for the LocalBusiness node. Those were two
 * separate `SiteSettings.find()` calls opening the same connection.
 */

import { cache } from "react";
import { connectToDatabase } from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import { CONTENT_DEFAULTS } from "@/lib/siteContent";
import { escapeRegex } from "@/lib/security/url";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from "./config";

/** A parsed postal address. Every field is optional — none are invented. */
export interface ParsedAddress {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
}

export interface SeoSettings {
  title: string;
  description: string;
  /** Admin-configured favicon, or undefined to fall back to app/icon.png. */
  faviconUrl?: string;
  farmName: string;
  phone?: string;
  email?: string;
  /** The raw `contact_address` value, for display. */
  addressText?: string;
  /** Structured form of the same value, for schema. Empty when unparseable. */
  address: ParsedAddress;
  socialLinks: string[];
}

const SEO_KEYS = [
  "seo_title",
  "seo_description",
  "favicon_url",
  "logo_url",
  "farm_name",
  "contact_phone",
  "contact_email",
  "contact_address",
  "social_facebook",
  "social_instagram",
  "social_youtube",
] as const;

/**
 * Parse an Indian-style postal address into schema.org PostalAddress fields.
 *
 * The address used to be hardcoded three different ways in this repo (three
 * different door numbers), with the schema value derived from
 * `address.split(",")[0]` and the locality, region and postcode written as
 * literals. NAP consistency is a direct local-ranking factor, so there is now
 * exactly one source: the `contact_address` setting.
 *
 * Anything that cannot be parsed is omitted rather than guessed — a partial
 * PostalAddress is valid schema, a wrong one is a ranking liability.
 *
 * Handles: "2/90 Mettu Street, Therkunam, Villupuram, Tamil Nadu - 604102"
 *          "50, Mettu Street, Villupuram, Tamil Nadu 604102"
 */
export function parseAddress(raw: string | undefined): ParsedAddress {
  if (!raw || !raw.trim()) return {};

  const postalMatch = raw.match(/\b(\d{6})\b/);
  const postalCode = postalMatch?.[1];

  // Drop the postcode and any dash/comma left dangling where it used to be.
  const withoutPostal = postalCode
    ? raw.replace(postalMatch[0], "").replace(/[\s,-]+$/, "")
    : raw;

  const parts = withoutPostal
    .split(",")
    .map((p) => p.replace(/^[\s-]+|[\s-]+$/g, "").trim())
    .filter(Boolean);

  const result: ParsedAddress = {};
  if (postalCode) result.postalCode = postalCode;

  if (parts.length >= 3) {
    result.addressRegion = parts[parts.length - 1];
    result.addressLocality = parts[parts.length - 2];
    result.streetAddress = parts.slice(0, parts.length - 2).join(", ");
  } else if (parts.length === 2) {
    result.addressRegion = parts[1];
    result.streetAddress = parts[0];
  } else if (parts.length === 1) {
    result.streetAddress = parts[0];
  }

  return result;
}

export const getSeoSettings = cache(async (): Promise<SeoSettings> => {
  let values: Record<string, string> = {};

  try {
    await connectToDatabase();
    const rows = await SiteSettings.find({ key: { $in: SEO_KEYS } })
      .select("key value")
      .lean<{ key: string; value?: string }[]>();
    values = Object.fromEntries(
      rows.filter((r) => r.value).map((r) => [r.key, r.value as string])
    );
  } catch (error) {
    console.error("[seo] Failed to load site settings:", error);
  }

  const addressText = values.contact_address;

  return {
    title: values.seo_title || DEFAULT_TITLE,
    description: values.seo_description || DEFAULT_DESCRIPTION,
    faviconUrl: values.favicon_url || values.logo_url || undefined,
    farmName: values.farm_name || "Lara's Pinnal",
    phone: values.contact_phone || undefined,
    email: values.contact_email || undefined,
    addressText,
    address: parseAddress(addressText),
    socialLinks: [
      values.social_facebook,
      values.social_instagram || CONTENT_DEFAULTS.social_instagram,
      values.social_youtube,
    ].filter((v): v is string => Boolean(v)),
  };
});

export interface DeliverySettings {
  /** Flat delivery fee in INR. 0 means delivery is free on every order. */
  fee: number;
  freeAboveEnabled: boolean;
  /** Subtotal above which delivery is free, when `freeAboveEnabled`. */
  freeAboveThreshold: number;
}

/**
 * The live delivery-charge rule.
 *
 * Authoritative implementation is in `app/api/orders/route.ts`:
 *   fee = (freeEnabled && subtotal >= threshold) || feeSetting === 0 ? 0 : feeSetting
 * A flat fee with no zone or weight variation, which is what makes a single
 * `OfferShippingDetails` node truthful for every destination.
 */
export const getDeliverySettings = cache(async (): Promise<DeliverySettings> => {
  try {
    await connectToDatabase();
    const rows = await SiteSettings.find({
      key: { $in: ["delivery_fee", "is_free_delivery_enabled", "free_delivery_threshold"] },
    })
      .select("key value")
      .lean<{ key: string; value?: string }[]>();
    const get = (k: string) => rows.find((r) => r.key === k)?.value ?? "";
    return {
      fee: Number.parseFloat(get("delivery_fee")) || 0,
      freeAboveEnabled: get("is_free_delivery_enabled") === "true",
      freeAboveThreshold: Number.parseFloat(get("free_delivery_threshold")) || 0,
    };
  } catch (error) {
    console.error("[seo] Failed to load delivery settings:", error);
    return { fee: 0, freeAboveEnabled: false, freeAboveThreshold: 0 };
  }
});

/**
 * When a CMS-backed page was last edited, for `sitemap.lastModified` and
 * `WebPage.dateModified`. Returns null when the key has never been saved, so
 * the caller can omit the field rather than claim "now".
 */
export const getSettingUpdatedAt = cache(async (key: string): Promise<Date | null> => {
  try {
    await connectToDatabase();
    const row = await SiteSettings.findOne({ key })
      .select("updatedAt")
      .lean<{ updatedAt?: Date }>();
    return row?.updatedAt ? new Date(row.updatedAt) : null;
  } catch (error) {
    console.error(`[seo] Failed to load updatedAt for ${key}:`, error);
    return null;
  }
});

/**
 * The newest `updatedAt` across every key sharing a prefix. Null when none
 * exist.
 *
 * `keyPrefix` is escaped even though every caller passes a literal: this repo
 * has already shipped one unescaped `$regex` interpolation that turned into an
 * unauthenticated CPU denial of service, so raw interpolation into a Mongo
 * regex is treated as a mistake regardless of the current call sites.
 */
export const getNewestSettingUpdatedAt = cache(
  async (keyPrefix: string): Promise<Date | null> => {
    try {
      await connectToDatabase();
      const row = await SiteSettings.findOne({
        key: { $regex: `^${escapeRegex(keyPrefix)}` },
      })
        .sort({ updatedAt: -1 })
        .select("updatedAt")
        .lean<{ updatedAt?: Date }>();
      return row?.updatedAt ? new Date(row.updatedAt) : null;
    } catch (error) {
      console.error(`[seo] Failed to load newest updatedAt for ${keyPrefix}:`, error);
      return null;
    }
  }
);
