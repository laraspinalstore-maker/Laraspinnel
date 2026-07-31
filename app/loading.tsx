"use client";

import React from "react";
import useSWR from "swr";
import Image from "next/image";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Loading() {
  const { data: settings = {} } = useSWR("/api/settings", fetcher);
  
  // Show the bundled logo immediately — the loading screen is transient and
  // waiting on /api/settings meant the text fallback usually showed instead.
  // The admin-configured logo takes over as soon as settings arrive.
  const logoUrl = settings.logo_url || "/logo.png";
  const farmName = settings.farm_name || "LARA'S PINNAL";

  return (
    <div className="fixed inset-0 z-9999 bg-white flex flex-col items-center justify-center min-h-screen">
      <div className="relative flex flex-col items-center justify-center">
        {/* Outer Pulsing Effect */}
        <div className="absolute w-32 h-32 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] bg-primary/20" />
        
        {/* Spinning Elegant Ring */}
        <div className="absolute w-36 h-36 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin" />
        <div className="absolute w-36 h-36 border-4 border-brand-light-gray/30 rounded-full" />
        
        {/* Logo Container */}
        <div className="relative z-10 w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.05)] overflow-hidden p-4">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={farmName}
                fill
                className="object-contain p-4"
                sizes="112px"
                priority
              />
            ) : (
             <span className="font-display text-2xl tracking-wider text-brand-black uppercase text-center leading-none">
               {farmName}
             </span>
           )}
        </div>
      </div>
      
      <div className="mt-14 flex flex-col items-center gap-2">
        <p className="text-sm font-bold text-primary tracking-[0.3em] uppercase">
          Loading
        </p>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
