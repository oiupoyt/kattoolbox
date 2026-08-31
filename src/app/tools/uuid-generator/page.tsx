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
        <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700/60 dark:bg-gray-800/40">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Quantity Selector */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Quantity (1 - 100)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={count}
                  onChange={(e) => handleCountChange(parseInt(e.target.value) || 1)}
                  className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
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
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
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
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Formatting Options
              </label>
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={uppercase}
                    onChange={handleUppercaseToggle}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span>Uppercase (A-F)</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={hyphens}
                    onChange={handleHyphensToggle}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
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
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Generated UUIDs
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              {uuids.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copyAllToClipboard}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                copiedAll
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
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
          <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50/50 p-6 dark:border-blue-900/50 dark:bg-blue-950/20 sm:flex-row">
            <div className="flex-1 overflow-hidden">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Generated UUID v4
              </span>
              <p className="select-all break-all font-mono text-lg font-bold text-gray-900 dark:text-white sm:text-2xl">
                {uuids[0]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(uuids[0], 0)}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
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
          <div className="max-h-[500px] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/60">
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {uuids.map((uuid, idx) => (
                <div
                  key={`${uuid}-${idx}`}
                  className="group flex items-center justify-between gap-4 p-3 transition-colors hover:bg-white dark:hover:bg-gray-800/80"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-8 select-none text-right font-mono text-xs text-gray-400 dark:text-gray-500">
                      {idx + 1}.
                    </span>
                    <span className="select-all truncate font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                      {uuid}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(uuid, idx)}
                    className={`flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      copiedIndex === idx
                        ? "bg-green-600 text-white"
                        : "bg-white text-gray-700 opacity-90 shadow-sm hover:bg-gray-100 group-hover:opacity-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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
        <div className="grid grid-cols-1 gap-4 pt-4 text-xs text-gray-500 dark:text-gray-400 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/40">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">128-bit Randomness</h4>
            <p className="mt-1">
              UUID v4 utilizes 122 cryptographically secure random bits, making collisions statistically virtually impossible.
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/40">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">100% Client-Side</h4>
            <p className="mt-1">
              All identifiers are created locally in your browser using the Web Crypto API. No server logs or tracking.
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/40">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">RFC 4122 Compliant</h4>
            <p className="mt-1">
              Generated UUIDs adhere strictly to RFC 4122 specifications with standard version 4 and variant bits.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
