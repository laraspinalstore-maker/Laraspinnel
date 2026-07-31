import mongoose from "mongoose";
import Banner from "../models/Banner";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

const defaultBanners = [
  {
    imageUrl: "/logo.png",
    headline: "Handmade Crochet Gifts, Delivered Across India",
    subtext: "Crochet flower bouquets, custom frames, and amigurumi plush — hand-knitted with love.",
    buttonText: "Explore Gifts",
    buttonLink: "/shop",
    buttonTheme: "green",
    order: 1,
    isActive: true,
  },
  {
    imageUrl: "/logo.png",
    headline: "Custom Crochet Bouquets, Made to Order",
    subtext: "Premium milk cotton yarn, crafted into keepsakes for every occasion.",
    buttonText: "Explore Bouquets",
    buttonLink: "/shop?category=bouquets",
    buttonTheme: "red",
    order: 2,
    isActive: true,
  }
];

async function seedBanners() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected to MongoDB");

    await Banner.deleteMany({});
    console.log("Cleared existing banners");

    await Banner.insertMany(defaultBanners);
    console.log("Seeded default banners successfully!");

    process.exit(0);
  } catch (error) {
    console.error("Failed to seed banners:", error);
    process.exit(1);
  }
}

seedBanners();
