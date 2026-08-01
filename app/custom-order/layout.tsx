import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/lib/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbNode, webPageNode } from "@/lib/seo/schema";

// Metadata + structured data carrier for the client component at
// app/custom-order/page.tsx. Required — client components cannot export `metadata`.

const DESCRIPTION =
  "Design your own custom crochet creation from Lara's Pinnal — pick colors, size, and personalization for forever bouquets, amigurumi plushies, frames, and gift hampers, handmade in Tamil Nadu.";

export const metadata: Metadata = buildMetadata({
  title: "Custom Crochet Orders | Made by Hand, Made for You",
  description: DESCRIPTION,
  path: "/custom-order",
  ogDescription:
    "Tell us your idea — colors, occasion, and details — and we'll handcraft something uniquely yours. Custom bouquets, plushies, frames, and hampers.",
});

export default function CustomOrderLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        graph={[
          webPageNode({
            path: "/custom-order",
            name: "Custom Crochet Orders",
            description: DESCRIPTION,
          }),
          breadcrumbNode(
            [{ name: "Home", path: "/" }, { name: "Custom Orders" }],
            "/custom-order"
          ),
        ]}
      />
    </>
  );
}
