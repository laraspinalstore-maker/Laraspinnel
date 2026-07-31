"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Quote, Users, MapPin, ShieldCheck, ChevronLeft, ChevronRight, Star } from "lucide-react";
import useSWR from "swr";
import { X, CheckCircle2, Loader2 } from "lucide-react";
import SwipeButton from "@/components/shared/SwipeButton";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const ReviewCard = ({ rev, className = "" }: { rev: any; className?: string }) => (
  <div className={`bg-white p-5 md:p-6 rounded-2xl border border-brand-border shadow-card flex flex-col justify-between relative group hover:-translate-y-0.5 transition-transform duration-200 h-full ${className}`}>
    <Quote className="text-primary/10 absolute top-5 right-5 group-hover:scale-105 transition-transform" size={36} />

    {/* Review Text */}
    <div className="space-y-4">
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={16} className={i < (rev.rating || 5) ? "text-gold-primary fill-gold-primary" : "text-brand-gray/30"} />
        ))}
      </div>
      <div className="text-xs text-brand-gray leading-relaxed relative z-10 space-y-3">
        <p className="text-justify line-clamp-2"><strong className="text-brand-black">Goal:</strong> {rev.goal}</p>
        <p className="text-justify line-clamp-4"><strong className="text-brand-black">Outcome:</strong> {rev.outcome}</p>
      </div>
    </div>

    {/* Customer Info */}
    <div className="flex items-center gap-3 pt-6 border-t border-brand-border mt-6">
      <div className="w-10 h-10 rounded-full bg-primary-tint text-primary-text font-bold text-sm flex items-center justify-center border border-primary/10 shrink-0">
        {rev.initial}
      </div>
      <div>
        <h3 className="font-semibold text-brand-black text-sm">{rev.name}</h3>
        <p className="text-[10px] text-brand-gray mt-0.5 font-medium">{rev.location}</p>
      </div>
    </div>
  </div>
);

const AddReviewModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [formData, setFormData] = useState({ name: "", location: "", goal: "", outcome: "", rating: 5, refId: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
      } else {
        setErrorMessage(data.error || "Failed to submit review");
        setStatus("error");
      }
    } catch (err) {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-4 sm:p-8 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-brand-light-gray rounded-full text-brand-gray hover:text-brand-black transition-colors z-10">
          <X size={20} />
        </button>

        {status === "success" ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-2xl font-display uppercase tracking-wide text-brand-black">Thank You!</h3>
            <p className="text-brand-gray">Your review has been submitted and is pending approval.</p>
            <button onClick={onClose} className="mt-4 px-6 py-3 bg-brand-black text-white rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-neutral-800 transition-colors">
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-display text-2xl uppercase tracking-wide text-brand-black mb-1">Write a Review</h3>
            <p className="text-sm text-brand-gray mb-6">Share your experience with Lara's Pinnal.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center gap-1 mb-4">
                <label className="text-xs font-bold text-brand-black uppercase tracking-wider">Rating</label>
                <div className="flex gap-1 justify-center">
                  {[...Array(5)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: i + 1 })}
                      className="focus:outline-none transition-transform active:scale-90"
                    >
                      <Star size={32} className={i < formData.rating ? "text-gold-primary fill-gold-primary" : "text-brand-gray/30"} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-black uppercase tracking-wider pl-1">Name *</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-brand-border bg-brand-light-gray/30 outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black transition-all text-sm" placeholder="e.g. Ramesh Kumar" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-black uppercase tracking-wider pl-1">Location *</label>
                  <input required type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-brand-border bg-brand-light-gray/30 outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black transition-all text-sm" placeholder="e.g. Villupuram, TN" />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-black uppercase tracking-wider pl-1">Order Ref ID *</label>
                <input required type="text" value={formData.refId} onChange={(e) => setFormData({ ...formData, refId: e.target.value })} className="w-full h-12 px-4 rounded-xl border border-brand-border bg-brand-light-gray/30 outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black transition-all text-sm uppercase" placeholder="e.g. BKG-12345" />
                <p className="text-[10px] text-brand-gray pl-1">Found in your booking confirmation SMS/Email.</p>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-black uppercase tracking-wider pl-1">Goal *</label>
                <textarea required rows={2} value={formData.goal} onChange={(e) => setFormData({ ...formData, goal: e.target.value })} className="w-full p-4 rounded-xl border border-brand-border bg-brand-light-gray/30 outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black transition-all text-sm resize-none" placeholder="What were you looking for? (e.g., A custom crochet flower bouquet)"></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-black uppercase tracking-wider pl-1">Outcome *</label>
                <textarea required rows={3} value={formData.outcome} onChange={(e) => setFormData({ ...formData, outcome: e.target.value })} className="w-full p-4 rounded-xl border border-brand-border bg-brand-light-gray/30 outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black transition-all text-sm resize-none" placeholder="Tell us about the result..."></textarea>
              </div>

              {status === "error" && <p className="text-red-500 text-xs font-medium text-center bg-red-50 p-2 rounded-lg">{errorMessage}</p>}

              <button type="submit" disabled={status === "loading"} className="w-full h-12 bg-primary text-white font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mt-4">
                {status === "loading" ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : "Submit Review"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default function Testimonials() {
  const { data: settings = {} } = useSWR("/api/settings", fetcher);
  const { data: testimonials = [] } = useSWR("/api/testimonials", fetcher);
  
  const reviews = testimonials.length > 0 ? testimonials : [
    {
      name: "Ramesh Kumar",
      location: "Coimbatore, TN",
      goal: "Ordering a custom crochet flower bouquet for a large family celebration.",
      outcome: "Exceptional craftsmanship delivered right on time in perfect condition. Lara's Pinnal provided the most reliable handmade-to-door service we've experienced.",
      initial: "R",
      rating: 5,
    },
    {
      name: "Revathi S.",
      location: "Villupuram, TN",
      goal: "Finding a reliable source for personalized crochet gift hampers.",
      outcome: "Beautifully finished pieces delivered in lovely gift-ready packaging. Lara's Pinnal is now our default choice for all handmade gifts.",
      initial: "R",
      rating: 5,
    },
    {
      name: "Mohamed Asif",
      location: "Tiruppur, TN",
      goal: "Commissioning custom amigurumi plush toys and keychains as gifts.",
      outcome: "The team helped choose the perfect colors and yarn and provided thoughtful guidance. Very professional service with honest, transparent pricing.",
      initial: "M",
      rating: 5,
    },
  ];

  const [visibleItems, setVisibleItems] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const updateVisible = () => {
      if (window.innerWidth >= 1024) setVisibleItems(3);
      else if (window.innerWidth >= 768) setVisibleItems(2);
      else setVisibleItems(1);
    };
    updateVisible();
    window.addEventListener("resize", updateVisible);
    return () => window.removeEventListener("resize", updateVisible);
  }, []);

  const maxSlide = Math.max(0, reviews.length - visibleItems);

  useEffect(() => {
    if (currentSlide > maxSlide) {
      setCurrentSlide(maxSlide);
    }
  }, [maxSlide, currentSlide]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev >= maxSlide ? 0 : prev + 1));
  }, [maxSlide]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev <= 0 ? maxSlide : prev - 1));
  }, [maxSlide]);

  useEffect(() => {
    // Don't auto-advance for reduced-motion users, or when nothing to scroll.
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || maxSlide === 0) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, maxSlide]);

  return (
    <section className="py-20 bg-brand-light-gray">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-16">
        {/* Header row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between pb-6 gap-4 md:gap-8">
          <div className="md:pr-6">
            <h2 className="font-display text-2xl md:text-3xl text-brand-black tracking-wide uppercase">
              {settings.home_testimonials_title || "What Our Customers Say"}
            </h2>
            <p className="text-sm font-medium text-brand-gray mt-1 text-justify md:text-left">
              {settings.home_testimonials_subtitle || "Stories of satisfaction from gift-givers, families, and loyal customers."}
            </p>
            <p className="text-sm font-medium text-brand-gray mt-1 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-primary" /> Verified Purchases Only
            </p>
          </div>

          <div className="w-full md:w-auto md:min-w-50">
            <div className="hidden sm:block">
              <button onClick={() => setIsModalOpen(true)} className="px-8 py-3 w-full bg-primary border-2 border-transparent text-white font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-primary-hover transition-all shadow-sm active:scale-95">
                Add Your Review
              </button>
            </div>
            <div className="block sm:hidden w-full">
              <SwipeButton onSwipeComplete={() => setIsModalOpen(true)} text="Slide to Review" />
            </div>
          </div>
        </div>

        {/* Content & Badges Wrapper */}
        <div className="space-y-8">
        {/* Carousel for all devices */}
        <div className="relative -mx-4 overflow-hidden py-2">
          <div 
            className="flex transition-transform duration-500 ease-in-out items-stretch"
            style={{ transform: `translateX(-${currentSlide * (100 / visibleItems)}%)` }}
          >
            {reviews.map((rev: any, idx: number) => (
              <div key={idx} className="w-full md:w-1/2 lg:w-1/3 shrink-0 px-4 pb-2 h-auto">
                <ReviewCard rev={rev} />
              </div>
            ))}
          </div>

          {/* Controls */}
          {maxSlide > 0 && (
            <div className="flex items-center justify-center gap-5 mt-6">
              <button 
                onClick={prevSlide}
                aria-label="Previous slide"
                className="w-11 h-11 rounded-full bg-white border border-brand-border flex items-center justify-center text-brand-black shadow-sm active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-black"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex gap-2.5">
                {[...Array(maxSlide + 1)].map((_, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className="p-2 -m-2"
                    aria-label={`Go to slide ${idx + 1}`}
                  >
                    <div className={`h-2.5 rounded-full transition-all duration-300 ${
                      currentSlide === idx ? "w-8 bg-brand-black" : "w-2.5 bg-brand-border"
                    }`} />
                  </button>
                ))}
              </div>

              <button 
                onClick={nextSlide}
                aria-label="Next slide"
                className="w-11 h-11 rounded-full bg-white border border-brand-border flex items-center justify-center text-brand-black shadow-sm active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-black"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Trust Badges Strip */}
        <div>
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee {
              animation: marquee 12s linear infinite;
            }
          `}</style>
          
          {/* Desktop View */}
          <div className="hidden sm:flex flex-wrap items-center justify-center gap-6">
            <span className="inline-flex shrink-0 items-center gap-2 bg-white px-4 py-2 rounded-full border border-brand-border text-brand-black font-semibold text-xs shadow-xs transition-colors hover:bg-neutral-50 cursor-default">
              <Users size={15} className="text-primary shrink-0" />
              <span className="whitespace-nowrap">{settings.home_stat_1 || "500+ Happy Customers"}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-2 bg-white px-4 py-2 rounded-full border border-brand-border text-brand-black font-semibold text-xs shadow-xs transition-colors hover:bg-neutral-50 cursor-default">
              <MapPin size={15} className="text-primary shrink-0" />
              <span className="whitespace-nowrap">{settings.home_stat_2 || "Ships Across India"}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-2 bg-white px-4 py-2 rounded-full border border-brand-border text-brand-black font-semibold text-xs shadow-xs transition-colors hover:bg-neutral-50 cursor-default">
              <ShieldCheck size={15} className="text-primary shrink-0" />
              <span className="whitespace-nowrap">{settings.home_stat_3 || "Handmade Quality Guaranteed"}</span>
            </span>
          </div>

          {/* Mobile View - Marquee */}
          <div className="flex sm:hidden relative overflow-hidden whitespace-nowrap -mx-4 px-4">
            {/* Blurry fade overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-brand-light-gray to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-brand-light-gray to-transparent z-10" />
            
            <div className="flex animate-marquee w-max">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3 pr-3 shrink-0">
                  <span className="inline-flex shrink-0 items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-brand-border text-brand-black font-semibold text-[11px] shadow-xs cursor-default">
                    <Users size={15} className="text-primary shrink-0" />
                    <span className="whitespace-nowrap">{settings.home_stat_1 || "500+ Happy Customers"}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-brand-border text-brand-black font-semibold text-[11px] shadow-xs cursor-default">
                    <MapPin size={15} className="text-primary shrink-0" />
                    <span className="whitespace-nowrap">{settings.home_stat_2 || "Ships Across India"}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-brand-border text-brand-black font-semibold text-[11px] shadow-xs cursor-default">
                    <ShieldCheck size={15} className="text-primary shrink-0" />
                    <span className="whitespace-nowrap">{settings.home_stat_3 || "Handmade Quality Guaranteed"}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
      <AddReviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
