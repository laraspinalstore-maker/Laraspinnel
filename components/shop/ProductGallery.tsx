"use client";

import React, { useState } from "react";
import Image from "next/image";
import StickyBox from "@/components/shared/StickyBox";

/**
 * Product image gallery.
 *
 * A client island because it owns which thumbnail is selected. Everything else
 * on the product page — heading, price, availability, description — is rendered
 * on the server.
 *
 * IMPORTANT: this component renders its own grid-cell wrapper, including
 * `relative`. StickyBox measures `slotRef.current.parentElement` and requires it
 * to be a positioned element; if the server rendered the wrapper and this
 * component rendered only the inner box, `parentElement` would resolve to a
 * different node and the gallery would dock to the wrong element on scroll.
 */

interface ProductGalleryProps {
  name: string;
  images: string[];
  /** Drives the "Offer" badge. */
  hasDiscount: boolean;
}

export default function ProductGallery({ name, images, hasDiscount }: ProductGalleryProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const activeImage = images[activeImageIdx];

  return (
    <div className="order-1 md:order-1 md:col-span-5 md:row-span-2 relative">
      <StickyBox topOffset={112} enableFrom={768}>
        <div className="space-y-4">
          {/* Active Image Frame */}
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-brand-light-gray/40 border border-brand-border group">
            {activeImage && (
              <Image
                src={activeImage}
                alt={name}
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 500px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />
            )}
            {hasDiscount && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-md">
                Offer
              </span>
            )}
          </div>

          {/* Thumbnails Row */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  aria-label={`Show image ${idx + 1} of ${images.length}`}
                  aria-pressed={activeImageIdx === idx}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    activeImageIdx === idx
                      ? "border-primary scale-95 shadow-sm"
                      : "border-brand-border hover:border-brand-gray"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${name} thumbnail ${idx + 1}`}
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
  );
}
