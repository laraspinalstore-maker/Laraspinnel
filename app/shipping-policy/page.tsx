import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { sanitizeRichText } from "@/lib/security/sanitize";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { connectToDatabase } from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import JsonLd from "@/lib/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbNode, webPageNode } from "@/lib/seo/schema";
import { getDeliverySettings } from "@/lib/seo/settings";

/**
 * Shipping policy.
 *
 * Structurally a clone of app/refund-policy/page.tsx — server component, an HTML
 * default that an admin can override from Admin → Content → Policies, rendered
 * through sanitizeRichText — with two deliberate differences:
 *
 *   1. Metadata is typed. The four older policy pages exported an untyped
 *      object, so their shape was never checked against Next's Metadata.
 *   2. The delivery charge is NOT part of the editable copy. It is rendered from
 *      the same settings checkout reads, immediately below the prose. An admin
 *      editing the policy text therefore cannot leave a stated fee that
 *      contradicts the fee actually charged.
 *
 * On what this page does and does not claim: courier partner names, per-region
 * transit day ranges, and a lost-parcel SLA are business facts that exist
 * nowhere in this application — Order has no carrier, AWB, or tracking-URL
 * field, and the status enum has no in-transit state. Rather than invent them,
 * the copy describes the process truthfully and points customers to WhatsApp for
 * the specifics of their own parcel. India-only shipping is not a guess: checkout
 * has no country field and validates against an Indian mobile pattern, so a
 * foreign order physically cannot be placed.
 */

const DESCRIPTION =
  "How Lara's Pinnal crafts, packs, and ships handmade crochet gifts across India — made-to-order processing times, delivery charges, packaging, tracking, and what happens if a parcel is damaged or delayed.";

export const metadata: Metadata = buildMetadata({
  title: "Shipping Policy",
  description: DESCRIPTION,
  path: "/shipping-policy",
});

const DEFAULT_CONTENT = `
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3">1. Everything Is Made to Order</h2>
  <p>We do not hold finished stock. Every bouquet, plushie, frame, and hamper is hand-knitted for your specific order in our studio in Villupuram, Tamil Nadu. This means your timeline begins when we confirm your order details with you, not at the moment the order is placed.</p>
</section>
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3 mt-8">2. Processing &amp; Crafting Time</h2>
  <p>Most pieces take 2 to 4 days to craft. Larger bouquets, multi-piece gift hampers, and personalised frames take longer, because the work scales with the number of individual flowers and stitched elements involved. We confirm your expected completion date with you on WhatsApp before crafting begins, so you always know where you stand before we start.</p>
</section>
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3 mt-8">3. Your Order Journey</h2>
  <p>Every order moves through five stages, and you can see the current stage at any time on our Track Order page:</p>
  <ul>
    <li><strong>Order Placed</strong> — we have received your order.</li>
    <li><strong>Confirmed</strong> — we have confirmed the details and payment with you.</li>
    <li><strong>Crafting</strong> — your piece is being handmade.</li>
    <li><strong>Ready</strong> — packed and ready to hand to the courier.</li>
    <li><strong>Delivered</strong> — delivered to your address.</li>
  </ul>
</section>
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3 mt-8">4. Who Carries Your Parcel</h2>
  <p>We dispatch through established national courier services, choosing the one that serves your PIN code most reliably. Because the best option varies by destination, we share the courier and the reference for your specific parcel over WhatsApp at the moment it leaves the studio rather than promising one carrier for every order.</p>
</section>
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3 mt-8">5. Where We Deliver</h2>
  <p>We ship to all states and union territories in India. Transit time after dispatch depends on how far your address is from Villupuram and on your courier's local network, so it is quoted per order rather than as a single figure. Metro addresses are typically quicker than remote PIN codes.</p>
</section>
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3 mt-8">6. International Orders</h2>
  <p>We currently ship within India only, and our checkout accepts Indian delivery addresses and mobile numbers. If you would like a piece sent overseas, message us on WhatsApp before ordering and we will tell you honestly whether we can arrange it for your destination.</p>
</section>
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3 mt-8">7. Packaging</h2>
  <p>Handmade pieces need protecting. Bouquets, frames, and plushies are wrapped in protective material and packed inside rigid corrugated boxes chosen to stop the contents from moving in transit. If your order is a gift going directly to the recipient, tell us and we will keep pricing paperwork off the outside of the parcel.</p>
</section>
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3 mt-8">8. Tracking Your Order</h2>
  <p>Use our Track Order page with your order number and the 10-digit mobile number you gave at checkout to see your current stage. This is our own studio status, updated by us as your order progresses. Once the parcel is with the courier we also send you their tracking reference on WhatsApp.</p>
</section>
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3 mt-8">9. Delayed or Missing Parcels</h2>
  <p>Couriers occasionally run late, and very rarely a parcel goes missing. If your order has not arrived when expected, message us with your order number. We take it up with the courier on your behalf and stay with it until it is resolved — either the parcel is located and delivered, or we remake and reship your order.</p>
</section>
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3 mt-8">10. Damaged on Arrival</h2>
  <p>If your order arrives damaged, contact us within 48 hours of delivery with your order number and photographs of the problem. We will arrange a replacement or a full refund at no extra cost to you. Approved refunds are issued to your original payment method within 5 to 7 business days.</p>
</section>
<section>
  <h2 class="text-2xl font-bold text-brand-black mb-3 mt-8">11. Getting Help</h2>
  <p>WhatsApp is the fastest way to reach us about anything shipping-related, and you can also call us or use the form on our Contact page. Please have your order number ready so we can look your order up immediately.</p>
</section>
`;

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default async function ShippingPolicyPage() {
  let content = DEFAULT_CONTENT;
  let updatedAt = new Date("2024-07-01"); // fallback

  try {
    await connectToDatabase();
    const settings = await SiteSettings.findOne({ key: "shipping_policy_content" }).lean();
    if (settings) {
      if (settings.value && settings.value.trim() !== "") {
        content = settings.value;
      }
      if (settings.updatedAt) {
        updatedAt = new Date(settings.updatedAt);
      }
    }
  } catch (error) {
    console.error("Error loading shipping policy:", error);
  }

  const delivery = await getDeliverySettings();

  return (
    <div className="min-h-screen bg-white flex flex-col font-body">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl mx-auto px-4 md:px-6 pt-5 md:pt-12 pb-14 md:pb-24 w-full">
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex items-center gap-2 text-xs text-brand-gray">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-semibold text-brand-black">
              Shipping Policy
            </li>
          </ol>
        </nav>

        <h1 className="font-display text-3xl md:text-5xl text-brand-black mb-4 uppercase tracking-wide pb-6">
          Shipping Policy
        </h1>
        <p className="text-sm text-brand-gray mb-10 italic">
          Last Updated:{" "}
          {updatedAt.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        <div
          className="space-y-6 text-brand-gray leading-relaxed text-sm md:text-base prose prose-sm max-w-none text-justify [&_p]:text-justify! prose-p:text-brand-gray prose-a:text-primary [&_:is(h1,h2,h3,h4,h5,h6)]:text-xl! md:[&_:is(h1,h2,h3,h4,h5,h6)]:text-2xl! [&_:is(h1,h2,h3,h4,h5,h6)]:font-bold! [&_:is(h1,h2,h3,h4,h5,h6)]:text-brand-black! [&_:is(h1,h2,h3,h4,h5,h6)]:mt-8! [&_:is(h1,h2,h3,h4,h5,h6)]:mb-4!"
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(content) }}
        />

        {/* Rendered from the same settings /api/orders uses to compute the fee,
            deliberately outside the admin-editable block above. */}
        <section
          aria-labelledby="delivery-charges"
          className="mt-10 rounded-2xl border border-brand-border bg-brand-light-gray/30 p-5 md:p-6"
        >
          <h2
            id="delivery-charges"
            className="text-xl md:text-2xl font-bold text-brand-black mb-3"
          >
            Current Delivery Charges
          </h2>
          {delivery.fee === 0 ? (
            <p className="text-sm md:text-base text-brand-gray leading-relaxed">
              Delivery is currently <strong className="text-brand-black">free on every
              order</strong> within India. No delivery charge is added at checkout.
            </p>
          ) : (
            <p className="text-sm md:text-base text-brand-gray leading-relaxed">
              A flat delivery charge of{" "}
              <strong className="text-brand-black">{formatInr(delivery.fee)}</strong>{" "}
              applies to orders within India.
              {delivery.freeAboveEnabled && delivery.freeAboveThreshold > 0 && (
                <>
                  {" "}
                  Delivery is <strong className="text-brand-black">free on orders of{" "}
                  {formatInr(delivery.freeAboveThreshold)} and above</strong>.
                </>
              )}
            </p>
          )}
          <p className="text-xs text-brand-gray mt-3">
            The exact amount for your order is always shown in your cart before you
            confirm.
          </p>
        </section>

        {/* Real next/link elements, not links inside the sanitized block:
            sanitizeRichText rewrites every surviving anchor to rel="nofollow",
            so internal links placed in admin rich text lose their signal. */}
        <nav aria-labelledby="shipping-related" className="mt-10">
          <h2
            id="shipping-related"
            className="text-xl md:text-2xl font-bold text-brand-black mb-3"
          >
            Related Pages
          </h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
            <li>
              <Link href="/faq" className="text-primary hover:underline">
                Frequently Asked Questions
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" className="text-primary hover:underline">
                Refund Policy
              </Link>
            </li>
            <li>
              <Link href="/track-order" className="text-primary hover:underline">
                Track Your Order
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-primary hover:underline">
                Contact Us
              </Link>
            </li>
          </ul>
        </nav>
      </main>
      <Footer />

      <JsonLd
        graph={[
          webPageNode({
            path: "/shipping-policy",
            name: "Shipping Policy",
            description: DESCRIPTION,
            dateModified: updatedAt,
          }),
          breadcrumbNode(
            [{ name: "Home", path: "/" }, { name: "Shipping Policy" }],
            "/shipping-policy"
          ),
        ]}
      />
    </div>
  );
}
