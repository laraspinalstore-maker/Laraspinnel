import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Track Your Order | Lara's Pinnal — Handmade Crochet Gifts, Villupuram",
  description:
    "Track your Lara's Pinnal order. Enter your order number and mobile number to see the live status of your handmade crochet bouquet, gift hamper, or custom order.",
  alternates: {
    canonical: "/track-order",
  },
  openGraph: {
    title: "Track Your Order | Lara's Pinnal",
    description:
      "Check the live status of your handmade crochet order — from crafting to delivery.",
    type: "website",
    locale: "en_IN",
    siteName: "Lara's Pinnal",
  },
  twitter: {
    card: "summary",
    title: "Track Your Order | Lara's Pinnal",
    description:
      "Check the live status of your handmade crochet order — from crafting to delivery.",
  },
};

export default function TrackOrderLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
