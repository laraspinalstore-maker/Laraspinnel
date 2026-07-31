"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQClientProps {
  faqs: {
    _id: string;
    question: string;
    answer: string;
  }[];
}

export default function FAQClient({ faqs }: FAQClientProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 items-stretch">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={faq._id}
            className="bg-white rounded-2xl shadow-sm border border-brand-border hover:shadow-md transition-all duration-300 h-full flex flex-col"
          >
            {/* Unified Header */}
            <button
              onClick={() => toggleOpen(index)}
              className="flex items-start justify-between w-full p-4 md:p-6 lg:p-8 text-left focus:outline-none bg-transparent lg:cursor-default"
              aria-expanded={isOpen}
            >
              <div className="flex items-start gap-4">
                <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-tint text-primary font-bold text-sm mt-0.5">
                  Q
                </span>
                <h2 className="text-lg md:text-xl font-bold text-brand-black leading-snug">
                  {faq.question}
                </h2>
              </div>
              <div className="shrink-0 ml-4 mt-1 lg:hidden">
                <ChevronDown
                  className={`w-5 h-5 text-brand-gray transition-transform duration-300 ease-out ${
                    isOpen ? "rotate-180" : "rotate-0"
                  }`}
                />
              </div>
            </button>

            {/* Unified Answer Body */}
            <div
              className={`grid transition-all duration-300 ease-in-out lg:grid-rows-[1fr] lg:opacity-100 ${
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div 
                  className="px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 text-brand-gray leading-relaxed space-y-3 text-justify [&_p]:text-justify!"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
