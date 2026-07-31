"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { ChevronRight } from "lucide-react";

export default function SwipeButton({ onSwipeComplete, text = "Slide to Review" }: { onSwipeComplete: () => void, text?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const controls = useAnimation();
  
  // The thumb is 40px wide (w-10)
  const thumbWidth = 40;

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDragEnd = async (event: any, info: any) => {
    const threshold = containerWidth - 48; // 40px thumb + 4px left + 4px right padding
    
    if (info.offset.x >= threshold * 0.75) {
      // Complete!
      await controls.start({ x: threshold }); // snap exactly to the end padding
      onSwipeComplete();
      
      // Reset after a delay so it's ready if modal closes
      setTimeout(() => {
        controls.start({ x: 0 });
      }, 500);
    } else {
      // Snap back
      controls.start({ x: 0 });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-12 bg-primary rounded-full flex items-center justify-center overflow-hidden shadow-sm"
    >
      <span className="text-white/70 font-bold uppercase tracking-widest text-xs z-0 pointer-events-none pl-6">
        {text}
      </span>
      
      {containerWidth > 0 && (
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: containerWidth - 48 }}
          dragElastic={0.05}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          animate={controls}
          className="absolute left-1 top-1 w-10 h-10 bg-white rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing z-10 shadow-sm"
        >
          <ChevronRight size={18} className="text-primary ml-0.5" />
        </motion.div>
      )}
    </div>
  );
}
