"use client";

import React from "react";
import Image from "next/image";
import { HandHeart, Gift, Heart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

/* Floral Doodle SVG for section headers */
export function FloralDoodle({ className = "text-rose-text/70" }: { className?: string }) {
  return (
    <svg
      width="28"
      height="14"
      viewBox="0 0 28 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ml-2 ${className}`}
      aria-hidden="true"
    >
      <path
        d="M1 7C5 7 8 4 10 1C10 5 12 7 16 7C12 7 10 9 10 13C8 10 5 7 1 7Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 7C19 7 21 5 23 3C23 6 24.5 7 27.5 7C24.5 7 23 8 23 11C21 9 19 7 16 7Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const INDICATORS = [
  { icon: HandHeart, label: "HANDMADE\nWITH LOVE" },
  { icon: Gift, label: "MADE TO\nORDER" },
  { icon: Heart, label: "MADE FOR\nMEANINGFUL MOMENTS" },
];

export default function AboutHero({ settings }: { settings: Record<string, string> }) {
  const heroImage =
    settings.about_intro_image && settings.about_intro_image !== "/placeholder-goat.jpg"
      ? settings.about_intro_image
      : "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=1000&auto=format&fit=crop&q=80";

  return (
    <section className="bg-[#FFFDF9] relative overflow-hidden pt-8 md:pt-16 pb-16 md:pb-24 border-b border-brand-border/40">
      {/* Background subtle botanical watermark pattern */}
      <div className="absolute top-10 left-4 w-32 h-32 opacity-15 pointer-events-none text-rose-primary">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <path d="M50,0 C60,25 75,40 100,50 C75,60 60,75 50,100 C40,75 25,60 0,50 C25,40 40,25 50,0 Z" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[46fr_54fr] gap-12 lg:gap-16 items-center">
          {/* Text column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="space-y-6 text-center lg:text-left"
          >
            {/* Eyebrow */}
            <div className="flex items-center justify-center lg:justify-start">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-goat-primary">
                {settings.about_intro_eyebrow || "OUR STORY"}
              </span>
              <FloralDoodle />
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-brand-black tracking-tight leading-[1.08] text-balance">
              {settings.about_intro_title || (
                <>
                  Made by Hand.
                  <br />
                  <span className="text-rose-text font-display italic font-semibold">Made to Mean More.</span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-sm md:text-base font-medium text-brand-gray leading-relaxed max-w-md mx-auto lg:mx-0">
              {settings.about_intro_subtitle ||
                "At Lara's Pinnal, every creation is handmade with love, care, and attention to detail. We craft meaningful pieces that turn special moments into lasting memories."}
            </p>

            {/* 3 Indicators strip */}
            <div className="flex items-center justify-center lg:justify-start gap-6 sm:gap-10 pt-3">
              {INDICATORS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex flex-col items-center text-center space-y-2 group">
                    <span className="w-11 h-11 rounded-full bg-cream-bg border border-brand-border flex items-center justify-center text-rose-text shadow-3xs group-hover:scale-105 transition-transform">
                      <Icon size={18} strokeWidth={1.5} />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-black/80 leading-tight whitespace-pre-line">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Visual column: Main Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
            className="relative lg:pl-6"
          >
            {/* Main Lifestyle Photo Container */}
            <div className="relative aspect-4/3 sm:aspect-16/11 lg:aspect-5/4 rounded-3xl overflow-hidden border border-brand-border bg-white shadow-card">
              <Image
                src={heroImage}
                alt="Hands crafting handmade crochet flowers"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 640px"
                className="object-cover"
              />
            </div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
