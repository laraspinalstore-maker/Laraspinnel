import React from "react";
import Link from "next/link";
import { ArrowRight, Brush, Sparkles, HeartHandshake, Heart } from "lucide-react";
import CustomOrderGallery from "./CustomOrderGallery";
import {
  CONTENT_DEFAULTS,
  DEFAULT_CUSTOM_POINTS,
  DEFAULT_CUSTOM_GALLERY,
  CustomGalleryItem,
  parseList,
} from "@/lib/siteContent";

/**
 * CustomOrderBanner
 * Editorial campaign banner fusing brand storytelling with the Custom Orders message.
 *
 * Every visible piece (copy, benefit points, CTAs, background image, gallery
 * items, visibility) is admin-editable via the `home_custom_*` SiteSettings
 * keys — Admin → Website Content → Home → "Custom Order Banner". Saved values
 * override the CONTENT_DEFAULTS fallbacks.
 *
 * Desktop: 45/55 split — editorial content on the LEFT, an animated three-column
 * showcase of real custom creations on the RIGHT (columns scroll in alternating
 * directions; see CustomOrderGallery).
 * Tablet: content plus a single slow horizontal carousel.
 * Mobile: same centered editorial stack over a horizontal carousel.
 */

// Benefit icons are fixed and assigned by position, like the Why Choose steps.
const POINT_ICONS = [Brush, Sparkles, HeartHandshake];

interface CustomOrderBannerProps {
  settings?: Record<string, string>;
  customOrderLink?: string;
  exploreLink?: string;
}

export default function CustomOrderBanner({
  settings = {},
  customOrderLink = "/custom-order",
  exploreLink = "/shop",
}: CustomOrderBannerProps) {
  // Saved value wins; blank/missing falls back to the CMS default.
  const s = (key: string) => settings[key]?.trim() || CONTENT_DEFAULTS[key] || "";

  if (s("home_custom_enabled") === "false") return null;

  const eyebrow = s("home_custom_eyebrow");
  const headingLines = s("home_custom_heading").split("\n").filter(Boolean);
  const description = s("home_custom_description");
  const points = parseList<string>(settings["home_custom_points"], DEFAULT_CUSTOM_POINTS);
  const primaryText = s("home_custom_primary_text");
  // "/contact" was the CTA's default before the dedicated /custom-order page
  // existed — treat a stored legacy value as unset so the button lands on the
  // custom-order builder. Any other admin-set link still wins.
  const storedPrimaryLink = settings["home_custom_primary_link"]?.trim();
  const primaryLink =
    storedPrimaryLink && storedPrimaryLink !== "/contact" ? storedPrimaryLink : customOrderLink;
  const secondaryText = s("home_custom_secondary_text");
  const secondaryLink = settings["home_custom_secondary_link"]?.trim() || exploreLink;
  const bgImage = s("home_custom_bg_image");
  const bgImageTablet = settings["home_custom_bg_image_tablet"]?.trim() || bgImage;
  const bgImageMobile = s("home_custom_bg_image_mobile") || bgImage;
  const galleryItems = parseList<CustomGalleryItem>(
    settings["home_custom_gallery"],
    DEFAULT_CUSTOM_GALLERY
  );

  const Eyebrow = (
    <p className="text-center text-[11px] sm:text-xs md:max-lg:text-sm font-semibold uppercase tracking-[0.24em] text-goat-primary">
      {eyebrow}
    </p>
  );

  const Headline = (
    <h2
      id="custom-order-heading"
      className="font-display text-5xl xl:text-6xl leading-[1.08] tracking-wide text-brand-black text-center"
    >
      {headingLines.map((line, i) => (
        <React.Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </React.Fragment>
      ))}
    </h2>
  );

  const Divider = (
    <div aria-hidden="true" className="flex items-center justify-center gap-3">
      <span className="h-px w-12 bg-brand-border" />
      <Heart size={12} className="text-rose-primary/60" fill="currentColor" strokeWidth={0} />
      <span className="h-px w-12 bg-brand-border" />
    </div>
  );

  const Description = (
    <p className="text-base sm:text-lg md:max-lg:text-xl text-brand-gray leading-relaxed max-w-md md:max-lg:max-w-xl mx-auto text-center">
      {description}
    </p>
  );

  const ValuePoints = (
    <ul className="flex items-start justify-center pt-3">
      {points.map((label, i) => {
        const Icon = POINT_ICONS[i % POINT_ICONS.length];
        return (
          <li
            key={label}
            className={`flex flex-col items-center gap-3 px-5 sm:px-7 text-center ${
              i > 0 ? "border-l border-brand-border/70" : ""
            }`}
          >
            <span
              aria-hidden="true"
              className="w-12 h-12 md:max-lg:w-14 md:max-lg:h-14 rounded-full bg-goat-tint border border-goat-primary/10 flex items-center justify-center text-goat-primary shrink-0"
            >
              <Icon size={20} strokeWidth={1.5} />
            </span>
            <span className="text-[11px] md:max-lg:text-xs font-semibold uppercase tracking-wider text-brand-gray/80 md:max-lg:text-brand-black/70 leading-relaxed max-w-24 md:max-lg:max-w-28">
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );

  const Actions = (
    <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4 pt-4">
      <Link
        href={primaryLink}
        className="group/cta inline-flex items-center justify-center gap-2 h-13 px-8 rounded-full bg-brand-black hover:bg-goat-primary text-white font-bold text-sm shadow-md transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goat-primary focus-visible:ring-offset-2"
      >
        {primaryText}
        <ArrowRight
          size={17}
          className="transition-transform duration-300 group-hover/cta:translate-x-1"
        />
      </Link>
      <Link
        href={secondaryLink}
        className="inline-flex items-center min-h-11 text-sm font-semibold text-brand-black hover:text-goat-primary transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goat-primary focus-visible:ring-offset-2 rounded-sm"
      >
        {secondaryText}
      </Link>
    </div>
  );

  return (
    <section
      aria-labelledby="custom-order-heading"
      className="bg-cream-bg bg-(image:--custom-bg-mobile) md:bg-(image:--custom-bg-tablet) lg:bg-(image:--custom-bg) bg-cover bg-center bg-no-repeat border-y border-brand-border overflow-hidden"
      style={
        {
          "--custom-bg": bgImage ? `url(${bgImage})` : "none",
          "--custom-bg-tablet": bgImageTablet ? `url(${bgImageTablet})` : "none",
          "--custom-bg-mobile": bgImageMobile ? `url(${bgImageMobile})` : "none",
        } as React.CSSProperties
      }
    >
      {/* ===== Mobile: centered editorial stack + horizontal showcase (no benefit row) ===== */}
      <div className="block md:hidden px-4 py-12 space-y-8">
        <div className="space-y-5 animate-in fade-in duration-700">
          {Eyebrow}
          <div className="space-y-3">
            {Headline}
            {Divider}
            {Description}
          </div>
          {Actions}
        </div>

        {/* Slow infinite carousel of custom creations */}
        <div className="-mx-4">
          <CustomOrderGallery orientation="horizontal" items={galleryItems} />
        </div>
      </div>

      {/* ===== Tablet: content + horizontal showcase ===== */}
      <div className="hidden md:block lg:hidden px-4 md:px-6 py-14 space-y-8">
        {/* Soft cream panel keeps the copy readable over the background image */}
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-700 rounded-3xl bg-cream-bg/85 backdrop-blur-sm px-8 py-10">
          {Eyebrow}
          <div className="space-y-3">
            {Headline}
            {Divider}
            {Description}
          </div>
          {ValuePoints}
          {Actions}
        </div>

        {/* Single slow infinite carousel of custom creations */}
        <div className="-mx-4 md:-mx-6">
          <CustomOrderGallery orientation="horizontal" items={galleryItems} />
        </div>
      </div>

      {/* ===== Desktop: 45/55 editorial split ===== */}
      <div className="hidden lg:flex relative w-full h-120 xl:h-130 max-w-7xl mx-auto">
        {/* Left 45% — editorial content, vertically centered */}
        <div className="w-[45%] h-full flex items-center justify-center px-8 xl:px-12 py-10">
          <div className="max-w-xl mx-auto space-y-5 animate-in fade-in duration-700">
            {Eyebrow}
            <div className="space-y-3">
              {Headline}
              {Divider}
              {Description}
            </div>
            {ValuePoints}
            {Actions}
          </div>
        </div>

        {/* Right 55% — staggered columns scrolling in alternating directions */}
        <div className="relative w-[55%] h-full py-5 pr-6 xl:pr-8">
          <CustomOrderGallery orientation="vertical" items={galleryItems} />
        </div>
      </div>
    </section>
  );
}
