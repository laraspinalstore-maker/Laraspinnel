"use client";

import React from "react";
import useSWR from "swr";
import { Heart, Star } from "lucide-react";
import Reveal from "./Reveal";
import { safeImageUrl } from "@/lib/security/url";
import type { TestimonialDTO } from "@/lib/data/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ImageReview = {
  id: string;
  imageUrl: string;
  name: string;
  rating: number;
};

/**
 * AboutReviews — the About page's own review section.
 *
 * Renders admin-uploaded review images/screenshots (testimonials with an
 * `imageUrl`, managed under Admin → Customer Reviews). Text-only reviews stay
 * on the home page's WhatsApp-style CustomerLove section; this one is purely
 * visual. Section hides itself while there are no image reviews yet.
 */
export default function AboutReviews() {
  const { data: testimonials, isLoading } = useSWR<TestimonialDTO[]>(
    "/api/testimonials",
    fetcher
  );

  const reviews: ImageReview[] = Array.isArray(testimonials)
    ? testimonials
        .filter((t): t is TestimonialDTO & { imageUrl: string } =>
          typeof t.imageUrl === "string" && Boolean(t.imageUrl)
        )
        .map((t, i) => ({
          id: String(t._id ?? i),
          imageUrl: t.imageUrl,
          name: t.name || "Customer Review",
          rating: t.rating || 5,
        }))
    : [];

  if (!isLoading && reviews.length === 0) return null;

  /* Marquee needs enough cards to fill the track — repeat the set until ~6 wide.
     The loop itself comes from rendering TWO identical halves and translating -50%. */
  const repeats = reviews.length ? Math.max(1, Math.ceil(6 / reviews.length)) : 0;
  const track = Array.from({ length: repeats }, () => reviews).flat();

  return (
    <section
      aria-labelledby="about-reviews-heading"
      className="bg-[#FFF9F8] py-16 md:py-24"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-10 md:space-y-14">
        {/* Header */}
        <Reveal>
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <p className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-rose-text">
              <Heart size={13} fill="currentColor" strokeWidth={0} aria-hidden="true" />
              Customer Love
            </p>
            <h2
              id="about-reviews-heading"
              className="font-display text-3xl sm:text-4xl text-brand-black tracking-wide leading-tight"
            >
              Straight from Their Hearts
            </h2>
            <p className="text-sm md:text-base text-brand-gray leading-relaxed font-medium">
              Real messages and moments shared by the people who received our
              handmade creations.
            </p>
          </div>
        </Reveal>

        {/* Infinite horizontal marquee — same seamless two-half loop as the home galleries.
            Hover pauses it; prefers-reduced-motion stops it (rules live in globals.css). */}
        {isLoading ? (
          <div className="flex justify-center gap-5 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-48 sm:w-64 md:w-72 shrink-0 aspect-4/5 rounded-2xl bg-rose-tint/40 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <Reveal>
            <div className="relative overflow-hidden -mx-4 md:-mx-6">
              <div
                className="flex w-max animate-gallery-x"
                style={{ animationDuration: `${Math.max(25, track.length * 6)}s` }}
              >
                {[0, 1].map((half) => (
                  <div key={half} aria-hidden={half === 1} className="flex gap-4 pr-4 sm:gap-5 sm:pr-5 py-1">
                    {track.map((rev, i) => (
                      <figure
                        key={`${half}-${rev.id}-${i}`}
                        className="w-48 sm:w-64 md:w-72 shrink-0 rounded-2xl overflow-hidden bg-white border border-rose-primary/20 shadow-card"
                      >
                        {/* Fixed 4:5 frame; object-contain keeps the whole screenshot readable */}
                        <div className="relative aspect-4/5 bg-rose-tint/25 flex items-center justify-center p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={safeImageUrl(rev.imageUrl)}
                            alt={half === 0 ? `Review from ${rev.name}` : ""}
                            loading="lazy"
                            className="max-w-full max-h-full object-contain rounded-lg"
                          />
                        </div>
                        <figcaption className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-t border-rose-primary/10 bg-white">
                          <span className="text-xs font-semibold text-brand-black truncate">
                            {rev.name}
                          </span>
                          <span
                            role="img"
                            aria-label={`${rev.rating} out of 5 stars`}
                            className="flex gap-px shrink-0"
                          >
                            {[...Array(5)].map((_, s) => (
                              <Star
                                key={s}
                                size={11}
                                className={
                                  s < rev.rating
                                    ? "text-gold-primary fill-gold-primary"
                                    : "text-brand-gray/30"
                                }
                              />
                            ))}
                          </span>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
