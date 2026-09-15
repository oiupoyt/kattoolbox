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
    <header className="relative z-20 border-b border-[#1f1f1f] bg-[#0b0b0b]/90 backdrop-blur-md sticky top-0 font-mono">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand & Local Status */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-bold tracking-tight text-white hover:text-gray-300 transition-colors shrink-0 select-none"
          title="kattoolbox - client-side utilities"
        >
          <span>kattoolbox</span>
          <span className="inline-block w-1.5 h-1.5 bg-[#4ade80]" title="local execution" />
        </Link>

        {/* Centered Search Bar */}
        <div className="relative flex-1 max-w-md mx-auto">
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
            placeholder={`Search ${tools.length} utilities...`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="w-full border border-[#222] bg-[#0d0d0d] pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-[#555] outline-none focus:border-[#555] transition-colors font-mono"
          />

          {showResults && filtered.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 max-h-80 overflow-y-auto border border-[#262626] bg-[#0e0e0e] shadow-2xl z-50 divide-y divide-[#171717]">
              {filtered.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="flex items-center justify-between px-3.5 py-2 text-xs text-gray-300 hover:bg-[#181818] hover:text-white transition-colors"
                  onClick={() => {
                    setQuery("");
                    setShowResults(false);
                  }}
                >
                  <span className="font-medium text-gray-200">{tool.name}</span>
                  <span className="text-[11px] text-[#666] truncate ml-3">{tool.description}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Info */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] font-mono text-[#555] hidden sm:inline">{tools.length} tools</span>
          <a
            href="https://github.com/oiupoyt/kattoolbox"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-[#666] hover:text-gray-300 transition-colors"
          >
            github
          </a>
        </div>
      </div>
    </header>
  );
}
