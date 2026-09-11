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
    <header className="relative z-20 border-b border-[#1a1a1a] bg-black/90 backdrop-blur-md sticky top-0">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <span className="w-7 h-7 rounded bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-sm group-hover:border-blue-400 transition-colors">
            🧰
          </span>
          <span className="font-mono text-sm font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
            kattoolbox
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#161616] text-[#666] border border-[#222]">
            v2.0
          </span>
        </Link>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-xl">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={`Search ${tools.length} private tools...`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="w-full border border-[#222] bg-[#0a0a0a] pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-[#555] outline-none focus:border-blue-600 transition-colors"
          />

          {showResults && filtered.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 max-h-80 overflow-y-auto border border-[#222] bg-[#0c0c0c] shadow-2xl z-50 divide-y divide-[#161616]">
              {filtered.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="flex items-center gap-3 px-3.5 py-2 text-xs text-gray-300 hover:bg-[#161616] hover:text-blue-400 transition-colors"
                  onClick={() => {
                    setQuery("");
                    setShowResults(false);
                  }}
                >
                  <span className="text-base">{tool.icon}</span>
                  <div className="truncate">
                    <span className="font-medium text-gray-200">{tool.name}</span>
                    <span className="ml-2 text-[11px] text-[#666]">{tool.description}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Privacy Badge */}
        <div className="hidden md:flex items-center gap-2 text-[11px] text-[#666] font-mono">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>100% In-Browser</span>
        </div>
      </div>
    </header>
  );
}
