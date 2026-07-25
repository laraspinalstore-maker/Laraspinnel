"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { parseList, DEFAULT_CUSTOM_GALLERY, CustomGalleryItem } from "@/lib/siteContent";
import Reveal from "./Reveal";
import { FloralDoodle } from "./AboutHero";

function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: CustomGalleryItem[];
  index: number;
  onClose: () => void;
  onNavigate: (next: number) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);

  const prev = useCallback(
    () => onNavigate((index - 1 + items.length) % items.length),
    [index, items.length, onNavigate]
  );
  const next = useCallback(
    () => onNavigate((index + 1) % items.length),
    [index, items.length, onNavigate]
  );

  useEffect(() => {
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  const item = items[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Image ${index + 1} of ${items.length}: ${item.alt}`}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (dx > 48) prev();
        else if (dx < -48) next();
        touchStartX.current = null;
      }}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close gallery"
        className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white z-10"
      >
        <X size={20} />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          prev();
        }}
        aria-label="Previous image"
        className="absolute left-2 md:left-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white z-10"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="relative w-full max-w-2xl aspect-square flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full h-4/5">
          <Image src={item.src} alt={item.alt} fill sizes="(max-width: 768px) 100vw, 672px" className="object-contain" />
        </div>
        <div className="pt-4 text-center space-y-2">
          <p className="text-white/90 text-sm md:text-base font-medium">{item.alt}</p>
          <p className="text-white/50 text-xs font-semibold">
            {index + 1} / {items.length}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
        aria-label="Next image"
        className="absolute right-2 md:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white z-10"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

export default function HandsGallery({ settings }: { settings: Record<string, string> }) {
  const items = parseList<CustomGalleryItem>(settings.home_custom_gallery, DEFAULT_CUSTOM_GALLERY)
    .filter((g) => g?.src)
    .slice(0, 6);

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <section className="bg-white py-16 md:py-24 border-b border-brand-border/40">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-12">
        <Reveal className="max-w-2xl mx-auto text-center space-y-2">
          <div className="flex items-center justify-center">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-goat-primary">
              FROM OUR HANDS
            </span>
            <FloralDoodle />
          </div>
          <h2 className="font-display text-3xl md:text-4xl text-brand-black tracking-wide text-balance">
            Creations Made With Love
          </h2>
        </Reveal>

        {/* Desktop Larger Photo Cards Grid (3 columns on desktop, 2 on mobile) */}
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
            {items.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setOpenIndex(idx)}
                aria-label={`View larger: ${item.alt}`}
                className="group relative w-full aspect-square rounded-[2rem] lg:rounded-[2.6rem] bg-[#FAF2EE] border border-brand-border/30 p-2.5 lg:p-3.5 shadow-3xs hover:shadow-card hover:-translate-y-1.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-black"
              >
                <div className="relative w-full h-full rounded-[1.5rem] lg:rounded-[1.9rem] overflow-hidden border-[4px] lg:border-[6px] border-white shadow-3xs">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 400px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </button>
            ))}
          </div>
        </Reveal>

        {/* View Full Gallery Pill Button */}
        <Reveal className="text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 border border-brand-black/30 bg-white hover:bg-brand-black hover:text-white text-brand-black font-semibold text-xs uppercase tracking-wider h-12 px-8 rounded-full transition-all shadow-3xs"
          >
            View Full Gallery <ArrowRight size={14} />
          </Link>
        </Reveal>
      </div>

      {openIndex !== null && (
        <Lightbox
          items={items}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </section>
  );
}
