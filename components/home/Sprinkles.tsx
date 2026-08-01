"use client";

import { motion } from "framer-motion";
import { hexToRgba } from "@/lib/utils";
import { seededRandom } from "@/lib/animation/seededRandom";

const SPRINKLE_COUNT = 20;

/**
 * Falling sprinkles behind the footer banner.
 *
 * Same change as FloatingPaper: the per-particle randomness is seeded by index and
 * evaluated once at module load instead of on every render, so the component no
 * longer needs `mounted` state and an effect to stay hydration-safe. See
 * lib/animation/seededRandom.ts.
 */
interface Sprinkle {
  x: number;
  delay: number;
  duration: number;
  size: number;
}

const SPRINKLES: Sprinkle[] = Array.from({ length: SPRINKLE_COUNT }, (_, i) => {
  const r = (salt: number) => seededRandom(i * 53 + salt);
  return {
    x: r(1) * 100,
    delay: r(2) * 5,
    // 4 to 8 seconds to fall the height of the container.
    duration: 4 + r(3) * 4,
    size: r(4) > 0.5 ? 4 : 6,
  };
});

export default function Sprinkles({ colorHex }: { colorHex: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-4xl z-10"
    >
      {SPRINKLES.map((sprinkle, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: sprinkle.size,
            height: sprinkle.size,
            backgroundColor: colorHex,
            boxShadow: `0 0 10px ${hexToRgba(colorHex, 0.8)}, 0 0 20px ${hexToRgba(colorHex, 0.4)}`,
            left: `${sprinkle.x}%`,
          }}
          initial={{ top: "-10%", opacity: 0 }}
          animate={{
            top: ["-10%", "110%"],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: sprinkle.duration,
            repeat: Infinity,
            delay: sprinkle.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
