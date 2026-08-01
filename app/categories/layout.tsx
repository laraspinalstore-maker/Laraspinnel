import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/lib/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbNode, itemListNode, webPageNode } from "@/lib/seo/schema";
import { listActiveCategories } from "@/lib/data/categories";

// This layout exists solely to carry metadata and structured data: app/categories/page.tsx
// is a client component, and a client component cannot export `metadata`.
// Do not "simplify" it away.

const DESCRIPTION =
  "Explore all gift categories at Lara's Pinnal — crochet flower bouquets, amigurumi plushies, custom photo frames, keychains, and curated gift hampers.";

export const metadata: Metadata = buildMetadata({
  title: "Gift Categories | Crochet Bouquets, Plushies, Frames & Hampers",
  description: DESCRIPTION,
  path: "/categories",
});

export default async function CategoriesLayout({ children }: { children: ReactNode }) {
  // The page renders every active category unfiltered, so an ItemList here
  // matches what a visitor actually sees. (/shop deliberately gets its ItemList
  // from the page instead, because that view is parameterised by ?category=.)
  let categories: { name: string; slug: string }[] = [];
  try {
    categories = await listActiveCategories();
  } catch (error) {
    console.error("[categories] schema category load failed:", error);
  }

  return (
    <>
      {children}
      <JsonLd
        graph={[
          webPageNode({
            path: "/categories",
            name: "Gift Categories",
            description: DESCRIPTION,
            type: "CollectionPage",
          }),
          categories.length
            ? itemListNode({
                path: "/categories",
                items: categories.map((c) => ({
                  name: c.name,
                  url: `/shop?category=${encodeURIComponent(c.slug)}`,
                })),
              })
            : null,
          breadcrumbNode(
            [
              { name: "Home", path: "/" },
              { name: "Gift Categories" },
            ],
            "/categories"
          ),
        ]}
      />
    </>
  );
}
