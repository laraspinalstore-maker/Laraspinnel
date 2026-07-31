"use client";

import React, { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { safeUrl } from "@/lib/security/url";

interface Banner {
  _id: string;
  imageUrl: string;
  headline: string;
  subtext?: string;
  buttonText?: string;
  buttonLink?: string;
  buttonTheme: "green" | "red";
}

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

  const onInit = useCallback((emblaApi: any) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on("reInit", onInit);
    emblaApi.on("select", onSelect);
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
            // The page's single <h1> is the sr-only heading in app/page.tsx.
            // Carousel slide headlines are <h2> so there is exactly one H1.
            const Heading = "h2";
            return (
              <div
                key={slide._id}
                className="flex-[0_0_100%] min-w-full w-full h-[45vh] min-h-85 md:min-h-120 md:h-[55vh] xl:h-[65vh] relative bg-brand-black"
              >
                {slide.imageUrl && (
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
                  <div className="max-w-3xl space-y-4 max-[300px]:space-y-2 text-left animate-in fade-in slide-in-from-bottom-5 duration-700">
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
