import React from "react";
import { sanitizeRichText } from "@/lib/security/sanitize";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { connectToDatabase } from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";

export const metadata = {
  title: "Terms of Service | Lara's Pinnal",
  description: "Terms of Service for Lara's Pinnal.",
};

const DEFAULT_CONTENT = `
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3">1. Acceptance of Terms</h2>
  <p>By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.</p>
</section>
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3 mt-8">2. Products and Orders</h2>
  <p>All handmade crochet products are subject to availability. As each item is hand-knitted to order, slight variations in colour and finish may occur. We reserve the right to refuse service, cancel orders, or limit quantities at our discretion. Prices are subject to change without notice.</p>
</section>
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3 mt-8">3. Delivery and Refunds</h2>
  <p>Delivery times are estimates and may vary, especially for custom and made-to-order pieces. Because our products are handmade and often personalized, refund and return policies are handled on a case-by-case basis. Please contact customer service for any issues with your delivery.</p>
</section>
`;

export default async function TermsOfServicePage() {
  let content = DEFAULT_CONTENT;

  let updatedAt = new Date("2024-07-01"); // fallback

  try {
    await connectToDatabase();
    const settings = await SiteSettings.findOne({ key: "terms_of_service_content" }).lean();
    if (settings) {
      if (settings.value && settings.value.trim() !== "") {
        content = settings.value;
      }
      if (settings.updatedAt) {
        updatedAt = new Date(settings.updatedAt);
      }
    }
  } catch (error) {
    console.error("Error loading terms of service:", error);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-body">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 pt-5 md:pt-12 pb-14 md:pb-24 w-full">
        <h1 className="font-display text-3xl md:text-5xl text-brand-black mb-4 uppercase tracking-wide pb-6">Terms of Service</h1>
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
