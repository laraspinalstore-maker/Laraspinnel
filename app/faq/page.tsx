import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, HelpCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import JsonLd from "@/lib/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbNode, faqPageNode } from "@/lib/seo/schema";
import { getDeliverySettings } from "@/lib/seo/settings";
import { FAQ_GROUPS, faqSchemaEntries, faqsByGroup } from "@/lib/faqContent";

/**
 * Frequently asked questions.
 *
 * A server component with ZERO client JavaScript. The disclosure widgets are
 * native `<details>`/`<summary>`, which buys three things a JS accordion does
 * not:
 *
 *   1. Every answer is in the server-rendered HTML unconditionally. That matters
 *      for AI crawlers and it is a hard requirement for the FAQPage markup,
 *      which must describe content that is actually on the page.
 *   2. `<summary>`'s content model permits heading content, so
 *      `<summary><h3>…</h3></summary>` is valid HTML and produces a real heading
 *      outline entry. The orphaned components/faq/FAQClient.tsx put an `<h2>`
 *      inside a `<button>`, which is not valid, and reported
 *      `aria-expanded={false}` on panels its own `lg:` classes forced open —
 *      markup that lied to screen readers. It has been deleted.
 *   3. The browser supplies expand/collapse state, keyboard activation and the
 *      correct ARIA. There is no ARIA to fall out of sync.
 *
 * `<details name>` (exclusive accordion) is deliberately not used: the project's
 * browserslist includes firefox >= 115 and that attribute needs Firefox 130.
 */

export const revalidate = 3600;

const DESCRIPTION =
  "Answers to common questions about Lara's Pinnal handmade crochet gifts — materials, made-to-order timelines, customisation, payments, shipping across India, tracking, returns, and care instructions.";

export const metadata: Metadata = buildMetadata({
  title: "Frequently Asked Questions",
  description: DESCRIPTION,
  path: "/faq",
});

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default async function FaqPage() {
  // The delivery-charge answer is rendered live from settings so the page can
  // never quote a fee that differs from the one checkout actually charges. The
  // schema text for that answer stays generic for the same reason — see the note
  // in lib/faqContent.ts.
  const delivery = await getDeliverySettings();

  const deliveryLine =
    delivery.fee === 0
      ? "Delivery is currently free on every order within India."
      : delivery.freeAboveEnabled && delivery.freeAboveThreshold > 0
        ? `Delivery is currently ${formatInr(delivery.fee)} within India, and free on orders of ${formatInr(delivery.freeAboveThreshold)} and above.`
        : `Delivery is currently a flat ${formatInr(delivery.fee)} within India.`;

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
              FAQ
            </li>
          </ol>
        </nav>

        <span className="flex items-center gap-2 text-xs font-semibold text-primary-text uppercase tracking-wider">
          <HelpCircle size={14} className="text-primary" aria-hidden="true" /> Help Centre
        </span>

        <h1 className="font-display text-3xl md:text-5xl text-brand-black mt-3 mb-4 uppercase tracking-wide">
          Frequently Asked Questions
        </h1>

        <p className="text-sm md:text-base text-brand-gray max-w-3xl leading-relaxed mb-10">
          Everything about how our handmade crochet gifts are made, customised,
          packed, and delivered. If your question isn&apos;t here,{" "}
          <Link href="/contact" className="text-primary font-semibold hover:underline">
            get in touch
          </Link>{" "}
          and we&apos;ll answer it personally.
        </p>

        <div className="space-y-12">
          {FAQ_GROUPS.map((group) => {
            const items = faqsByGroup(group.id);
            if (!items.length) return null;

            return (
              <section key={group.id} aria-labelledby={`faq-${group.id}`}>
                <h2
                  id={`faq-${group.id}`}
                  className="font-display text-xl md:text-2xl text-brand-black uppercase tracking-wide mb-4 pb-2 border-b border-brand-border"
                >
                  {group.heading}
                </h2>

                <div className="space-y-3">
                  {items.map((item) => (
                    <details
                      key={item.id}
                      id={item.id}
                      className="group rounded-2xl bg-white border border-brand-border hover:border-primary/40 transition-colors"
                    >
                      <summary className="flex items-start justify-between gap-4 p-4 md:p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                        <h3 className="text-sm md:text-base font-semibold text-brand-black leading-snug">
                          {item.question}
                        </h3>
                        <ChevronDown
                          size={18}
                          aria-hidden="true"
                          className="shrink-0 mt-0.5 text-brand-gray transition-transform duration-200 group-open:rotate-180"
                        />
                      </summary>
                      <div className="px-4 md:px-5 pb-4 md:pb-5 pt-3 border-t border-brand-border/60 text-sm text-brand-gray leading-relaxed">
                        <p>{item.answer}</p>
                        {item.id === "delivery-charge" && (
                          <p className="mt-2 font-semibold text-brand-black">{deliveryLine}</p>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Cross-links rendered as real next/link elements rather than inside
            admin rich text: sanitizeRichText rewrites every surviving anchor to
            rel="nofollow", so an internal link placed in CMS copy would be
            nofollowed. */}
        <aside
          aria-labelledby="faq-more-help"
          className="mt-14 rounded-2xl border border-brand-border bg-brand-light-gray/30 p-5 md:p-6"
        >
          <h2
            id="faq-more-help"
            className="font-display text-lg md:text-xl text-brand-black uppercase tracking-wide mb-3"
          >
            Still need help?
          </h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
            <li>
              <Link href="/shipping-policy" className="text-primary hover:underline">
                Shipping Policy
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
              <Link href="/custom-order" className="text-primary hover:underline">
                Request a Custom Order
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-primary hover:underline">
                Contact Us
              </Link>
            </li>
          </ul>
        </aside>
      </main>

      <Footer />

      <JsonLd
        graph={[
          faqPageNode("/faq", faqSchemaEntries()),
          breadcrumbNode([{ name: "Home", path: "/" }, { name: "FAQ" }], "/faq"),
        ]}
      />
    </div>
  );
}
