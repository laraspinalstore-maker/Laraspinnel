import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Your Cart | Lara's Pinnal",
  description: "Review the handmade crochet gifts in your cart before checkout.",
  alternates: {
    canonical: "/cart",
  },
};

export default function CartLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
