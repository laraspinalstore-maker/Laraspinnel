"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { Tag } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CategoriesPage() {
  const { data: categories = [], isLoading, error } = useSWR("/api/categories", fetcher);

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-7 md:py-12 w-full space-y-12 animate-in fade-in">
        {/* Page Header */}
        <div className="space-y-3 pb-6 text-center mx-auto w-full">
          <span className="flex items-center justify-center gap-2 text-xs font-semibold text-primary-text uppercase tracking-wider">
            <Tag size={14} className="text-primary" /> Gift Collections
          </span>
          <h1 className="font-display text-3xl sm:text-5xl text-brand-black tracking-wide uppercase">
            Browse Categories
          </h1>
          <p className="text-sm font-medium text-brand-gray">
            Choose a category to find the perfect handcrafted crochet gift for your loved ones.
          </p>
        </div>

        {/* List Grid */}
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-6">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="space-y-3">
                <div className="w-full aspect-square rounded-2xl md:rounded-[2rem] bg-neutral-200 animate-pulse" />
                <div className="h-4 bg-neutral-200 rounded animate-pulse w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-red-600 text-sm font-semibold py-8">
            Failed to load categories list.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-6">
            {categories.map((category: any) => (
              <Link
                key={category._id}
                href={`/shop?category=${category.slug}`}
                className="group flex flex-col items-center text-center gap-3 w-full"
              >
                {/* Rounded Square Card with Off-White Background */}
                <div className="relative aspect-square w-full rounded-2xl md:rounded-[2rem] overflow-hidden bg-[#F3F4F6] border border-brand-border/40 transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 200px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    quality={75}
                  />
                </div>

                {/* Title Text Underneath */}
                <h3 className="font-semibold text-brand-black text-xs md:text-base leading-tight transition-colors group-hover:text-primary uppercase tracking-wide px-1">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
