"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import type { EmblaCarouselType } from "embla-carousel";
import { useSettings } from "@/hooks/useSettings";
import { PromoCard, DEFAULT_PROMO_CARDS, CONTENT_DEFAULTS, getPromoCardColorClass, parseList } from "@/lib/siteContent";
import { safeUrl } from "@/lib/security/url";

const TWEEN_FACTOR_BASE = 0.84;

function numberWithinRange(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function PromoCardButton({ text, href }: { text: string; href: string }) {
  const className =
    "inline-flex items-center px-5 py-2.5 rounded-full bg-white text-brand-black text-xs font-bold uppercase tracking-wide shadow-sm hover:scale-105 active:scale-95 transition-transform";
  // buttonLink is admin-editable settings content, so it is normalised BEFORE
  // the internal-vs-external branch is chosen. Doing it the other way round
  // meant a protocol-relative value like "//evil.com" passed the
  // startsWith("/") test and was rendered as an internal <Link>, and a
  // "javascript:" value reached the anchor untouched.
  const safeHref = safeUrl(href);

  if (safeHref.startsWith("/")) {
    return (
      <Link href={safeHref} className={className}>
        {text}
      </Link>
    );
  }
  return (
    <a href={safeHref} target="_blank" rel="noopener noreferrer" className={className}>
      {text}
    </a>
  );
}

export default function PromoShowcase() {
  const { settings } = useSettings();
  const cards = parseList<PromoCard>(settings.home_promo_cards, DEFAULT_PROMO_CARDS);
  const promoTitle = settings.home_promo_title || CONTENT_DEFAULTS.home_promo_title;
  const promoSubtitle = settings.home_promo_subtitle || CONTENT_DEFAULTS.home_promo_subtitle;

  const [prefersReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center", skipSnaps: false },
    prefersReducedMotion ? [] : [Autoplay({ delay: 2500, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  const tweenNodes = useRef<(HTMLElement | null)[]>([]);
  const tweenFactor = useRef(0);

  const setTweenNodes = useCallback((api: EmblaCarouselType) => {
    tweenNodes.current = api
      .slideNodes()
      .map((slideNode) => slideNode.querySelector<HTMLElement>(".promo-tween-target"));
  }, []);

  const setTweenFactor = useCallback((api: EmblaCarouselType) => {
    tweenFactor.current = TWEEN_FACTOR_BASE * api.scrollSnapList().length;
  }, []);

  const tweenScale = useCallback((api: EmblaCarouselType, eventName?: string) => {
    const engine = api.internalEngine();
    const scrollProgress = api.scrollProgress();
    const slidesInView = api.slidesInView();
    const isScrollEvent = eventName === "scroll";

    api.scrollSnapList().forEach((scrollSnap, snapIndex) => {
      let diffToTarget = scrollSnap - scrollProgress;
      const slidesInSnap = engine.slideRegistry[snapIndex] ?? [];

      slidesInSnap.forEach((slideIndex) => {
        if (isScrollEvent && !slidesInView.includes(slideIndex)) return;

        if (engine.options.loop) {
          engine.slideLooper.loopPoints.forEach((loopItem) => {
            const target = loopItem.target();
            if (slideIndex === loopItem.index && target !== 0) {
              const sign = Math.sign(target);
              if (sign === -1) diffToTarget = scrollSnap - (1 + scrollProgress);
              if (sign === 1) diffToTarget = scrollSnap + (1 - scrollProgress);
            }
          });
        }

        const tweenValue = 1 - Math.abs(diffToTarget * tweenFactor.current);
        const scale = numberWithinRange(tweenValue, 0.72, 1);
        const rotateY = numberWithinRange(diffToTarget * 40, -40, 40);
        const opacity = numberWithinRange(tweenValue, 0.4, 1);
        const tweenNode = tweenNodes.current[slideIndex];
        if (tweenNode) {
          tweenNode.style.transform = `scale(${scale}) rotateY(${rotateY}deg)`;
          tweenNode.style.opacity = String(opacity);
        }
      });
    });
  }, []);

  useEffect(() => {
    if (!emblaApi || prefersReducedMotion) return;

    setTweenNodes(emblaApi);
    setTweenFactor(emblaApi);
    tweenScale(emblaApi);

    emblaApi
      .on("reInit", setTweenNodes)
      .on("reInit", setTweenFactor)
      .on("reInit", tweenScale)
      .on("scroll", tweenScale)
      .on("slideFocus", tweenScale);
  }, [emblaApi, prefersReducedMotion, setTweenNodes, setTweenFactor, tweenScale]);

  if (cards.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-8">
        {/* Header row */}
        <div className="pb-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl text-brand-black tracking-wide uppercase">
              {promoTitle}
            </h2>
            <p className="text-sm font-medium text-brand-gray mt-2">
              {promoSubtitle}
            </p>
          </div>
        </div>

        <div
          className="overflow-hidden"
          style={{ perspective: prefersReducedMotion ? undefined : "1400px" }}
          ref={emblaRef}
        >
          <div className="flex -mx-3">
            {cards.map((card, index) => (
              <div
                key={index}
                className="flex-[0_0_97%] sm:flex-[0_0_70%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0 px-3"
              >
                <div className="promo-tween-target will-change-transform">
                  <div
                    className={`relative rounded-[28px] ${getPromoCardColorClass(
                      card.bgColor
                    )} p-6 h-96 sm:h-[25rem] lg:h-[28rem] overflow-hidden flex flex-col`}
                  >
                    {/* Decorative background layer */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                      {/* Dot-grid texture */}
                      <div
                        className="absolute inset-0 opacity-[0.22]"
                        style={{
                          backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
                          backgroundSize: "18px 18px",
                        }}
                      />
                      {/* Soft glow blobs */}
                      <div className="absolute -top-14 -right-14 w-48 h-48 rounded-full bg-white/25 blur-3xl" />
                      <div className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full bg-black/20 blur-3xl" />
                      <div className="absolute top-1/3 -left-16 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
                      <div className="absolute bottom-1/4 -right-10 w-28 h-28 rounded-full bg-white/20 blur-2xl" />

                      {/* Outline ring accents */}
                      <div className="absolute top-6 -right-6 w-24 h-24 rounded-full border border-white/35" />
                      <div className="absolute top-14 -right-2 w-10 h-10 rounded-full border border-white/35" />
                      <div className="absolute bottom-10 left-6 w-16 h-16 rounded-full border border-dashed border-white/25" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-white/20" />

                      {/* Scattered sparkle marks */}
                      <span className="absolute top-10 left-8 text-white/40 text-xl leading-none rotate-12">✦</span>
                      <span className="absolute top-1/3 right-10 text-white/35 text-sm leading-none -rotate-6">✦</span>
                      <span className="absolute bottom-1/3 left-1/4 text-white/30 text-xs leading-none rotate-45">✦</span>
                      <span className="absolute bottom-8 right-1/3 text-white/35 text-lg leading-none">✦</span>

                      {/* Corner bracket accent */}
                      <div className="absolute bottom-5 right-5 w-10 h-10 border-b-2 border-r-2 border-white/35 rounded-br-2xl" />

                      {/* Diagonal sheen */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/5" />
                    </div>

                    <div className="relative z-10 w-full pr-2">
                      <h3 className="text-white font-display text-lg sm:text-xl leading-snug drop-shadow-sm truncate">
                        {card.title}
                      </h3>
                    </div>

                    {card.imageUrl && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[84%] aspect-square rounded-2xl overflow-hidden">
                        <Image
                          src={card.imageUrl}
                          alt={card.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 60vw, 320px"
                        />
                      </div>
                    )}

                    {/* Buy Now — centered at the bottom of the card, above the image */}
                    {card.buttonText && card.buttonLink && (
                      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
                        <PromoCardButton text={card.buttonText} href={card.buttonLink} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
