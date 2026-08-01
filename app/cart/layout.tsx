import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildMetadata } from "@/lib/seo/metadata";

// Metadata carrier for the client component at app/cart/page.tsx.
// No structured data: a cart has no indexable content to describe.
export const metadata: Metadata = buildMetadata({
  title: "Your Cart",
  description: "Review the handmade crochet gifts in your cart before checkout.",
  path: "/cart",
  // Transactional and contentless: what it renders depends entirely on the
  // visitor's own cart. `follow` keeps the outbound links carrying signal.
  // /cart is deliberately NOT disallowed in robots.txt — a crawler has to be
  // able to fetch the page to read this directive at all.
  robots: "noindex",
});

export default function CartLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
