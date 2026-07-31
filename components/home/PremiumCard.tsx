"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Sparkles, Plus, Minus } from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface PremiumCardProps {
  id?: string;
  name: string;
  price: string;
  tag?: string;
  image?: string;
  slug: string;
  theme?: "primary" | "secondary";
  stock?: number;
}

export default function PremiumCard({
  id,
  name,
  price,
  tag,
  image,
  slug,
  theme = "primary",
  stock,
}: PremiumCardProps) {
  const url = `/shop/${slug}`;
  const { cart, addItem, updateQuantity } = useCart();
  const outOfStock = typeof stock === "number" && stock <= 0;
  const productId = id || slug; // Fallback to slug if id not provided

  // Only tracks the plain (no customization note/image) cart line — a
  // customized order placed from the product detail page is a distinct line
  // and shouldn't be affected by the quick +/- stepper on this card.
  const cartLine = cart.find((i) => i.productId === productId && !i.customText && !i.customImage);
  const quantityInCart = cartLine?.quantity ?? 0;

  // Extract numeric price from format (e.g. "₹249" -> 249)
  const numericPrice = parseFloat(price.replace(/[^\d.]/g, "")) || 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (outOfStock) return;

    addItem({
      productId,
      name,
      price: numericPrice,
      image: image || "",
    });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ productId, name, price: numericPrice, image: image || "" });
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(productId, quantityInCart - 1);
  };

  return (
    <Link
      href={url}
      prefetch={true}
      className={`group relative flex flex-col w-full overflow-hidden rounded-[1.25rem] sm:rounded-3xl bg-white border border-brand-border/60 shadow-xs transition-all duration-300 h-full ${
        outOfStock ? "opacity-60 hover:shadow-xs" : "hover:shadow-md"
      }`}
    >
      {/* Top Image Section */}
      <div className="relative aspect-square w-full bg-brand-light-gray overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            quality={75}
            className={`object-cover transition-transform duration-500 ${
              outOfStock ? "grayscale" : "group-hover:scale-105"
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-10">
            <Sparkles size={48} className="text-brand-black" />
          </div>
        )}

        {/* Top Sale/Save Tag */}
        {tag && !outOfStock && (
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10">
            <div className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-rose-primary text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wider shadow-sm">
              <span>{tag}</span>
            </div>
          </div>
        )}

        {/* Out of Stock overlay badge */}
        {outOfStock && (
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10">
            <div className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-brand-black/80 text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wider shadow-sm">
              <span>Out of Stock</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Section at Bottom */}
      <div className="p-3 sm:p-4 flex flex-col justify-between flex-1 gap-2 sm:gap-3 bg-white">
        <div className="space-y-0.5 sm:space-y-1">
          {/* Subtle Category/Tag indicator */}
          <span className="block truncate text-[8px] sm:text-[9px] font-bold tracking-widest text-brand-gray uppercase">
            {tag ? "Special Offer" : "Handcrafted"}
          </span>
          <h3 className="truncate text-xs sm:text-sm font-display font-extrabold text-brand-black tracking-wide leading-snug group-hover:text-primary transition-colors">
            {name}
          </h3>
        </div>

        {/* Price and Add to Cart Row */}
        <div className="flex items-center justify-between gap-1.5 mt-auto pt-2 border-t border-brand-border/40">
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold text-primary">
              {price}
            </span>
          </div>

          {outOfStock ? (
            <button
              disabled
              className="w-16 sm:w-20 h-9 sm:h-10 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-1 shadow-xs border bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
            >
              <span>Sold Out</span>
            </button>
          ) : quantityInCart > 0 ? (
            <div className="w-16 sm:w-20 h-9 sm:h-10 flex items-center justify-between rounded-full border border-primary/30 bg-primary-tint overflow-hidden shrink-0">
              <button
                onClick={handleDecrement}
                aria-label="Decrease quantity"
                className="h-full px-1 sm:px-1.5 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <Minus size={10} className="sm:w-3 sm:h-3" />
              </button>
              <span className="h-full w-4 sm:w-5 flex items-center justify-center text-xs sm:text-sm font-bold text-primary">
                {quantityInCart}
              </span>
              <button
                onClick={handleIncrement}
                aria-label="Increase quantity"
                className="h-full px-1 sm:px-1.5 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <Plus size={10} className="sm:w-3 sm:h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-16 sm:w-20 h-9 sm:h-10 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1 shadow-xs border bg-primary text-white border-transparent hover:bg-primary-hover cursor-pointer"
            >
              <ShoppingCart size={10} className="sm:w-3 sm:h-3" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
