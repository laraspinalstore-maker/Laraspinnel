import React from "react";
import { sanitizeRichText } from "@/lib/security/sanitize";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { connectToDatabase } from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";

export const metadata = {
  title: "Refund Policy | Lara's Pinnal",
  description: "Refund Policy for Lara's Pinnal.",
};

const DEFAULT_CONTENT = `
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3">1. Custom & Handmade Orders</h2>
  <p>Every item is hand-knitted to order, and many are personalized with your chosen names, colors, or designs. Because of this, we cannot accept returns or offer refunds for custom or personalized orders once work has begun, except where the item arrives damaged or defective.</p>
</section>
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3 mt-8">2. Cancellations</h2>
  <p>You may cancel an order for a full refund within 24 hours of placing it, provided work on your custom piece has not yet started. Once crafting has begun, the order can no longer be cancelled.</p>
</section>
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3 mt-8">3. Damaged or Defective Items</h2>
  <p>If your order arrives damaged or with a manufacturing defect, contact us within 48 hours of delivery with your order number and photos of the issue. We will arrange a replacement or a full refund at no extra cost to you.</p>
</section>
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3 mt-8">4. Refund Processing Time</h2>
  <p>Approved refunds are issued to your original payment method within 5-7 business days. Bank processing times may add a few additional days before the amount appears in your account.</p>
</section>
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3 mt-8">5. Contact Us</h2>
  <p>For any questions about a refund or a specific order, reach out to us on WhatsApp or through our Contact page and we'll be happy to help.</p>
</section>
`;

export default async function RefundPolicyPage() {
  let content = DEFAULT_CONTENT;

  let updatedAt = new Date("2024-07-01"); // fallback

  try {
    await connectToDatabase();
    const settings = await SiteSettings.findOne({ key: "refund_policy_content" }).lean();
    if (settings) {
      if (settings.value && settings.value.trim() !== "") {
        content = settings.value;
      }
      if (settings.updatedAt) {
        updatedAt = new Date(settings.updatedAt);
      }
    }
  } catch (error) {
    console.error("Error loading refund policy:", error);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-body">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 pt-5 md:pt-12 pb-14 md:pb-24 w-full">
        <h1 className="font-display text-3xl md:text-5xl text-brand-black mb-4 uppercase tracking-wide pb-6">Refund Policy</h1>
        <p className="text-sm text-brand-gray mb-10 italic">Last Updated: {updatedAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div
          className="space-y-6 text-brand-gray leading-relaxed text-sm md:text-base prose prose-sm max-w-none text-justify [&_p]:text-justify! prose-p:text-brand-gray prose-a:text-goat-primary [&_:is(h1,h2,h3,h4,h5,h6)]:!text-xl md:[&_:is(h1,h2,h3,h4,h5,h6)]:!text-2xl [&_:is(h1,h2,h3,h4,h5,h6)]:!font-bold [&_:is(h1,h2,h3,h4,h5,h6)]:!text-brand-black [&_:is(h1,h2,h3,h4,h5,h6)]:!mt-8 [&_:is(h1,h2,h3,h4,h5,h6)]:!mb-4"
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(content) }}
        />
      </main>
      <Footer />
    </div>
  );
}
