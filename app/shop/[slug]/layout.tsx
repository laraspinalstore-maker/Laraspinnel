import type { Metadata } from "next";
import type { ReactNode } from "react";
import { connectToDatabase } from "@/lib/db";
import Product from "@/models/Product";
import { SITE_URL } from "@/lib/siteUrl";
import { serializeJsonLd } from "@/lib/security/sanitize";

// Product pages themselves are client components (SWR-driven), so the
// SEO-critical head elements — per-product title, description, canonical,
// OG tags, and Product JSON-LD — are served from this server layout instead.
// Without this, product pages inherit /shop's metadata and canonical.

export const revalidate = 300;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getProduct(slug: string) {
  try {
    await connectToDatabase();
    return await Product.findOne({ slug, isActive: true })
      .select("name slug description images price discountPrice stock")
      .lean<{
        name: string;
        slug: string;
        description: string;
        images: string[];
        price: number;
        discountPrice?: number;
        stock: number;
      }>();
  } catch (error) {
    console.error("Product metadata lookup failed:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found | Lara's Pinnal",
      robots: { index: false, follow: true },
    };
  }

  const description = stripHtml(product.description).slice(0, 158);
  const canonical = `/shop/${product.slug}`;
  const image = product.images?.[0];

  return {
    title: `${product.name} | Lara's Pinnal`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${product.name} | Lara's Pinnal`,
      description,
      type: "website",
      locale: "en_IN",
      siteName: "Lara's Pinnal",
      url: canonical,
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Lara's Pinnal`,
      description,
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": `${SITE_URL}/shop/${product.slug}#product`,
        name: product.name,
        description: stripHtml(product.description).slice(0, 500),
        image: product.images ?? [],
        url: `${SITE_URL}/shop/${product.slug}`,
        brand: {
          "@type": "Brand",
          name: "Lara's Pinnal",
        },
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}/shop/${product.slug}`,
          priceCurrency: "INR",
          price: product.discountPrice ?? product.price,
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          seller: { "@id": `${SITE_URL}/#organization` },
        },
      }
    : null;

  return (
    <>
      {children}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      )}
    </>
  );
}
