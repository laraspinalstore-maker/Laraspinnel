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

export const revalidate = 60; // Revalidate every 60 seconds

export const metadata: Metadata = {
  title: "Lara's Pinnal | Handcrafted Crochet Gifts & Flowers in Tamil Nadu",
  description:
    "Buy beautiful handcrafted crochet flower bouquets, custom frames, baby amigurumi plushies, keychains, and gift hampers from Lara's Pinnal, Tamil Nadu.",
  keywords: [
    "crochet bouquet online India",
    "handmade gifts Chennai",
    "crochet flowers Tamil Nadu",
    "customized frames gifts",
    "personalized amigurumi plushies",
    "crochet keychain online buy",
    "handmade hampers birthday",
    "crochet Rakhi online",
    "gifts under 999 online",
    "crochet corner Tamil Nadu",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Lara's Pinnal | Handcrafted Crochet Gifts & Flowers",
    description:
      "Order premium milk cotton yarn crochet gifts, hand-knitted with love. Unique flower bouquets, plushies, keychains, and custom hampers. Delivery across Tamil Nadu.",
    type: "website",
    locale: "en_IN",
    siteName: "Lara's Pinnal",
    url: "/",
    images: [
      {
        url: "https://images.unsplash.com/photo-1596436889106-be35e843f974?w=1200&auto=format&fit=crop&q=80",
        width: 1200,
        height: 630,
        alt: "Lara's Pinnal Crochet Bouquet",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lara's Pinnal | Handcrafted Crochet Gifts & Flowers",
    description:
      "Buy original handmade crochet items and customized gifts from Lara's Pinnal, Tamil Nadu.",
  },
};

export default async function HomePage() {
  await connectToDatabase();

  let initialBanners: any[] = [];
  try {
    const dbBanners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean();
    initialBanners = dbBanners.map((b: any) => ({
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

  let allSettings: Record<string, string> = {};
  try {
    const settingsList = await SiteSettings.find({}).lean();
    settingsList.forEach((s: any) => {
      allSettings[s.key] = s.value;
    });
  } catch (err) {
    console.error("Failed to load settings", err);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      {/* Scroll-aware sticky Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* Visually hidden H1 for SEO */}
        <h1 className="sr-only">Lara's Pinnal - Handcrafted Crochet Gifts & Flowers</h1>
        
        {/* Visually hidden data table for AI Citability & SEO structured extraction */}
        <table className="sr-only">
          <caption>Lara's Pinnal Services & Offerings</caption>
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
              <td>All Districts in Tamil Nadu</td>
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
    </div>
  );
}
