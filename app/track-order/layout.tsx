import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/lib/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbNode, webPageNode } from "@/lib/seo/schema";

// Metadata + structured data carrier for the client component at
// app/track-order/page.tsx. Required — client components cannot export `metadata`.

const DESCRIPTION =
  "Track your Lara's Pinnal order. Enter your order number and mobile number to see the live status of your handmade crochet bouquet, gift hamper, or custom order.";

export const metadata: Metadata = buildMetadata({
  title: "Track Your Order",
  description: DESCRIPTION,
  path: "/track-order",
  ogDescription:
    "Check the live status of your handmade crochet order — from crafting to delivery.",
  // The lookup form has no image worth a large card.
  twitterCard: "summary",
});

export default function TrackOrderLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        graph={[
          webPageNode({
            path: "/track-order",
            name: "Track Your Order",
            description: DESCRIPTION,
          }),
          breadcrumbNode(
            [{ name: "Home", path: "/" }, { name: "Track Order" }],
            "/track-order"
          ),
        ]}
      />
    </>
  );
}
