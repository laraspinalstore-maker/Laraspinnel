"use client";

import React from "react";
import Image from "next/image";
import { CustomGalleryItem, DEFAULT_CUSTOM_GALLERY } from "@/lib/siteContent";

/**
 * CustomOrderGallery — animated custom-product showcase for the Custom Order banner.
 *
 * Desktop (`orientation="vertical"`): three staggered compact columns scrolling in
 * alternating directions (up ↑ / down ↓ / up ↑) — a living moodboard of custom
 * creations. The third column folds away below the xl breakpoint so tablet widths
 * keep two comfortable columns.
 * Mobile (`orientation="horizontal"`): a single slow infinite carousel row.
 *
 * Seamless loop technique: each track renders TWO identical halves and each half
 * carries its own trailing gap (pb/pr = gap), so the -50% keyframe translation
 * lands exactly on the seam. Keyframes + reduced-motion live in globals.css.
 *
 * The showcase is a fixed curated set (white-background studio shots from the
 * catalog's ImageKit CDN) so the banner composition stays art-directed: order is
 * round-robin across the three columns — items 0/3/6/9 → col A, 1/4/7/10 → col B,
 * 2/5/8/11 → col C.
 */

type GalleryItem = CustomGalleryItem;

// Uniform 1:1 cards.
const CARD_ASPECTS = ["aspect-square"];

function GalleryCard({ item, index }: { item: GalleryItem; index: number }) {
  return (
    <div
      className={`relative w-full ${CARD_ASPECTS[index % CARD_ASPECTS.length]} rounded-[26px] overflow-hidden bg-linear-to-b from-[#FFF7EF] via-[#FDEFE8] to-[#FBE7E3] border-[5px] border-white shadow-[0_10px_28px_rgba(43,36,32,0.10)] group`}
    >
      <Image
        src={item.src}
        alt={item.alt}
        fill
        sizes="(max-width: 1023px) 35vw, 200px"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />
    </div>
  );
}


/** One infinitely scrolling column (two identical halves = seamless -50% loop). */
function GalleryColumn({
  items,
  direction,
  aspectShift,
  className = "",
  duration,
}: {
  items: GalleryItem[];
  direction: "up" | "down";
  aspectShift: number;
  className?: string;
  duration?: string;
}) {
  return (
    <div className={className}>
      <div
        className={`flex flex-col ${direction === "up" ? "animate-gallery-up" : "animate-gallery-down"}`}
        style={duration ? { animationDuration: duration } : undefined}
      >
        {[0, 1].map((half) => (
          <div key={half} aria-hidden={half === 1} className="flex flex-col gap-3.5 pb-3.5">
            {items.map((item, i) => (
              <GalleryCard key={`${half}-${i}`} item={item} index={i + aspectShift} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CustomOrderGallery({
  orientation,
  items: itemsProp,
}: {
  orientation: "vertical" | "horizontal";
  /** Admin-managed showcase items; falls back to the curated defaults. */
  items?: GalleryItem[];
}) {
  const items = itemsProp && itemsProp.length > 0 ? itemsProp : DEFAULT_CUSTOM_GALLERY;
  // Distribute round-robin so product variety spreads across all columns.
  const colA = items.filter((_, i) => i % 3 === 0);
  const colB = items.filter((_, i) => i % 3 === 1);
  const colC = items.filter((_, i) => i % 3 === 2);

  if (orientation === "horizontal") {
    return (
      <div
        role="group"
        aria-label="Showcase of custom handmade creations"
        className="relative overflow-hidden"
      >
        {/* Edge fades blend into the cream banner background */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-linear-to-r from-cream-bg to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-linear-to-l from-cream-bg to-transparent" />

        <div className="flex w-max animate-gallery-x">
          {[0, 1].map((half) => (
            <div key={half} aria-hidden={half === 1} className="flex gap-3.5 pr-3.5">
              {items.map((item, i) => (
                <div key={`${half}-${i}`} className="w-32 sm:w-36 shrink-0">
                  <GalleryCard item={item} index={i} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Showcase of custom handmade creations"
      className="relative h-full overflow-hidden"
    >
      {/* Top/bottom fades — cards drift in and out of the visible area.
          Colors match the banner's right-side blush background. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-linear-to-b from-cream-bg/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-linear-to-t from-cream-bg/80 to-transparent" />

      {/* 3 compact columns (2 on tablet widths), alternating directions, staggered starts */}
      <div className="relative grid grid-cols-2 xl:grid-cols-3 gap-3.5 h-full px-4">
        <GalleryColumn items={colA} direction="up" aspectShift={0} className="-mt-8" />
        <GalleryColumn items={colB} direction="down" aspectShift={1} className="mt-12" />
        <GalleryColumn
          items={colC}
          direction="up"
          aspectShift={2}
          className="hidden xl:block -mt-16"
          duration="27s"
        />
      </div>
    </div>
  );
}
