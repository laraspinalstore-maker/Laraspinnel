import React from "react";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Above-fold: static imports — rendered immediately, no deferred bundle
import HeroSlider from "@/components/home/HeroSlider";
import ShopByCategory from "@/components/home/ShopByCategory";

// Near-fold text marquee with SSR for no layout shift
import dynamic from "next/dynamic";
const TextMarquee = dynamic(() => import("@/components/home/TextMarquee"), { ssr: true });

import BestSellers from "@/components/home/BestSellers";
import CustomOrderBanner from "@/components/home/CustomOrderBanner";
import BelowFoldSections from "@/components/home/BelowFoldSections";

import { connectToDatabase } from "@/lib/db";
import Banner from "@/models/Banner";
import SiteSettings from "@/models/SiteSettings";
import type { BannerDTO } from "@/lib/data/types";
import type { Types } from "mongoose";

/**
 * The banner fields this page reads, as a `.lean()` document. `_id` is an
 * ObjectId and the optional fields are genuinely absent on older rows, which is
 * why every one of them is defaulted below before being handed to a client
 * component.
 */
interface LeanBanner {
  _id: Types.ObjectId;
  imageUrl: string;
  headline: string;
  subtext?: string;
  buttonText?: string;
  buttonLink?: string;
  buttonTheme?: string;
}

import JsonLd from "@/lib/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { webPageNode } from "@/lib/seo/schema";

export const revalidate = 60; // Revalidate every 60 seconds

const DESCRIPTION =
  "Buy beautiful handcrafted crochet flower bouquets, custom frames, baby amigurumi plushies, keychains, and gift hampers from Lara's Pinnal, Tamil Nadu.";

export const metadata: Metadata = buildMetadata({
  // `titleAbsolute` because this title already leads with the brand; letting the
  // root template append " | Lara's Pinnal" would say it twice.
  titleAbsolute: "Lara's Pinnal | Handcrafted Crochet Gifts & Flowers in Tamil Nadu",
  description: DESCRIPTION,
  path: "/",
  ogDescription:
    "Order premium milk cotton yarn crochet gifts, hand-knitted with love. Unique flower bouquets, plushies, keychains, and custom hampers. Shipped across India.",
  twitterDescription:
    "Buy original handmade crochet items and customized gifts from Lara's Pinnal, Tamil Nadu.",
  // No `images`: the OG image comes from app/opengraph-image.tsx. This used to
  // point at an images.unsplash.com stock photo — a third-party URL representing
  // the brand in every social share, which would also break the moment Unsplash
  // changed it.
});

export default async function HomePage() {
  await connectToDatabase();

  let initialBanners: BannerDTO[] = [];
  try {
    const dbBanners = await Banner.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean<LeanBanner[]>();
    initialBanners = dbBanners.map((b) => ({
      _id: b._id.toString(),
      imageUrl: b.imageUrl,
      headline: b.headline,
      subtext: b.subtext || "",
      buttonText: b.buttonText || "",
      buttonLink: b.buttonLink || "",
      buttonTheme: b.buttonTheme || "green",
    }));
  } catch (err) {
    console.error("Failed to load initial banners", err);
  }

  const allSettings: Record<string, string> = {};
  try {
    const settingsList = await SiteSettings.find({}).lean<{ key: string; value?: string }[]>();
    settingsList.forEach((s) => {
      allSettings[s.key] = s.value ?? "";
    });
  } catch (err) {
    console.error("Failed to load settings", err);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      {/* Scroll-aware sticky Navbar */}
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1">
        {/* The page's <h1> is the first HeroSlider headline — the largest text on
            the page and the thing the page is actually about. An sr-only <h1>
            used to sit here, which meant the dominant headline was only an <h2>. */}

        {/* Visually hidden data table for AI Citability & SEO structured extraction */}
        <table className="sr-only">
          <caption>Lara&apos;s Pinnal Services & Offerings</caption>
          <thead>
            <tr>
              <th scope="col">Product / Category</th>
              <th scope="col">Key Highlights</th>
              <th scope="col">Availability</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Crochet Flower Bouquets</td>
              <td>Lavender, Rose, Lily, Sunflower forever bouquets</td>
              {/* Was "All Districts in Tamil Nadu", which contradicted the
                  Pan-India claim on the next row and everywhere else on the
                  site. Checkout accepts any Indian PIN code, so Pan-India is the
                  accurate one. */}
              <td>Pan-India Shipping Available</td>
            </tr>
            <tr>
              <td>Personalized Frames & Hampers</td>
              <td>Photo + crochet combination, baby shower boxes</td>
              <td>Pan-India Shipping Available</td>
            </tr>
            <tr>
              <td>Cute Keychains & Accessories</td>
              <td>Avocados, bees, totes, clips under ₹999</td>
              <td>Ready to Ship in 2-4 days</td>
            </tr>
          </tbody>
        </table>

        {/* Hero Banner Slider */}
        <HeroSlider initialBanners={initialBanners} />

        {/* Marquee — all viewports */}
        <TextMarquee
          items={[
            { label: "100% Handmade", icon: "hand" },
            { label: "Custom Made", icon: "palette" },
            { label: "Premium Yarn", icon: "gem" },
            { label: "Baby-Friendly", icon: "baby" },
            { label: "Secure Shipping", icon: "truck" },
          ]}
          bgColor="bg-brand-light-gray"
          textColor="text-brand-black"
          dividerColor="text-brand-black/20"
        />

        {/* Shop by Category cards */}
        <ShopByCategory settings={allSettings} />

        {/* Popular Best Sellers Section */}
        <BestSellers />

        {/* Custom Orders — single editorial campaign banner (admin-managed) */}
        <CustomOrderBanner settings={allSettings} />

        {/* Below-fold sections */}
        <BelowFoldSections />
      </main>

      {/* Footer block */}
      <Footer />

      <JsonLd
        graph={[
          webPageNode({
            path: "/",
            name: "Lara's Pinnal — Handcrafted Crochet Gifts & Flowers",
            description: DESCRIPTION,
          }),
        ]}
      />
    </div>
  );
}
