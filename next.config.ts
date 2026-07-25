import type { NextConfig } from "next";

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
  },
  compress: true, // Explicitly enable compression (Gzip/Brotli)
  experimental: {
    // optimizeCss is disabled to prevent Turbopack compilation loop
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
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://images.unsplash.com https://ik.imagekit.io https://www.googletagmanager.com https://www.google-analytics.com https://www.facebook.com; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://connect.facebook.net https://www.facebook.com; font-src 'self' data:; media-src 'self' blob: https://ik.imagekit.io; frame-src 'self' https://www.google.com https://maps.google.com;",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
