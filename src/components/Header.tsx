"use client";

import { useState } from "react";
import Link from "next/link";
import { tools } from "@/lib/tools";

export default function Header() {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const filtered = query.trim()
    ? tools.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.description.toLowerCase().includes(query.toLowerCase()) ||
          t.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <header className="relative z-20 border-b border-[#141414] bg-[#070707] sticky top-0 font-mono">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
        {/* Corner Client-Side indicator linking home */}
        <Link
          href="/"
          className="text-[10px] font-mono uppercase tracking-widest text-[#444] hover:text-[#777] transition-colors shrink-0 select-none"
          title="Return to index"
        >
          client-side
        </Link>

        {/* Centered Search Bar */}
        <div className="relative flex-1 max-w-lg mx-auto">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#444]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={`Search ${tools.length} utilities...`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="w-full border border-[#1c1c1c] bg-[#0d0d0d] pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-[#444] outline-none focus:border-[#444] transition-colors font-mono"
          />

          {showResults && filtered.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 max-h-80 overflow-y-auto border border-[#1f1f1f] bg-[#090909] shadow-2xl z-50 divide-y divide-[#141414]">
              {filtered.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="flex items-center justify-between px-3.5 py-2 text-xs text-gray-300 hover:bg-[#141414] hover:text-white transition-colors"
                  onClick={() => {
                    setQuery("");
                    setShowResults(false);
                  }}
                >
                  <span className="font-medium text-gray-200">{tool.name}</span>
                  <span className="text-[11px] text-[#555] truncate ml-3">{tool.description}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Balancer spacing for desktop layout */}
        <div className="w-[70px] hidden sm:block shrink-0" />
      </div>
    </header>
  );
}
