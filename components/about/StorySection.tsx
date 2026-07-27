"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { DEFAULT_STORY_CHIPS, parseList } from "@/lib/siteContent";
import Reveal from "./Reveal";

export default function StorySection({ settings }: { settings: Record<string, string> }) {
  const mainStoryImage =
    settings.about_story_image && settings.about_story_image !== "/custombg.png"
      ? settings.about_story_image
      : "https://images.unsplash.com/photo-1596436889106-be35e843f974?w=1000&auto=format&fit=crop&q=80";

  /* Heading: last word gets the italic gold accent, like the mock */
  const title = settings.about_story_title?.trim() || "How It All Began";
  const titleWords = title.split(/\s+/);
  const titleAccent = titleWords.pop();
  const titleLead = titleWords.join(" ");

  const eyebrow = settings.about_story_eyebrow?.trim() || "Our Story";
  const estYear = settings.about_story_est?.trim() || "2019";
  const chips = parseList<string>(settings.about_story_chips, DEFAULT_STORY_CHIPS);
  const ctaText = settings.about_story_cta_text?.trim() || "Our Craft";
  const signoff =
    settings.about_story_signoff?.trim() || "Thank you for being a part of our journey.";

  return (
    <section id="our-story" className="bg-white scroll-mt-20 py-16 md:py-24 border-b border-brand-border/40">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <Reveal>
          {/* Warm cream story panel — same family as the Final CTA card */}
          <div className="relative overflow-hidden rounded-3xl md:rounded-[2.5rem] bg-linear-to-br from-[#FFFDF9] via-cream-bg to-gold-tint border border-brand-border shadow-card">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center p-6 sm:p-10 lg:p-14">
              {/* Left: maker photo in a stitched frame, EST badge pinned on top */}
              <div className="lg:col-span-5 relative pt-8 pl-4 sm:pl-6">
                <div className="relative rounded-3xl border-2 border-dashed border-gold-primary/40 p-2.5 bg-white shadow-card">
                  <div className="relative aspect-4/5 rounded-2xl overflow-hidden bg-gold-tint/40">
                    <Image
                      src={mainStoryImage}
                      alt="The maker at work in the Lara's Pinnal studio"
                      fill
                      sizes="(max-width: 1024px) 100vw, 480px"
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* EST. badge */}
                <div className="absolute top-0 left-0 z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-goat-primary shadow-md flex flex-col items-center justify-center">
                  <span className="font-display font-extrabold text-xl sm:text-2xl text-cream-bg leading-none">
                    {estYear}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.3em] text-cream-bg/80 mt-1">
                    Est.
                  </span>
                </div>
              </div>

              {/* Right: story copy */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                {/* Eyebrow with trailing thread */}
                <p className="inline-flex items-center gap-3 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-goat-primary">
                  {eyebrow}
                  <span aria-hidden="true" className="h-px w-10 bg-goat-primary/40" />
                </p>

                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-wide leading-tight text-brand-black">
                  {titleLead && <>{titleLead} </>}
                  <span className="italic text-goat-text">{titleAccent}</span>
                </h2>

                <div className="space-y-4 text-sm md:text-base text-brand-gray leading-relaxed font-medium max-w-xl mx-auto lg:mx-0 text-justify">
                  <p>
                    {settings.about_intro_p1?.trim() ||
                      "At Lara's Pinnal, we believe the best gifts are the ones made by hand. A passion for knitting and yarn became a premium crochet studio in Tamil Nadu, designing gifts for life's most precious milestones."}
                  </p>
                  <p>
                    {settings.about_intro_p2?.trim() ||
                      "Bouquets that never fade, custom photo frames, amigurumi plushies, corporate hampers — every single stitch represents our passion for quality and craftsmanship."}
                  </p>
                  {settings.about_intro_p3?.trim() && <p>{settings.about_intro_p3}</p>}
                </div>

                {/* Craft chips */}
                <ul className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
                  {chips.map((chip) => (
                    <li
                      key={chip}
                      className="rounded-full bg-goat-tint border border-goat-primary/15 text-primary-hover font-bold text-xs sm:text-sm px-5 py-2.5"
                    >
                      {chip}
                    </li>
                  ))}
                </ul>

                <hr className="border-brand-border" />

                <div>
                  <Link
                    href="#our-craft"
                    className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-brand-black hover:bg-goat-primary text-white font-bold text-xs uppercase tracking-wider transition-colors duration-300 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goat-primary focus-visible:ring-offset-2"
                  >
                    {ctaText}
                  </Link>
                </div>

                <p className="font-display italic text-lg md:text-xl text-goat-text">
                  {signoff}
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
