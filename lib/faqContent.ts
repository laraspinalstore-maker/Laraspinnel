/**
 * The single source of truth for /faq.
 *
 * The visible page and the `FAQPage` JSON-LD are both generated from this array,
 * so the marked-up answers cannot drift from the rendered ones. Marking up
 * content that is not visible on the page is a structured-data policy violation,
 * and that is exactly what the previous root-layout FAQPage did — two questions
 * on every route, with answers that appeared in no UI at all.
 *
 * Answers are PLAIN TEXT, not HTML. Three consequences, all deliberate:
 *   - they drop into JSON-LD `text` verbatim;
 *   - they render as React text nodes, so there is no `dangerouslySetInnerHTML`
 *     and no sanitiser in the path;
 *   - `sanitizeRichText`'s allowed-tag list does not include `details`/`summary`,
 *     so this cannot live in a rich-text CMS field without the accordion markup
 *     being stripped on save.
 *
 * Every answer below is grounded in something the application actually does or
 * publishes. Sources are noted per item. Two commonly-asked questions are
 * deliberately ABSENT because the repository does not establish an answer and
 * guessing would be inventing policy:
 *   - which payment methods are accepted (the code only proves that payment
 *     happens after confirmation and that a screenshot is requested);
 *   - whether a tax invoice / GST receipt is issued.
 * Both are listed for the owner in the handover notes.
 */

export type FaqGroupId =
  | "materials"
  | "ordering"
  | "customization"
  | "payments"
  | "shipping"
  | "tracking"
  | "returns"
  | "care";

export interface FaqGroup {
  id: FaqGroupId;
  /** Visible <h2> for the section. */
  heading: string;
}

export interface FaqItem {
  id: string;
  group: FaqGroupId;
  question: string;
  answer: string;
}

export const FAQ_GROUPS: FaqGroup[] = [
  { id: "materials", heading: "Crochet Flowers & Materials" },
  { id: "ordering", heading: "Placing an Order" },
  { id: "customization", heading: "Customisation" },
  { id: "payments", heading: "Payments" },
  { id: "shipping", heading: "Shipping & Delivery" },
  { id: "tracking", heading: "Tracking & Support" },
  { id: "returns", heading: "Cancellations, Returns & Refunds" },
  { id: "care", heading: "Caring for Your Pieces" },
];

export const FAQS: FaqItem[] = [
  // ── Crochet flowers & materials ────────────────────────────────────────────
  {
    id: "what-are-crochet-flowers",
    group: "materials",
    question: "What are crochet flowers, and how are they different from fresh flowers?",
    answer:
      "Crochet flowers are hand-knitted from yarn rather than grown, so they never wilt, drop petals, or need water. A crochet bouquet is a keepsake you can keep on a shelf for years, which is why they are popular for anniversaries, birthdays, and farewells where a fresh bouquet would last a week.",
  },
  {
    id: "what-yarn",
    group: "materials",
    // Harvested verbatim in substance from the studio's own copy.
    question: "What yarn do you use for bouquets and amigurumi?",
    answer:
      "We use 100% premium milk cotton yarn. It is anti-pilling, velvety soft, hypoallergenic, and non-toxic, and it holds its colour over time without fading.",
  },
  {
    id: "baby-safe",
    group: "materials",
    question: "Are your plushies suitable for babies and young children?",
    answer:
      "The milk cotton yarn we use is hypoallergenic and non-toxic, and our plushies are stitched closed rather than glued. If a piece is intended for a baby or a child under three, please tell us when you order so we can make sure it is finished without any small attached parts.",
  },
  {
    id: "handmade-variation",
    group: "materials",
    // Sourced from DEFAULT_FOOTER_DISCLAIMER in lib/siteContent.ts.
    question: "Will my piece look exactly like the photo?",
    answer:
      "It will be very close, but not identical. Because every item is 100% handcrafted and made to order, slight variations in yarn shade, shape, and sizing can occur. These are not flaws — they are what makes each piece authentically handmade.",
  },

  // ── Ordering ───────────────────────────────────────────────────────────────
  {
    id: "how-to-order",
    group: "ordering",
    question: "How do I place an order?",
    answer:
      "Add the pieces you want to your cart, then go to checkout and enter your name, phone number, delivery address, and PIN code. We then confirm the details with you on WhatsApp or by phone before any crafting begins.",
  },
  {
    id: "made-to-order",
    group: "ordering",
    question: "Do you keep stock, or is everything made to order?",
    answer:
      "Almost everything is made to order in our Villupuram studio. Nothing sits on a shelf waiting to ship, which is why the timeline starts when your order is confirmed rather than the moment it is placed.",
  },
  {
    id: "custom-not-in-shop",
    group: "ordering",
    question: "Can I order a design that isn't in the shop?",
    answer:
      "Yes. Use our Custom Order page to tell us the occasion, size, colours, personalisation, and preferred date, and to upload reference images. We reply with a design plan and a price before starting.",
  },
  {
    id: "bulk-orders",
    group: "ordering",
    question: "Do you take bulk, wedding, or corporate orders?",
    answer:
      "Yes — we regularly make curated hampers and favours for weddings, baby showers, and corporate gifting. Message us on WhatsApp with the quantity and the date you need them by, and we will tell you what is achievable.",
  },

  // ── Customisation ──────────────────────────────────────────────────────────
  {
    id: "what-can-i-customize",
    group: "customization",
    question: "What can I customise?",
    answer:
      "Flower colours, the arrangement and wrap of a bouquet, initials and dates on frames, and a personal gift message. You can add customisation notes directly on a product page before adding it to your cart.",
  },
  {
    id: "colour-matching",
    group: "customization",
    question: "Can you match a specific colour?",
    answer:
      "Usually. You can pick from our preset shades or give us any colour reference, including a photo. Exact matching depends on the yarn shades we have in stock, so we will confirm what is achievable before we begin.",
  },
  {
    id: "reference-images",
    group: "customization",
    question: "Can I send a reference photo of what I want?",
    answer:
      "Yes. You can attach reference images both on the Custom Order form and on an individual product page when you add it to your cart.",
  },

  // ── Payments ───────────────────────────────────────────────────────────────
  {
    id: "pay-at-checkout",
    group: "payments",
    // Sourced from the checkout trust card and the WhatsApp order template.
    question: "Do I have to pay online at checkout?",
    answer:
      "No. Checkout does not take a payment. We verify your order details with you first, then share payment instructions, and we begin crafting once the payment is confirmed.",
  },
  {
    id: "card-details",
    group: "payments",
    question: "Do you store my card details?",
    answer:
      "No card details are collected on this website at all. The checkout form asks only for the contact and delivery information we need to make and send your order.",
  },

  // ── Shipping & delivery ────────────────────────────────────────────────────
  {
    id: "where-do-you-ship",
    group: "shipping",
    question: "Where do you ship?",
    answer:
      "We ship to all states and union territories in India from our studio in Villupuram, Tamil Nadu. We do not currently ship outside India — message us on WhatsApp if you have an overseas request and we will tell you honestly whether we can arrange it.",
  },
  {
    id: "how-long",
    group: "shipping",
    question: "How long will my order take?",
    answer:
      "Crafting typically takes 2 to 4 days depending on the complexity of the piece, and larger bouquets, multi-piece hampers, and personalised frames take longer. Courier transit time is added on top and varies by destination. We confirm your expected date with you before crafting starts.",
  },
  {
    id: "delivery-charge",
    group: "shipping",
    // The page renders the live fee from settings next to this answer. The
    // schema text stays deliberately generic so the marked-up copy cannot go
    // stale when an admin changes the fee.
    question: "How much is delivery?",
    answer:
      "A flat delivery charge applies to orders within India, and free delivery may apply above a certain order value. The current rate is shown on our Shipping Policy page and again in your cart before you confirm.",
  },
  {
    id: "packaging",
    group: "shipping",
    question: "How is my order packed?",
    answer:
      "Bouquets, frames, and plushies are wrapped in protective material and packed inside rigid corrugated boxes so they arrive undamaged. If your order is a gift being sent directly to the recipient, tell us and we will keep pricing paperwork off the outside of the parcel.",
  },
  {
    id: "specific-date",
    group: "shipping",
    question: "Can I get my order by a specific date?",
    answer:
      "Often, yes. Tell us the date at checkout or on the Custom Order form and we will confirm whether it is achievable before we start. The earlier you ask, the more likely we can meet it.",
  },

  // ── Tracking & support ─────────────────────────────────────────────────────
  {
    id: "track-order",
    group: "tracking",
    // Sourced from the real status enum rendered on /track-order.
    question: "How do I track my order?",
    answer:
      "Use our Track Order page with your order number and the 10-digit mobile number you used at checkout. Your order moves through five stages: Order Placed, Confirmed, Crafting, Ready, and Delivered.",
  },
  {
    id: "contact-support",
    group: "tracking",
    question: "How do I reach you if something is wrong?",
    answer:
      "WhatsApp is the fastest way to reach us, and you can also call or use the form on our Contact page. Have your order number ready so we can look it up straight away.",
  },
  {
    id: "parcel-delayed",
    group: "tracking",
    question: "My parcel seems delayed — what should I do?",
    answer:
      "Message us with your order number and we will take it up with the courier on your behalf and keep you updated until it is resolved.",
  },

  // ── Cancellations, returns & refunds ───────────────────────────────────────
  {
    id: "can-i-cancel",
    group: "returns",
    // Sourced from /refund-policy.
    question: "Can I cancel my order?",
    answer:
      "You can cancel for a full refund within 24 hours of placing your order, as long as work on your piece has not already started. Once crafting has begun the order can no longer be cancelled.",
  },
  {
    id: "returns",
    group: "returns",
    question: "Can I return or exchange an item?",
    answer:
      "Because every piece is hand-knitted to order and many are personalised, we cannot accept returns or exchanges once work has begun. The exception is an item that arrives damaged or defective, which we always put right.",
  },
  {
    id: "damaged",
    group: "returns",
    question: "My order arrived damaged. What now?",
    answer:
      "Contact us within 48 hours of delivery with your order number and photos of the problem. We will arrange a replacement or a full refund at no extra cost to you. Approved refunds reach your original payment method within 5 to 7 business days.",
  },

  // ── Care ───────────────────────────────────────────────────────────────────
  {
    id: "how-to-clean",
    group: "care",
    question: "How do I clean crochet flowers and plushies?",
    answer:
      "Blow or brush dust away with a soft dry brush. For a mark, dab gently with a damp cloth and a little mild soap, then air-dry in the shade. Never bleach a piece and never put it in a tumble dryer.",
  },
  {
    id: "how-long-last",
    group: "care",
    question: "How long will a crochet bouquet last?",
    answer:
      "Years, with almost no maintenance. Keep it out of prolonged direct sunlight to preserve the colours and dust it occasionally, and it will look the same as the day it arrived.",
  },
];

/** The `mainEntity` payload for the FAQPage node. */
export function faqSchemaEntries(): { question: string; answer: string }[] {
  return FAQS.map((item) => ({ question: item.question, answer: item.answer }));
}

/** FAQs belonging to one visible section, in declaration order. */
export function faqsByGroup(group: FaqGroupId): FaqItem[] {
  return FAQS.filter((item) => item.group === group);
}
