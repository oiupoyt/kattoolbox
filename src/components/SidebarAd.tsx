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
      // Ignore if AdSense blocked by client
    }
  }, []);

  return (
    <aside
      aria-label="Advertisement"
      className={`relative flex flex-col items-center justify-center border border-[#161616] bg-[#070707] p-2 text-center transition-colors hover:border-[#222] ${
        format === "vertical" ? "w-[170px] min-h-[500px]" : "w-full min-h-[250px]"
      } ${className}`}
    >
      <span className="absolute top-1.5 right-2 text-[9px] uppercase tracking-wider text-[#333]">
        Ad
      </span>

      {/* Google AdSense Unit */}
      <ins
        className="adsbygoogle block w-full h-full"
        style={{ display: "block" }}
        data-ad-client="ca-pub-3876936176422477"
        data-ad-slot={slotId || "1234567890"}
        data-ad-format={format === "vertical" ? "vertical" : "auto"}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
