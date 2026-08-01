import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lara's Pinnal",
    short_name: "Lara's Pinnal",
    description:
      "Shop handmade crochet gifts and flowers from Lara's Pinnal, Tamil Nadu. Crochet bouquets, amigurumi plushies, custom frames, keychains, and gift hampers shipped across India.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#1a1a1a",
    lang: "en-IN",
    categories: ["shopping", "lifestyle", "business"],
    // Chrome requires both a >=192px and a >=512px icon before it will offer an
    // install prompt. This previously declared a single non-square 453x358
    // logo, so the manifest could never be satisfied. These are padded squares
    // generated from public/logo.png; the maskable variant insets the artwork
    // further because Android crops maskable icons to a circular safe zone.
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
