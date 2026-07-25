"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useSettings } from "@/hooks/useSettings";
import { formatDate } from "@/lib/utils";
import {
  PackageSearch,
  Phone,
  Hash,
  Loader2,
  AlertCircle,
  ClipboardList,
  BadgeCheck,
  Sparkles,
  PackageCheck,
  Truck,
  XCircle,
  ShoppingBag,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";

type TrackedOrder = {
  orderNumber: string;
  customerName: string;
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
  orderType: "shop" | "custom";
  city: string;
  items: { name: string; price: number; quantity: number; image: string; customText?: string }[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
};

const STEPS = [
  { key: "pending", label: "Order Placed", icon: ClipboardList, desc: "We've received your order" },
  { key: "confirmed", label: "Confirmed", icon: BadgeCheck, desc: "Details confirmed with you" },
  { key: "preparing", label: "Crafting", icon: Sparkles, desc: "Being handmade with love" },
  { key: "ready", label: "Ready", icon: PackageCheck, desc: "Packed and ready to ship" },
  { key: "delivered", label: "Delivered", icon: Truck, desc: "Delivered to your door" },
] as const;

const StatusTimeline = ({ status, updatedAt }: { status: TrackedOrder["status"]; updatedAt: string }) => {
  if (status === "cancelled") {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-4 rounded-xl flex items-start gap-3">
        <XCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
        <span className="font-medium">
          This order was cancelled on {formatDate(updatedAt)}. If this is unexpected, please contact us and we&apos;ll sort it out.
        </span>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <ol className="flex flex-col md:flex-row md:items-start gap-0 md:gap-0">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        const Icon = step.icon;
        return (
          <li key={step.key} className="relative flex md:flex-col md:flex-1 md:items-center gap-4 md:gap-2">
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className={`absolute left-5 top-10 h-[calc(100%-1.25rem)] w-0.5 md:left-[calc(50%+1.5rem)] md:right-auto md:top-5 md:h-0.5 md:w-[calc(100%-3rem)] ${
                  done ? "bg-goat-primary" : "bg-brand-border"
                }`}
              />
            )}
            <span
              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors ${
                done || current
                  ? "bg-goat-primary border-goat-primary text-white"
                  : "bg-white border-brand-border text-brand-gray/60"
              } ${current ? "ring-4 ring-goat-primary/15" : ""}`}
            >
              <Icon size={17} />
            </span>
            <div className="pb-8 md:pb-0 md:text-center md:px-1">
              <p className={`text-sm font-bold ${done || current ? "text-brand-black" : "text-brand-gray/70"}`}>
                {step.label}
              </p>
              <p className="text-[11px] text-brand-gray mt-0.5 leading-snug">
                {current ? `${step.desc} · ${formatDate(updatedAt)}` : step.desc}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default function TrackOrderPage() {
  const { settings } = useSettings();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  // Prefill from ?order=… (checkout success links here). Read from
  // window.location instead of useSearchParams to avoid a Suspense boundary.
  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get("order");
    if (fromQuery) setOrderNumber(fromQuery.toUpperCase());
  }, []);

  const whatsapp = settings.contact_whatsapp || "+91 9442379832";
  const whatsappFormatted = whatsapp.replace(/[^\d+]/g, "");
  const whatsappUrl = `https://wa.me/${whatsappFormatted}?text=${encodeURIComponent(
    order ? `Hi Lara's Pinnal, I have a question about my order ${order.orderNumber}.` : "Hi Lara's Pinnal, I need help tracking my order."
  )}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOrder(null);

    const cleanPhone = phone.replace(/\D/g, "");
    if (!orderNumber.trim()) {
      setError("Please enter your order number.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("Enter the 10-digit mobile number you used while ordering.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), phone: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to look up order.");
      } else {
        setOrder(data.order);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 md:px-6 py-7 md:py-12 w-full space-y-10">
        {/* Page Header */}
        <div className="space-y-3 pb-2 text-center mx-auto w-full">
          <span className="flex items-center justify-center gap-2 text-xs font-semibold text-goat-text uppercase tracking-wider">
            <PackageSearch size={14} className="text-goat-primary" /> Order Status
          </span>
          <h1 className="font-display text-3xl sm:text-5xl text-brand-black tracking-wide uppercase">
            Track Your Order
          </h1>
          <p className="text-sm font-medium text-brand-gray max-w-xl mx-auto">
            Enter your order number and the mobile number you used at checkout to see where your handmade order is right now.
          </p>
        </div>

        {/* Lookup Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-brand-light-gray/30 border border-brand-border rounded-2xl p-5 md:p-8 space-y-4 max-w-2xl mx-auto w-full"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="track-order-number" className="text-xs font-bold text-brand-black uppercase tracking-wider block">
                Order Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-gray">
                  <Hash size={16} />
                </div>
                <input
                  id="track-order-number"
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="LPO-20260724-1234"
                  className="w-full h-11 bg-white border border-brand-border rounded-xl pl-10 pr-4 text-sm text-brand-black outline-none focus:ring-2 focus:ring-goat-primary uppercase placeholder:normal-case"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="track-phone" className="text-xs font-bold text-brand-black uppercase tracking-wider block">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-gray">
                  <Phone size={16} />
                </div>
                <input
                  id="track-phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full h-11 bg-white border border-brand-border rounded-xl pl-10 pr-4 text-sm text-brand-black outline-none focus:ring-2 focus:ring-goat-primary"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-xl flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-goat-primary hover:bg-goat-hover disabled:opacity-60 text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Looking up…
              </>
            ) : (
              <>
                <PackageSearch size={16} /> Track Order
              </>
            )}
          </button>
          <p className="text-[11px] text-brand-gray text-center">
            Your order number is in your confirmation email and the message we sent you after checkout.
          </p>
        </form>

        {/* Result */}
        {order && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Summary header */}
            <div className="bg-white border border-brand-border rounded-2xl shadow-card p-5 md:p-8 space-y-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider">Order</p>
                  <h2 className="font-display text-2xl text-brand-black tracking-wide uppercase mt-1">
                    {order.orderNumber}
                  </h2>
                  <p className="text-xs text-brand-gray mt-1">
                    Placed on {formatDate(order.createdAt)} · {order.city}
                    {order.orderType === "custom" && " · Custom order"}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 bg-goat-tint text-goat-text font-bold text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full border border-goat-primary/10">
                  {order.status === "cancelled" ? "Cancelled" : STEPS.find((s) => s.key === order.status)?.label}
                </span>
              </div>

              <StatusTimeline status={order.status} updatedAt={order.updatedAt} />
            </div>

            {/* Items & totals */}
            <div className="bg-white border border-brand-border rounded-2xl shadow-card p-5 md:p-8 space-y-5">
              <h3 className="font-bold text-sm text-brand-black uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag size={15} className="text-goat-primary" /> Items in this order
              </h3>
              <ul className="divide-y divide-brand-border/70">
                {order.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-4 py-3">
                    {item.image ? (
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-brand-border shrink-0">
                        <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-goat-tint flex items-center justify-center shrink-0">
                        <ShoppingBag size={18} className="text-goat-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-brand-black truncate">{item.name}</p>
                      <p className="text-xs text-brand-gray mt-0.5">
                        Qty {item.quantity} × ₹{item.price.toLocaleString("en-IN")}
                      </p>
                      {item.customText && (
                        <p className="text-[11px] text-brand-gray italic truncate">“{item.customText}”</p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-brand-black shrink-0">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="border-t border-brand-border pt-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-brand-gray">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-brand-gray">
                  <span>Delivery</span>
                  <span>{order.deliveryFee === 0 ? "Free" : `₹${order.deliveryFee.toLocaleString("en-IN")}`}</span>
                </div>
                <div className="flex justify-between font-bold text-brand-black text-base pt-1">
                  <span>Total</span>
                  <span>₹{order.totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="bg-brand-light-gray/30 border border-brand-border rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-brand-gray font-medium text-center sm:text-left">
                Question about this order? Message us with your order number and we&apos;ll reply quickly.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold py-2.5 px-5 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm text-xs shrink-0"
              >
                <FaWhatsapp size={16} /> Chat on WhatsApp
              </a>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
