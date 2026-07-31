"use client";

import React from "react";
import { Heart, ShieldCheck, Sparkles, Truck, Tag } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { CONTENT_DEFAULTS, DEFAULT_WHY_STEPS, parseList, WhyStep } from "@/lib/siteContent";

const STEP_ICONS = [
  <Heart key="h" size={30} className="text-primary" />,
  <ShieldCheck key="s" size={30} className="text-primary" />,
  <Sparkles key="sp" size={30} className="text-primary" />,
  <Truck key="t" size={30} className="text-primary" />,
  <Tag key="tg" size={30} className="text-primary" />,
];

export default function HowItWorks() {
  const { settings } = useSettings();
  const whyTitle = settings.home_why_title || CONTENT_DEFAULTS.home_why_title;
  const whySubtitle = settings.home_why_subtitle || CONTENT_DEFAULTS.home_why_subtitle;

  const steps = parseList<WhyStep>(settings.home_why_steps, DEFAULT_WHY_STEPS).map((s, i) => ({
    number: String(i + 1),
    title: s.title,
    description: s.desc,
    icon: STEP_ICONS[i % STEP_ICONS.length],
  }));

  return (
    <section className="py-20 bg-brand-light-gray">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-16">
        {/* Header row */}
        <div className="pb-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl text-brand-black tracking-wide uppercase">
              {whyTitle}
            </h2>
            <p className="text-sm font-medium text-brand-gray mt-2">
              {whySubtitle}
            </p>
          </div>
        </div>

        <style>{`
          @keyframes marquee-steps {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-steps {
            animation: marquee-steps 25s linear infinite;
          }
          @keyframes dotMove {
            0% { left: 0%; opacity: 0; }
            5% { opacity: 1; }
            70% { opacity: 1; }
            75% { left: 100%; opacity: 0; }
            100% { left: 100%; opacity: 0; }
          }
          @keyframes iconZoom {
            0%, 20%, 100% { transform: scale(1); border-color: rgba(143, 168, 138, 0.1); box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
            5% { transform: scale(1.15); border-color: rgba(143, 168, 138, 1); box-shadow: 0 4px 15px rgba(143, 168, 138, 0.4); }
          }
          .animate-dot-move {
            animation: dotMove 15s linear infinite;
          }
          .animate-icon-zoom {
            animation: iconZoom 15s infinite;
          }
          
          /* Mobile specific animations */
          .animate-dot-move-mobile {
            animation: dotMove 25s linear infinite;
          }
          .animate-icon-zoom-mobile {
            animation: iconZoom 25s infinite;
          }
        `}</style>

        {/* Desktop View */}
        <div className="hidden md:grid grid-cols-5 gap-6 relative pt-10">
          {/* Connector Line with Moving Dot */}
          <div className="absolute top-18 left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-primary/25 z-0">
            <div className="absolute -top-1.25 w-2 h-2 rounded-full bg-primary animate-dot-move shadow-[0_0_8px_rgba(143,168,138,0.8)]"></div>
          </div>

          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center space-y-4 relative z-10 group"
            >
              <div
                className="w-16 h-16 rounded-full bg-primary-tint border border-primary/10 flex items-center justify-center relative shadow-sm transition-transform duration-200 animate-icon-zoom"
                style={{ animationDelay: `${idx * 3}s` }}
              >
                {step.icon}
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-black text-white text-[10px] font-bold flex items-center justify-center">
                  {step.number}
                </span>
              </div>
              <div className="space-y-1 max-w-xs">
                <h3 className="font-display font-extrabold text-brand-black text-sm sm:text-base">
                  {step.title}
                </h3>
                <p className="text-xs text-brand-gray font-medium leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View - Marquee */}
        <div className="flex md:hidden overflow-hidden -mx-4 px-4 pt-14 pb-4 mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex animate-marquee-steps w-max" style={{ willChange: 'transform' }}>
            {[1, 2].map((setIndex) => (
              <div key={setIndex} className="flex gap-12 relative shrink-0 pr-12">
                {/* Connector Line with Moving Dot for Mobile */}
                <div className="absolute top-8 left-27.5 right-39.5 h-0.5 border-t-2 border-dashed border-primary/25 z-0">
                  <div className="absolute -top-1.25 w-2 h-2 rounded-full bg-primary animate-dot-move-mobile shadow-[0_0_8px_rgba(143,168,138,0.8)]" style={{ animationDelay: '-1.6s' }}></div>
                </div>

                {steps.map((step, idx) => (
                  <div
                    key={`${setIndex}-${idx}`}
                    className="flex flex-col items-center text-center space-y-4 relative z-10 group shrink-0 w-45"
                  >
                    <div
                      className="w-16 h-16 rounded-full bg-primary-tint border border-primary/10 flex items-center justify-center relative shadow-sm transition-transform duration-200 animate-icon-zoom-mobile"
                      style={{ animationDelay: `${(idx * 5) - 1.6}s` }}
                    >
                      {step.icon}
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-black text-white text-[10px] font-bold flex items-center justify-center">
                        {step.number}
                      </span>
                    </div>
                    <div className="space-y-1 max-w-xs whitespace-normal">
                      <h3 className="font-display font-extrabold text-brand-black text-sm sm:text-base">
                        {step.title}
                      </h3>
                      <p className="text-xs text-brand-gray font-medium leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
