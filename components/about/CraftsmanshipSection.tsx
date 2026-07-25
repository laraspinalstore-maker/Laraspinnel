"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles, Heart, ShieldCheck, Palette, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "./Reveal";

interface CraftPillar {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  icon: React.ElementType;
  colorClass: string;
  bgTintClass: string;
  imageSrc: string;
  imageAlt: string;
  polaroidCaption: string;
}

const PILLARS: CraftPillar[] = [
  {
    id: "yarn",
    tag: "Material Selection",
    title: "100% Premium Milk Cotton Yarn",
    subtitle: "Anti-pilling, velvety softness & fade-resistant colors",
    description:
      "We source high-grade milk cotton yarn that gives every creation its signature soft feel and rich color depth. Hypoallergenic and safe for babies, kids, and pets.",
    highlights: [
      "Hypoallergenic & non-toxic fibers",
      "Rich, fade-resistant color dye",
      "Super soft texture with high durability",
      "Easy spot cleaning & hand washable",
    ],
    icon: Sparkles,
    colorClass: "text-goat-primary",
    bgTintClass: "bg-goat-tint",
    imageSrc:
      "https://ik.imagekit.io/senra6374/laraspinnal/Crochet_rose_flower_on_stem_202607192151-removebg-preview_6NgeZL4GE.png",
    imageAlt: "Single Pink Rose Stem in milk cotton yarn",
    polaroidCaption: "Soft Milk Cotton • Hand-dyed Shades",
  },
  {
    id: "technique",
    tag: "Stitch-by-Stitch",
    title: "Over 1,200+ Individual Hand Stitches",
    subtitle: "Patience, precision, and passion in every single petal",
    description:
      "Nothing here is machine-stamped. Each petal, stem, plushie ear, and coaster pattern is hand-crocheted stitch by stitch in our Villupuram studio with meticulous attention to detail.",
    highlights: [
      "100% hand-knitted by skilled artisans",
      "Tight, uniform stitch integrity",
      "Reinforced stems & structured plush forms",
      "Uniquely handcrafted — no two are identical",
    ],
    icon: Heart,
    colorClass: "text-secondary",
    bgTintClass: "bg-secondary-tint",
    imageSrc:
      "https://ik.imagekit.io/senra6374/laraspinnal/Crochet_flower_bouquet_pink_lilies_202607192147-removebg-preview_LtUJPk8Yq.png",
    imageAlt: "Pink Lily Crochet Bouquet with hand-stitched details",
    polaroidCaption: "1,200+ Stitches • Hours of Care",
  },
  {
    id: "durability",
    tag: "Everlasting Quality",
    title: "Blooms & Gifts That Never Fade",
    subtitle: "Keepsakes made to be cherished for years to come",
    description:
      "Unlike fresh flowers that wither in days, Lara's Pinnal crochet bouquets remain vibrant year after year. A permanent symbol of your love and special occasions.",
    highlights: [
      "Zero wilting or petal dropping",
      "Zero watering or sunlight required",
      "Retains shape and color vibrancy over time",
      "Timeless memory piece for homes & desks",
    ],
    icon: ShieldCheck,
    colorClass: "text-rose-text",
    bgTintClass: "bg-rose-tint",
    imageSrc:
      "https://ik.imagekit.io/senra6374/laraspinnal/Crochet_teddy_bear_on_white_202607192145-removebg-preview_5cLkpFYkW.png",
    imageAlt: "Handmade Teddy Bear Crochet Plushie",
    polaroidCaption: "Forever Memories • Zero Wilting",
  },
  {
    id: "customization",
    tag: "Bespoke Requests",
    title: "Personalized For Your Story",
    subtitle: "Custom color palettes, names, initials, and gift packaging",
    description:
      "Want lavender instead of red? Need a photo frame with initials? We customize colors, arrangements, and add handwritten gift notes so your gift feels personal.",
    highlights: [
      "Custom color matching & combinations",
      "Personalized tags & name initials",
      "Custom bouquet wrapping & ribbons",
      "Complimentary gift messaging included",
    ],
    icon: Palette,
    colorClass: "text-gold-text",
    bgTintClass: "bg-gold-tint",
    imageSrc:
      "https://ik.imagekit.io/senra6374/laraspinnal/Wooden_embroidery_hoop_photo_frame_202607192148-removebg-preview_rCFSgzD5l.png",
    imageAlt: "Wooden Hoop Crochet Photo Frame",
    polaroidCaption: "Custom Colors • Personalized Touches",
  },
];

export default function CraftsmanshipSection() {
  const [activeId, setActiveId] = useState<string>(PILLARS[0].id);
  const activePillar = PILLARS.find((p) => p.id === activeId) || PILLARS[0];

  return (
    <section className="bg-cream-bg py-16 md:py-24 border-t border-brand-border/60 relative overflow-hidden">
      {/* Decorative subtle background elements */}
      <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-goat-tint/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-rose-tint/40 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 space-y-12">
        <Reveal className="max-w-2xl mx-auto text-center space-y-3">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-goat-primary">
            Inside Our Studio
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-brand-black tracking-wide text-balance">
            The Anatomy of a Handmade Keepsake
          </h2>
          <p className="text-sm md:text-base text-brand-gray leading-relaxed">
            Every creation is crafted with premium materials, intentional design, and hours of dedicated handwork.
          </p>
        </Reveal>

        {/* Tab Selection */}
        <Reveal>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              const isActive = pillar.id === activeId;
              return (
                <button
                  key={pillar.id}
                  onClick={() => setActiveId(pillar.id)}
                  className={`flex items-center gap-2.5 px-4 md:px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    isActive
                      ? "bg-brand-black text-white shadow-md scale-105"
                      : "bg-white text-brand-gray border border-brand-border hover:bg-goat-tint/40 hover:text-brand-black"
                  }`}
                >
                  <Icon size={15} className={isActive ? "text-rose-text" : pillar.colorClass} />
                  <span>{pillar.tag}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Active Pillar Card Showcase */}
        <Reveal>
          <div className="bg-white rounded-3xl md:rounded-4xl border border-brand-border p-6 md:p-10 shadow-card">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePillar.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
              >
                {/* Visual Column - Polaroid Style */}
                <div className="lg:col-span-5 flex justify-center">
                  <div className="relative w-64 md:w-72 lg:w-80 rotate-[-2deg] rounded-3xl bg-white border border-brand-border shadow-hover p-4 pb-6 group transition-transform duration-500 hover:rotate-0">
                    <div className={`relative aspect-square rounded-2xl ${activePillar.bgTintClass} overflow-hidden p-4`}>
                      <Image
                        src={activePillar.imageSrc}
                        alt={activePillar.imageAlt}
                        fill
                        sizes="(max-width: 768px) 280px, 320px"
                        className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="mt-4 text-center">
                      <p className="font-display italic text-sm text-brand-black font-medium">
                        {activePillar.polaroidCaption}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Text Content Column */}
                <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                  <div className="space-y-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${activePillar.bgTintClass} ${activePillar.colorClass}`}>
                      {activePillar.tag}
                    </span>
                    <h3 className="font-display text-2xl md:text-3xl lg:text-4xl text-brand-black tracking-wide leading-tight">
                      {activePillar.title}
                    </h3>
                    <p className={`text-xs md:text-sm font-semibold uppercase tracking-wider ${activePillar.colorClass}`}>
                      {activePillar.subtitle}
                    </p>
                  </div>

                  <p className="text-sm md:text-base text-brand-gray leading-relaxed">
                    {activePillar.description}
                  </p>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {activePillar.highlights.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-left">
                        <CheckCircle2 size={17} className={`${activePillar.colorClass} shrink-0`} />
                        <span className="text-xs md:text-sm font-medium text-brand-black/90">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
