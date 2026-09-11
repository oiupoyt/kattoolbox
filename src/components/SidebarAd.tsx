"use client";

import { useEffect, useRef } from "react";

interface SidebarAdProps {
  slotId?: string;
  format?: "vertical" | "rectangle";
  className?: string;
}

export default function SidebarAd({ format = "vertical", className = "" }: SidebarAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    try {
      const script = document.createElement("script");
      script.src = "https://pl31295441.profitableratecpmnetwork.com/fd/4a/91/fd4a9155d8cc10399821f613377ee9f1.js";
      script.async = true;
      containerRef.current.appendChild(script);
    } catch {
      // Ignore network blocks
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

      <div ref={containerRef} className="w-full flex items-center justify-center min-h-[250px]" />
    </aside>
  );
}
