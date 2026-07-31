"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSettings } from "@/hooks/useSettings";
import { getThemeAccentHex } from "@/lib/siteContent";
import { hexToRgba } from "@/lib/utils";
import FloatingPaper from "./FloatingPaper";
import Sprinkles from "./Sprinkles";
import { motion } from "framer-motion";

const CARD_CLASSES =
  "relative w-full overflow-hidden rounded-[2rem] bg-brand-light-gray ring-1 ring-primary/15 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-700 ease-out group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)]";

function CardDecoration({ colorHex }: { colorHex: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Full inner box effect */}
      <div
        className="absolute inset-3 border-2 rounded-2xl opacity-80"
        style={{ borderColor: colorHex }}
      />
      
      {/* Corner Accents */}
      <div
        className="absolute top-4 left-4 w-12 h-12 border-t-[3px] border-l-[3px] rounded-tl-2xl"
        style={{ borderColor: colorHex }}
      />
      <div
        className="absolute bottom-4 right-4 w-12 h-12 border-b-[3px] border-r-[3px] rounded-br-2xl"
        style={{ borderColor: colorHex }}
      />
      <div
        className="absolute top-4 right-4 w-6 h-6 border-t-[3px] border-r-[3px] rounded-tr-xl"
        style={{ borderColor: colorHex }}
      />
      <div
        className="absolute bottom-4 left-4 w-6 h-6 border-b-[3px] border-l-[3px] rounded-bl-xl"
        style={{ borderColor: colorHex }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border"
        style={{ borderColor: colorHex }}
      />
      <span className="absolute top-5 right-6 text-xl drop-shadow-sm rotate-12" style={{ color: colorHex }}>
        ✦
      </span>
      <span className="absolute bottom-6 left-8 text-base drop-shadow-sm -rotate-6" style={{ color: colorHex }}>
        ✦
      </span>
      <span className="absolute top-1/3 left-6 text-sm drop-shadow-sm rotate-45" style={{ color: colorHex }}>
        ✦
      </span>
      <span className="absolute bottom-10 right-10 text-sm drop-shadow-sm -rotate-12" style={{ color: colorHex }}>
        ✦
      </span>
    </div>
  );
}

export default function FooterBanner() {
  const { settings } = useSettings();
  const tabletImageUrl = settings.home_footer_banner_image;
  const link = settings.home_footer_banner_link;
  const decorationColor = getThemeAccentHex(settings.home_footer_banner_decoration_color || "brown");
  // Image-only opacity — the card decoration (corner accents/sparkles) always stays fully visible.
  const imageOpacity = Number(settings.home_footer_banner_image_opacity ?? 100) / 100;

  if (!tabletImageUrl) return null;

  const content = (
    <motion.div 
      className="transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.02] group-hover:-translate-y-2 space-y-0 relative perspective-1000"
      initial={{ opacity: 0, scale: 1.1, y: 50, rotateX: 10 }}
      whileInView={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ 
        type: "spring",
        stiffness: 120,
        damping: 15,
        mass: 1.2,
        delay: 0.1
      }}
    >
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative w-full"
      >
        {/* Paper Floating Layer & Sprinkles Layer */}
        <FloatingPaper colorHex={decorationColor} />
        <Sprinkles colorHex={decorationColor} />
        
        {/* Tablet — 4:3, admin-uploaded image (mobile shows TrackOrderCard instead) */}
      <div className={`aspect-[4/3] ${CARD_CLASSES}`}>
        <Image
          src={tabletImageUrl}
          alt="Promotional banner"
          fill
          sizes="1200px"
          className="object-cover"
          style={{ opacity: imageOpacity }}
        />
        <CardDecoration colorHex={decorationColor} />
      </div>
      </motion.div>
    </motion.div>
  );

  return (
    <section className="relative overflow-hidden py-12 md:py-16 bg-white hidden sm:block lg:hidden">
      <div className="relative max-w-7xl mx-auto px-4 md:px-6">
        {link ? (
          <Link href={link} className="block group">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
    </section>
  );
}
