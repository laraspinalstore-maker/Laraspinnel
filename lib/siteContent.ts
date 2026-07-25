/**
 * Single source of truth for editable site CONTENT that lives in the
 * SiteSettings key/value store.
 *
 * - `CONTENT_DEFAULTS` holds defaults for content keys that the admin CMS
 *   introduced (Home "Why Choose"/CTA, Footer lists, etc.). Both the admin
 *   editor and the public components read these so they never disagree.
 * - List-type content (footer links, why-choose steps, marquee items) is
 *   stored as a JSON string in a single settings value and parsed with
 *   `parseList`.
 */

export interface LinkItem {
  label: string;
  href: string;
}
export interface WhyStep {
  title: string;
  desc: string;
}
export interface PromoCard {
  imageUrl: string;
  title: string;
  buttonText: string;
  buttonLink: string;
  bgColor: string;
}
export interface PromoCardColorOption {
  key: string;
  label: string;
  className: string;
}
export interface CustomGalleryItem {
  src: string;
  alt: string;
}

/* ---- Home: "Why Choose Us" steps (icons are fixed in the component by index) ---- */
export const DEFAULT_WHY_STEPS: WhyStep[] = [
  { title: "Handmade with Love", desc: "100% hand-knitted creations with meticulous care and passion." },
  { title: "Premium Quality", desc: "Made with premium, hypoallergenic milk cotton yarn." },
  { title: "Customized Gifts", desc: "We customize colors, names, and patterns for you." },
  { title: "Fast Delivery", desc: "Reliable and safe delivery across Tamil Nadu." },
  { title: "Affordable Pricing", desc: "Transparent prices direct from our local crochet artist." },
];

/* ---- Home: below-fold marquee items ---- */
export const DEFAULT_MARQUEE_ITEMS: string[] = [
  "Crochet Bouquets",
  "Custom Frames",
  "Baby Plushies",
  "Desk Decor",
  "Keychains",
  "Festive Rakhis",
  "Gifts Under ₹999",
];

/* ---- Home: Promo Showcase rotating cards (below Testimonials) ---- */
export const PROMO_CARD_COLORS: PromoCardColorOption[] = [
  { key: "goat", label: "Sage Green", className: "bg-goat-primary" },
  { key: "gold", label: "Golden Cream", className: "bg-gold-primary" },
  { key: "mutton", label: "Terracotta", className: "bg-mutton-primary" },
  { key: "rose", label: "Blush Rose", className: "bg-rose-primary" },
  { key: "brown", label: "Cocoa Brown", className: "bg-brown-primary" },
];

export function getPromoCardColorClass(key: string): string {
  return (
    PROMO_CARD_COLORS.find((c) => c.key === key)?.className ??
    PROMO_CARD_COLORS[0].className
  );
}

// Hex values for the same 5 theme colors above — for spots (like the footer
// banner's decoration overlay) that need an actual color value rather than a
// Tailwind background class, e.g. for border/text colors mixed with opacity.
export const THEME_ACCENT_HEX: Record<string, string> = {
  goat: "#8FA88A",
  gold: "#C9A15A",
  mutton: "#C1622D",
  rose: "#D98E97",
  brown: "#6B4A2E",
};

export function getThemeAccentHex(key: string): string {
  return THEME_ACCENT_HEX[key] ?? THEME_ACCENT_HEX.goat;
}

export const DEFAULT_PROMO_CARDS: PromoCard[] = [
  {
    imageUrl: "/placeholder-goat.jpg",
    title: "Crochet Flower Bouquets",
    buttonText: "Buy Now",
    buttonLink: "/shop?category=bouquets",
    bgColor: "goat",
  },
  {
    imageUrl: "/placeholder-mutton.jpg",
    title: "Custom Crochet Frames",
    buttonText: "Buy Now",
    buttonLink: "/shop?category=customized-frames",
    bgColor: "gold",
  },
  {
    imageUrl: "/placeholder-goat.jpg",
    title: "Amigurumi Gift Hampers",
    buttonText: "Buy Now",
    buttonLink: "/shop?category=hampers",
    bgColor: "rose",
  },
];

/* ---- Home: Custom Order banner ---- */
export const DEFAULT_CUSTOM_POINTS: string[] = [
  "Choose Your Colors",
  "Personalized Details",
  "Handmade to Order",
];

// Curated custom creations — Lara's Pinnal catalog photography (ImageKit CDN).
export const DEFAULT_CUSTOM_GALLERY: CustomGalleryItem[] = [
  {
    src: "https://ik.imagekit.io/senra6374/laraspinnal/Crochet_rose_flower_on_stem_202607192151-removebg-preview_6NgeZL4GE.png",
    alt: "Single Pink Rose Stem — custom handmade by Lara's Pinnal",
  },
  {
    src: "https://ik.imagekit.io/senra6374/laraspinnal/Crochet_teddy_bear_on_white_202607192145-removebg-preview_5cLkpFYkW.png",
    alt: "Cute Teddy Bear Amigurumi — custom handmade by Lara's Pinnal",
  },
  {
    src: "https://ik.imagekit.io/senra6374/ragugoatfarm/Baby_shower_gift_hamper_arrangement_202607191703-removebg-preview_d9iZSHF5O.png",
    alt: "Baby Shower Warm Hamper — custom handmade by Lara's Pinnal",
  },
  {
    src: "https://ik.imagekit.io/senra6374/laraspinnal/Crochet_flower_bouquet_lavender___202607192146-removebg-preview_O0_IyzOS2.png",
    alt: "Lavender Crochet Bouquet — custom handmade by Lara's Pinnal",
  },
  {
    src: "https://ik.imagekit.io/senra6374/laraspinnal/Crochet_hair_band_daisy_flower_202607192143-removebg-preview_h3rCfX27-.png",
    alt: "Daisy Flower Hair Band — custom handmade by Lara's Pinnal",
  },
  {
    src: "https://ik.imagekit.io/senra6374/laraspinnal/Crochet_sunflower_coasters_stacked_2K_202607192202-removebg-preview_GEjOlGAlH.png",
    alt: "Desk Sunflower Coaster Set — custom handmade by Lara's Pinnal",
  },
  {
    src: "https://ik.imagekit.io/senra6374/laraspinnal/Crochet_flower_bouquet_pink_lilies_202607192147-removebg-preview_LtUJPk8Yq.png",
    alt: "Pink Lily Bouquet — custom handmade by Lara's Pinnal",
  },
  {
    src: "https://ik.imagekit.io/senra6374/laraspinnal/Wooden_embroidery_hoop_photo_frame_202607192148-removebg-preview_rCFSgzD5l.png",
    alt: "Wooden Hoop Crochet Portrait Frame — custom handmade by Lara's Pinnal",
  },
  {
    src: "https://ik.imagekit.io/senra6374/laraspinnal/Crochet_bunny_plush_sitting_pose_202607192145-removebg-preview_j3Tt7vKMS.png",
    alt: "Pink Bunny Crochet Plush — custom handmade by Lara's Pinnal",
  },
  {
    src: "https://ik.imagekit.io/senra6374/laraspinnal/Crochet_tulip_desk_lamp_2K_202607192202-removebg-preview_fL6jvkQ8E.png",
    alt: "Crochet Tulip Desk Lamp — custom handmade by Lara's Pinnal",
  },
  {
    src: "https://ik.imagekit.io/senra6374/laraspinnal/Crochet_tote_bag_with_daisy_202607192143-removebg-preview_hHYTevl_N.png",
    alt: "Daisy Flower Crochet Tote Bag — custom handmade by Lara's Pinnal",
  },
  {
    src: "https://ik.imagekit.io/senra6374/laraspinnal/Crochet_sunflower_keychain_desk___202607192150-removebg-preview_0tqyzIWZh.png",
    alt: "Smiley Sunflower Keychain Desk Stand — custom handmade by Lara's Pinnal",
  },
];

/* ---- Footer link columns ---- */
export const DEFAULT_FOOTER_QUICKLINKS: LinkItem[] = [
  { label: "Home", href: "/" },
  { label: "Shop Catalog", href: "/shop" },
  { label: "Categories", href: "/categories" },
  { label: "About Us", href: "/about" },
  { label: "Enquiry", href: "/contact" },
  { label: "Track Order", href: "/track-order" },
  { label: "Shopping Cart", href: "/cart" },
];

export const DEFAULT_FOOTER_CATEGORIES: LinkItem[] = [
  { label: "Crochet Bouquets", href: "/shop?category=bouquets" },
  { label: "Customized Frames", href: "/shop?category=customized-frames" },
  { label: "Birthday Gifts", href: "/shop?category=birthday-gifts" },
  { label: "Gift Hampers", href: "/shop?category=hampers" },
  { label: "Cute Keychains", href: "/shop?category=keychains" },
];

/* ---- Footer trust badges ---- */
export const DEFAULT_FOOTER_BADGES: string[] = [
  "100% Handcrafted",
  "Customized Designs",
  "Crafted with Love",
  "Secure Checkout",
];

export const DEFAULT_FOOTER_DISCLAIMER =
  "Since all our products are 100% handcrafted and custom-made, slight variations in yarn shade, shape, and sizing may occur. These are not flaws but signs of authentic handmade art. Product delivery time depends on order complexity and custom details requested. Lara's Pinnal reserves the right to manage stocks and active categories dynamically.";

export const DEFAULT_FOOTER_NOTE = "Made by hand, with passion.";

/**
 * Defaults for content keys OWNED by the CMS (new keys). The admin editor
 * prefills these and the public components fall back to them, so what the
 * admin sees is exactly what renders live.
 */
export const CONTENT_DEFAULTS: Record<string, string> = {
  // Home — Why Choose Us
  home_why_title: "Why Choose Us",
  home_why_subtitle: "Every detail of our handcrafted gifts is designed to bring joy and lasting memories.",
  home_why_steps: JSON.stringify(DEFAULT_WHY_STEPS),
  // Home — Promo Showcase (rotating cards below reviews)
  home_promo_title: "Shop Our Favorites",
  home_promo_subtitle: "Handpicked crochet collections, ready to gift or keep for yourself.",
  // Home — marquee
  home_marquee: JSON.stringify(DEFAULT_MARQUEE_ITEMS),
  // Home — Custom Order banner
  home_custom_enabled: "true",
  home_custom_eyebrow: "Custom Made · Just For You",
  home_custom_heading: "Made by Hand.\nMade for You.",
  home_custom_description:
    "From forever bouquets to meaningful gifts, we create something uniquely yours.",
  home_custom_points: JSON.stringify(DEFAULT_CUSTOM_POINTS),
  home_custom_primary_text: "Start Your Custom Order",
  home_custom_primary_link: "/custom-order",
  home_custom_secondary_text: "View Custom Creations",
  home_custom_secondary_link: "/shop",
  home_custom_bg_image: "/custombg.png",
  home_custom_bg_image_mobile: "/custommobile.png",
  home_custom_gallery: JSON.stringify(DEFAULT_CUSTOM_GALLERY),
  // Footer
  footer_quicklinks: JSON.stringify(DEFAULT_FOOTER_QUICKLINKS),
  footer_categories: JSON.stringify(DEFAULT_FOOTER_CATEGORIES),
  footer_badges: JSON.stringify(DEFAULT_FOOTER_BADGES),
  footer_disclaimer: DEFAULT_FOOTER_DISCLAIMER,
  footer_note: DEFAULT_FOOTER_NOTE,
};

/**
 * Placeholder/hint text shown for content keys that already had public
 * fallbacks before the CMS existed (About/Contact/Home section titles).
 * These fields prefill with the SAVED value only; leaving them blank keeps
 * the built-in public default, so we never overwrite a good default.
 */
export const CONTENT_PLACEHOLDERS: Record<string, string> = {
  home_shop_title: "Handmade Gifts Crafted with Love",
  home_shop_subtitle:
    "Browse our collection of hand-knitted crochet bouquets, customized frames, hampers, and accessories.",
  home_testimonials_eyebrow: "Customer Love",
  home_testimonials_title: "Kind Words From Happy Customers",
  home_testimonials_subtitle:
    "Real messages from customers who made their special moments a little more memorable with Lara's Pinnal.",
  home_stat_1: "500+ Happy Customers",
  home_stat_2: "Ships Across India",
  home_stat_3: "Handmade Quality Guaranteed",
  about_intro_title: "About Lara's Pinnal",
  about_intro_subtitle: "Handcrafting crochet gifts and flowers with love in Villupuram, Tamil Nadu.",
  about_intro_p1: "Tell customers your story — how Lara's Pinnal began and what makes it special.",
  about_intro_p2: "Add a second paragraph about your craft, materials, or mission.",
  about_why_title: "Why Choose Lara's Pinnal?",
  about_why_subtitle: "What sets your handmade gifts apart.",
  about_why_1_title: "Handmade with Love",
  about_why_1_desc: "Describe your first key strength.",
  about_why_2_title: "Fully Customizable Gifts",
  about_why_2_desc: "Describe your second key strength.",
  about_why_3_title: "Safe Pan-India Delivery",
  about_why_3_desc: "Describe your third key strength.",
  about_stat_1_val: "500+",
  about_stat_1_label: "Gifts Handmade",
  about_stat_2_val: "100%",
  about_stat_2_label: "Handcrafted",
  about_stat_3_val: "4.9★",
  about_stat_3_label: "Happy Customers",
  about_stat_4_val: "Pan-India",
  about_stat_4_label: "Delivery",
  contact_phone: "+91 9442379832",
  contact_whatsapp: "+91 9442379832",
  contact_email: "you@example.com",
  contact_address: "Your studio address",
  business_hours: "Monday - Sunday: 9:00 AM - 9:00 PM",
  contact_map_url: "Google Maps embed URL",
  social_facebook: "https://facebook.com/...",
  social_instagram: "https://instagram.com/...",
  social_youtube: "https://youtube.com/...",
  social_x: "https://x.com/...",
};

/** Safely parse a JSON-array settings value, falling back to a default array. */
export function parseList<T>(value: string | undefined | null, fallback: T[]): T[] {
  if (!value || !value.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}
