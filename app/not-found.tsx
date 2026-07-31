"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, MapPinOff } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center min-h-[70vh] bg-brand-light-gray/30 px-6 py-20 text-center">
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-700">
          {/* Icon Container */}
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse blur-xl"></div>
            <div className="relative bg-white border border-brand-border shadow-xl rounded-full w-full h-full flex items-center justify-center text-primary">
              <MapPinOff size={56} strokeWidth={1.5} />
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-4">
            <h1 className="font-display text-7xl md:text-8xl text-brand-black tracking-tight drop-shadow-sm">
              404
            </h1>
            <h2 className="font-display text-2xl md:text-2xl md:text-3xl text-brand-black">
              Oops! This thread came unravelled.
            </h2>
            <p className="text-base text-brand-gray/80 font-medium max-w-md mx-auto leading-relaxed">
              We couldn&apos;t find the page you were looking for. It might have been moved, deleted, or perhaps you just took a wrong turn.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-brand-black text-white hover:bg-primary hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 font-semibold w-full sm:w-auto"
            >
              <Home size={18} />
              <span>Back to Home</span>
            </Link>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.history.back();
                }
              }}
              className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-white text-brand-black border-2 border-brand-black/10 hover:border-brand-black hover:bg-brand-black hover:text-white transition-all duration-300 font-semibold w-full sm:w-auto"
            >
              <ArrowLeft size={18} />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
