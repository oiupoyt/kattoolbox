"use client";

import { useState, useMemo, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";

type BaseType = 2 | 8 | 10 | 16;

const BASE_OPTIONS: { label: string; value: BaseType; prefix: string; radixName: string }[] = [
  { label: "Decimal (Base 10)", value: 10, prefix: "", radixName: "Decimal" },
  { label: "Binary (Base 2)", value: 2, prefix: "0b", radixName: "Binary" },
  { label: "Hexadecimal (Base 16)", value: 16, prefix: "0x", radixName: "Hex" },
  { label: "Octal (Base 8)", value: 8, prefix: "0o", radixName: "Octal" },
];

const PRESETS = [
  { label: "0", base: 10, value: "0" },
  { label: "42", base: 10, value: "42" },
  { label: "255 (0xFF)", base: 10, value: "255" },
  { label: "1024 (1K)", base: 10, value: "1024" },
  { label: "65,535 (16-bit max)", base: 10, value: "65535" },
  { label: "4,294,967,295 (32-bit max)", base: 10, value: "4294967295" },
  { label: "0xDEADBEEF", base: 16, value: "DEADBEEF" },
  { label: "0b10101010", base: 2, value: "10101010" },
];

// Helper: validate digit in base
function isValidChar(char: string, base: number): boolean {
  const code = char.toLowerCase().charCodeAt(0);
  if (code >= 48 && code <= 57) {
    // 0-9
    return code - 48 < base;
  }
  if (code >= 97 && code <= 122) {
    // a-z
    return code - 97 + 10 < base;
  }
  return false;
}

// Parse string in arbitrary base (2-36) into BigInt
function parseBigIntBase(str: string, base: number): { value: bigint | null; error: string | null; isNegative: boolean } {
  let s = str.trim();
  if (!s) return { value: null, error: "Please enter a number", isNegative: false };

  let isNegative = false;
  if (s.startsWith("-")) {
    isNegative = true;
    s = s.substring(1).trim();
  } else if (s.startsWith("+")) {
    s = s.substring(1).trim();
  }

  // Strip prefixes if present
  if (base === 2 && s.toLowerCase().startsWith("0b")) s = s.substring(2);
  else if (base === 8 && s.toLowerCase().startsWith("0o")) s = s.substring(2);
  else if (base === 16 && s.toLowerCase().startsWith("0x")) s = s.substring(2);

  // Remove spaces or underscores used as separators
  s = s.replace(/[\s_]/g, "");

  if (!s) return { value: null, error: "Please enter digits", isNegative };

  // Validate each character
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (!isValidChar(ch, base)) {
      return {
        value: null,
        error: `Invalid character '${ch}' for base ${base}. Allowed: ${
          base <= 10 ? `0 to ${base - 1}` : `0-9, A-${String.fromCharCode(65 + base - 11)}`
        }`,
        isNegative,
      };
    }
  }

  try {
    const bigBase = BigInt(base);
    let result = BigInt(0);
    for (let i = 0; i < s.length; i++) {
      const ch = s[i].toLowerCase();
      let digitVal: bigint;
      const code = ch.charCodeAt(0);
      if (code >= 48 && code <= 57) {
        digitVal = BigInt(code - 48);
      } else {
        digitVal = BigInt(code - 97 + 10);
      }
      result = result * bigBase + digitVal;
    }

    return {
      value: isNegative ? -result : result,
      error: null,
      isNegative,
    };
  } catch {
    return { value: null, error: "Number is too large to parse", isNegative };
  }
}

// Format binary string with grouped nibbles/bytes
function formatBinary(binStr: string, groupSize: number = 4): string {
  const isNeg = binStr.startsWith("-");
  const raw = isNeg ? binStr.substring(1) : binStr;
  const rem = raw.length % groupSize;
  const padded = rem > 0 ? raw : raw;

  const chunks: string[] = [];
  let i = padded.length;
  while (i > 0) {
    const start = Math.max(0, i - groupSize);
    chunks.unshift(padded.substring(start, i));
    i = start;
  }
  return (isNeg ? "-" : "") + chunks.join(" ");
}

// Format Hex string with grouped bytes
function formatHex(hexStr: string, groupSize: number = 2): string {
  const isNeg = hexStr.startsWith("-");
  const raw = isNeg ? hexStr.substring(1) : hexStr;
  const chunks: string[] = [];
  let i = raw.length;
  while (i > 0) {
    const start = Math.max(0, i - groupSize);
    chunks.unshift(raw.substring(start, i));
    i = start;
  }
  return (isNeg ? "-" : "") + chunks.join(" ");
}

// Format Decimal with commas
function formatDecimal(decStr: string): string {
  const isNeg = decStr.startsWith("-");
  const raw = isNeg ? decStr.substring(1) : decStr;
  return (isNeg ? "-" : "") + raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function NumberBaseConverterPage() {
  const [inputVal, setInputVal] = useState<string>("42");
  const [inputBase, setInputBase] = useState<BaseType>(10);
  const [customBase, setCustomBase] = useState<number>(36);
  const [includePrefixes, setIncludePrefixes] = useState<boolean>(false);
  const [hexUppercase, setHexUppercase] = useState<boolean>(true);
  const [enableGrouping, setEnableGrouping] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Parse current input
  const parseResult = useMemo(() => {
    return parseBigIntBase(inputVal, inputBase);
  }, [inputVal, inputBase]);

  // Copy helper
  const copyToClipboard = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
    }
  }, []);

  // Compute conversions
  const conversions = useMemo(() => {
    if (parseResult.value === null) return null;
    const val = parseResult.value;
    const isNeg = val < BigInt(0);
    const absVal = isNeg ? -val : val;

    // Binary
    const rawBin = (isNeg ? "-" : "") + absVal.toString(2);
    const prefBin = (isNeg ? "-" : "") + (includePrefixes ? "0b" : "") + absVal.toString(2);
    const displayBin = enableGrouping ? formatBinary(rawBin, 4) : rawBin;

    // Octal
    const rawOct = (isNeg ? "-" : "") + absVal.toString(8);
    const prefOct = (isNeg ? "-" : "") + (includePrefixes ? "0o" : "") + absVal.toString(8);
    const displayOct = enableGrouping ? formatBinary(rawOct, 3) : rawOct;

    // Decimal
    const rawDec = val.toString(10);
    const displayDec = enableGrouping ? formatDecimal(rawDec) : rawDec;

    // Hex
    const rawHex = (isNeg ? "-" : "") + (hexUppercase ? absVal.toString(16).toUpperCase() : absVal.toString(16).toLowerCase());
    const prefHex = (isNeg ? "-" : "") + (includePrefixes ? "0x" : "") + (hexUppercase ? absVal.toString(16).toUpperCase() : absVal.toString(16).toLowerCase());
    const displayHex = enableGrouping ? formatHex(rawHex, 2) : rawHex;

    // Custom Base (2-36)
    let customBaseStr = "";
    if (customBase >= 2 && customBase <= 36) {
      customBaseStr = (isNeg ? "-" : "") + (hexUppercase ? absVal.toString(customBase).toUpperCase() : absVal.toString(customBase).toLowerCase());
    }

    // Bit length
    const bitLength = absVal === BigInt(0) ? 1 : absVal.toString(2).length;
    const byteCount = Math.ceil(bitLength / 8);

    // Fixed-width binary representations for positive integers
    const absBinStr = absVal.toString(2);
    const pad8 = absBinStr.padStart(8, "0");
    const pad16 = absBinStr.padStart(16, "0");
    const pad32 = absBinStr.padStart(32, "0");
    const pad64 = absBinStr.padStart(64, "0");

    // ASCII representation (if in 0..127 or 0..255 range)
    let asciiChar: string | null = null;
    if (val >= BigInt(32) && val <= BigInt(126)) {
      asciiChar = String.fromCharCode(Number(val));
    } else if (val === BigInt(10)) {
      asciiChar = "\\n (LF)";
    } else if (val === BigInt(13)) {
      asciiChar = "\\r (CR)";
    } else if (val === BigInt(9)) {
      asciiChar = "\\t (TAB)";
    } else if (val === BigInt(0)) {
      asciiChar = "\\0 (NUL)";
    }

    return {
      bin: { raw: rawBin, formatted: displayBin, withPrefix: prefBin },
      oct: { raw: rawOct, formatted: displayOct, withPrefix: prefOct },
      dec: { raw: rawDec, formatted: displayDec, withPrefix: rawDec },
      hex: { raw: rawHex, formatted: displayHex, withPrefix: prefHex },
      custom: customBaseStr,
      bitLength,
      byteCount,
      pad8,
      pad16,
      pad32,
      pad64,
      asciiChar,
      isNegative: isNeg,
    };
  }, [parseResult, includePrefixes, hexUppercase, enableGrouping, customBase]);

  return (
    <ToolLayout
      title="Number Base Converter"
      description="Convert numbers seamlessly between Binary, Octal, Decimal, Hexadecimal, and any custom base from 2 to 36 with instant live results."
    >
      <div className="space-y-8">
        {/* Input Configuration Box */}
        <div className=" border border-[#1a1a1a] bg-black p-4 sm:p-6 space-y-4">
          {/* Base Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
              Input Base:
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {BASE_OPTIONS.map((baseOpt) => (
                <button
                  key={baseOpt.value}
                  type="button"
                  onClick={() => setInputBase(baseOpt.value)}
                  className={`flex items-center justify-center gap-2  py-2.5 px-3 text-sm font-semibold border transition-all ${
                    inputBase === baseOpt.value
                      ? "border-blue-600 bg-blue-600 text-white "
                      : "border-[#1a1a1a] bg-[#0a0a0a] text-gray-400 hover:bg-[#111]"
                  }`}
                >
                  <span>{baseOpt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Number Input Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="num-input" className="text-xs font-semibold text-gray-600">
                Number value (supports BigInt & arbitrary precision):
              </label>
              {inputVal && (
                <button
                  type="button"
                  onClick={() => setInputVal("")}
                  className="text-xs text-gray-500 hover:text-red-400"
                >
                  Clear input
                </button>
              )}
            </div>

            <div className="relative">
              <input
                id="num-input"
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={`Enter a ${BASE_OPTIONS.find((b) => b.value === inputBase)?.radixName} number...`}
                className={`w-full p-3.5 font-mono text-base sm:text-lg  border bg-[#0a0a0a] text-gray-200 focus:ring-1 focus:outline-none ${
                  parseResult.error
                    ? "border-red-400 focus:ring-red-400"
                    : "border-[#1a1a1a] focus:ring-blue-900"
                }`}
              />
            </div>

            {/* Error Message banner */}
            {parseResult.error && (
              <p className="mt-2 text-xs font-medium text-red-400 flex items-center gap-1.5">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {parseResult.error}
              </p>
            )}
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-medium text-gray-500 mr-1">Presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setInputBase(p.base as BaseType);
                  setInputVal(p.value);
                }}
                className="rounded bg-[#0a0a0a] px-2.5 py-1 text-xs font-medium text-gray-400 border border-[#1a1a1a] hover:bg-[#111] transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Display Options / Toggles */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[#1a1a1a] text-xs text-gray-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includePrefixes}
                onChange={(e) => setIncludePrefixes(e.target.checked)}
                className="h-4 w-4 border-[#1a1a1a] text-blue-600 focus:ring-blue-900"
              />
              <span>Include prefixes (0b, 0o, 0x)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hexUppercase}
                onChange={(e) => setHexUppercase(e.target.checked)}
                className="h-4 w-4 border-[#1a1a1a] text-blue-600 focus:ring-blue-900"
              />
              <span>Uppercase HEX</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableGrouping}
                onChange={(e) => setEnableGrouping(e.target.checked)}
                className="h-4 w-4 border-[#1a1a1a] text-blue-600 focus:ring-blue-900"
              />
              <span>Format with digit separators</span>
            </label>
          </div>
        </div>

        {/* Conversions Output Cards (All 4 Primary Bases) */}
        {conversions ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Decimal Card */}
              <div className="flex flex-col justify-between  border border-blue-900 bg-[#0a0a1a]/40 p-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-2 w-2 rounded-none bg-[#0a0a1a]0" />
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                        Decimal (Base 10)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(conversions.dec.raw, "copy-dec")}
                      className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-[#0a0a0a] border border-blue-900 text-blue-400 hover:bg-[#0a0a1a] transition-colors"
                    >
                      {copiedKey === "copy-dec" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="font-mono text-lg font-bold text-gray-200 break-all">
                    {conversions.dec.formatted}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-blue-100 text-xs text-gray-500">
                  Standard base-10 numerical system
                </div>
              </div>

              {/* Hexadecimal Card */}
              <div className="flex flex-col justify-between  border border-purple-200 bg-purple-50/40 p-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-2 w-2 rounded-none bg-purple-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                        Hexadecimal (Base 16)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(conversions.hex.withPrefix, "copy-hex")}
                      className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-[#0a0a0a] border border-purple-200 text-purple-700 hover:bg-purple-100 transition-colors"
                    >
                      {copiedKey === "copy-hex" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="font-mono text-lg font-bold text-gray-200 break-all">
                    {conversions.hex.formatted}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-purple-100 text-xs text-gray-500 flex items-center justify-between">
                  <span>Prefix: 0x</span>
                  <span>{conversions.byteCount} Byte{conversions.byteCount > 1 ? "s" : ""}</span>
                </div>
              </div>

              {/* Binary Card */}
              <div className="flex flex-col justify-between  border border-emerald-200 bg-emerald-50/40 p-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-2 w-2 rounded-none bg-emerald-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                        Binary (Base 2)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(conversions.bin.withPrefix, "copy-bin")}
                      className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-[#0a0a0a] border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      {copiedKey === "copy-bin" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="font-mono text-base sm:text-lg font-bold text-gray-200 break-all leading-relaxed">
                    {conversions.bin.formatted}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-100 text-xs text-gray-500 flex items-center justify-between">
                  <span>Prefix: 0b</span>
                  <span>{conversions.bitLength} Bit{conversions.bitLength > 1 ? "s" : ""}</span>
                </div>
              </div>

              {/* Octal Card */}
              <div className="flex flex-col justify-between  border border-amber-200 bg-amber-50/40 p-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-2 w-2 rounded-none bg-amber-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                        Octal (Base 8)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(conversions.oct.withPrefix, "copy-oct")}
                      className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-[#0a0a0a] border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors"
                    >
                      {copiedKey === "copy-oct" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="font-mono text-lg font-bold text-gray-200 break-all">
                    {conversions.oct.formatted}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-amber-100 text-xs text-gray-500 flex items-center justify-between">
                  <span>Prefix: 0o</span>
                  <span>Digits: 0-7</span>
                </div>
              </div>
            </div>

            {/* Custom Base Converter & Bit Level Details */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Custom Base Section */}
              <div className="lg:col-span-6  border border-[#1a1a1a] bg-[#0a0a0a] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">
                    Custom Base (Base {customBase})
                  </h3>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(conversions.custom, "copy-custom")}
                    className="text-xs text-blue-600 hover:text-blue-400 font-medium"
                  >
                    {copiedKey === "copy-custom" ? "Copied!" : "Copy"}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">Radix:</span>
                  <input
                    type="range"
                    min="2"
                    max="36"
                    value={customBase}
                    onChange={(e) => setCustomBase(Number(e.target.value))}
                    className="flex-1 h-2 bg-[#1a1a1a]  appearance-none cursor-pointer accent-blue-600"
                  />
                  <input
                    type="number"
                    min="2"
                    max="36"
                    value={customBase}
                    onChange={(e) => setCustomBase(Math.min(Math.max(Number(e.target.value), 2), 36))}
                    className="w-14 p-1.5 text-center font-mono text-xs border border-[#1a1a1a] bg-[#0a0a0a]"
                  />
                </div>

                <div className="font-mono text-base font-bold text-gray-200 break-all p-3  bg-black border border-[#1a1a1a]">
                  {conversions.custom || "N/A"}
                </div>
              </div>

              {/* Bit Information & ASCII */}
              <div className="lg:col-span-6  border border-[#1a1a1a] bg-[#0a0a0a] p-5 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">
                  Bit-Level Representation
                </h3>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 bg-black border border-[#1a1a1a]">
                    <span className="text-gray-500">8-bit (Byte):</span>
                    <span className="text-gray-200 font-bold">{conversions.pad8.slice(-8)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-black border border-[#1a1a1a]">
                    <span className="text-gray-500">16-bit (Word):</span>
                    <span className="text-gray-200 font-bold">{formatBinary(conversions.pad16.slice(-16), 4)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-black border border-[#1a1a1a]">
                    <span className="text-gray-500">ASCII / Character:</span>
                    <span className="text-blue-600 font-bold">
                      {conversions.asciiChar !== null ? `'${conversions.asciiChar}'` : "Non-printable / Out of ASCII range"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Quick Reference Table (0 to 15) */}
        <div className=" border border-[#1a1a1a] bg-black p-5">
          <h3 className="text-sm font-bold text-gray-200 mb-3">
            Quick Reference Table (Values 0 - 15)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1a1a1a] text-gray-500 uppercase">
                  <th className="pb-2 pr-4">Decimal (10)</th>
                  <th className="pb-2 pr-4">Binary (2)</th>
                  <th className="pb-2 pr-4">Octal (8)</th>
                  <th className="pb-2">Hexadecimal (16)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-300">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((val) => (
                  <tr key={val} className="hover:bg-[#0a0a0a]">
                    <td className="py-1.5 pr-4 font-semibold">{val}</td>
                    <td className="py-1.5 pr-4">{val.toString(2).padStart(4, "0")}</td>
                    <td className="py-1.5 pr-4">{val.toString(8)}</td>
                    <td className="py-1.5 font-semibold text-purple-600">
                      0x{val.toString(16).toUpperCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
