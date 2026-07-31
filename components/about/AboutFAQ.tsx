"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Reveal from "./Reveal";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "How long does a custom crochet order take to make and deliver?",
    answer:
      "Because every piece is 100% hand-knitted to order in our Villupuram studio, creation typically takes 2 to 4 days depending on complexity. Pan-India shipping usually takes an additional 2 to 5 business days. Express shipping options can be coordinated via WhatsApp.",
  },
  {
    question: "What material yarn do you use for bouquets and amigurumi?",
    answer:
      "We use 100% premium milk cotton yarn. It is anti-pilling, velvety soft, hypoallergenic, and non-toxic. It retains vibrant colors over time without fading, making it perfectly safe for infants, kids, and pets.",
  },
  {
    question: "Can I customize flower colors, bouquet wraps, or add personal names?",
    answer:
      "Absolutely! Customization is our specialty. You can select custom flower colors, request specific bouquet arrangements, add personalized initials to photo frames, or write custom gift messages during checkout or on our Custom Order page.",
  },
  {
    question: "How do I care for and clean crochet flowers and plushies?",
    answer:
      "Crochet keepsakes are practically maintenance-free! To remove dust, gently blow or brush with a soft dry brush. For spots, gently dab with a damp cloth and mild soap, then air-dry in the shade. Never bleach or machine tumble-dry.",
  },
  {
    question: "How are items safely packaged for Pan-India delivery?",
    answer:
      "We take extreme care in packaging. Bouquets, frames, and plushies are nestled into custom protective wrapping within rigid corrugated gift boxes so they reach your doorstep in flawless condition.",
  },
];

export default function AboutFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-white py-16 md:py-24 border-b border-brand-border">
      <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-12">
        <Reveal className="text-center space-y-3">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Clear Answers
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-brand-black tracking-wide text-balance">
            Frequently Asked Questions
          </h2>
          <p className="text-sm font-medium text-brand-gray max-w-lg mx-auto">
            Everything you need to know about our handcrafted process, yarn materials, and delivery timelines.
          </p>
        </Reveal>

        <Reveal>
          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-cream-bg border border-brand-border shadow-3xs overflow-hidden transition-shadow hover:shadow-card"
                >
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle size={18} className="text-primary shrink-0" />
                      <span className="font-display text-base md:text-lg text-brand-black font-semibold">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-brand-gray shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-5 pb-5 md:px-6 md:pb-6 text-sm text-brand-gray leading-relaxed border-t border-brand-border/60 pt-4">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* Ask Us Direct Banner */}
        <Reveal className="text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 bg-primary-tint border border-primary/20 px-6 py-4 rounded-2xl shadow-3xs">
            <span className="text-xs font-semibold text-brand-black">Have a specific question or custom idea?</span>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary-hover transition-colors"
            >
              <MessageCircle size={14} /> Ask Us Directly &rarr;
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
