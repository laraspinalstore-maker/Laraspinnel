const mongoose = require('mongoose');

const SiteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, default: "" },
  },
  { timestamps: true }
);

const SiteSettings = mongoose.models.SiteSettings || mongoose.model("SiteSettings", SiteSettingsSchema);

const seedData = {
  home_shop_title: "What Are You Looking For?",
  home_shop_subtitle: "Choose your category to browse handmade crochet bouquets, plushies, frames, and gifts.",
  home_shop_image_1: "/logo.png",
  home_shop_image_2: "/logo.png",
  home_testimonials_title: "What Our Customers Say",
  home_testimonials_subtitle: "Stories of joy from gift-givers, families, and collectors across India.",
  home_stat_1: "100% Handmade to Order",
  home_stat_2: "Ships Across India",
  home_stat_3: "Handmade Quality Guaranteed",
  about_intro_title: "About Lara's Pinnal",
  about_intro_subtitle: "Handcrafting crochet gifts and flowers with love in Villupuram, Tamil Nadu.",
  about_intro_p1: "At Lara's Pinnal, we believe that a meaningful gift begins with careful handwork. From our studio in Villupuram, every bouquet, plushie, and frame is crocheted stitch by stitch using premium milk cotton yarn.",
  about_intro_p2: "We started with a vision to bring personalized, handmade gifting to everyone in India. By crafting each order ourselves and shipping directly to your doorstep, we keep prices transparent and every piece uniquely yours.",
  about_intro_image: "/logo.png",
  about_why_title: "Why Choose Lara's Pinnal?",
  about_why_subtitle: "We stand by quality markers that set our handmade gifts apart.",
  about_why_1_title: "Handmade with Love",
  about_why_1_desc: "Every piece is 100% hand-knitted with meticulous care — no mass production, ever.",
  about_why_2_title: "Fully Customizable Gifts",
  about_why_2_desc: "We customize colors, names, and patterns so your gift is one of a kind.",
  about_why_3_title: "Safe Pan-India Delivery",
  about_why_3_desc: "Carefully packaged and reliably shipped so your handmade gift arrives in perfect shape.",
  about_stat_1_val: "100%",
  about_stat_1_label: "Hand-Knitted",
  about_stat_2_val: "Made to Order",
  about_stat_2_label: "Every Piece",
  about_stat_3_val: "Milk Cotton",
  about_stat_3_label: "Premium Yarn",
  about_stat_4_val: "Pan-India",
  about_stat_4_label: "Delivery",
  contact_map_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125433.09848529045!2d76.92055610080645!3d10.66986518712613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba836b28eb6ea85%3A0xaae3bbecafcc2061!2sVillupuram%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1709400000000!5m2!1sen!2sin"
};

async function seed() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log("Connecting to Mongo:", uri ? uri.substring(0, 20) + "..." : "undefined");
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    for (const [key, value] of Object.entries(seedData)) {
      await SiteSettings.findOneAndUpdate(
        { key },
        { $setOnInsert: { value } }, // Only insert if missing
        { upsert: true, returnDocument: 'after' }
      );
      console.log(`Seeded: ${key}`);
    }

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
