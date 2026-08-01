import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/lib/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbNode, webPageNode } from "@/lib/seo/schema";
import { getNewestSettingUpdatedAt } from "@/lib/seo/settings";

// Metadata + structured data carrier for the client component at
// app/about/page.tsx. Required — client components cannot export `metadata`.

const DESCRIPTION =
  "Lara's Pinnal is a family-run handmade crochet gifts studio in Villupuram, Tamil Nadu. Crochet flower bouquets, amigurumi plush, photo frames, and gift hampers made with premium milk cotton yarn. Shipping across India.";

export const metadata: Metadata = buildMetadata({
  title: "About Lara's Pinnal | Handmade Crochet Gifts, Villupuram, Tamil Nadu",
  description: DESCRIPTION,
  path: "/about",
  ogDescription:
    "Learn about Lara's Pinnal — handcrafted crochet flowers, amigurumi, and gift hampers made with love in Villupuram, Tamil Nadu. Every piece hand-knitted to order and shipped across India.",
  twitterDescription:
    "Handcrafted crochet flowers, amigurumi, and gift hampers made with premium milk cotton yarn — Lara's Pinnal, Villupuram, Tamil Nadu.",
});

export default async function AboutLayout({ children }: { children: ReactNode }) {
  // All of /about's copy is admin-editable under the about_ prefix, so the
  // newest of those timestamps is a real dateModified rather than "now".
  const dateModified = await getNewestSettingUpdatedAt("about_");

  return (
    <>
      {children}
      <JsonLd
        graph={[
          webPageNode({
            path: "/about",
            name: "About Lara's Pinnal",
            description: DESCRIPTION,
            type: "AboutPage",
            dateModified,
          }),
          breadcrumbNode([{ name: "Home", path: "/" }, { name: "About" }], "/about"),
        ]}
      />
    </>
  );
}
