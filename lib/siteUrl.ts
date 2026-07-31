/**
 * Single source of truth for the site's public base URL.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_APP_URL   (set this in Vercel)
 *   2. NEXT_PUBLIC_SITE_URL  (legacy / local dev)
 *   3. Production fallback    (the real domain)
 *
 * Set NEXT_PUBLIC_APP_URL in Vercel: https://laraspinal.in
 *
 * Production guard: a production build must never emit localhost canonicals,
 * sitemap entries, or schema URLs — that exact misconfiguration shipped once
 * (Vercel env var pointed at http://localhost:3000 and every <link
 * rel="canonical"> on the live site said localhost). If the env value looks
 * local while NODE_ENV is production, fall through to the real domain.
 */
const PRODUCTION_URL = "https://laraspinal.in";

const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "";

const isLocalUrl = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(envUrl);

export const SITE_URL = (
  !envUrl || (process.env.NODE_ENV === "production" && isLocalUrl) ? PRODUCTION_URL : envUrl
).replace(/\/$/, "");
