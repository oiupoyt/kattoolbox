"use client";

import { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";

function generateSingleUUID(uppercase: boolean, hyphens: boolean): string {
  let uuid: string;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    uuid = crypto.randomUUID();
  } else if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10xx
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  } else {
    uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  if (!hyphens) {
    uuid = uuid.replace(/-/g, "");
  }

  return uppercase ? uuid.toUpperCase() : uuid.toLowerCase();
}

export default function UuidGeneratorPage() {
  const [count, setCount] = useState<number>(5);
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [hyphens, setHyphens] = useState<boolean>(true);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  const generate = useCallback(
    (countToGen: number, isUpper: boolean, hasHyphens: boolean) => {
      const validCount = Math.min(Math.max(1, countToGen), 100);
      const generated: string[] = [];
      for (let i = 0; i < validCount; i++) {
        generated.push(generateSingleUUID(isUpper, hasHyphens));
      }
      setUuids(generated);
      setCopiedIndex(null);
      setCopiedAll(false);
    },
    []
  );

  // Generate on initial load
  useEffect(() => {
    generate(count, uppercase, hyphens);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = () => {
    generate(count, uppercase, hyphens);
  };

  const handleCountChange = (newCount: number) => {
    const clamped = Math.min(Math.max(1, newCount), 100);
    setCount(clamped);
    generate(clamped, uppercase, hyphens);
  };

  const handleUppercaseToggle = () => {
    const next = !uppercase;
    setUppercase(next);
    setUuids((prev) =>
      prev.map((id) => (next ? id.toUpperCase() : id.toLowerCase()))
    );
  };

  const handleHyphensToggle = () => {
    const next = !hyphens;
    setHyphens(next);
    generate(count, uppercase, next);
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const copyAllToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(uuids.join("\n"));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error("Failed to copy all: ", err);
    }
  };

  const downloadAsText = () => {
    const blob = new Blob([uuids.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `uuids-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsJson = () => {
    const blob = new Blob([JSON.stringify(uuids, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `uuids-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const countPresets = [1, 5, 10, 25, 50, 100];

  return (
    <ToolLayout
      title="UUID Generator"
      description="Generate cryptographically secure UUID v4 (Universally Unique Identifier) strings in bulk with customization options."
    >
      <div className="space-y-6">
        {/* Controls Bar */}
        <div className=" border border-[#1a1a1a] bg-black/50 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Quantity Selector */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Quantity (1 - 100)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={count}
                  onChange={(e) => handleCountChange(parseInt(e.target.value) || 1)}
                  className="w-24  border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2 text-sm font-medium text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-900/20"
                />
                <div className="flex flex-wrap gap-1">
                  {countPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleCountChange(preset)}
                      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                        count === preset
                          ? "bg-blue-600 text-white"
                          : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222]"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Options Toggles */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Formatting Options
              </label>
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={uppercase}
                    onChange={handleUppercaseToggle}
                    className="h-4 w-4 border-[#1a1a1a] text-blue-600 focus:ring-blue-900"
                  />
                  <span>Uppercase (A-F)</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={hyphens}
                    onChange={handleHyphensToggle}
                    className="h-4 w-4 border-[#1a1a1a] text-blue-600 focus:ring-blue-900"
                  />
                  <span>Include Hyphens</span>
                </label>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <button
                type="button"
                onClick={handleGenerate}
                className="flex w-full items-center justify-center gap-2  bg-blue-600 px-5 py-2.5 font-medium text-white  transition-all hover:bg-blue-700 active:scale-[0.99] focus:outline-none focus:ring-1 focus:ring-blue-900 focus:ring-offset-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Generate New {count > 1 ? `(${count})` : ""}
              </button>
            </div>
          </div>
        </div>

        {/* Results Header / Bulk Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1a1a1a] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-400">
              Generated UUIDs
            </span>
            <span className="inline-flex items-center rounded-none bg-[#0a0a1a] px-2.5 py-0.5 text-xs font-semibold text-blue-400">
              {uuids.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copyAllToClipboard}
              className={`inline-flex items-center gap-1.5  px-3 py-1.5 text-xs font-medium transition-colors ${
                copiedAll
                  ? "bg-green-600 text-white"
                  : "bg-[#111] text-gray-400 hover:bg-[#1a1a1a]"
              }`}
            >
              {copiedAll ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  All Copied!
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy All
                </>
              )}
            </button>

            <button
              type="button"
              onClick={downloadAsText}
              title="Download as .txt"
              className="inline-flex items-center gap-1.5  bg-[#111] px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-[#1a1a1a]"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              .txt
            </button>

            <button
              type="button"
              onClick={downloadAsJson}
              title="Download as .json"
              className="inline-flex items-center gap-1.5  bg-[#111] px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-[#1a1a1a]"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              .json
            </button>
          </div>
        </div>

        {/* Featured Single UUID Card when count is 1 */}
        {uuids.length === 1 && (
          <div className="flex flex-col items-center justify-between gap-4  border border-blue-900 bg-[#0a0a1a]/50 p-6 sm:flex-row">
            <div className="flex-1 overflow-hidden">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-blue-400">
                Generated UUID v4
              </span>
              <p className="select-all break-all font-mono text-lg font-bold text-gray-200 sm:text-2xl">
                {uuids[0]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(uuids[0], 0)}
              className={`flex items-center gap-2  px-5 py-2.5 text-sm font-medium transition-all ${
                copiedIndex === 0
                  ? "bg-green-600 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
              }`}
            >
              {copiedIndex === 0 ? (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        )}

        {/* UUID List for multiple */}
        {uuids.length > 1 && (
          <div className="max-h-[500px] overflow-y-auto  border border-[#1a1a1a] bg-black">
            <div className="divide-y divide-[#1a1a1a]">
              {uuids.map((uuid, idx) => (
                <div
                  key={`${uuid}-${idx}`}
                  className="group flex items-center justify-between gap-4 p-3 transition-colors hover:bg-[#0a0a0a]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-8 select-none text-right font-mono text-xs text-gray-400">
                      {idx + 1}.
                    </span>
                    <span className="select-all truncate font-mono text-sm font-medium text-gray-200">
                      {uuid}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(uuid, idx)}
                    className={`flex shrink-0 items-center gap-1  px-2.5 py-1 text-xs font-medium transition-colors ${
                      copiedIndex === idx
                        ? "bg-green-600 text-white"
                        : "bg-[#0a0a0a] text-gray-400 opacity-90  hover:bg-[#111] group-hover:opacity-100"
                    }`}
                  >
                    {copiedIndex === idx ? (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informational Details */}
        <div className="grid grid-cols-1 gap-4 pt-4 text-xs text-gray-500 sm:grid-cols-3">
          <div className=" border border-gray-100 bg-black p-3">
            <h4 className="font-semibold text-gray-300">128-bit Randomness</h4>
            <p className="mt-1">
              UUID v4 utilizes 122 cryptographically secure random bits, making collisions statistically virtually impossible.
            </p>
          </div>
          <div className=" border border-gray-100 bg-black p-3">
            <h4 className="font-semibold text-gray-300">100% Client-Side</h4>
            <p className="mt-1">
              All identifiers are created locally in your browser using the Web Crypto API. No server logs or tracking.
            </p>
          </div>
          <div className=" border border-gray-100 bg-black p-3">
            <h4 className="font-semibold text-gray-300">RFC 4122 Compliant</h4>
            <p className="mt-1">
              Generated UUIDs adhere strictly to RFC 4122 specifications with standard version 4 and variant bits.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
