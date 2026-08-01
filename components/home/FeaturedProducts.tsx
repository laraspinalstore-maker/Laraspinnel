"use client";

import React from "react";
import useSWR from "swr";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PremiumCard from "./PremiumCard";
import SkeletonCard from "../shared/SkeletonCard";
import { sortInStockFirst } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Product {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  images: string[];
  slug: string;
  stock?: number;
}

export default function FeaturedProducts() {
  const { data: rawProducts = [], isLoading, error } = useSWR<Product[]>(
    "/api/products?featured=true",
    fetcher
  );
  // Out-of-stock items fall to the end; they return to their normal spot once restocked.
  const products = sortInStockFirst(rawProducts);

  return (
    <section className="relative overflow-hidden py-20 bg-brand-light-gray/40">
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 space-y-8">
        {/* Header row */}
        <div className="flex flex-row items-center justify-between pb-4 gap-3 sm:gap-0">
          <style>{`
            @keyframes arrowSlide {
              0%, 100% { transform: translateX(0); }
              50% { transform: translateX(4px); }
            }
            @media (max-width: 1023px) {
              .animate-arrow-slide {
                animation: arrowSlide 1.5s ease-in-out infinite;
              }
            }
          `}</style>
          <div className="space-y-1 min-w-0">
            <h2 className="font-display text-2xl md:text-3xl text-brand-black tracking-wide uppercase">
              Featured Products
            </h2>
          </div>
          <Link
            href="/shop"
            className="group inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover transition-colors whitespace-nowrap shrink-0"
          >
            <span>View All</span>
            <ArrowRight size={14} className="animate-arrow-slide lg:transition-transform lg:group-hover:translate-x-1" />
          </Link>
        </div>

        {/* List Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="block"><SkeletonCard /></div>
            <div className="block"><SkeletonCard /></div>
            <div className="block"><SkeletonCard /></div>
            <div className="block"><SkeletonCard /></div>
          </div>
        ) : error ? (
          <p className="text-center text-red-600 text-sm font-semibold py-8">
            Failed to load products.
          </p>
        ) : products.length === 0 ? (
          <div className="text-center text-brand-gray py-12">
            <p className="text-sm font-semibold">No featured products set up.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {products.slice(0, 8).map((product, idx) => (
              <div 
                key={product._id}
                className={idx >= 6 ? "hidden md:block" : "block"}
              >
                <PremiumCard
                  id={product._id}
                  name={product.name}
                  price={product.discountPrice ? `₹${product.discountPrice}` : `₹${product.price}`}
                  tag={product.discountPrice ? `SAVE ₹${product.price - product.discountPrice}` : undefined}
                  image={product.images?.[0]}
                  slug={product.slug}
                  stock={product.stock}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
