import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Shop Handmade Crochet Gifts | Bouquets, Plushies & Hampers | Lara's Pinnal",
  description:
    "Browse handmade crochet flower bouquets, amigurumi plushies, custom frames, keychains, and gift hampers. Made to order with premium milk cotton yarn, shipped across India.",
  alternates: {
    canonical: "/shop",
  },
  openGraph: {
    title: "Shop Handmade Crochet Gifts | Lara's Pinnal",
    description:
      "Browse handmade crochet flower bouquets, amigurumi plushies, custom frames, keychains, and gift hampers. Made to order, shipped across India.",
    type: "website",
    locale: "en_IN",
    siteName: "Lara's Pinnal",
    url: "/shop",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop Handmade Crochet Gifts | Lara's Pinnal",
    description:
      "Handmade crochet bouquets, plushies, frames, keychains, and gift hampers — made to order, shipped across India.",
  },
};

export default function ShopLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
