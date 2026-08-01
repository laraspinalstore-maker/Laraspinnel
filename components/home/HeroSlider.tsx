"use client";

import React, { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import Link from "next/link";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { safeUrl } from "@/lib/security/url";
import type { BannerDTO } from "@/lib/data/types";

/**
 * Banner shape, shared with the server render in app/page.tsx via
 * `lib/data/types.ts` rather than declared twice. `buttonTheme` is a plain string
 * there because the value comes from the database: the admin form only offers
 * "green" and "red", but an older or hand-edited row can hold anything, and the
 * button below treats everything that is not "red" as the default theme.
 */
type Banner = BannerDTO;

/**
 * The carousel instance, as handed to Embla's event callbacks. The hook returns
 * `[ref, api | undefined]`, so the api type is the second tuple member with the
 * `undefined` stripped — the callbacks below only ever run with a live instance.
 */
type EmblaApi = NonNullable<UseEmblaCarouselType[1]>;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function HeroSlider({ initialBanners = [] }: { initialBanners?: Banner[] }) {
  const { data: banners = initialBanners } = useSWR<Banner[]>("/api/banners", fetcher, {
    fallbackData: initialBanners,
    // Don't re-fetch on first mount — server already passed initialBanners.
    // This prevents a duplicate network request on the critical path and
    // eliminates the loading flash that was delaying LCP.
    revalidateOnMount: false,
    revalidateOnFocus: false,
  });
  // Honor prefers-reduced-motion: no autoplay, no loop when the user asks for stillness.
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: !prefersReducedMotion },
    prefersReducedMotion ? [] : [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  // Slides 2+ sit inside the on-screen carousel viewport, so loading="lazy"
  // never defers them — mounted eagerly they compete with the slide-1 LCP
  // image for bandwidth during the critical window. Mount their images only
  // once the browser goes idle (well before the 5s autoplay advance).
  const [restReady, setRestReady] = useState(false);
  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setRestReady(true), { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(() => setRestReady(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const onInit = useCallback((api: EmblaApi) => {
    setScrollSnaps(api.scrollSnapList());
  }, []);

  const onSelect = useCallback((api: EmblaApi) => {
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on("reInit", onInit);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("select", onSelect);

    // The first read of the snap list is queued rather than run inline. Embla has
    // the values ready immediately, but setting state in the body of an effect
    // renders again before the browser paints (`react-hooks/set-state-in-effect`)
    // — and this only populates the pagination dots, which are below the LCP
    // image and not worth a synchronous pass.
    const id = setTimeout(() => {
      onInit(emblaApi);
      onSelect(emblaApi);
    }, 0);

    // The previous version never unsubscribed, so every remount left its
    // listeners attached to the carousel instance.
    return () => {
      clearTimeout(id);
      emblaApi.off("reInit", onInit);
      emblaApi.off("reInit", onSelect);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onInit, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );


  // Fallback defaults if no active banners seeded
  const slides = banners.length > 0 ? banners : [
    {
      _id: "default-1",
      imageUrl: "",
      headline: "Handmade Crochet Gifts, Delivered Across India",
      subtext: "Crochet flower bouquets, custom frames, and amigurumi plush — hand-knitted with love.",
      buttonText: "Explore Gifts",
      buttonLink: "/shop",
      buttonTheme: "green" as const,
    },
    {
      _id: "default-2",
      imageUrl: "",
      headline: "Custom Crochet Frames & Bouquets, Made to Order",
      subtext: "Premium milk cotton yarn, crafted into keepsakes for every occasion.",
      buttonText: "Explore Bouquets",
      buttonLink: "/shop?category=bouquets",
      buttonTheme: "red" as const,
    }
  ];

  return (
    <section className="relative overflow-hidden group select-none bg-brand-light-gray px-4 pt-4 pb-4 md:px-6 md:pt-6 md:pb-6 lg:px-8 lg:pt-8 lg:pb-8">
      {/* Viewport */}
      <div className="relative overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => {
            // The first slide's headline is the page's <h1>: it is the visually
            // dominant text on the page and it is what the page is about, so it
            // should carry the top heading level rather than a hidden duplicate.
            // Only slide 0 gets it — Embla keeps every slide mounted, so a
            // per-slide <h1> would mean several <h1>s in one document, and the
            // <h1> never disappears as the carousel advances.
            // Paired with app/page.tsx, which no longer renders an sr-only <h1>.
            const Heading = index === 0 ? "h1" : "h2";
            return (
              <div
                key={slide._id}
                className="flex-[0_0_100%] min-w-full w-full h-[45vh] min-h-85 md:min-h-120 md:h-[55vh] xl:h-[65vh] relative bg-brand-black"
              >
                {slide.imageUrl && (index === 0 || restReady) && (
                  <Image
                    src={slide.imageUrl}
                    alt={slide.headline}
                    fill
                    className="absolute inset-0 w-full h-full object-cover object-right md:object-center opacity-80"
                    priority={index === 0}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    sizes="100vw"
                    quality={75}
                    onLoad={() => {
                      if (index === 0) {
                        window.dispatchEvent(new Event("banner-loaded"));
                      }
                    }}
                  />
                )}
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-brand-black/80 via-brand-black/35 to-transparent"></div>

                {/* Slide Content */}
                <div className="absolute inset-0 flex flex-col justify-center pb-12 md:pb-6 max-w-7xl mx-auto px-4 md:px-6 pt-6">
                  {/* No entry animation on the first slide — its headline is the
                      page's LCP element and a fade-in delays the LCP paint. */}
                  <div
                    className={`max-w-3xl space-y-4 max-[300px]:space-y-2 text-left ${
                      index === 0 ? "" : "animate-in fade-in slide-in-from-bottom-5 duration-700"
                    }`}
                  >
                    {/* Title in display Anton font */}
                    <Heading className="font-display text-white text-2xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight uppercase tracking-wide max-[300px]:text-2xl max-[300px]:leading-tight line-clamp-2">
                      {slide.headline}
                    </Heading>

                    {/* Subtext */}
                    {slide.subtext && (
                      <p className="text-white/80 text-sm sm:text-base md:text-lg max-w-xl font-normal leading-relaxed max-[300px]:text-xs max-[300px]:leading-snug line-clamp-3">
                        {slide.subtext}
                      </p>
                    )}

                    {/* Call to action */}
                    {slide.buttonText && (
                      <div className="pt-2">
                        <Link
                          href={safeUrl(slide.buttonLink, "/")}
                          className={`inline-flex items-center justify-center px-7 py-3 rounded-full text-sm font-semibold shadow-md transition-all duration-300 hover:scale-102 ${slide.buttonTheme === "red"
                            ? "bg-secondary text-white hover:bg-secondary-hover"
                            : "bg-primary text-white hover:bg-primary-hover"
                            }`}
                        >
                          {slide.buttonText}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={scrollPrev}
          className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-xs border border-white/10 hidden md:flex items-center justify-center text-white cursor-pointer md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-all duration-300 active:scale-95"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>

        <button
          onClick={scrollNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-xs border border-white/10 hidden md:flex items-center justify-center text-white cursor-pointer md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-all duration-300 active:scale-95"
          aria-label="Next slide"
        >
          <ChevronRight size={24} strokeWidth={2} />
        </button>

        {/* Dots navigation */}
        <div className="absolute bottom-8 lg:bottom-6 left-0 right-0 flex justify-center gap-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`relative h-2 rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white after:absolute after:inset-x-0 after:-inset-y-4 after:content-[''] ${index === selectedIndex ? "w-7 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                }`}
              aria-label={`Go to slide ${index + 1}`}
            ></button>
          ))}
        </div>
      </div>
    </section>
  );
}
