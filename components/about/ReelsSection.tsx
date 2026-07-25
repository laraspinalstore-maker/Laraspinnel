"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Play, Pause, ExternalLink } from "lucide-react";
import { FaInstagram } from "react-icons/fa6";
import { motion } from "framer-motion";
import { parseList, DEFAULT_CUSTOM_GALLERY } from "@/lib/siteContent";
import Reveal from "./Reveal";
import { FloralDoodle } from "./AboutHero";

export interface AboutReel {
  title: string;
  videoUrl: string;
  posterUrl?: string;
  duration?: string;
}

const DEFAULT_REELS: AboutReel[] = [
  {
    title: "Making a Crochet Bouquet",
    videoUrl: "",
    posterUrl: DEFAULT_CUSTOM_GALLERY[3]?.src,
    duration: "0:15",
  },
  {
    title: "Custom Bunny In Progress",
    videoUrl: "",
    posterUrl: DEFAULT_CUSTOM_GALLERY[1]?.src,
    duration: "0:15",
  },
  {
    title: "Packaging Your Orders",
    videoUrl: "",
    posterUrl: DEFAULT_CUSTOM_GALLERY[2]?.src,
    duration: "0:12",
  },
  {
    title: "Sunflower Bouquet Creation",
    videoUrl: "",
    posterUrl: DEFAULT_CUSTOM_GALLERY[5]?.src,
    duration: "0:20",
  },
  {
    title: "Crochet Flower Making",
    videoUrl: "",
    posterUrl: DEFAULT_CUSTOM_GALLERY[0]?.src,
    duration: "0:15",
  },
];

function ReelCard({
  reel,
  index,
  instagram,
  onPlayingChange,
  allowInstagramFallback = false,
}: {
  reel: AboutReel;
  index: number;
  instagram?: string;
  onPlayingChange?: (playing: boolean) => void;
  /** Only the built-in placeholder cards link out to Instagram; admin reels must play in place */
  allowInstagramFallback?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  /* When the raw upload can't be decoded (e.g. iPhone .MOV/HEVC), retry once
     through ImageKit's MP4 transcode before giving up. */
  const [srcOverride, setSrcOverride] = useState("");
  const [failed, setFailed] = useState(false);
  const playingRef = useRef(false);

  const videoSrc = srcOverride || reel.videoUrl;

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !started) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) el.pause();
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  // Resume playback after an on-error source swap
  useEffect(() => {
    if (!srcOverride || !started) return;
    const el = videoRef.current;
    if (!el) return;
    el.load();
    el.play().catch(() => {});
  }, [srcOverride, started]);

  const setPlayState = (next: boolean) => {
    if (playingRef.current !== next) {
      playingRef.current = next;
      onPlayingChange?.(next);
    }
    setPlaying(next);
  };

  const handleVideoError = () => {
    if (!srcOverride && videoSrc.includes("ik.imagekit.io")) {
      const sep = videoSrc.includes("?") ? "&" : "?";
      setSrcOverride(`${videoSrc}${sep}tr=f-mp4`);
      return;
    }
    setFailed(true);
    setPlayState(false);
  };

  const toggle = () => {
    if (!reel.videoUrl || failed) {
      if (allowInstagramFallback && instagram) window.open(instagram, "_blank");
      return;
    }
    const el = videoRef.current;
    if (!el) return;
    if (!started) setStarted(true);
    // src is always set (preload="none" keeps it cheap), so play() works on the first tap
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  return (
    <div className="relative w-52 sm:w-56 md:w-60 lg:w-64 shrink-0 aspect-9/16 rounded-3xl overflow-hidden border border-brand-border bg-white shadow-card group">
      {reel.posterUrl && (
        <Image
          src={reel.posterUrl}
          alt={reel.title}
          fill
          sizes="(max-width: 768px) 208px, 256px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      {reel.videoUrl && !failed && (
        <video
          ref={videoRef}
          /* #t=0.001 nudges browsers to paint the first frame instead of a blank box */
          src={`${videoSrc}#t=0.001`}
          poster={reel.posterUrl || undefined}
          playsInline
          preload="metadata"
          onPlay={() => setPlayState(true)}
          onPause={() => setPlayState(false)}
          onEnded={() => setPlayState(false)}
          onError={handleVideoError}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {failed && (
        <p className="absolute inset-x-4 top-[28%] text-center text-[11px] font-semibold text-brand-gray">
          Video can&apos;t be played in this browser — try re-uploading it as MP4.
        </p>
      )}
      {!reel.videoUrl && !allowInstagramFallback && (
        <p className="absolute inset-x-4 top-[28%] text-center text-[11px] font-semibold text-brand-gray">
          No video uploaded for this reel yet.
        </p>
      )}

      {/* Legibility gradient */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
      <div className="absolute bottom-4 left-4 right-4 pointer-events-none space-y-1">
        <p className="text-white text-xs font-bold leading-snug drop-shadow-sm">
          {reel.title}
        </p>
        {reel.duration && (
          <p className="flex items-center gap-1 text-white/80 text-[10px] font-semibold">
            <Play size={9} aria-hidden /> {reel.duration}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? `Pause ${reel.title}` : `Play ${reel.title}`}
        className="absolute inset-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
      >
        <span
          className={`w-12 h-12 rounded-full bg-white/90 text-brand-black flex items-center justify-center shadow-md transition-all duration-300 ${
            playing ? "opacity-0 group-hover:opacity-100 scale-90" : "opacity-100 group-hover:scale-110"
          }`}
        >
          {playing ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5 text-brand-black" />}
        </span>
      </button>
    </div>
  );
}

export default function ReelsSection({ settings }: { settings: Record<string, string> }) {
  const configured = parseList<AboutReel>(settings.about_reels, []);
  const reels = configured.length > 0 ? configured : DEFAULT_REELS;
  const instagram = settings.social_instagram || "https://instagram.com";
  const [isHovered, setIsHovered] = useState(false);
  /* Ticker pauses while any reel is playing so the card doesn't scroll away mid-watch */
  const [activePlays, setActivePlays] = useState(0);
  const handlePlayingChange = (playing: boolean) =>
    setActivePlays((c) => Math.max(0, c + (playing ? 1 : -1)));

  const isPaused = isHovered || activePlays > 0;

  // Triple items for 100% infinite continuous marquee ticker
  const tickerItems = [...reels, ...reels, ...reels];

  return (
    <section className="bg-white py-16 md:py-24 border-b border-brand-border/40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-10">
        {/* Header */}
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 text-center md:text-left">
            <div className="max-w-xl space-y-2 mx-auto md:mx-0">
              <div className="flex items-center justify-center md:justify-start">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-goat-primary">
                  BEHIND EVERY STITCH
                </span>
                <FloralDoodle />
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-brand-black tracking-wide text-balance">
                A Glimpse Into Our World
              </h2>
              <p className="text-sm font-medium text-brand-gray">
                From the first stitch to the final touch — here&apos;s how your favorite creations come to life.
              </p>
            </div>
            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="self-center md:self-auto inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-text hover:text-rose-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-black rounded-md px-2 py-1 whitespace-nowrap"
              >
                Watch on Instagram <FaInstagram size={14} /> <ExternalLink size={12} />
              </a>
            )}
          </div>
        </Reveal>

        {/* 100% Infinite Moving Video Ticker Animation */}
        <Reveal>
          <div
            className="relative w-full overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Subtle edge fades */}
            <div className="absolute left-0 top-0 bottom-0 w-3 md:w-5 bg-linear-to-r from-white/40 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-3 md:w-5 bg-linear-to-l from-white/40 to-transparent z-10 pointer-events-none" />

            <motion.div
              animate={isPaused ? { x: undefined } : { x: ["0%", "-33.333%"] }}
              transition={{
                ease: "linear",
                duration: 25,
                repeat: Infinity,
              }}
              className="flex gap-4 md:gap-6 w-max py-2"
            >
              {tickerItems.map((reel, i) => (
                <ReelCard
                  key={`${reel.title}-${i}`}
                  reel={reel}
                  index={i}
                  instagram={instagram}
                  onPlayingChange={handlePlayingChange}
                  allowInstagramFallback={configured.length === 0}
                />
              ))}
            </motion.div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
