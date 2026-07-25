"use client";

import React from "react";
import { motion } from "framer-motion";

/* Shared fade-up entrance for About page sections. Reduced motion is handled
   globally by the page's <MotionConfig reducedMotion="user">. */
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
