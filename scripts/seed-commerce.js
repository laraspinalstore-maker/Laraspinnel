const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Load .env.local manually without external dependencies
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const value = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
        process.env[key] = value;
      }
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Please define the MONGODB_URI environment variable inside .env.local");
  process.exit(1);
}

// Inline schemas for seeding (independent of TypeScript models)
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  description: { type: String, required: true },
  images: { type: [String], default: [] },
  stock: { type: Number, required: true, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, required: true }
});

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  notes: { type: String },
  items: [OrderItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"],
    default: "pending"
  }
}, { timestamps: true });

const SiteSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, default: "" }
}, { timestamps: true });

const TestimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  goal: { type: String, required: true },
  outcome: { type: String, required: true },
  initial: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
  refId: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
const SiteSettings = mongoose.models.SiteSettings || mongoose.model("SiteSettings", SiteSettingsSchema);
const Testimonial = mongoose.models.Testimonial || mongoose.model("Testimonial", TestimonialSchema);

const BannerSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  headline: { type: String, required: true },
  subtext: { type: String },
  buttonText: { type: String },
  buttonLink: { type: String },
  buttonTheme: { type: String, default: "green" },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Banner = mongoose.models.Banner || mongoose.model("Banner", BannerSchema);

const bannersData = [
  {
    imageUrl: "https://images.unsplash.com/photo-1596436889106-be35e843f974?w=1600&auto=format&fit=crop&q=80",
    headline: "Handmade Gifts Crafted with Love",
    subtext: "Unique customized crochet flower bouquets, frames, and plush toys that last forever.",
    buttonText: "Shop Collection",
    buttonLink: "/shop",
    buttonTheme: "green",
    order: 1,
    isActive: true
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1600&auto=format&fit=crop&q=80",
    headline: "Personalized Gifts for Every Occasion",
    subtext: "Celebrate special days with customized frames, hampers, and keychains hand-knitted just for you.",
    buttonText: "Browse Categories",
    buttonLink: "/categories",
    buttonTheme: "red",
    order: 2,
    isActive: true
  }
];

const categoriesData = [
  {
    name: "Bouquets",
    slug: "bouquets",
    description: "Beautifully handcrafted crochet flower bouquets that last forever.",
    image: "https://images.unsplash.com/photo-1596436889106-be35e843f974?w=500&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    name: "Customized Frames",
    slug: "customized-frames",
    description: "Unique personalized frames combining photos and crochet art.",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    name: "Birthday Gifts",
    slug: "birthday-gifts",
    description: "Adorable crochet plushies and cards for celebrating special days.",
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    name: "Home & Desk Decor",
    slug: "home-desk-decor",
    description: "Coasters, plant holders, and decorative accessories to brighten spaces.",
    image: "https://images.unsplash.com/photo-1545128485-c400e7702796?w=500&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    name: "Keychains",
    slug: "keychains",
    description: "Cute miniature crochet keychains for bags, keys, and gifts.",
    image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=500&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    name: "Hampers",
    slug: "hampers",
    description: "Curated gift hampers filled with premium handmade items.",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "Handcrafted hair clips, headbands, bags, and bookmarks.",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    name: "Rakhi",
    slug: "rakhi",
    description: "Special crochet Rakhis made with love and thread for brothers.",
    image: "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=500&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    name: "Gifts Under ₹999",
    slug: "gifts-under-999",
    description: "Affordable and highly customized tiny crochet gifts.",
    image: "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=500&auto=format&fit=crop&q=80",
    isActive: true
  }
];

const productsData = [
  // Bouquets
  {
    name: "Lavender Crochet Bouquet",
    slug: "lavender-crochet-bouquet",
    categorySlug: "bouquets",
    price: 1250,
    discountPrice: 999,
    description: "A calming lavender crochet flower bouquet wrapped in premium tissue. Handcrafted using premium soft milk cotton yarn.",
    images: ["https://images.unsplash.com/photo-1596436889106-be35e843f974?w=600&auto=format&fit=crop&q=80"],
    stock: 15,
    isFeatured: true,
    isActive: true
  },
  {
    name: "Pink Lily Bouquet",
    slug: "pink-lily-bouquet",
    categorySlug: "bouquets",
    price: 1500,
    discountPrice: 1299,
    description: "Stunning pink and white crochet lilies paired with green leaves. Elegant design that never fades.",
    images: ["https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&auto=format&fit=crop&q=80"],
    stock: 12,
    isFeatured: true,
    isActive: true
  },
  {
    name: "Sunflowers & Roses Bouquet",
    slug: "sunflowers-roses-bouquet",
    categorySlug: "bouquets",
    price: 1800,
    discountPrice: 1599,
    description: "A cheerful arrangement of bright yellow crochet sunflowers and classic cream roses.",
    images: ["https://images.unsplash.com/photo-1591886960571-74d43a9d4166?w=600&auto=format&fit=crop&q=80"],
    stock: 8,
    isFeatured: true,
    isActive: true
  },
  {
    name: "Red Rose Forever Bouquet",
    slug: "red-rose-forever-bouquet",
    categorySlug: "bouquets",
    price: 999,
    description: "Three handcrafted crimson red roses inside an aesthetic white mesh wrap with a golden ribbon.",
    images: ["https://images.unsplash.com/photo-1596436889106-be35e843f974?w=600&auto=format&fit=crop&q=80"],
    stock: 25,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Tulip Garden Bouquet",
    slug: "tulip-garden-bouquet",
    categorySlug: "bouquets",
    price: 1100,
    description: "Five colorful pastel tulips (pink, yellow, purple, blue, peach) hand-knitted for a bright gift.",
    images: ["https://images.unsplash.com/photo-1520763185298-1b434c919102?w=600&auto=format&fit=crop&q=80"],
    stock: 18,
    isFeatured: false,
    isActive: true
  },

  // Customized Frames
  {
    name: "Couple Portrait Crochet Frame",
    slug: "couple-portrait-crochet-frame",
    categorySlug: "customized-frames",
    price: 2499,
    discountPrice: 1999,
    description: "An elegant custom photo frame adorned with delicate 3D crochet roses and hearts. Ideal anniversary gift.",
    images: ["https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80"],
    stock: 5,
    isFeatured: true,
    isActive: true
  },
  {
    name: "Family Tree Crochet Frame",
    slug: "family-tree-crochet-frame",
    categorySlug: "customized-frames",
    price: 2999,
    description: "Beautifully embroidered family tree with crochet leaves and mini portraits. Highly customizable.",
    images: ["https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=600&auto=format&fit=crop&q=80"],
    stock: 4,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Baby Born Memory Frame",
    slug: "baby-born-memory-frame",
    categorySlug: "customized-frames",
    price: 1800,
    discountPrice: 1650,
    description: "A cute pastel frame featuring crochet baby booties, a rattle, and placeholder spaces for birth stats.",
    images: ["https://images.unsplash.com/photo-1559251606-c623743a6d76?w=600&auto=format&fit=crop&q=80"],
    stock: 7,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Floral Monogram Letter Frame",
    slug: "floral-monogram-letter-frame",
    categorySlug: "customized-frames",
    price: 1599,
    description: "Personalized letter frame decorated with mini crochet flowers and pearls. Excellent birthday gift.",
    images: ["https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80"],
    stock: 10,
    isFeatured: false,
    isActive: true
  },

  // Birthday Gifts
  {
    name: "Cute Teddy Bear Amigurumi",
    slug: "cute-teddy-bear-amigurumi",
    categorySlug: "birthday-gifts",
    price: 899,
    discountPrice: 799,
    description: "Soft brown teddy bear plushie wearing a cute knitted pink hat. Made of premium baby wool.",
    images: ["https://images.unsplash.com/photo-1559251606-c623743a6d76?w=600&auto=format&fit=crop&q=80"],
    stock: 14,
    isFeatured: true,
    isActive: true
  },
  {
    name: "Pink Bunny Crochet Plush",
    slug: "pink-bunny-crochet-plush",
    categorySlug: "birthday-gifts",
    price: 1200,
    discountPrice: 999,
    description: "Adorable fluffy pink bunny plush wearing dungarees. Safe for infants and children.",
    images: ["https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80"],
    stock: 10,
    isFeatured: true,
    isActive: true
  },
  {
    name: "Crochet Cake Ornament",
    slug: "crochet-cake-ornament",
    categorySlug: "birthday-gifts",
    price: 499,
    description: "Mini birthday cake complete with a crochet candle. Fits on a work desk or study table.",
    images: ["https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop&q=80"],
    stock: 20,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Personalized Birthday Card with Mini Bouquet",
    slug: "personalized-birthday-card-mini-bouquet",
    categorySlug: "birthday-gifts",
    price: 350,
    description: "A premium textured greeting card attached with a real miniature crochet tulip stem.",
    images: ["https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80"],
    stock: 30,
    isFeatured: false,
    isActive: true
  },

  // Home & Desk Decor
  {
    name: "Desk Sunflower Coaster Set",
    slug: "desk-sunflower-coaster-set",
    categorySlug: "home-desk-decor",
    price: 650,
    discountPrice: 499,
    description: "A set of 4 sunflower-shaped crochet coasters stored in an aesthetic mini basket pot.",
    images: ["https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&auto=format&fit=crop&q=80"],
    stock: 15,
    isFeatured: true,
    isActive: true
  },
  {
    name: "Mini Crochet Cactus Pot",
    slug: "mini-crochet-cactus-pot",
    categorySlug: "home-desk-decor",
    price: 399,
    description: "A tiny desk cactus that never needs watering. Housed in a cute clay pot.",
    images: ["https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=80"],
    stock: 40,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Hanging Ivy Plant Ornament",
    slug: "hanging-ivy-plant-ornament",
    categorySlug: "home-desk-decor",
    price: 750,
    description: "Crochet hanging vines in a mini pot. Perfect for car dashboards or study rooms.",
    images: ["https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&auto=format&fit=crop&q=80"],
    stock: 12,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Crochet Tulip Desk Lamp",
    slug: "crochet-tulip-desk-lamp",
    categorySlug: "home-desk-decor",
    price: 1899,
    discountPrice: 1499,
    description: "A beautiful LED-integrated desk lamp with crochet tulip petals that illuminate softly.",
    images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80"],
    stock: 6,
    isFeatured: true,
    isActive: true
  },

  // Keychains
  {
    name: "Mini Avocado Keychain",
    slug: "mini-avocado-keychain",
    categorySlug: "keychains",
    price: 250,
    description: "A cute avocado keychain with a 3D seed and smiley face. Hand-knitted with high quality thread.",
    images: ["https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80"],
    stock: 50,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Chubby Bumblebee Keychain",
    slug: "chubby-bumblebee-keychain",
    categorySlug: "keychains",
    price: 299,
    discountPrice: 249,
    description: "Soft crochet yellow bee keychain with tiny wings and key clasp.",
    images: ["https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&auto=format&fit=crop&q=80"],
    stock: 35,
    isFeatured: true,
    isActive: true
  },
  {
    name: "Strawberry Charm Keychain",
    slug: "strawberry-charm-keychain",
    categorySlug: "keychains",
    price: 199,
    description: "Bright red crochet strawberry keychain with green stem and white seeds.",
    images: ["https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&auto=format&fit=crop&q=80"],
    stock: 45,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Boba Milk Tea Keychain",
    slug: "boba-milk-tea-keychain",
    categorySlug: "keychains",
    price: 350,
    description: "Creative crochet bubble tea keychain complete with mini straw and pearls.",
    images: ["https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80"],
    stock: 20,
    isFeatured: false,
    isActive: true
  },

  // Hampers
  {
    name: "Ultimate Love Gift Hamper",
    slug: "ultimate-love-gift-hamper",
    categorySlug: "hampers",
    price: 3499,
    discountPrice: 2999,
    description: "Curated gift box with 1 Rose Bouquet, 1 Heart Keychain, 1 Couple Frame, and gourmet chocolates.",
    images: ["https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80"],
    stock: 5,
    isFeatured: true,
    isActive: true
  },
  {
    name: "Baby Shower Warm Hamper",
    slug: "baby-shower-warm-hamper",
    categorySlug: "hampers",
    price: 2499,
    description: "Includes a crochet baby blanket, bunny rattle plush, booties, and milestone cards.",
    images: ["https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=600&auto=format&fit=crop&q=80"],
    stock: 8,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Cozy Desk Essentials Hamper",
    slug: "cozy-desk-essentials-hamper",
    categorySlug: "hampers",
    price: 1999,
    discountPrice: 1799,
    description: "Includes 1 Tulip Pot, 2 Coasters, 1 Crochet Bookmark, and a personalized message card.",
    images: ["https://images.unsplash.com/photo-1512909006721-3d6018887383?w=600&auto=format&fit=crop&q=80"],
    stock: 10,
    isFeatured: true,
    isActive: true
  },

  // Accessories
  {
    name: "Daisy Flower Crochet Tote Bag",
    slug: "daisy-flower-crochet-tote-bag",
    categorySlug: "accessories",
    price: 1499,
    discountPrice: 1199,
    description: "Aesthetically woven granny-square tote bag decorated with daisy flowers. Highly durable.",
    images: ["https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80"],
    stock: 7,
    isFeatured: true,
    isActive: true
  },
  {
    name: "Crochet Hair Bow Clip Set",
    slug: "crochet-hair-bow-clip-set",
    categorySlug: "accessories",
    price: 299,
    description: "Pack of 3 pastel colored hair bow clips. Made of lightweight milk cotton wool.",
    images: ["https://images.unsplash.com/photo-1576243101635-a5c66024f53c?w=600&auto=format&fit=crop&q=80"],
    stock: 30,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Daisy Flower Hair Band",
    slug: "daisy-flower-hair-band",
    categorySlug: "accessories",
    price: 399,
    description: "Stretchable hair band adorned with a row of five handcrafted white daisies.",
    images: ["https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=600&auto=format&fit=crop&q=80"],
    stock: 25,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Froggy Coin Purse",
    slug: "froggy-coin-purse",
    categorySlug: "accessories",
    price: 450,
    description: "Cute green frog face coin purse with a metal kiss-lock frame. Perfect gift for kids.",
    images: ["https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&auto=format&fit=crop&q=80"],
    stock: 15,
    isFeatured: false,
    isActive: true
  },

  // Rakhi
  {
    name: "Ganesha Crochet Rakhi",
    slug: "ganesha-crochet-rakhi",
    categorySlug: "rakhi",
    price: 250,
    discountPrice: 199,
    description: "A beautifully detailed crochet Ganesha Rakhi thread. Eco-friendly and skin-safe.",
    images: ["https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600&auto=format&fit=crop&q=80"],
    stock: 50,
    isFeatured: true,
    isActive: true
  },
  {
    name: "Krishna Flute Crochet Rakhi",
    slug: "krishna-flute-crochet-rakhi",
    categorySlug: "rakhi",
    price: 250,
    description: "Soft thread Rakhi featuring a yellow crochet peacock feather and flute.",
    images: ["https://images.unsplash.com/photo-1590073844006-33379778ae09?w=600&auto=format&fit=crop&q=80"],
    stock: 40,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Daisy Flower Kids Rakhi",
    slug: "daisy-flower-kids-rakhi",
    categorySlug: "rakhi",
    price: 180,
    description: "Cute daisy flower Rakhi thread specifically sized for kids. Extremely soft.",
    images: ["https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80"],
    stock: 60,
    isFeatured: false,
    isActive: true
  },

  // Gifts Under 999
  {
    name: "Crochet Pocket Heart Hug",
    slug: "crochet-pocket-heart-hug",
    categorySlug: "gifts-under-999",
    price: 199,
    description: "A tiny crochet heart that fits in a pocket, accompanied by a poem card to send warm hugs.",
    images: ["https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80"],
    stock: 100,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Single Pink Rose Stem",
    slug: "single-pink-rose-stem",
    categorySlug: "gifts-under-999",
    price: 350,
    discountPrice: 299,
    description: "A single long-stem pink crochet rose wrapped individually. Perfect small gesture.",
    images: ["https://images.unsplash.com/photo-1591886960571-74d43a9d4166?w=600&auto=format&fit=crop&q=80"],
    stock: 40,
    isFeatured: true,
    isActive: true
  },
  {
    name: "Mini Crochet Whale Plushie",
    slug: "mini-crochet-whale-plushie",
    categorySlug: "gifts-under-999",
    price: 499,
    description: "A palm-sized blue whale amigurumi plush. Perfect desk buddy.",
    images: ["https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80"],
    stock: 30,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Smiley Sunflower Keychain Desk Stand",
    slug: "smiley-sunflower-keychain-desk-stand",
    categorySlug: "gifts-under-999",
    price: 399,
    description: "Smiley yellow sunflower keychain that can also stand on its own mini wooden tripod.",
    images: ["https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=600&auto=format&fit=crop&q=80"],
    stock: 25,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Pink Tulip Bloom Bouquet",
    slug: "pink-tulip-bloom-bouquet",
    categorySlug: "bouquets",
    price: 1350,
    description: "Soft pink crochet tulips arranged in a beautiful paper wrap with ribbon.",
    images: ["https://images.unsplash.com/photo-1520763185298-1b434c919102?w=600&auto=format&fit=crop&q=80"],
    stock: 12,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Wooden Hoop Crochet Portrait Frame",
    slug: "wooden-hoop-crochet-portrait-frame",
    categorySlug: "customized-frames",
    price: 1999,
    discountPrice: 1750,
    description: "Personalized embroidery hoop adorned with premium crochet roses and family name.",
    images: ["https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=600&auto=format&fit=crop&q=80"],
    stock: 8,
    isFeatured: true,
    isActive: true
  },
  {
    name: "Cute Crochet Dino Plushie",
    slug: "cute-crochet-dino-plushie",
    categorySlug: "birthday-gifts",
    price: 1100,
    discountPrice: 950,
    description: "Extremely soft green dinosaur amigurumi plush. Perfect birthday companion.",
    images: ["https://images.unsplash.com/photo-1559251606-c623743a6d76?w=600&auto=format&fit=crop&q=80"],
    stock: 15,
    isFeatured: true,
    isActive: true
  },
  {
    name: "Aesthetic Flower Pot Stand Decor",
    slug: "aesthetic-flower-pot-stand-decor",
    categorySlug: "home-desk-decor",
    price: 890,
    description: "Three mini crochet potted plants (tulip, rose, succulent) set on a small wooden tray.",
    images: ["https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=80"],
    stock: 10,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Mini Peach Charm Keychain",
    slug: "mini-peach-charm-keychain",
    categorySlug: "keychains",
    price: 220,
    description: "Cute miniature peach keychain with green leaf accent and ring clasp.",
    images: ["https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80"],
    stock: 30,
    isFeatured: false,
    isActive: true
  },
  {
    name: "Festive Celebration Gift Hamper",
    slug: "festive-celebration-gift-hamper",
    categorySlug: "hampers",
    price: 2990,
    discountPrice: 2499,
    description: "A luxury woven hamper basket containing 1 tulip bouquet, 2 coasters, and a customized frame.",
    images: ["https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80"],
    stock: 6,
    isFeatured: true,
    isActive: true
  }
];

const mockOrders = [
  {
    orderNumber: "LPO-10021",
    customerName: "Ananya Sen",
    phone: "9876543210",
    address: "Apt 4B, Greenwood Residences, OMR",
    city: "Chennai",
    pincode: "600119",
    notes: "Please pack it nicely for a birthday gift.",
    totalAmount: 1798,
    status: "pending"
  },
  {
    orderNumber: "LPO-10022",
    customerName: "Karthik Raja",
    phone: "9444012345",
    address: "15, Anna Salai, near Post Office",
    city: "Villupuram",
    pincode: "605602",
    notes: "",
    totalAmount: 999,
    status: "confirmed"
  },
  {
    orderNumber: "LPO-10023",
    customerName: "Meera Nair",
    phone: "8123456789",
    address: "Block A-202, Sobha Primrose, Sarjapur Road",
    city: "Bangalore",
    pincode: "560103",
    notes: "Deliver on Friday evening if possible.",
    totalAmount: 1299,
    status: "preparing"
  },
  {
    orderNumber: "LPO-10024",
    customerName: "Senthil Nathan",
    phone: "9442379832",
    address: "50, Mettu Street, Therkunam",
    city: "Villupuram",
    pincode: "604102",
    notes: "Gift for my sister",
    totalAmount: 2498,
    status: "ready"
  },
  {
    orderNumber: "LPO-10025",
    customerName: "Priya Pillai",
    phone: "7890123456",
    address: "12, Beach Road",
    city: "Pondicherry",
    pincode: "605001",
    notes: "Wrap with rose petals if possible",
    totalAmount: 499,
    status: "delivered"
  },
  {
    orderNumber: "LPO-10026",
    customerName: "Rahul Sharma",
    phone: "9988776655",
    address: "Flat 102, Shanti Kunj",
    city: "Coimbatore",
    pincode: "641002",
    notes: "Urgent delivery",
    totalAmount: 1999,
    status: "cancelled"
  },
  // Add 14 more mock orders to satisfy the 20+ requirement
  {
    orderNumber: "LPO-10027",
    customerName: "Vijay Kumar",
    phone: "9000112233",
    address: "88, West Cross Road",
    city: "Trichy",
    pincode: "620002",
    notes: "",
    totalAmount: 1599,
    status: "delivered"
  },
  {
    orderNumber: "LPO-10028",
    customerName: "Sneha Reddy",
    phone: "9122334455",
    address: "G-10, Orchid Towers",
    city: "Madurai",
    pincode: "625001",
    notes: "",
    totalAmount: 1250,
    status: "delivered"
  },
  {
    orderNumber: "LPO-10029",
    customerName: "Ganesh Prasad",
    phone: "9334455667",
    address: "5, Temple View St",
    city: "Kanchipuram",
    pincode: "631501",
    notes: "",
    totalAmount: 799,
    status: "pending"
  },
  {
    orderNumber: "LPO-10030",
    customerName: "Deepa S.",
    phone: "9445566778",
    address: "24, Gandhi Nagar",
    city: "Salem",
    pincode: "636007",
    notes: "Happy Birthday tag requested",
    totalAmount: 1199,
    status: "confirmed"
  },
  {
    orderNumber: "LPO-10031",
    customerName: "Arun Mozhi",
    phone: "9556677889",
    address: "71, Kamaraj Street",
    city: "Erode",
    pincode: "638001",
    notes: "",
    totalAmount: 999,
    status: "preparing"
  },
  {
    orderNumber: "LPO-10032",
    customerName: "Vikram Seth",
    phone: "9667788990",
    address: "10B, Officers Colony",
    city: "Vellore",
    pincode: "632001",
    notes: "",
    totalAmount: 249,
    status: "ready"
  },
  {
    orderNumber: "LPO-10033",
    customerName: "Gayathri Devi",
    phone: "9778899001",
    address: "14, Raja Street",
    city: "Tiruppur",
    pincode: "641604",
    notes: "",
    totalAmount: 1499,
    status: "delivered"
  },
  {
    orderNumber: "LPO-10034",
    customerName: "Bharath W.",
    phone: "9889900112",
    address: "A-50, Industrial Estate",
    city: "Hosur",
    pincode: "635109",
    notes: "",
    totalAmount: 2999,
    status: "delivered"
  },
  {
    orderNumber: "LPO-10035",
    customerName: "Divya R.",
    phone: "9990011223",
    address: "6, Lake View Road",
    city: "Thanjavur",
    pincode: "613007",
    notes: "",
    totalAmount: 399,
    status: "pending"
  },
  {
    orderNumber: "LPO-10036",
    customerName: "Mani Shankar",
    phone: "9080706050",
    address: "18, Netaji Subash St",
    city: "Tirunelveli",
    pincode: "627006",
    notes: "",
    totalAmount: 499,
    status: "confirmed"
  },
  {
    orderNumber: "LPO-10037",
    customerName: "Swetha K.",
    phone: "9040302010",
    address: "9, New Avadi Road",
    city: "Chennai",
    pincode: "600010",
    notes: "",
    totalAmount: 1599,
    status: "preparing"
  },
  {
    orderNumber: "LPO-10038",
    customerName: "Siddharth J.",
    phone: "9566712345",
    address: "Flat 401, Sapphire Palms",
    city: "Chennai",
    pincode: "600096",
    notes: "Leave at door.",
    totalAmount: 1299,
    status: "delivered"
  },
  {
    orderNumber: "LPO-10039",
    customerName: "Abirami T.",
    phone: "9488412345",
    address: "32, South Mada Street",
    city: "Chennai",
    pincode: "600004",
    notes: "",
    totalAmount: 199,
    status: "delivered"
  },
  {
    orderNumber: "LPO-10040",
    customerName: "Harish N.",
    phone: "9159012345",
    address: "10, Car Street",
    city: "Chidambaram",
    pincode: "608001",
    notes: "",
    totalAmount: 450,
    status: "pending"
  }
];

const testimonialsData = [
  {
    name: "Ramesh Kumar",
    location: "Coimbatore, TN",
    goal: "Looking for a unique, customized anniversary gift for my parents.",
    outcome: "Ordered the Couple Portrait Crochet Frame. The craftsmanship is stunning, and it arrived in a beautiful premium gift box. Best handmade gifts store online!",
    initial: "R",
    rating: 5,
    refId: "LPO-10026",
    isActive: true
  },
  {
    name: "Revathi S.",
    location: "Villupuram, TN",
    goal: "Finding a long-lasting aesthetic floral gift for housewarming.",
    outcome: "The Lavender Crochet Bouquet looks so realistic and cozy! My host loved it, and it will stay fresh forever. Will definitely purchase again.",
    initial: "R",
    rating: 5,
    refId: "LPO-10022",
    isActive: true
  },
  {
    name: "Mohamed Asif",
    location: "Tiruppur, TN",
    goal: "Sourcing cute custom keychains for corporate gifting.",
    outcome: "Lara's Pinnal created 30 bumblebee keychains on a tight schedule. Great communication, lovely packaging, and extremely affordable rates.",
    initial: "M",
    rating: 5,
    refId: "LPO-10033",
    isActive: true
  }
];

const settingsData = {
  farm_name: "Lara's Pinnal",
  home_shop_title: "Handmade Gifts Crafted with Love",
  home_shop_subtitle: "Browse our collection of hand-knitted crochet bouquets, customized frames, hampers, and accessories.",
  home_shop_image_1: "https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800&auto=format&fit=crop&q=80",
  home_shop_image_2: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80",
  home_testimonials_title: "Loved by Gift Receivers",
  home_testimonials_subtitle: "Stories of joy from families, friends, and corporate partners who received our handcrafted creations.",
  home_stat_1: "100% Handcrafted",
  home_stat_2: "Customized Gifts",
  home_stat_3: "Premium Wool Materials",
  about_intro_title: "About Lara's Pinnal",
  about_intro_subtitle: "Crafting beautiful crochet products and personalized gifts in Tamil Nadu.",
  about_intro_p1: "At Lara's Pinnal, we believe that the best gifts are the ones made by hand. What started as a passion for knitting and yarn has grown into a premium crochet studio. Located in Tamil Nadu, our team designs and handcrafts unique gifts that help celebrate life's most precious milestones.",
  about_intro_p2: "Whether you need a bouquet of roses that never fades, custom photo frames, adorable amigurumi plushies, or corporate gift hampers, we design each item with meticulous care and high-grade milk cotton wool. Every single stitch represents our passion for quality and craftsmanship.",
  about_intro_image: "https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800&auto=format&fit=crop&q=80",
  about_why_title: "Why Lara's Pinnal?",
  about_why_subtitle: "Every creation is double-checked for durability, aesthetic alignment, and safety.",
  about_why_1_title: "Handmade with Love",
  about_why_1_desc: "100% original hand-stitched crochet work, ensuring no two items are exactly the same, giving each gift a soul.",
  about_why_2_title: "Premium Quality",
  about_why_2_desc: "We use only premium, hypoallergenic milk cotton yarn that is soft to touch, vibrant, and extremely durable.",
  about_why_3_title: "Customized Gifts",
  about_why_3_desc: "We customize colors, letters, shapes, and frames according to your photos and specific requirements.",
  about_stat_1_val: "100%",
  about_stat_1_label: "Hand-Knitted",
  about_stat_2_val: "5,000+",
  about_stat_2_label: "Stitches Per Piece",
  about_stat_3_val: "4.9 ★",
  about_stat_3_label: "Customer Rating",
  about_stat_4_val: "1,500+",
  about_stat_4_label: "Gifts Delivered",
  contact_phone: "+91 9442379832",
  contact_whatsapp: "+91 9442379832",
  contact_email: "senthilragunathan2004@gmail.com",
  contact_address: "50, Mettu Street, Therkunam, Villupuram, Tamil Nadu - 604102",
  business_hours: "Monday - Sunday: 9:00 AM - 9:00 PM"
};

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully.");

    // 1. Clear Old Collections
    console.log("Clearing old collections...");
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Testimonial.deleteMany({});
    await Banner.deleteMany({});

    // Also try to clear obsolete models from previous database if they exist
    try {
      await mongoose.connection.db.dropCollection("bookings");
      console.log("Dropped collection: bookings");
    } catch (e) {}
    try {
      await mongoose.connection.db.dropCollection("festivalbookings");
      console.log("Dropped collection: festivalbookings");
    } catch (e) {}
    try {
      await mongoose.connection.db.dropCollection("blogposts");
      console.log("Dropped collection: blogposts");
    } catch (e) {}
    try {
      await mongoose.connection.db.dropCollection("faqs");
      console.log("Dropped collection: faqs");
    } catch (e) {}
    try {
      await mongoose.connection.db.dropCollection("galleryimages");
      console.log("Dropped collection: galleryimages");
    } catch (e) {}

    // Seed Banners
    console.log("Seeding banners...");
    await Banner.insertMany(bannersData);
    console.log("Seeded banners.");

    // 2. Seed Categories
    console.log("Seeding categories...");
    const createdCategories = await Category.insertMany(categoriesData);
    console.log(`Seeded ${createdCategories.length} categories.`);

    // Map categories for easier lookups
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.slug] = cat._id;
    });

    // 3. Seed Products
    console.log("Seeding products...");
    const preparedProducts = productsData.map(p => {
      const catId = categoryMap[p.categorySlug];
      if (!catId) {
        throw new Error(`Category not found for slug: ${p.categorySlug}`);
      }
      const { categorySlug, ...rest } = p;
      return {
        ...rest,
        category: catId
      };
    });

    const createdProducts = await Product.insertMany(preparedProducts);
    console.log(`Seeded ${createdProducts.length} products.`);

    // Map products for easier order items mock assembly
    const productMap = {};
    createdProducts.forEach(prod => {
      productMap[prod.slug] = prod;
    });

    // 4. Seed Orders (with order items)
    console.log("Seeding orders...");
    const preparedOrders = mockOrders.map((o, index) => {
      // Pick some random products to purchase
      const items = [];
      const prodKeys = Object.keys(productMap);
      
      // Determine number of items: usually 1 or 2
      const numItems = (index % 3) + 1;
      let totalAmount = 0;

      for (let i = 0; i < numItems; i++) {
        // Pick product based on index to ensure deterministic mapping
        const pKey = prodKeys[(index + i * 2) % prodKeys.length];
        const prod = productMap[pKey];
        const qty = (index % 2) + 1;
        const price = prod.discountPrice || prod.price;

        items.push({
          productId: prod._id,
          name: prod.name,
          price: price,
          quantity: qty,
          image: prod.images[0]
        });

        totalAmount += price * qty;
      }

      return {
        ...o,
        items,
        totalAmount
      };
    });

    const createdOrders = await Order.insertMany(preparedOrders);
    console.log(`Seeded ${createdOrders.length} orders.`);

    // 5. Seed Testimonials
    console.log("Seeding testimonials...");
    await Testimonial.insertMany(testimonialsData);
    console.log("Testimonials seeded.");

    // 6. Update Site Settings
    console.log("Updating Site Settings...");
    for (const [key, value] of Object.entries(settingsData)) {
      await SiteSettings.findOneAndUpdate(
        { key },
        { value },
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log("Site settings seeded.");

    console.log("COMMERCE DATA SEEDING COMPLETE!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
