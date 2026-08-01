"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useSettings } from "@/hooks/useSettings";
import { ShoppingBag, ChevronRight, Sparkles } from "lucide-react";

export default function FloatingCartBar() {
  const { cartCount, cartTotal } = useCart();
  const { settings } = useSettings();
  const pathname = usePathname();

  if (cartCount === 0) return null;

  // Don't show on cart or checkout pages
  if (pathname === "/cart" || pathname === "/checkout" || pathname?.startsWith("/admin")) {
    return null;
  }

  const isFreeDeliveryEnabled = settings.is_free_delivery_enabled === "true";
  const freeDeliveryThreshold = parseFloat(settings.free_delivery_threshold) || 0;
  const amountRemaining = freeDeliveryThreshold - cartTotal;

  return (
    <div className="fixed left-4 right-4 md:left-auto md:w-85 md:right-6 bottom-19 md:bottom-6 z-60 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <Link href="/cart" className="block group">
        <div className="bg-brand-black text-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/15 backdrop-blur-md transform transition-transform group-hover:scale-[1.02]">

          {/* Free Delivery Banner */}
          {isFreeDeliveryEnabled && (
            <div className={`px-3 md:px-4 py-1 md:py-1.5 text-[10px] md:text-[11px] font-bold text-center border-b border-white/10 flex items-center justify-center gap-1.5 transition-colors ${amountRemaining <= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-white/90'}`}>
              {amountRemaining > 0 ? (
                <>
                  <span>Add <span className="text-white font-extrabold text-xs">₹{amountRemaining}</span> more for FREE Delivery</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} className="text-emerald-400" />
                  <span>You&apos;ve unlocked FREE Delivery!</span>
                </>
              )}
            </div>
          )}

          {/* Main Action Bar */}
          <div className="flex items-center justify-between p-1.5 px-3 md:px-4">
            {/* Left section: Items info */}
            <div className="flex items-center gap-3 py-1">
              <div className="bg-white/10 p-1.5 md:p-2 rounded-lg md:rounded-xl flex items-center justify-center relative">
                <ShoppingBag className="text-white w-4 h-4 md:w-5 md:h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-tight">
                  {cartCount} {cartCount === 1 ? "Item" : "Items"}
                </span>
                <span className="text-[11px] font-medium text-white/70">
                  Total: <span className="text-white font-bold">₹{cartTotal}</span>
                </span>
              </div>
            </div>

            {/* Right section: Action */}
            <div className="flex items-center gap-1 bg-primary group-hover:bg-primary-hover transition-colors rounded-lg md:rounded-xl px-3 py-2 md:px-4 md:py-3 h-full">
              <span className="text-xs md:text-sm font-bold uppercase tracking-wide">View Cart</span>
              <ChevronRight className="w-4 h-4 md:w-4 md:h-4 animate-slide-right" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
