import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy.
 *
 * `'unsafe-eval'` is only emitted outside production — the dev server's HMR
 * client needs it, a deployed build does not, and leaving it on gives any
 * injection a far easier path to execution.
 *
 * `'unsafe-inline'` in script-src is still required: app/layout.tsx renders the
 * Facebook Pixel bootstrap and the JSON-LD blocks inline. Those values are now
 * escaped (serializeJsonLd) rather than trusted, but dropping 'unsafe-inline'
 * entirely needs a per-request nonce — tracked in SECURITY.md as the remaining
 * CSP hardening step.
 *
 * Directives added by this audit: object-src, base-uri, form-action,
 * frame-ancestors, upgrade-insecure-requests.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"} https://www.googletagmanager.com https://connect.facebook.net`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://ik.imagekit.io https://www.googletagmanager.com https://www.google-analytics.com https://www.facebook.com",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://connect.facebook.net https://www.facebook.com",
  "font-src 'self' data:",
  "media-src 'self' blob: https://ik.imagekit.io",
  "frame-src 'self' https://www.google.com https://maps.google.com",
  // No plugins, ever — blocks <object>/<embed> as script vectors.
  "object-src 'none'",
  // Stops injected markup from rewriting the base URL to hijack relative paths.
  "base-uri 'self'",
  // Forms may only submit back to this origin.
  "form-action 'self'",
  // Modern equivalent of X-Frame-Options: DENY (kept below for older browsers).
  "frame-ancestors 'none'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      }
    ],
    formats: ['image/avif', 'image/webp'],
    // Explicit: SVGs never pass through the optimizer. An SVG is an XML
    // document that can carry script, and it would be served from this origin.
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
  },
  compress: true, // Explicitly enable compression (Gzip/Brotli)
  // Don't advertise the framework/version to scanners.
  poweredByHeader: false,
  // Source maps would publish readable source (and its comments) to anyone.
  productionBrowserSourceMaps: false,
  experimental: {
    // optimizeCss is disabled to prevent Turbopack compilation loop
    // Cap page-data collection workers: the default (logical cores - 1 = 15
    // here) spawns one Node process per worker, each loading mongoose and the
    // full server bundle — on a 16GB machine that exhausts memory and build
    // dies with "Array buffer allocation failed".
    cpus: 4,
  },

  async redirects() {
    return [
      // The old .vercel.app host must not serve a duplicate of the site now
      // that laraspinal.in is the primary domain — 308 everything across.
      {
        source: "/:path*",
        has: [{ type: "host", value: "laraspinnel.vercel.app" }],
        destination: "https://laraspinal.in/:path*",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "alt-svc",
            value: 'h3=":443"; ma=86400, h3-29=":443"; ma=86400',
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(), usb=(), serial=(), bluetooth=(), midi=(), display-capture=(), idle-detection=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
          // Cross-Origin-Embedder-Policy is deliberately NOT set. It would only
          // matter for cross-origin isolation (SharedArrayBuffer etc.), which
          // this app doesn't use, and it blocks cross-origin embeds that don't
          // send COEP themselves — including the Google Maps iframe that
          // `contact_map_url` exists for and that CSP frame-src already allows.
          // Cost without benefit; COOP + CORP above carry the real weight.
        ],
      },
      {
        // Never indexed, but still cacheable where a route opts in via
        // `revalidate` — see the /api/admin rule below for the sensitive ones.
        source: "/api/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
      {
        // Admin API responses carry order/customer data and reflect a session.
        // No shared cache or browser history entry may retain them — otherwise a
        // back-button press after logout, or a CDN, can resurface them.
        source: "/api/admin/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, private",
          },
        ],
      },
      {
        // Belt-and-braces alongside the noindex metadata on the admin layout.
        source: "/admin/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, private",
          },
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
