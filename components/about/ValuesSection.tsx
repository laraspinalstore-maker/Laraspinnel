"use client";

import React from "react";
import { HandHeart, Gift, PenLine, Heart, Sparkles, CheckCircle2 } from "lucide-react";
import Reveal from "./Reveal";
import { FloralDoodle } from "./AboutHero";

export default function ValuesSection({ settings }: { settings: Record<string, string> }) {
  const values = [
    {
      num: "01",
      icon: HandHeart,
      pill: "100% HAND-STITCHED",
      title: settings.about_why_1_title || "Handmade with Love",
      desc:
        settings.about_why_1_desc ||
        "100% original hand-stitched crochet work, ensuring no two items are exactly the same, giving each gift a soul.",
      accentBg: "bg-rose-tint/60 text-rose-text",
      cardBg: "bg-gradient-to-b from-[#FDF8F3] to-[#FAF2EB]",
    },
    {
      num: "02",
      icon: Gift,
      pill: "MILK COTTON YARN",
      title: settings.about_why_2_title || "Premium Quality",
      desc:
        settings.about_why_2_desc ||
        "We use only premium, hypoallergenic milk cotton yarn that is soft to touch, vibrant, and extremely durable.",
      accentBg: "bg-goat-tint/80 text-goat-primary",
      cardBg: "bg-gradient-to-b from-[#F5F8F4] to-[#EEF4EC]",
    },
    {
      num: "03",
      icon: PenLine,
      pill: "TAILORED DETAILS",
      title: settings.about_why_3_title || "Customized Gifts",
      desc:
        settings.about_why_3_desc ||
        "We customize colors, letters, shapes, and frames according to your photos and specific requirements.",
      accentBg: "bg-gold-tint/80 text-gold-text",
      cardBg: "bg-gradient-to-b from-[#FAF7EE] to-[#F7EFDE]",
    },
    {
      num: "04",
      icon: Heart,
      pill: "CHERISHED FOREVER",
      title: settings.about_why_4_title || "Made for Meaningful Moments",
      desc:
        settings.about_why_4_desc ||
        "Perfect for gifting and cherishing forever — turning special celebrations into lasting, heartfelt memories.",
      accentBg: "bg-rose-tint/80 text-rose-text",
      cardBg: "bg-gradient-to-b from-[#FCF4F6] to-[#F8E8EC]",
    },
  ];

  return (
    <section className="bg-white py-16 md:py-24 border-b border-brand-border/40 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-12 relative z-10">
        {/* Section Header */}
        <Reveal className="max-w-2xl mx-auto text-center space-y-2">
          <div className="flex items-center justify-center">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-goat-primary">
              OUR ARTISAN PROMISE
            </span>
            <FloralDoodle />
          </div>
          <h2 className="font-display text-3xl md:text-4xl text-brand-black tracking-wide text-balance">
            Crafted With Purpose. Made For Keeps.
          </h2>
          <p className="text-sm font-medium text-brand-gray">
            Every creation carries our commitment to handmade excellence, hypoallergenic milk cotton yarn, and personal customization.
          </p>
        </Reveal>

        {/* 4 Cards Grid */}
        <Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className={`group relative rounded-3xl p-7 border border-brand-border/60 ${v.cardBg} shadow-3xs hover:shadow-card hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden`}
                >
                  {/* Step counter watermark */}
                  <span className="absolute top-4 right-5 text-4xl font-display font-extrabold text-brand-black/5 select-none pointer-events-none group-hover:text-brand-black/10 transition-colors">
                    {v.num}
                  </span>

                  <div className="space-y-5">
                    {/* Icon Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`w-14 h-14 rounded-2xl ${v.accentBg} border border-white/80 flex items-center justify-center shadow-3xs group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon size={24} strokeWidth={1.5} />
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h3 className="font-display text-lg font-bold text-brand-black group-hover:text-rose-text transition-colors">
                        {v.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-brand-gray leading-relaxed font-medium">
                        {v.desc}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Feature Pill */}
                  <div className="pt-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-brand-border/40 text-[10px] font-bold uppercase tracking-wider text-brand-black/80 shadow-3xs">
                      <CheckCircle2 size={12} className="text-goat-primary" />
                      {v.pill}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
