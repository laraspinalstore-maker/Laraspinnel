"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PackageSearch } from "lucide-react";

/* Mobile & tablet home section in the promo-banner slot: a simple order-number
   field that funnels into /track-order (number prefilled via ?order=…). */
export default function TrackOrderCard() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = orderNumber.trim();
    router.push(trimmed ? `/track-order?order=${encodeURIComponent(trimmed)}` : "/track-order");
  };

  return (
    <section className="lg:hidden py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="max-w-md sm:max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-goat-primary">
              Order Tracking
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-brand-black tracking-wide uppercase">
              Track Your Order
            </h2>
            <p className="text-sm md:text-base font-medium text-brand-gray">
              Enter your order number to see where your handmade order is.
            </p>
          </div>

          {/* Stacked on phones; single inline row from sm up */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-0 sm:flex sm:gap-3">
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Order number, e.g. LPO-…"
              aria-label="Order number"
              className="w-full sm:flex-1 h-12 bg-white border border-brand-border rounded-xl px-4 text-sm text-brand-black placeholder-brand-gray outline-none focus:ring-2 focus:ring-goat-primary transition-all uppercase placeholder:normal-case"
            />
            <button
              type="submit"
              className="w-full sm:w-auto sm:shrink-0 h-12 px-6 bg-goat-primary hover:bg-goat-hover text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <PackageSearch size={16} /> Track Order
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
