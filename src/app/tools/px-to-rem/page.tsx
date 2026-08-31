"use client";

import { useState, useId } from "react";
import ToolLayout from "@/components/ToolLayout";

const COMMON_PX_VALUES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96];

const TAILWIND_SPACING_MAP: Record<number, string> = {
  8: "p-2 / 2",
  10: "2.5",
  12: "p-3 / 3",
  14: "3.5",
  16: "p-4 / 4 (1rem)",
  18: "4.5",
  20: "p-5 / 5",
  24: "p-6 / 6 (1.5rem)",
  28: "p-7 / 7",
  32: "p-8 / 8 (2rem)",
  36: "p-9 / 9",
  40: "p-10 / 10 (2.5rem)",
  48: "p-12 / 12 (3rem)",
  56: "p-14 / 14 (3.5rem)",
  64: "p-16 / 16 (4rem)",
  72: "18 (4.5rem)",
  80: "p-20 / 20 (5rem)",
  96: "p-24 / 24 (6rem)",
};

const BASE_PRESETS = [
  { label: "16px (Browser Standard)", value: 16 },
  { label: "10px (62.5% HTML trick)", value: 10 },
  { label: "14px", value: 14 },
  { label: "18px", value: 18 },
  { label: "20px", value: 20 },
];

function formatNumber(num: number, maxDecimals = 4): string {
  if (isNaN(num)) return "0";
  const fixed = num.toFixed(maxDecimals);
  return parseFloat(fixed).toString();
}

export default function PxToRemPage() {
  const baseId = useId();
  const pxInputId = useId();
  const remInputId = useId();
  const bulkInputId = useId();

  const [baseSize, setBaseSize] = useState<number>(16);
  const [pxValue, setPxValue] = useState<string>("24");
  const [remValue, setRemValue] = useState<string>("1.5");
  const [selectedProperty, setSelectedProperty] = useState<string>("font-size");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState<string>("");

  // Bulk converter states
  const [bulkInput, setBulkInput] = useState<string>("8\n12\n16\n24\n32\n48\n64");
  const [bulkFormat, setBulkFormat] = useState<"rem-list" | "mapping" | "css-vars" | "tailwind">("rem-list");

  // Handle PX input change
  const handlePxChange = (val: string) => {
    setPxValue(val);
    const num = parseFloat(val);
    if (!isNaN(num) && baseSize > 0) {
      setRemValue(formatNumber(num / baseSize));
    } else {
      setRemValue("");
    }
  };

  // Handle REM input change
  const handleRemChange = (val: string) => {
    setRemValue(val);
    const num = parseFloat(val);
    if (!isNaN(num) && baseSize > 0) {
      setPxValue(formatNumber(num * baseSize));
    } else {
      setPxValue("");
    }
  };

  // Handle Base size change
  const handleBaseChange = (newBase: number) => {
    const validBase = Math.max(1, newBase);
    setBaseSize(validBase);
    const currentPx = parseFloat(pxValue);
    if (!isNaN(currentPx)) {
      setRemValue(formatNumber(currentPx / validBase));
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Calculate bulk output
  const parsedBulkRows = bulkInput
    .split(/[\n,]+/)
    .map((s) => s.trim().replace(/px$/i, ""))
    .filter((s) => s.length > 0)
    .map((s) => {
      const num = parseFloat(s);
      if (isNaN(num)) return null;
      const rem = formatNumber(num / baseSize);
      return { px: num, rem };
    })
    .filter((row): row is { px: number; rem: string } => row !== null);

  const getBulkOutputString = () => {
    if (parsedBulkRows.length === 0) return "";
    switch (bulkFormat) {
      case "rem-list":
        return parsedBulkRows.map((r) => `${r.rem}rem`).join("\n");
      case "mapping":
        return parsedBulkRows.map((r) => `${r.px}px = ${r.rem}rem`).join("\n");
      case "css-vars":
        return parsedBulkRows
          .map((r) => `--size-${r.px}: ${r.rem}rem; /* ${r.px}px */`)
          .join("\n");
      case "tailwind":
        return parsedBulkRows
          .map((r) => `'${r.px}': '${r.rem}rem', /* ${r.px}px */`)
          .join("\n");
      default:
        return "";
    }
  };

  // Extra units for currently active px
  const currentPxNum = parseFloat(pxValue) || 0;
  const currentRemNum = parseFloat(remValue) || 0;
  const percentageValue = formatNumber((currentPxNum / baseSize) * 100, 2);
  const ptValue = formatNumber(currentPxNum * 0.75, 2); // 1px = 0.75pt
  const cssDeclaration = `${selectedProperty}: ${remValue || "0"}rem; /* ${pxValue || "0"}px */`;

  // Filtered reference table rows
  const filteredTableValues = COMMON_PX_VALUES.filter((px) => {
    if (!tableSearch.trim()) return true;
    const search = tableSearch.toLowerCase().trim();
    const rem = formatNumber(px / baseSize);
    return px.toString().includes(search) || rem.includes(search);
  });

  return (
    <ToolLayout
      title="Px to Rem Converter"
      description="Convert pixels (px) to relative root ems (rem) and vice versa with real-time conversion, a customizable base font size, reference table, and bulk conversion."
    >
      <title>Px to Rem Converter Online — DevToolbox</title>
      <meta
        name="description"
        content="Free online PX to REM and REM to PX converter. Live two-way converter, interactive reference table, CSS code snippet generator, and bulk converter."
      />

      <div className="space-y-6">
        {/* Base Font Size Configuration Bar */}
        <div className="rounded-xl border border-gray-200 bg-white p-4.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor={baseId}
                  className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
                >
                  Root Base Font Size
                </label>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                  1rem = {baseSize}px
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Standard browser default is 16px. Change to 10px if using the 62.5% font-size technique.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <input
                  id={baseId}
                  type="number"
                  min="1"
                  max="100"
                  value={baseSize}
                  onChange={(e) => handleBaseChange(parseInt(e.target.value) || 16)}
                  className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-1.5 font-mono text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">px</span>
              </div>

              {/* Preset buttons */}
              <div className="flex items-center gap-1">
                {BASE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleBaseChange(preset.value)}
                    className={`cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      baseSize === preset.value
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {preset.value}px
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Two-Way Interactive Live Converter */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Converter Box (7 Cols) */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-7 space-y-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Live Two-Way Converter
            </h3>

            {/* Input Inputs Row with Bidirectional Arrow */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-11 sm:items-center">
              {/* PX Input */}
              <div className="sm:col-span-5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor={pxInputId} className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Pixels (PX)
                  </label>
                  <span className="text-[11px] text-gray-400">Fixed</span>
                </div>
                <div className="relative">
                  <input
                    id={pxInputId}
                    type="number"
                    step="any"
                    value={pxValue}
                    onChange={(e) => handlePxChange(e.target.value)}
                    placeholder="24"
                    className="w-full rounded-lg border border-gray-300 bg-white p-3 pr-10 font-mono text-lg font-bold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900/70 dark:text-gray-100 shadow-inner"
                  />
                  <span className="pointer-events-none absolute right-3 top-3.5 font-mono text-sm font-semibold text-gray-400">
                    px
                  </span>
                </div>
              </div>

              {/* Arrow Indicator */}
              <div className="sm:col-span-1 flex justify-center text-gray-400 pt-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
              </div>

              {/* REM Input */}
              <div className="sm:col-span-5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor={remInputId} className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Root Em (REM)
                  </label>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Relative</span>
                </div>
                <div className="relative">
                  <input
                    id={remInputId}
                    type="number"
                    step="any"
                    value={remValue}
                    onChange={(e) => handleRemChange(e.target.value)}
                    placeholder="1.5"
                    className="w-full rounded-lg border border-gray-300 bg-white p-3 pr-12 font-mono text-lg font-bold text-blue-600 dark:text-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900/70 shadow-inner"
                  />
                  <span className="pointer-events-none absolute right-3 top-3.5 font-mono text-sm font-semibold text-gray-400">
                    rem
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Multi-Unit Equivalents Cards */}
            <div>
              <span className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2">
                Equivalent Dimensions for {pxValue || 0}px:
              </span>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/60">
                  <span className="block text-[10px] text-gray-500 uppercase font-medium">REM</span>
                  <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {remValue || "0"}rem
                  </span>
                </div>
                <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/60">
                  <span className="block text-[10px] text-gray-500 uppercase font-medium">EM</span>
                  <span className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {remValue || "0"}em
                  </span>
                </div>
                <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/60">
                  <span className="block text-[10px] text-gray-500 uppercase font-medium">Percent (%)</span>
                  <span className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {percentageValue}%
                  </span>
                </div>
                <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/60">
                  <span className="block text-[10px] text-gray-500 uppercase font-medium">Points (pt)</span>
                  <span className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {ptValue}pt
                  </span>
                </div>
              </div>
            </div>

            {/* CSS Declaration Generator */}
            <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3.5 dark:border-gray-700/60 dark:bg-gray-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  CSS Declaration Snippet
                </span>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="font-size">font-size</option>
                  <option value="padding">padding</option>
                  <option value="margin">margin</option>
                  <option value="width">width</option>
                  <option value="height">height</option>
                  <option value="gap">gap</option>
                  <option value="border-radius">border-radius</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                <span className="truncate">{cssDeclaration}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(cssDeclaration, "css-decl")}
                  className="cursor-pointer shrink-0 rounded bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/70 transition-colors"
                >
                  {copiedKey === "css-decl" ? "✓ Copied!" : "Copy CSS"}
                </button>
              </div>
            </div>
          </div>

          {/* Formula & How It Works Card (5 Cols) */}
          <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Calculation Formula
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="rounded-lg bg-blue-50/70 p-3 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50">
                <span className="block text-[11px] font-sans font-semibold text-blue-800 dark:text-blue-300 mb-1">
                  Pixels to Rem:
                </span>
                <p className="text-gray-900 dark:text-gray-100">
                  rem = px ÷ baseFont ({baseSize})
                </p>
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  Example: {pxValue || 24}px ÷ {baseSize} = {remValue || 1.5}rem
                </p>
              </div>

              <div className="rounded-lg bg-indigo-50/70 p-3 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50">
                <span className="block text-[11px] font-sans font-semibold text-indigo-800 dark:text-indigo-300 mb-1">
                  Rem to Pixels:
                </span>
                <p className="text-gray-900 dark:text-gray-100">
                  px = rem × baseFont ({baseSize})
                </p>
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  Example: {remValue || 1.5}rem × {baseSize} = {pxValue || 24}px
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">💡 Why use REM over PX?</p>
              <p>
                REM units scale proportionally when users adjust their operating system or browser font size settings, ensuring accessibility (WCAG) compliance.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Reference Table */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Quick Reference Table (Base: {baseSize}px)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Click any row to load into converter or copy individual values.
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search px or rem..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Pixels (px)</th>
                  <th className="px-4 py-2.5 font-semibold">Root Em (rem)</th>
                  <th className="px-4 py-2.5 font-semibold">Em (em)</th>
                  <th className="px-4 py-2.5 font-semibold">Tailwind Class</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTableValues.map((px) => {
                  const rem = formatNumber(px / baseSize);
                  const isSelected = px.toString() === pxValue;
                  const tailwindClass = TAILWIND_SPACING_MAP[px] || "-";

                  return (
                    <tr
                      key={px}
                      onClick={() => handlePxChange(px.toString())}
                      className={`cursor-pointer transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-950/20 ${
                        isSelected ? "bg-blue-50/80 dark:bg-blue-950/40 font-semibold" : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono">
                        <span className="rounded bg-gray-100 px-2 py-0.5 font-bold text-gray-900 dark:bg-gray-700 dark:text-gray-100">
                          {px}px
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-blue-600 dark:text-blue-400 font-bold">
                        {rem}rem
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-gray-600 dark:text-gray-400">
                        {rem}em
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-emerald-600 dark:text-emerald-400">
                        {tailwindClass}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(`${rem}rem`, `row-${px}`);
                          }}
                          className="cursor-pointer rounded bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          {copiedKey === `row-${px}` ? "✓ Copied" : "Copy REM"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bulk Converter Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Bulk Pixel Converter
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Paste multiple pixel values (separated by newlines or commas) to convert all at once.
              </p>
            </div>

            {/* Bulk Format Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Format:</span>
              <select
                value={bulkFormat}
                onChange={(e) => setBulkFormat(e.target.value as "rem-list" | "mapping" | "css-vars" | "tailwind")}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
              >
                <option value="rem-list">Rem Values (0.5rem)</option>
                <option value="mapping">Mapping (8px = 0.5rem)</option>
                <option value="css-vars">CSS Custom Properties</option>
                <option value="tailwind">Tailwind Theme Keys</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Input Box */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={bulkInputId} className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Input Pixel Values (one per line)
                </label>
                <button
                  type="button"
                  onClick={() => setBulkInput("8\n12\n16\n20\n24\n32\n40\n48\n64\n80\n96\n128")}
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400 font-medium cursor-pointer"
                >
                  Load Sample Scale
                </button>
              </div>
              <textarea
                id={bulkInputId}
                rows={7}
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="Paste numbers like:&#10;12px&#10;16px&#10;24px&#10;32px"
                className="w-full rounded-lg border border-gray-300 bg-white p-3 font-mono text-xs text-gray-900 shadow-inner focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900/60 dark:text-gray-100 leading-relaxed"
              />
            </div>

            {/* Output Box */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Converted Output ({parsedBulkRows.length} items)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(getBulkOutputString(), "bulk-output")}
                  disabled={!getBulkOutputString()}
                  className="cursor-pointer rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  {copiedKey === "bulk-output" ? "✓ Copied All!" : "Copy All"}
                </button>
              </div>
              <textarea
                readOnly
                rows={7}
                value={getBulkOutputString()}
                placeholder="Bulk conversion output will appear here..."
                className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 font-mono text-xs text-gray-900 shadow-inner focus:outline-none dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-100 leading-relaxed select-all"
              />
            </div>
          </div>
        </div>

        {/* Informational Guidelines */}
        <div className="mt-8 grid grid-cols-1 gap-4 border-t border-gray-200 pt-6 text-xs text-gray-600 dark:border-gray-800 dark:text-gray-400 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700/60 dark:bg-gray-800/40">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">REM vs EM Units</h4>
            <p>
              <code>rem</code> units are calculated relative to the root <code>&lt;html&gt;</code> element font size, avoiding compound scaling issues encountered with nested <code>em</code> elements.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700/60 dark:bg-gray-800/40">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">The 62.5% Trick (10px Base)</h4>
            <p>
              Setting <code>html &#123; font-size: 62.5%; &#125;</code> makes 1rem = 10px (1.6rem = 16px, 2.4rem = 24px) while preserving user browser zoom scaling.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700/60 dark:bg-gray-800/40">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Instant Client Calculation</h4>
            <p>
              Computations happen instantly in your browser on each keystroke without sending queries over the network.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
