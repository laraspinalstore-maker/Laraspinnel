const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    review: { type: String, required: true },
    initial: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Testimonial = mongoose.models.Testimonial || mongoose.model("Testimonial", TestimonialSchema);

const seedData = [
  {
    name: "Ramesh Kumar",
    location: "Coimbatore, TN",
    review: "Ordered a crochet rose bouquet for our anniversary. The craftsmanship was exceptional, and it arrived right on time, beautifully packaged. Best handmade gift I've found in Tamil Nadu!",
    initial: "R",
    isActive: true,
  },
  {
    name: "Revathi S.",
    location: "Villupuram, TN",
    review: "Lara's Pinnal is our go-to for baby gifts. The amigurumi plushies are soft, safe, and finished with so much care. Highly recommend their custom hampers.",
    initial: "R",
    isActive: true,
  },
  {
    name: "Mohamed Asif",
    location: "Tiruppur, TN",
    review: "Ordered a custom crochet frame with our names for a wedding gift. The team helped us pick colors and design, and the result was stunning. Very professional, honest pricing.",
    initial: "M",
    isActive: true,
  }
];

async function seed() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log("Connecting to Mongo:", uri ? uri.substring(0, 20) + "..." : "undefined");
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    // Check if any testimonials exist
    const count = await Testimonial.countDocuments();
    if (count === 0) {
      console.log("No testimonials found. Inserting defaults...");
      await Testimonial.insertMany(seedData);
      console.log("Default testimonials seeded successfully!");
    } else {
      console.log(`Found ${count} existing testimonials. Skipping seed to prevent duplicates.`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error seeding testimonials:", error);
    process.exit(1);
  }
}

seed();
