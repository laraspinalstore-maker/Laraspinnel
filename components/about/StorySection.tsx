"use client";

import React from "react";
import Image from "next/image";
import Reveal from "./Reveal";
import { FloralDoodle } from "./AboutHero";

export default function StorySection({ settings }: { settings: Record<string, string> }) {
  const mainStoryImage =
    settings.about_story_image && settings.about_story_image !== "/custombg.png"
      ? settings.about_story_image
      : "https://images.unsplash.com/photo-1596436889106-be35e843f974?w=1000&auto=format&fit=crop&q=80";

  return (
    <section id="our-story" className="bg-white scroll-mt-20 py-16 md:py-24 border-b border-brand-border/40 relative overflow-hidden">


      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Main photo */}
          <Reveal className="order-2 lg:order-1">
            <div className="relative">
              {/* Main Studio Setup Photo */}
              <div className="relative aspect-4/3 rounded-3xl overflow-hidden border border-brand-border bg-white shadow-card">
                <Image
                  src={mainStoryImage}
                  alt="Lara's Pinnal crochet studio display table"
                  fill
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover"
                />
              </div>

            </div>
          </Reveal>

          {/* Right Column: Story Text */}
          <Reveal delay={0.1} className="order-1 lg:order-2 space-y-6 pt-2 lg:pt-0 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-goat-primary">
                OUR STORY
              </span>
              <FloralDoodle />
            </div>

            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-brand-black tracking-wide leading-tight">
              How It All Began <span className="text-rose-text text-3xl md:text-4xl font-normal inline-block ml-1">♡</span>
            </h2>

            <div className="space-y-4 text-sm md:text-base text-brand-gray leading-relaxed font-medium">
              <p>
                {settings.about_intro_p1 ||
                  "Lara's Pinnal began with a simple love for crochet and a desire to create gifts that feel personal, thoughtful, and made just for you."}
              </p>
              <p>
                {settings.about_intro_p2 ||
                  "What started as a small passion project has grown into a brand that celebrates handmade artistry, customization, and the joy of giving."}
              </p>
              <p>
                {settings.about_intro_p3 ||
                  "Every stitch we make carries our promise of quality, creativity, and heartfelt care."}
              </p>
            </div>

            {/* Handwritten cursive sign-off */}
            <div className="pt-2">
              <p className="font-display italic text-xl md:text-2xl text-rose-text">
                Thank you for being a part of our journey. <span className="text-lg">♡</span>
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
