"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PremiumCard from "@/components/home/PremiumCard";
import ImageUploadDropzone from "@/components/admin/ImageUploadDropzone";
import StickyBox from "@/components/shared/StickyBox";
import { useCart } from "@/hooks/useCart";
import { sortInStockFirst } from "@/lib/utils";
import { ShoppingCart, ShoppingBag, Plus, Minus, ArrowLeft, Heart, ShieldCheck } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { addItem } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [successMsg, setSuccessMsg] = useState("");
  const [customText, setCustomText] = useState("");
  const [customImage, setCustomImage] = useState("");

  const { data, isLoading, error } = useSWR(
    slug ? `/api/products/${slug}` : null,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !data || !data.product) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-20 text-center space-y-4">
          <h2 className="text-xl font-bold text-red-600">Product Not Found</h2>
          <p className="text-sm text-brand-gray">The product you are looking for does not exist or has been disabled.</p>
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft size={16} /> Back to Shop
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { product, relatedProducts: rawRelatedProducts = [] } = data;
  // Out-of-stock items fall to the end; they return to their normal spot once restocked.
  const relatedProducts = sortInStockFirst(rawRelatedProducts);
  const inStock = product.stock > 0;
  const currentPrice = product.discountPrice || product.price;

  const handleAddToCart = () => {
    addItem({
      productId: product._id,
      name: product.name,
      price: currentPrice,
      image: product.images[0] || "",
      customText: customText.trim() || undefined,
      customImage: customImage || undefined,
    }, quantity);

    setSuccessMsg("Added to cart successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleBuyNow = () => {
    addItem({
      productId: product._id,
      name: product.name,
      price: currentPrice,
      image: product.images[0] || "",
      customText: customText.trim() || undefined,
      customImage: customImage || undefined,
    }, quantity);
    router.push("/cart");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-9 w-full space-y-16 animate-in fade-in">
        <div className="space-y-4 md:space-y-6">
          {/* Back Link */}
          <div>
            <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-black hover:text-primary transition-colors">
              <ArrowLeft size={16} /> Back to Catalog
            </Link>
          </div>

          {/* Product Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
          {/* Gallery Column — mirrors the desktop layout from tablet width up */}
          <div className="order-1 md:order-1 md:col-span-5 md:row-span-2 relative">
          <StickyBox topOffset={112} enableFrom={768}>
            <div className="space-y-4">
            {/* Active Image Frame */}
            <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-brand-light-gray/40 border border-brand-border group">
              {product.images[activeImageIdx] && (
                <Image
                  src={product.images[activeImageIdx]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 500px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                />
              )}
              {product.discountPrice && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-md">
                  Offer
                </span>
              )}
            </div>

            {/* Thumbnails Row */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      activeImageIdx === idx ? "border-primary scale-95 shadow-sm" : "border-brand-border hover:border-brand-gray"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            </div>
          </StickyBox>
          </div>

          {/* Info: title, price, description */}
          <div className="order-2 md:order-2 md:col-span-7 space-y-4">
            <div className="space-y-2">
              <Link
                href={`/shop?category=${product.category.slug}`}
                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
              >
                {product.category.name}
              </Link>
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
                    ({Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF)
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
                    <ShieldCheck size={16} /> In Stock ({product.stock} left)
                  </span>
                ) : (
                  <span className="text-red-600 font-bold">Out of Stock</span>
                )}
              </div>
              
              {/\<[a-z][\s\S]*>/i.test(product.description) ? (
                // Rich-text description (written with the formatting editor).
                // Already sanitized server-side by /api/products/[slug] — see the
                // note there. Do NOT sanitize here: that would ship sanitize-html
                // to the browser and make the guarantee client-side.
                <div
                  className="prose text-sm leading-relaxed text-brand-gray text-justify"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                // Legacy plain-text description saved before rich formatting was added
                <div className="text-sm leading-relaxed text-brand-gray whitespace-pre-line text-justify">
                  {product.description}
                </div>
              )}
            </div>
          </div>

          {/* Purchase: quantity + Add to Cart / Buy Now */}
          {inStock && (
            <div className="order-3 md:order-3 md:col-span-7 space-y-4">
                {/* Custom design instructions */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="customText" className="text-sm font-semibold text-primary-text">
                      Customize Your Order
                    </label>
                    <span className="text-[10px] text-brand-gray">Optional</span>
                  </div>
                  <textarea
                    id="customText"
                    rows={4}
                    maxLength={300}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="e.g. Add name 'Priya', change ribbon color to pink..."
                    className="w-full p-3 bg-primary-tint/20 border border-primary/25 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                  />
                </div>

                {/* Reference image upload */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <label className="text-sm font-semibold text-primary-text">
                      Upload Reference Image
                    </label>
                    <span className="text-[10px] text-brand-gray">Optional</span>
                  </div>
                  <ImageUploadDropzone
                    value={customImage ? [customImage] : []}
                    onChange={(urls) => setCustomImage(urls[urls.length - 1] || "")}
                    maxFiles={1}
                    endpoint="/api/customer-upload"
                  />
                </div>

                {/* Quantity picker */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-primary-text">Quantity:</span>
                  <div className="flex items-center border border-primary/25 rounded-xl bg-primary-tint/20 h-10 overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 h-full hover:bg-primary-tint transition-colors text-brand-black"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-brand-black">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="px-3 h-full hover:bg-primary-tint transition-colors text-brand-black"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Checkout buttons */}
                <div className="flex flex-col lg:flex-row gap-3 pt-2">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-white hover:bg-brand-light-gray text-brand-black border border-brand-border font-bold py-3 px-6 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ShoppingCart size={18} /> Add to Cart
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 bg-brand-black hover:bg-primary text-white font-bold py-3 px-6 rounded-full transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <ShoppingBag size={18} /> Buy Now
                  </button>
                </div>

                {/* Success alert message */}
                {successMsg && (
                  <p className="text-sm text-primary font-semibold text-center mt-2 animate-pulse">
                    {successMsg}
                  </p>
                )}
              </div>
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
              {relatedProducts.map((p: any) => (
                <div key={p._id}>
                  <PremiumCard
                    name={p.name}
                    price={p.discountPrice ? `₹${p.discountPrice}` : `₹${p.price}`}
                    tag={p.discountPrice ? `SAVE ₹${p.price - p.discountPrice}` : undefined}
                    image={p.images?.[0]}
                    slug={p.slug}
                    theme="primary"
                    stock={p.stock}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
