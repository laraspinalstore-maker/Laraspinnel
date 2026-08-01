"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { hexToRgba } from "@/lib/utils";
import { seededRandom } from "@/lib/animation/seededRandom";

const PAPER_COUNT = 30;

/**
 * Confetti burst behind the footer banner.
 *
 * Every particle's geometry used to be `Math.random()` evaluated inside the map
 * callback, which meant it was recomputed on each render, differed between server
 * and client, and needed a `mounted` state flag plus an effect to avoid a
 * hydration mismatch. The values are now seeded by index and computed once at
 * module load — see lib/animation/seededRandom.ts. Same look, no state, no
 * effect, and the animation no longer restarts when the parent re-renders.
 *
 * Two dead locals went with it: `startY` and `finalY` were computed and never
 * used, the second one carrying a "Fly upwards then fall? Or crash downwards?"
 * comment — the vertical path is defined inline in `animate.top` below.
 */
interface Paper {
  /** Horizontal start and end, in percent of the container. */
  startX: number;
  midX: number;
  endX: number;
  /** Peak height of the burst, in percent (negative is above the container). */
  peakY: number;
  scale: number;
  rotation: number;
  spinDirection: 1 | -1;
  duration: number;
  delay: number;
  repeatDelay: number;
  isSmall: boolean;
}

const PAPERS: Paper[] = Array.from({ length: PAPER_COUNT }, (_, i) => {
  const r = (salt: number) => seededRandom(i * 101 + salt);
  const midX = r(1) * 100;
  return {
    startX: 50 + (r(2) * 20 - 10),
    midX,
    endX: midX + (r(3) * 40 - 20),
    peakY: -20 + r(4) * 80,
    scale: 0.3 + r(5) * 0.9,
    rotation: r(6) * 720,
    spinDirection: r(7) > 0.5 ? 1 : -1,
    duration: 4 + r(8) * 4,
    delay: r(9) * 0.4,
    repeatDelay: 1 + r(10) * 3,
    isSmall: r(11) > 0.5,
  };
});

export default function FloatingPaper({ colorHex }: { colorHex: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" });

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-4xl z-10 perspective-1000"
    >
      {isInView &&
        PAPERS.map((paper, i) => (
          <motion.div
            key={i}
            initial={{
              left: `${paper.startX}%`,
              top: "110%",
              scale: 0,
              rotate: 0,
              opacity: 0,
            }}
            animate={{
              // Burst up past the top of the container, then fall back through it.
              top: ["100%", `${paper.peakY}%`, "120%"],
              left: [`${paper.startX}%`, `${paper.midX}%`, `${paper.endX}%`],
              rotate: [0, paper.rotation, paper.rotation + 720 * paper.spinDirection],
              scale: [0, paper.scale, paper.scale],
              opacity: [0, 1, 0.8, 0],
            }}
            transition={{
              duration: paper.duration,
              ease: [0.2, 0.8, 0.2, 1],
              // Peak height is reached quickly, the fall is slow.
              times: [0, 0.2, 1],
              repeat: Infinity,
              repeatDelay: paper.repeatDelay,
              delay: paper.delay,
            }}
            className={`absolute ${paper.isSmall ? "w-3 h-4" : "w-5 h-7"} rounded-xs shadow-sm backdrop-blur-md`}
            style={{
              backgroundColor: hexToRgba(colorHex, 0.25),
              border: `1px solid ${hexToRgba(colorHex, 0.4)}`,
              boxShadow: `0 10px 30px ${hexToRgba(colorHex, 0.2)}, inset 0 0 10px rgba(255,255,255,0.6)`,
            }}
          />
        ))}
    </div>
  );
}
