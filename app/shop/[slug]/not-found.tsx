import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

/**
 * Shown when `notFound()` fires for an unknown or deactivated product slug,
 * with a real HTTP 404 status.
 *
 * This reproduces the compact inline message the product page used to render for
 * a missing product. Without a segment-scoped not-found, `notFound()` would fall
 * through to the site-wide app/not-found.tsx and replace that message with the
 * full-screen 404 screen — a UX change that fixing the status code does not
 * require.
 *
 * The heading is an <h1>. The old inline version used an <h2>, so that branch
 * rendered a page with no top-level heading at all.
 */
export default function ProductNotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-20 text-center space-y-4">
        <h1 className="text-xl font-bold text-red-600">Product Not Found</h1>
        <p className="text-sm text-brand-gray">
          The product you are looking for does not exist or has been disabled.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back to Shop
        </Link>
      </main>
      <Footer />
    </div>
  );
}
