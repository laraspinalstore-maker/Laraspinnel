import React from "react";

/**
 * Decorative floral flourish used beside section eyebrows on the About page.
 *
 * This lived in `components/about/AboutHero.tsx`, whose default-exported hero
 * section was never rendered by any route — `app/about/page.tsx` composes
 * StorySection, ReelsSection, AboutReviews and FinalCTA. That module was kept
 * alive purely because three other components imported this one function from it,
 * so the dead hero (and its framer-motion and next/image imports) shipped along
 * with it. Deleted; the doodle now stands alone.
 *
 * `aria-hidden` because it carries no information — the heading beside it does.
 * Not a client component: it renders no hooks and no interactivity.
 */
export function FloralDoodle({ className = "text-rose-text/70" }: { className?: string }) {
  return (
    <svg
      width="28"
      height="14"
      viewBox="0 0 28 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ml-2 ${className}`}
      aria-hidden="true"
    >
      <path
        d="M1 7C5 7 8 4 10 1C10 5 12 7 16 7C12 7 10 9 10 13C8 10 5 7 1 7Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 7C19 7 21 5 23 3C23 6 24.5 7 27.5 7C24.5 7 23 8 23 11C21 9 19 7 16 7Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default FloralDoodle;
