import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/url";

/**
 * robots.txt.
 *
 * This replaces `public/robots.txt`, which is deleted. A static file and this
 * route cannot coexist — the file in `public/` wins and the route is silently
 * ignored — and the file hardcoded `https://laraspinal.in/sitemap.xml`, so a
 * preview deployment advertised the production sitemap. `absoluteUrl` routes that
 * through `lib/siteUrl.ts`, which is also where the localhost guard lives.
 *
 * ## Why every group repeats the same rules
 *
 * A crawler obeys ONLY the single most specific `User-agent` group that matches
 * it, and ignores the rest. A named group containing just `Allow: /` would
 * therefore GRANT that bot access to /admin and /api/ — the opposite of the
 * intent. So the disallow list is repeated in every group.
 *
 * ## What is deliberately crawlable
 *
 * `/cart`, `/checkout` and `/search` are NOT disallowed. They are `noindex`, and
 * a crawler has to fetch a page to see its noindex tag — blocking them in robots
 * would leave URLs Google knows about but is forbidden to evaluate, which is how
 * a blocked page still ends up listed in results without a snippet.
 *
 * `/admin` and `/api/` are discoverability hygiene, not access control; both are
 * enforced server-side (see SECURITY.md).
 */

/** Crawlers named explicitly so their access is a decision, not an accident. */
const NAMED_AGENTS = [
  // Search
  "Googlebot",
  "Googlebot-Image",
  "Bingbot",
  "Applebot",
  "DuckDuckBot",
  "YandexBot",
  // AI assistants and their training/extended-use tokens
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "Google-Extended",
  "Applebot-Extended",
  "PerplexityBot",
  "Perplexity-User",
  "Meta-ExternalAgent",
  "Amazonbot",
  "cohere-ai",
  "YouBot",
  "Bytespider",
  // Social unfurlers — these fetch OG tags for link previews
  "facebookexternalhit",
  "Twitterbot",
  "WhatsApp",
  "LinkedInBot",
  "Pinterestbot",
  "TelegramBot",
];

const DISALLOW = ["/admin", "/admin/", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: NAMED_AGENTS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
