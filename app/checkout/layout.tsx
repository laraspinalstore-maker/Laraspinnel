import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Checkout | Lara's Pinnal",
  description: "Complete your order of handmade crochet gifts from Lara's Pinnal.",
  alternates: {
    canonical: "/checkout",
  },
};

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
