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
          t.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <header className="relative z-10 border-b border-[#1a1a1a] bg-black/80 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6 py-3 relative">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#525252]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search 30 tools..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            className="w-full border border-[#1a1a1a] bg-[#0a0a0a] pl-10 pr-3 py-2 text-sm text-gray-300 placeholder-[#525252] outline-none focus:border-blue-900 transition-colors"
          />
        </div>

        {showResults && filtered.length > 0 && (
          <div className="absolute left-6 right-6 top-full z-50 max-h-72 overflow-y-auto border border-[#1a1a1a] border-t-0 bg-black/95 backdrop-blur-md shadow-2xl shadow-black/80">
            {filtered.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="flex items-center gap-3 border-b border-[#111] px-4 py-2.5 text-sm text-gray-400 hover:bg-[#111] hover:text-blue-400 transition-colors"
                onClick={() => {
                  setQuery("");
                  setShowResults(false);
                }}
              >
                <span className="text-base">{tool.icon}</span>
                <div>
                  <span className="text-gray-200">{tool.name}</span>
                  <span className="ml-2 text-xs text-[#525252]">{tool.description}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
