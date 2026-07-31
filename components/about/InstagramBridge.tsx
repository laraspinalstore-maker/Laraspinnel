"use client";

import React from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { FaInstagram } from "react-icons/fa6";
import { parseList, DEFAULT_CUSTOM_GALLERY, CustomGalleryItem } from "@/lib/siteContent";
import Reveal from "./Reveal";

/* Extracts "@handle" from a configured instagram.com URL; falls back to
   nothing rather than inventing a username. */
function handleFromUrl(url: string): string | null {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, "");
    const segment = path.split("/").filter(Boolean)[0];
    return segment ? `@${segment}` : null;
  } catch {
    return null;
  }
}

/* Small social bridge after reviews. Renders only when the admin has
   configured social_instagram — no invented links or handles. */
export default function InstagramBridge({ settings }: { settings: Record<string, string> }) {
  const instagram = settings.social_instagram;
  if (!instagram) return null;

  const handle = handleFromUrl(instagram);
  // Different slice than the main gallery to avoid repeating the same images.
  const thumbs = parseList<CustomGalleryItem>(settings.home_custom_gallery, DEFAULT_CUSTOM_GALLERY)
    .filter((g) => g?.src)
    .slice(6, 11);

  return (
    <section className="bg-white border-t border-brand-border/60">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-14 md:py-16 space-y-8">
        <Reveal className="text-center space-y-2">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Follow the Making
          </p>
          {handle && (
            <p className="font-display text-2xl md:text-3xl text-brand-black tracking-wide uppercase">
              {handle}
            </p>
          )}
        </Reveal>

        {thumbs.length > 0 && (
          <Reveal>
            <div className="flex justify-center gap-3 md:gap-4 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
              {thumbs.map((t, i) => (
                <a
                  key={t.src}
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${t.alt} — open Instagram`}
                  className={`relative w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-2xl overflow-hidden border border-brand-border bg-primary-tint/60 hover:-translate-y-0.5 transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-black ${
                    i % 2 === 1 ? "md:translate-y-2" : ""
                  }`}
                >
                  <Image src={t.src} alt="" fill sizes="96px" className="object-contain p-1.5" />
                </a>
              ))}
            </div>
          </Reveal>
        )}

        <div className="text-center">
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-text hover:text-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-black rounded-md px-2 py-1"
          >
            <FaInstagram size={15} /> Follow on Instagram <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </section>
  );
}
