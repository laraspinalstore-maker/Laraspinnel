import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Gift Categories | Crochet Bouquets, Plushies, Frames & Hampers | Lara's Pinnal",
  description:
    "Explore all gift categories at Lara's Pinnal — crochet flower bouquets, amigurumi plushies, custom photo frames, keychains, and curated gift hampers.",
  alternates: {
    canonical: "/categories",
  },
  openGraph: {
    title: "Gift Categories | Lara's Pinnal",
    description:
      "Explore all gift categories — crochet flower bouquets, amigurumi plushies, custom photo frames, keychains, and curated gift hampers.",
    type: "website",
    locale: "en_IN",
    siteName: "Lara's Pinnal",
    url: "/categories",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gift Categories | Lara's Pinnal",
    description:
      "Crochet flower bouquets, amigurumi plushies, custom photo frames, keychains, and curated gift hampers.",
  },
};

export default function CategoriesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
