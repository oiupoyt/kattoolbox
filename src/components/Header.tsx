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
    <header className="border-b border-gray-900 bg-black">
      <div className="mx-auto max-w-5xl px-4 py-2.5 relative">
        <input
          type="text"
          placeholder="Search tools..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
          className="w-full border border-gray-800 bg-black px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-gray-600 font-mono"
        />

        {showResults && filtered.length > 0 && (
          <div className="absolute left-4 right-4 top-full z-50 mt-0 max-h-64 overflow-y-auto border border-gray-800 border-t-0 bg-black shadow-2xl">
            {filtered.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="block border-b border-gray-900 px-3 py-2 text-sm text-gray-300 hover:bg-gray-950"
                onClick={() => {
                  setQuery("");
                  setShowResults(false);
                }}
              >
                {tool.icon} {tool.name}
                <span className="ml-2 text-xs text-gray-600">{tool.description}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
