"use client";

import React from "react";
import dynamic from "next/dynamic";
import { MotionConfig } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useSettings } from "@/hooks/useSettings";

import StorySection from "@/components/about/StorySection";
import ReelsSection from "@/components/about/ReelsSection";
import FinalCTA from "@/components/about/FinalCTA";

/* About page's own review section — admin-uploaded review images */
const AboutReviews = dynamic(() => import("@/components/about/AboutReviews"), {
  ssr: false,
  loading: () => <div className="min-h-75 bg-white animate-pulse" />,
});

export default function AboutPage() {
  const { settings } = useSettings();

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      {/* Navigation Bar */}
      <Navbar />

      <MotionConfig reducedMotion="user">
        <main id="main-content" tabIndex={-1} className="flex-1 bg-white">
          {/* Accessible H1 Heading for SEO */}
          <h1 className="sr-only">About Lara&apos;s Pinnal — Handmade Crochet Gifts & Flowers, Villupuram</h1>

          {/* 1 · Our Story: How It All Began */}
          <StorySection settings={settings} />

          {/* 2 · Behind Every Stitch — Reels Video Carousel */}
          <ReelsSection settings={settings} />

          {/* 3 · Customer Love — uploaded review images */}
          <AboutReviews />

          {/* 4 · Closing Custom Order Banner */}
          <FinalCTA />
        </main>
      </MotionConfig>

      {/* Footer */}
      <Footer />
    </div>
  );
}
