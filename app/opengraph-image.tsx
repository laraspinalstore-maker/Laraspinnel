/**
 * The site-wide OpenGraph/Twitter card image.
 *
 * Generated rather than shipped as a static asset for three reasons:
 *   - there is no 1200x630 design asset to crop from. public/logo.png is
 *     453x358, and it was previously DECLARED as 1200x630 in the OG tags, which
 *     is a false claim that Facebook, WhatsApp and X act on;
 *   - Next serves this from a content-hashed URL, so editing it busts the
 *     aggressive OG caches those platforms keep;
 *   - Next derives `og:image:width`/`height`/`type` from `size` and
 *     `contentType` below, so the declared dimensions cannot drift from the file.
 *
 * IMPORTANT: this file convention is overridden by an explicit
 * `openGraph.images` in metadata. `buildMetadata` therefore omits that field
 * unless a caller passes a genuinely better image (product pages pass a real
 * product photo). Setting it globally would make this file dead code.
 */

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { BRAND } from "@/lib/seo/config";

export const alt = `${BRAND} — Handmade Crochet Gifts & Flowers, Tamil Nadu`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  // Read from disk rather than fetching over HTTP: at build time there is no
  // server to fetch from, and at request time a self-fetch is a pointless
  // round-trip.
  const logo = await readFile(join(process.cwd(), "public", "logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
          // Matches the --color-primary sage the site darkened to reach ~5.1:1
          // contrast, over the warm off-white used across the storefront.
          background: "linear-gradient(135deg, #FFFDF9 0%, #F1F4EE 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse
            renders with Satori, which has no next/image support. */}
        <img src={logoSrc} alt="" width={453} height={358} style={{ objectFit: "contain" }} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 60,
              fontWeight: 700,
              color: "#1a1a1a",
              letterSpacing: -1,
            }}
          >
            {BRAND}
          </div>
          <div style={{ fontSize: 30, color: "#5F7359", fontWeight: 600 }}>
            Handmade Crochet Gifts &amp; Flowers
          </div>
          <div style={{ fontSize: 24, color: "#6B7280" }}>
            Hand-knitted to order in Villupuram, Tamil Nadu
          </div>
        </div>
      </div>
    ),
    size
  );
}
