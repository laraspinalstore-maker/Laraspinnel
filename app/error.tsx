"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

/**
 * Route error boundary.
 *
 * The app had none, so any thrown render error — a failed database read on a
 * server component, a null dereference in a client one — fell through to Next's
 * built-in error screen: an unstyled page in development and a bare "Application
 * error: a client-side exception has occurred" in production. A crawler hitting
 * that got a 500 with no navigation and no way back into the site.
 *
 * Deliberately NOT `notFound()`-adjacent: a 500 is not a 404, and telling Google
 * a transient database failure means "this page does not exist" would drop live
 * URLs from the index. Next serves this boundary with a 500 status, which is the
 * correct signal — Google retries a 500 and keeps the URL.
 *
 * `error.digest` is the only detail available in production; the message and
 * stack are stripped server-side before reaching the browser. It is logged so a
 * user-reported failure can be matched to a server log line, and shown in the UI
 * for the same reason.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[error-boundary]", error.digest ?? "", error.message);
  }, [error]);

  return (
    <>
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex flex-col items-center justify-center min-h-[70vh] bg-brand-light-gray/30 px-6 py-20 text-center"
      >
        <div className="max-w-xl mx-auto space-y-8">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
            <div className="relative bg-white border border-brand-border shadow-xl rounded-full w-full h-full flex items-center justify-center text-primary">
              <AlertTriangle size={56} strokeWidth={1.5} aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-4xl md:text-5xl text-brand-black tracking-tight">
              Something went wrong
            </h1>
            <p className="text-base text-brand-gray/80 font-medium max-w-md mx-auto leading-relaxed">
              This page could not be loaded. It is most likely temporary — trying
              again usually works. If it keeps happening, please contact us and
              quote the reference below.
            </p>
            {error.digest && (
              <p className="text-xs text-brand-gray font-mono">
                Reference: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-brand-black text-white hover:bg-primary hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 font-semibold w-full sm:w-auto"
            >
              <RotateCcw size={18} aria-hidden="true" />
              <span>Try Again</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-white text-brand-black border-2 border-brand-black/10 hover:border-brand-black hover:bg-brand-black hover:text-white transition-all duration-300 font-semibold w-full sm:w-auto"
            >
              <Home size={18} aria-hidden="true" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
