import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildMetadata } from "@/lib/seo/metadata";

// Metadata carrier for the client component at app/checkout/page.tsx.
export const metadata: Metadata = buildMetadata({
  title: "Checkout",
  description: "Complete your order of handmade crochet gifts from Lara's Pinnal.",
  path: "/checkout",
  // See the note in app/cart/layout.tsx. /checkout additionally has three
  // mutually exclusive UIs (empty, form, order-placed), none of them indexable.
  robots: "noindex",
});

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
