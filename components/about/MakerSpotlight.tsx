"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Heart, ArrowRight, ShieldCheck } from "lucide-react";
import Reveal from "./Reveal";

export default function MakerSpotlight({ settings }: { settings: Record<string, string> }) {
  const image =
    settings.about_maker_image ||
    "https://ik.imagekit.io/senra6374/laraspinnal/Crochet_flower_bouquet_lavender___202607192146-removebg-preview_O0_IyzOS2.png";

  return (
    <section className="bg-cream-bg py-16 md:py-24 border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl md:rounded-4xl bg-white border border-brand-border p-8 md:p-14 shadow-card">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Polaroid Image Box */}
              <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
                <div className="relative w-64 md:w-72 lg:w-80 rotate-2 rounded-3xl bg-cream-bg border border-brand-border shadow-hover p-4 pb-6 transition-transform duration-500 hover:rotate-0">
                  <div className="relative aspect-4/5 rounded-2xl bg-white overflow-hidden border border-brand-border/60">
                    <Image
                      src={image}
                      alt="Handcrafted crochet studio pieces by Lara's Pinnal"
                      fill
                      sizes="(max-width: 768px) 280px, 320px"
                      className="object-contain p-4"
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between px-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-brand-black">
                      <MapPin size={14} className="text-primary" />
                      <span>Villupuram, TN</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-tint px-2.5 py-1 rounded-full">
                      Artisan Made
                    </span>
                  </div>
                </div>
              </div>

              {/* Artisan Note */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left order-1 lg:order-2">
                <div className="space-y-2">
                  <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                    Artisan Pledge & Studio Vision
                  </p>
                  <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-brand-black tracking-wide text-balance">
                    Crafting Memories, One Loop at a Time
                  </h2>
                </div>

                <p className="text-sm md:text-base text-brand-gray leading-relaxed">
                  {settings.about_maker_quote ||
                    "“When you unwrap a Lara's Pinnal creation, you're not just holding yarn and wire. You're opening hours of quiet dedication, patient hands, and genuine warmth. We craft every bouquet and plushie with the exact same love as if it were a gift for our own family.”"}
                </p>

                {/* Badges strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="flex items-center justify-center lg:justify-start gap-2 bg-cream-bg border border-brand-border rounded-2xl p-3 shadow-3xs">
                    <Heart size={16} className="text-rose-text shrink-0" />
                    <span className="text-xs font-bold text-brand-black">100% Handcrafted</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2 bg-cream-bg border border-brand-border rounded-2xl p-3 shadow-3xs">
                    <ShieldCheck size={16} className="text-primary shrink-0" />
                    <span className="text-xs font-bold text-brand-black">Milk Cotton Quality</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2 bg-cream-bg border border-brand-border rounded-2xl p-3 shadow-3xs col-span-2 sm:col-span-1">
                    <MapPin size={16} className="text-secondary-text shrink-0" />
                    <span className="text-xs font-bold text-brand-black">Shipping Pan-India</span>
                  </div>
                </div>

                {/* Sign-off signature & CTAs */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <p className="font-display italic text-xl md:text-2xl text-primary">
                    — The Lara&apos;s Pinnal Family
                  </p>
                  <Link
                    href="/custom-order"
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-text hover:text-primary-hover transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-black rounded-md px-2 py-1"
                  >
                    Custom Gift Inquiry <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
