"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * LazySection — defers mounting (and therefore chunk download + hydration) of
 * its children until the wrapper scrolls near the viewport.
 *
 * The below-fold homepage sections are already code-split via next/dynamic,
 * but a dynamic component still fetches and executes its chunk the moment it
 * renders. Wrapping each section in LazySection means those chunks only load
 * as the visitor scrolls, keeping the initial main-thread work (TBT/TTI) to
 * what's actually on screen.
 *
 * `className` should carry the same min-height as the section's loading
 * placeholder so nothing shifts when the real content mounts (CLS-safe).
 */
export default function LazySection({
  children,
  className,
  rootMargin = "700px 0px",
}: {
  children: React.ReactNode;
  className?: string;
  /** How early to mount before the section enters the viewport. */
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // No observer support: show everything. Queued rather than set inline —
      // a synchronous setState here would render twice before the first paint,
      // and this branch cannot be resolved during render because the server has
      // no IntersectionObserver either, which would flip the initial HTML.
      const id = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} className={visible ? undefined : className}>
      {visible ? children : null}
    </div>
  );
}
