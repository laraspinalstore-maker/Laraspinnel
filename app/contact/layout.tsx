import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/lib/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbNode, webPageNode } from "@/lib/seo/schema";

// Metadata + structured data carrier for the client component at
// app/contact/page.tsx. Required — client components cannot export `metadata`.

const DESCRIPTION =
  "Contact Lara's Pinnal in Villupuram, Tamil Nadu. Call or WhatsApp for custom crochet orders, gift enquiries, bouquet bookings, and bulk gift hampers. We respond within hours.";

export const metadata: Metadata = buildMetadata({
  title: "Contact Lara's Pinnal | Crochet Gifts Phone Number & WhatsApp — Villupuram",
  description: DESCRIPTION,
  path: "/contact",
  ogDescription:
    "Reach Lara's Pinnal for custom crochet orders, flower bouquets, and gift hamper enquiries. Call, WhatsApp, or fill the form.",
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        graph={[
          webPageNode({
            path: "/contact",
            name: "Contact Lara's Pinnal",
            description: DESCRIPTION,
            type: "ContactPage",
          }),
          breadcrumbNode(
            [{ name: "Home", path: "/" }, { name: "Contact" }],
            "/contact"
          ),
        ]}
      />
    </>
  );
}
