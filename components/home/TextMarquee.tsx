import React from "react";
import {
  Hand,
  Palette,
  Gem,
  Baby,
  Truck,
  type LucideIcon,
} from "lucide-react";

// Icon-name → Lucide component. Keeps page-level items as plain data (RSC-safe),
// no JSX crosses the server/client boundary.
const ICON_MAP: Record<string, LucideIcon> = {
  hand: Hand,
  palette: Palette,
  gem: Gem,
  baby: Baby,
  truck: Truck,
};

export type MarqueeItem = string | { label: string; icon?: string };

interface TextMarqueeProps {
  items: MarqueeItem[];
  bgColor?: string;
  textColor?: string;
  dividerColor?: string;
  borderColor?: string;
}

export default function TextMarquee({
  items,
  bgColor = "bg-brand-black",
  textColor = "text-white",
  dividerColor = "text-white/30",
  borderColor = "border-brand-border/10",
}: TextMarqueeProps) {
  const fadeFrom = bgColor.replace("bg-", "from-");

  return (
    <div className={`relative overflow-hidden py-5 px-4 md:px-6 flex items-center border-t ${borderColor} ${bgColor}`}>
      {/* Edge fade overlays */}
      <div className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-24 md:w-48 bg-linear-to-r ${fadeFrom} to-transparent`} />
      <div className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-24 md:w-48 bg-linear-to-l ${fadeFrom} to-transparent`} />

      {/* Keyframes + reduced-motion handling live in globals.css (.animate-marquee-text) */}
      <div className="flex animate-marquee-text whitespace-nowrap w-max items-center">
        {[1, 2].map((setIndex) => (
          <div key={setIndex} className="flex items-center">
            {items.map((item, idx) => {
              const label = typeof item === "string" ? item : item.label;
              const iconKey = typeof item === "string" ? undefined : item.icon;
              const Icon = iconKey ? ICON_MAP[iconKey] : undefined;
              return (
                <div key={`${setIndex}-${idx}`} className="flex items-center">
                  <span className={`inline-flex items-center gap-2.5 font-display text-3xl md:text-3xl tracking-widest uppercase mx-8 ${textColor}`}>
                    {Icon && (
                      <Icon
                        aria-hidden="true"
                        strokeWidth={1.75}
                        className="w-7 h-7 shrink-0"
                      />
                    )}
                    {label}
                  </span>
                  <span className={`text-xl ${dividerColor}`}>•</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
