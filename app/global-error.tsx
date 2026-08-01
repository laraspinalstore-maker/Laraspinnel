"use client";

import React from "react";

/**
 * Last-resort boundary for errors thrown by the ROOT LAYOUT itself.
 *
 * `app/error.tsx` renders as a child of the root layout, so it cannot catch a
 * failure in that layout — `generateMetadata`, `getSeoSettings`, or the schema
 * graph. This one replaces the whole document instead, which is why it must
 * render its own `<html>` and `<body>`.
 *
 * Styling is inline on purpose. This boundary substitutes for the root layout, so
 * the stylesheet that layout imports is not guaranteed to be applied — Tailwind
 * class names here would be a page with no styling at all. The subset of design
 * tokens used below is duplicated from globals.css deliberately; keeping this
 * file self-contained is worth more than sharing values with a stylesheet it
 * cannot rely on.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[global-error]", error.digest ?? "", error.message);
  }, [error]);

  return (
    <html lang="en-IN">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          color: "#1a1a1a",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "1.5rem",
        }}
      >
        <main
          style={{ maxWidth: "32rem", textAlign: "center" }}
          id="main-content"
          tabIndex={-1}
        >
          <h1 style={{ fontSize: "1.875rem", lineHeight: 1.2, margin: "0 0 1rem" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.6, color: "#555555", margin: "0 0 1.5rem" }}>
            The site could not be loaded. This is almost always temporary. Please
            try again, and quote the reference below if it persists.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: "0.75rem",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                color: "#777777",
                margin: "0 0 1.5rem",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                cursor: "pointer",
                border: "none",
                borderRadius: "9999px",
                padding: "0.875rem 2rem",
                fontSize: "1rem",
                fontWeight: 600,
                backgroundColor: "#1a1a1a",
                color: "#ffffff",
              }}
            >
              Try Again
            </button>
            {/* A plain anchor, deliberately. This boundary replaces the root
                layout, so the router this page would need for a client-side
                <Link> navigation is part of what may have failed. A full
                document load is the only reliable way out of here. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                borderRadius: "9999px",
                padding: "0.875rem 2rem",
                fontSize: "1rem",
                fontWeight: 600,
                border: "2px solid rgba(26,26,26,0.1)",
                color: "#1a1a1a",
                textDecoration: "none",
              }}
            >
              Back to Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
