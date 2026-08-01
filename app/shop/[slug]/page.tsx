import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PremiumCard from "@/components/home/PremiumCard";
import ProductGallery from "@/components/shop/ProductGallery";
import ProductPurchasePanel from "@/components/shop/ProductPurchasePanel";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { sortInStockFirst } from "@/lib/utils";
import JsonLd from "@/lib/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { productOgImage } from "@/lib/seo/url";
import {
  breadcrumbNode,
  productNode,
  returnPolicyNode,
  shippingDetailsNode,
  toPlainText,
} from "@/lib/seo/schema";
import { getDeliverySettings } from "@/lib/seo/settings";

/**
 * Product detail.
 *
 * Was a client component that fetched through SWR with no seed data, so the
 * server-rendered HTML for every product was a spinner: no H1, no price, no
 * description, no availability, no images. The metadata and Product JSON-LD were
 * served from a sibling layout as a workaround, which also meant the same product
 * was queried twice per request.
 *
 * Now the page itself is a server component. It owns `generateMetadata`, the
 * JSON-LD, and all the SEO-critical body copy; two small client islands keep the
 * gallery and the purchase controls interactive. `app/shop/[slug]/layout.tsx` has
 * been deleted — with the page able to export metadata there was nothing left for
 * it to do, and a second segment declaring `revalidate` is a trap, since the
 * lowest value across layout and page governs the whole route.
 *
 * ## Returning a real 404
 *
 * `generateStaticParams` returning an empty array is load-bearing, not
 * decoration. `app/loading.tsx` is a ROOT loading boundary, so it wraps this
 * segment too; a fully dynamic render therefore starts streaming as soon as that
 * fallback renders, and once the response body has begun streaming the status is
 * already sent — `notFound()` can then only inject a noindex meta tag, leaving
 * the response a 200. Declaring `generateStaticParams` makes the route
 * statically generated with ISR, so the render is buffered into a cache entry and
 * the 404 status can still be set.
 *
 * Returning `[]` rather than every slug is also deliberate: next.config.ts
 * documents a build out-of-memory caused by mongoose loading in each page-data
 * worker, and per-slug prerendering would reintroduce that pressure for no gain
 * beyond a faster first hit.
 *
 * `dynamicParams` must stay true, or an empty param list would 404 every product.
 */

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Request-cached, so this is the same query the page body and the JSON-LD use.
  const product = await getProductBySlug(slug);

  if (!product) {
    return buildMetadata({
      title: "Product Not Found",
      description: "This product does not exist or is no longer available.",
      // Explicit rather than omitted: metadata is shallow-merged root to leaf and
      // an absent field is INHERITED, so leaving this out previously meant the
      // not-found branch silently adopted the shop layout's canonical.
      path: `/shop/${slug}`,
      robots: "noindex",
    });
  }

  const description = toPlainText(product.description).slice(0, 158);
  const ogImage = productOgImage(product.images?.[0], product.name);

  return buildMetadata({
    title: product.name,
    description,
    path: `/shop/${product.slug}`,
    // A real product photo beats the generated site card, so this is one of the
    // few places that overrides app/opengraph-image.tsx.
    ...(ogImage ? { images: [ogImage] } : {}),
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [relatedRaw, delivery] = await Promise.all([
    // A product whose category document was deleted has no category to relate
    // against, and querying with a null id would match nothing anyway.
    product.category
      ? getRelatedProducts(product.category._id, slug)
      : Promise.resolve([]),
    getDeliverySettings(),
  ]);

  // Out-of-stock items fall to the end; they return to their normal spot once restocked.
  const relatedProducts = sortInStockFirst(relatedRaw);
  const inStock = product.stock > 0;
  const currentPrice = product.discountPrice || product.price;
  const isRichText = /<[a-z][\s\S]*>/i.test(product.description);

  const crumbs = product.category
    ? [
        { name: "Home", path: "/" },
        { name: "Shop", path: "/shop" },
        { name: product.category.name, path: `/shop?category=${product.category.slug}` },
        { name: product.name },
      ]
    : [{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }, { name: product.name }];

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-9 w-full space-y-16 animate-in fade-in">
        <div className="space-y-4 md:space-y-6">
          {/* Breadcrumb trail. sr-only so the visual design is unchanged while the
              full Home > Shop > Category > Product path is present in the HTML —
              the same approach app/page.tsx already uses for its AI-citability
              table. The matching BreadcrumbList node is emitted below. */}
          <nav aria-label="Breadcrumb" className="sr-only">
            <ol>
              {crumbs.map((crumb) => (
                <li key={crumb.name}>
                  {crumb.path ? (
                    <Link href={crumb.path}>{crumb.name}</Link>
                  ) : (
                    <span aria-current="page">{crumb.name}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          {/* Back Link */}
          <div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-black hover:text-primary transition-colors"
            >
              <ArrowLeft size={16} aria-hidden="true" /> Back to Catalog
            </Link>
          </div>

          {/* Product Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
            <ProductGallery
              name={product.name}
              images={product.images}
              hasDiscount={Boolean(product.discountPrice)}
            />

            {/* Info: title, price, description — all server-rendered */}
            <div className="order-2 md:order-2 md:col-span-7 space-y-4">
              <div className="space-y-2">
                {product.category && (
                  <Link
                    href={`/shop?category=${product.category.slug}`}
                    className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
                  >
                    {product.category.name}
                  </Link>
                )}
                <h1 className="font-display text-2xl md:text-4xl text-brand-black uppercase leading-tight">
                  {product.name}
                </h1>
              </div>

              {/* Price section */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-brand-black">
                  ₹{currentPrice}
                </span>
                {product.discountPrice && (
                  <>
                    <span className="text-lg text-brand-gray line-through">
                      ₹{product.price}
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      (
                      {Math.round(
                        ((product.price - product.discountPrice) / product.price) * 100
                      )}
                      % OFF)
                    </span>
                  </>
                )}
              </div>

              {/* Stock status & Description */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-brand-gray">Availability:</span>
                  {inStock ? (
                    <span className="text-primary flex items-center gap-1">
                      <ShieldCheck size={16} aria-hidden="true" /> In Stock ({product.stock}{" "}
                      left)
                    </span>
                  ) : (
                    <span className="text-red-600 font-bold">Out of Stock</span>
                  )}
                </div>

                {isRichText ? (
                  // Rich-text description written with the formatting editor.
                  // Already sanitized in lib/data/products.ts, on the server — the
                  // sanitizer must never move into a client component, both
                  // because the guarantee would then be client-side and because
                  // sanitize-html is ~200KB of browser bundle.
                  <div
                    className="prose text-sm leading-relaxed text-brand-gray text-justify"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  // Legacy plain-text description saved before rich formatting existed.
                  <div className="text-sm leading-relaxed text-brand-gray whitespace-pre-line text-justify">
                    {product.description}
                  </div>
                )}
              </div>
            </div>

            {inStock && (
              <ProductPurchasePanel
                productId={product._id}
                name={product.name}
                price={currentPrice}
                image={product.images[0] || ""}
                stock={product.stock}
              />
            )}
          </div>
        </div>

        {/* Related Products Grid */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6 pt-10">
            <h2 className="font-display text-2xl md:text-3xl text-brand-black uppercase tracking-wide">
              Explore Products
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {relatedProducts.map((p) => (
                <div key={p._id}>
                  {/* Deliberately no `id` prop, matching the previous call site.
                      PremiumCard falls back to the slug as the cart key, and
                      visitors' saved carts already contain lines keyed that way. */}
                  <PremiumCard
                    name={p.name}
                    price={p.discountPrice ? `₹${p.discountPrice}` : `₹${p.price}`}
                    tag={p.discountPrice ? `SAVE ₹${p.price - p.discountPrice}` : undefined}
                    image={p.images?.[0]}
                    slug={p.slug}
                    stock={p.stock}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />

      <JsonLd
        graph={[
          productNode({
            name: product.name,
            slug: product.slug,
            description: toPlainText(product.description),
            images: product.images,
            price: product.price,
            discountPrice: product.discountPrice,
            stock: product.stock,
            categoryName: product.category?.name,
            updatedAt: product.updatedAt,
          }),
          // Referenced by the Offer above via @id, so both must be in this graph.
          returnPolicyNode(),
          shippingDetailsNode(delivery.fee),
          breadcrumbNode(crumbs, `/shop/${product.slug}`),
        ]}
      />
    </div>
  );
}
