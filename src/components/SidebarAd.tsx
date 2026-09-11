"use client";

import { useEffect } from "react";

interface SidebarAdProps {
  slotId?: string;
  format?: "vertical" | "rectangle";
  className?: string;
}

export default function SidebarAd({ slotId, format = "vertical", className = "" }: SidebarAdProps) {
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        // @ts-expect-error Google ads window object
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch {
      // Ignore if AdSense blocked by user or not configured
    }
  }, []);

  return (
    <aside
      aria-label="Advertisement"
      className={`relative flex flex-col items-center justify-center border border-[#1a1a1a] bg-[#070707] p-3 text-center transition-colors hover:border-[#262626] ${
        format === "vertical" ? "w-[170px] min-h-[500px]" : "w-full min-h-[250px]"
      } ${className}`}
    >
      <span className="absolute top-1.5 right-2 text-[10px] uppercase tracking-wider text-[#404040]">
        Ad
      </span>

      {/* Actual AdSense Slot (active when ca-pub and slot ID are configured) */}
      <ins
        className="adsbygoogle block w-full h-full"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slotId || "1234567890"}
        data-ad-format={format === "vertical" ? "vertical" : "auto"}
        data-full-width-responsive="true"
      />

      {/* Elegant Minimalist Placeholder shown when ads are not yet loaded */}
      <div className="flex flex-col items-center justify-center gap-2 text-xs text-[#444] pointer-events-none select-none my-auto">
        <div className="w-8 h-8 rounded border border-[#1f1f1f] flex items-center justify-center text-[10px] text-[#555]">
          ADS
        </div>
        <span className="text-[11px] text-[#4a4a4a] font-mono">Sponsor Space</span>
        <span className="text-[10px] text-[#333] max-w-[130px] leading-tight">
          Non-intrusive side placement
        </span>
      </div>
    </aside>
  );
}
