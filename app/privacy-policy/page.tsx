import React from "react";
import { sanitizeRichText } from "@/lib/security/sanitize";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { connectToDatabase } from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";

export const metadata = {
  title: "Privacy Policy | Lara's Pinnal",
  description: "Privacy Policy for Lara's Pinnal.",
};

const DEFAULT_CONTENT = `
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3">1. Information We Collect</h2>
  <p>We collect information you provide directly to us when you make a booking, subscribe to our newsletter, or contact us for support. This may include your name, email address, phone number, delivery address, and payment information.</p>
</section>
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3 mt-8">2. How We Use Your Information</h2>
  <p>We use the information we collect to fulfill your orders, provide customer service, improve our website, and send you important updates regarding your purchases or our handmade crochet collections.</p>
</section>
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3 mt-8">3. Information Sharing</h2>
  <p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except trusted third parties who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.</p>
</section>
`;

export default async function PrivacyPolicyPage() {
  let content = DEFAULT_CONTENT;

  let updatedAt = new Date("2024-07-01"); // fallback

  try {
    await connectToDatabase();
    const settings = await SiteSettings.findOne({ key: "privacy_policy_content" }).lean();
    if (settings) {
      if (settings.value && settings.value.trim() !== "") {
        content = settings.value;
      }
      if (settings.updatedAt) {
        updatedAt = new Date(settings.updatedAt);
      }
    }
  } catch (error) {
    console.error("Error loading privacy policy:", error);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-body">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 pt-5 md:pt-12 pb-14 md:pb-24 w-full">
        <h1 className="font-display text-3xl md:text-5xl text-brand-black mb-4 uppercase tracking-wide pb-6">Privacy Policy</h1>
        <p className="text-sm text-brand-gray mb-10 italic">Last Updated: {updatedAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div 
          className="space-y-6 text-brand-gray leading-relaxed text-sm md:text-base prose prose-sm max-w-none text-justify [&_p]:text-justify! prose-p:text-brand-gray prose-a:text-primary [&_:is(h1,h2,h3,h4,h5,h6)]:!text-xl md:[&_:is(h1,h2,h3,h4,h5,h6)]:!text-2xl [&_:is(h1,h2,h3,h4,h5,h6)]:!font-bold [&_:is(h1,h2,h3,h4,h5,h6)]:!text-brand-black [&_:is(h1,h2,h3,h4,h5,h6)]:!mt-8 [&_:is(h1,h2,h3,h4,h5,h6)]:!mb-4"
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(content) }}
        />
      </main>
      <Footer />
    </div>
  );
}
