/**
 * Exposure policy for the SiteSettings key/value store.
 *
 * `GET /api/settings` is unauthenticated and used by most public pages via
 * useSettings(). It previously returned `SiteSettings.find({})` verbatim — the
 * entire table, every key, to anyone. That is fail-open by construction: any
 * key an admin adds later (an internal note, a template, an integration id) is
 * published the moment it is saved.
 *
 * The policy here is:
 *   1. A key matching PRIVATE_KEY_PATTERNS is never public. This check wins.
 *   2. Otherwise it is public if it is in PUBLIC_KEYS, or matches one of the
 *      PUBLIC_KEY_PREFIXES used by the site-content CMS.
 *   3. Anything else is withheld.
 *
 * Rule 2's prefixes exist so adding a new piece of page copy in the admin CMS
 * doesn't require a code change, while rule 1 guarantees that convenience can
 * never expose a credential-shaped key.
 */

/**
 * Always private, regardless of any other rule. Deliberately broad — matching
 * something harmless here only means "not readable anonymously".
 */
const PRIVATE_KEY_PATTERNS: RegExp[] = [
  /^email_/i, // outgoing email copy/templates: internal ops content
  /smtp/i,
  /secret/i,
  /token/i,
  /password/i,
  /passwd/i,
  /private/i,
  /credential/i,
  /webhook/i,
  /_internal$/i,
  /^internal_/i,
  // Anything key-shaped, ANYWHERE in the name. These were previously anchored
  // (`^api[_-]?key`, `^smtp`), which meant a key that merely sat under one of the
  // public content prefixes slipped straight through — `contact_api_key`,
  // `footer_apikey`, `social_auth_key` and `shop_admin_key` were all publicly
  // readable. The denylist has to be substring-based to be a denylist at all.
  /api[_-]?key/i,
  /auth[_-]?key/i,
  /admin[_-]?key/i,
  /access[_-]?key/i,
  /[_-]key$/i,
  /^key[_-]/i,
  /signature/i,
  /salt/i,
];

/** Prefixes for admin-editable page content that is rendered publicly anyway. */
const PUBLIC_KEY_PREFIXES = [
  "about_",
  "home_",
  "footer_",
  "social_",
  "seo_",
  "shop_",
  "contact_", // contact details are printed in the footer and on /contact
];

/**
 * Explicit public keys that don't fall under a content prefix. These are all
 * values already rendered on public pages.
 */
const PUBLIC_KEYS = new Set([
  "farm_name",
  "tagline",
  "logo_url",
  "favicon_url",
  "business_hours",
  "delivery_fee",
  "is_free_delivery_enabled",
  "free_delivery_threshold",
  "whatsapp_order_template",
  "privacy_policy_content",
  "terms_of_service_content",
  "refund_policy_content",
  "editorial_policy_content",
]);

export function isPublicSettingKey(key: string): boolean {
  if (!key) return false;

  // Rule 1 — denylist always wins.
  if (PRIVATE_KEY_PATTERNS.some((pattern) => pattern.test(key))) return false;

  // Rule 2 — explicit allowlist, then content prefixes.
  if (PUBLIC_KEYS.has(key)) return true;
  return PUBLIC_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/** Filters a settings map down to the publicly exposable subset. */
export function filterPublicSettings(settings: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(settings)) {
    if (isPublicSettingKey(key)) out[key] = value;
  }
  return out;
}

/**
 * Settings keys whose values are admin-authored HTML rendered with
 * `dangerouslySetInnerHTML` on the policy pages. They are sanitized on write
 * and again on read.
 */
export const RICH_TEXT_SETTING_KEYS = new Set([
  "privacy_policy_content",
  "terms_of_service_content",
  "refund_policy_content",
  "editorial_policy_content",
]);

/**
 * Keys whose value is a JSON-encoded list (footer links, promo cards, gallery
 * items, …). A handful of entries each carrying an ImageKit URL adds up fast, so
 * these need far more room than a phone number — an 8 KB cap silently rejected
 * legitimate saves once a list grew past roughly ten items.
 */
const JSON_LIST_KEY_PATTERN =
  /_(cards|gallery|quicklinks|categories|badges|steps|items|chips|reels|points|links|list)$/i;

/**
 * Upper bound on a single settings value. The admin settings endpoint accepted
 * `String(val)` of any length, so one request could write an unbounded document.
 */
export function maxSettingValueLength(key: string): number {
  if (RICH_TEXT_SETTING_KEYS.has(key)) return 200_000;
  if (JSON_LIST_KEY_PATTERN.test(key)) return 64_000;
  return 8_000;
}

/**
 * Shape of a settings key. Keys are used directly in a Mongo query and as
 * object property names, so they are constrained to a safe character set —
 * which also rules out prototype-polluting names like `__proto__`.
 */
const KEY_PATTERN = /^[a-z][a-z0-9_]{1,79}$/;

export function isValidSettingKey(key: string): boolean {
  if (!KEY_PATTERN.test(key)) return false;
  return key !== "__proto__" && key !== "constructor" && key !== "prototype";
}
