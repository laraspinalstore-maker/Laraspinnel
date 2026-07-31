"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, Heart, Sparkles } from "lucide-react";
import { DEFAULT_CUSTOM_GALLERY } from "@/lib/siteContent";
import Reveal from "./Reveal";

const ROTATE_INTERVAL_MS = 3500;

const TRUST_POINTS = ["100% Handmade", "Made with Love", "Unique & Personal"];

export default function FinalCTA() {
  const photos = DEFAULT_CUSTOM_GALLERY;
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  // Auto-advance the showcase card; skipped entirely for reduced-motion users.
  useEffect(() => {
    if (prefersReducedMotion || photos.length < 2) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % photos.length),
      ROTATE_INTERVAL_MS
    );
    return () => clearInterval(id);
  }, [photos.length, prefersReducedMotion]);

  const photo = photos[index];

  return (
    <section className="bg-white py-16 md:py-24 border-t border-brand-border/40">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl md:rounded-4xl bg-linear-to-br from-[#FFFDF9] via-cream-bg to-gold-tint border border-brand-border p-6 sm:p-10 lg:p-14 shadow-card">
            {/* Soft decorative blobs */}
            <div
              aria-hidden="true"
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gold-primary/10 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-gold-primary/10 blur-3xl"
            />
            {/* Stitched inner border — gold thread, a nod to handmade craft */}
            <div
              aria-hidden="true"
              className="absolute inset-3 sm:inset-4 rounded-2xl md:rounded-3xl border-2 border-dashed border-gold-primary/30 pointer-events-none"
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
              {/* Left Side: rotating showcase card — slides up and out, next rises in from below */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-sm">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={index}
                      initial={{ y: 90, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -90, opacity: 0 }}
                      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                      className="relative w-full rounded-3xl bg-white border border-brand-border shadow-hover p-3 pb-6"
                    >
                      <div className="relative aspect-4/3 sm:aspect-16/11 rounded-2xl overflow-hidden bg-gold-tint/50">
                        <Image
                          src={photo.src}
                          alt={photo.alt}
                          fill
                          sizes="400px"
                          className="object-contain p-3"
                        />
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Heart badge stays pinned while cards cycle */}
                  <span
                    aria-hidden="true"
                    className="absolute -top-3 -right-3 z-10 w-10 h-10 rounded-full bg-gold-primary text-white flex items-center justify-center shadow-md"
                  >
                    <Heart size={17} fill="currentColor" strokeWidth={0} />
                  </span>
                </div>
              </div>

              {/* Right Side: Copy & Buttons */}
              <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
                <p className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  <Sparkles size={13} aria-hidden="true" />
                  Made Just for You
                </p>

                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-brand-black tracking-wide leading-tight">
                  Have Something Special{" "}
                  <span className="text-primary-text italic">in Mind?</span>
                </h2>

                {/* Thread divider — the site's line · heart · line motif */}
                <div
                  aria-hidden="true"
                  className="flex items-center justify-center lg:justify-start gap-3"
                >
                  <span className="h-px w-12 bg-brand-border" />
                  <Heart
                    size={12}
                    className="text-gold-primary"
                    fill="currentColor"
                    strokeWidth={0}
                  />
                  <span className="h-px w-12 bg-brand-border" />
                </div>

                <p className="text-sm md:text-base text-brand-gray leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
                  Share your idea with us and we&apos;ll turn it into a handmade
                  creation you&apos;ll treasure forever.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-3">
                  <Link
                    href="/custom-order"
                    className="group/cta inline-flex items-center justify-center gap-2 bg-brand-black hover:bg-primary text-white font-bold text-xs uppercase tracking-wider h-12 px-8 rounded-full transition-colors duration-300 shadow-md w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    Start a Custom Order
                    <ArrowRight
                      size={15}
                      className="transition-transform duration-300 group-hover/cta:translate-x-1"
                    />
                  </Link>

                  <Link
                    href="/shop"
                    className="inline-flex items-center justify-center gap-2 border border-primary/40 bg-white/60 hover:bg-primary-tint text-primary-text font-semibold text-xs uppercase tracking-wider h-12 px-7 rounded-full transition-colors duration-300 w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    Explore Collections <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Trust row — mirrors the home trust bar */}
                <ul className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 pt-4">
                  {TRUST_POINTS.map((point) => (
                    <li
                      key={point}
                      className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-brand-gray/90 whitespace-nowrap"
                    >
                      <BadgeCheck
                        size={14}
                        className="text-gold-primary shrink-0"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
