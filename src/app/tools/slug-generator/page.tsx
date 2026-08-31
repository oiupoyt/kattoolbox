"use client";

import { useState, useMemo, useId, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";

// Comprehensive diacritics / accent transliteration map
const DIACRITICS_MAP: Record<string, string> = {
  á: "a", à: "a", ả: "a", ã: "a", ạ: "a", ă: "a", ắ: "a", ằ: "a", ẳ: "a", ẵ: "a", ặ: "a",
  â: "a", ấ: "a", ầ: "a", ẩ: "a", ẫ: "a", ậ: "a", ä: "a", å: "a", ā: "a", ą: "a", æ: "ae",
  Á: "A", À: "A", Ả: "A", Ã: "A", Ạ: "A", Ă: "A", Ắ: "A", Ằ: "A", Ẳ: "A", Ẵ: "A", Ặ: "A",
  Â: "A", Ấ: "A", Ầ: "A", Ẩ: "A", Ẫ: "A", Ậ: "A", Ä: "A", Å: "A", Ā: "A", Ą: "A", Æ: "AE",
  ć: "c", č: "c", ç: "c", ĉ: "c", ċ: "c",
  Ć: "C", Č: "C", Ç: "C", Ĉ: "C", Ċ: "C",
  ď: "d", đ: "d", ð: "d",
  Ď: "D", Đ: "D",
  é: "e", è: "e", ẻ: "e", ẽ: "e", ẹ: "e", ê: "e", ế: "e", ề: "e", ể: "e", ễ: "e", ệ: "e",
  ë: "e", ē: "e", ė: "e", ę: "e", ě: "e",
  É: "E", È: "E", Ẻ: "E", Ẽ: "E", Ẹ: "E", Ê: "E", Ế: "E", Ề: "E", Ể: "E", Ễ: "E", Ệ: "E",
  Ë: "E", Ē: "E", Ė: "E", Ę: "E", Ě: "E",
  ğ: "g", ĝ: "g", ġ: "g",ģ: "g",
  Ğ: "G", Ĝ: "G", Ġ: "G", Ģ: "G",
  ĥ: "h", ħ: "h",
  Ĥ: "H", Ħ: "H",
  í: "i", ì: "i", ỉ: "i", ĩ: "i", ị: "i", î: "i", ï: "i", ī: "i", į: "i", ı: "i",
  Í: "I", Ì: "I", Ỉ: "I", Ĩ: "I", Ị: "I", Î: "I", Ï: "I", Ī: "I", Į: "I", İ: "I",
  ĵ: "j", Ĵ: "J",
  ķ: "k", Ķ: "K",
  ĺ: "l", ľ: "l", ļ: "l", ł: "l",
  Ĺ: "L", Ľ: "L", Ļ: "L", Ł: "L",
  ń: "n", ň: "n", ñ: "n", ņ: "n", ŋ: "n",
  Ń: "N", Ň: "N", Ñ: "N", Ņ: "N", Ŋ: "N",
  ó: "o", ò: "o", ỏ: "o", õ: "o", ọ: "o", ô: "o", ố: "o", ồ: "o", ổ: "o", ỗ: "o", ộ: "o",
  ơ: "o", ớ: "o", ờ: "o", ở: "o", ỡ: "o", ợ: "o", ö: "o", ø: "o", ō: "o", ő: "o", œ: "oe",
  Ó: "O", Ò: "O", Ỏ: "O", Õ: "O", Ọ: "O", Ô: "O", Ố: "O", Ồ: "O", Ổ: "O", Ỗ: "O", Ộ: "O",
  Ơ: "O", Ớ: "O", Ờ: "O", Ở: "O", Ỡ: "O", Ợ: "O", Ö: "O", Ø: "O", Ō: "O", Ő: "O", Œ: "OE",
  ŕ: "r", ř: "r", ŗ: "r",
  Ŕ: "R", Ř: "R", Ŗ: "R",
  ś: "s", š: "s", ş: "s", ŝ: "s", ș: "s", ß: "ss",
  Ś: "S", Š: "S", Ş: "S", Ŝ: "S", Ș: "S",
  ť: "t", ţ: "t", ț: "t", ŧ: "t", þ: "th",
  Ť: "T", Ţ: "T", Ț: "T", Ŧ: "T", Þ: "TH",
  ú: "u", ù: "u", ủ: "u", ũ: "u", ụ: "u", ư: "u", ứ: "u", ừ: "u", ử: "u", ữ: "u", ự: "u",
  û: "u", ü: "u", ū: "u", ů: "u", ű: "u", ų: "u",
  Ú: "U", Ù: "U", Ủ: "U", Ũ: "U", Ụ: "U", Ư: "U", Ứ: "U", Ừ: "U", Ử: "U", Ữ: "U", Ự: "U",
  Û: "U", Ü: "U", Ū: "U", Ů: "U", Ű: "U", Ų: "U",
  ý: "y", ỳ: "y", ỷ: "y", ỹ: "y", ỵ: "y", ÿ: "y", ŷ: "y",
  Ý: "Y", Ỳ: "Y", Ỷ: "Y", Ỹ: "Y", Ỵ: "Y", Ÿ: "Y", Ŷ: "Y",
  ź: "z", ž: "z", ż: "z",
  Ź: "Z", Ž: "Z", Ż: "Z",
};

// Common English Stop Words
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with",
  "of", "by", "from", "up", "about", "into", "over", "after", "is", "are", "was",
  "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
  "as", "it", "its", "this", "that",
]);

interface SlugOptions {
  separator: string;
  caseFormat: "lowercase" | "uppercase" | "preserve";
  removeSpecialChars: boolean;
  convertSymbols: boolean; // & -> and, @ -> at
  removeStopWords: boolean;
  transliterateUnicode: boolean;
  maxLength: number | null;
  smartTruncate: boolean; // Truncate at word boundaries
}

const DEFAULT_OPTIONS: SlugOptions = {
  separator: "-",
  caseFormat: "lowercase",
  removeSpecialChars: true,
  convertSymbols: true,
  removeStopWords: false,
  transliterateUnicode: true,
  maxLength: null,
  smartTruncate: true,
};

const SAMPLE_TEXT = `How to Build a REST API with Node.js & TypeScript (2025 Guide!)
Café & Restaurant: 100% Délicieux Français 🥐
Top 10 Tips for Optimizing Next.js 15 Web Applications
Internationalization: Über, Zürich, Niño, São Paulo & Kraków
Database Migration: users_profile_v2_final`;

export default function SlugGeneratorPage() {
  const inputId = useId();
  const outputId = useId();

  const [input, setInput] = useState<string>(SAMPLE_TEXT);
  const [options, setOptions] = useState<SlugOptions>(DEFAULT_OPTIONS);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activePreset, setActivePreset] = useState<string>("url");

  // Transliteration function
  const transliterate = useCallback((str: string): string => {
    let result = "";
    for (const char of str) {
      result += DIACRITICS_MAP[char] !== undefined ? DIACRITICS_MAP[char] : char;
    }
    // Fallback to NFD decomposition for any unmapped diacritics
    return result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }, []);

  // Generate slug for a single line of text
  const generateSlug = useCallback(
    (line: string, opts: SlugOptions): string => {
      let text = line.trim();
      if (!text) return "";

      // 1. Symbol conversions if enabled
      if (opts.convertSymbols) {
        text = text
          .replace(/&/g, " and ")
          .replace(/@/g, " at ")
          .replace(/%/g, " percent ")
          .replace(/\+/g, " plus ");
      }

      // 2. Transliterate Accents / Unicode if enabled
      if (opts.transliterateUnicode) {
        text = transliterate(text);
      }

      // 3. Case conversion
      if (opts.caseFormat === "lowercase") {
        text = text.toLowerCase();
      } else if (opts.caseFormat === "uppercase") {
        text = text.toUpperCase();
      }

      // 4. Remove stop words if enabled
      if (opts.removeStopWords) {
        const words = text.split(/\s+/);
        const filtered = words.filter((w) => {
          const cleanW = w.toLowerCase().replace(/[^a-z0-9]/g, "");
          return !STOP_WORDS.has(cleanW);
        });
        text = filtered.join(" ");
      }

      const sep = opts.separator;

      // 5. Replace punctuation and special characters with separator
      if (opts.removeSpecialChars) {
        // Strip everything except alphanumeric characters and spaces
        text = text.replace(/[^a-zA-Z0-9\s-_.]/g, " ");
      }

      // 6. Split by whitespace and existing separator characters
      const tokens = text
        .split(/[\s\-_/\\|.]+/)
        .map((t) => t.trim())
        .filter(Boolean);

      if (tokens.length === 0) return "";

      let slug = tokens.join(sep);

      // 7. Deduplicate separators and trim
      if (sep) {
        const escapedSep = sep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const dupRegex = new RegExp(`${escapedSep}{2,}`, "g");
        slug = slug.replace(dupRegex, sep);

        const trimRegex = new RegExp(`^${escapedSep}+|${escapedSep}+$`, "g");
        slug = slug.replace(trimRegex, "");
      }

      // 8. Max Length Truncation
      if (opts.maxLength && opts.maxLength > 0 && slug.length > opts.maxLength) {
        if (opts.smartTruncate && sep) {
          // Truncate at previous separator boundary
          const truncated = slug.substring(0, opts.maxLength);
          const lastSepIndex = truncated.lastIndexOf(sep);
          if (lastSepIndex > 0) {
            slug = truncated.substring(0, lastSepIndex);
          } else {
            slug = truncated;
          }
        } else {
          slug = slug.substring(0, opts.maxLength);
        }

        // Clean trailing separator after truncation
        if (sep) {
          const escapedSep = sep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const trimRegex = new RegExp(`${escapedSep}+$`, "g");
          slug = slug.replace(trimRegex, "");
        }
      }

      return slug;
    },
    [transliterate]
  );

  // Compute all slugs line by line
  const lines = useMemo(() => {
    return input.split(/\r\n|\r|\n/);
  }, [input]);

  const slugs = useMemo(() => {
    return lines.map((line) => generateSlug(line, options));
  }, [lines, options, generateSlug]);

  const bulkOutput = useMemo(() => {
    return slugs.join("\n");
  }, [slugs]);

  // Non-empty slug count
  const validSlugCount = useMemo(() => {
    return slugs.filter((s) => s.length > 0).length;
  }, [slugs]);

  // Copy All Slugs
  const handleCopyAll = async () => {
    if (!bulkOutput) return;
    try {
      await navigator.clipboard.writeText(bulkOutput);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = bulkOutput;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  // Copy Single Slug
  const handleCopySingle = async (slugText: string, index: number) => {
    if (!slugText) return;
    try {
      await navigator.clipboard.writeText(slugText);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback
    }
  };

  // Preset Handlers
  const applyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    if (presetKey === "url") {
      setOptions({
        separator: "-",
        caseFormat: "lowercase",
        removeSpecialChars: true,
        convertSymbols: true,
        removeStopWords: false,
        transliterateUnicode: true,
        maxLength: null,
        smartTruncate: true,
      });
    } else if (presetKey === "filename") {
      setOptions({
        separator: "_",
        caseFormat: "lowercase",
        removeSpecialChars: true,
        convertSymbols: true,
        removeStopWords: false,
        transliterateUnicode: true,
        maxLength: null,
        smartTruncate: true,
      });
    } else if (presetKey === "wordpress") {
      setOptions({
        separator: "-",
        caseFormat: "lowercase",
        removeSpecialChars: true,
        convertSymbols: false,
        removeStopWords: false,
        transliterateUnicode: true,
        maxLength: 200,
        smartTruncate: true,
      });
    } else if (presetKey === "seo-clean") {
      setOptions({
        separator: "-",
        caseFormat: "lowercase",
        removeSpecialChars: true,
        convertSymbols: true,
        removeStopWords: true, // Strips "a", "the", "in" etc.
        transliterateUnicode: true,
        maxLength: 60,
        smartTruncate: true,
      });
    } else if (presetKey === "snake") {
      setOptions({
        separator: "_",
        caseFormat: "lowercase",
        removeSpecialChars: true,
        convertSymbols: true,
        removeStopWords: false,
        transliterateUnicode: true,
        maxLength: null,
        smartTruncate: true,
      });
    }
  };

  // Download Output File
  const handleDownload = () => {
    const blob = new Blob([bulkOutput], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "slugs.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout
      title="Slug Generator"
      description="Transform titles and text into clean, SEO-friendly URL slugs, filename-safe strings, and WordPress permalinks with full Unicode accent support."
    >
      <title>Slug Generator Online — DevToolbox</title>
      <meta
        name="description"
        content="Free online slug generator. Convert titles to SEO-friendly URL slugs, filename-safe strings, WordPress permalinks, and snake_case with Unicode transliteration."
      />

      <div className="space-y-6">
        {/* Presets and Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1a1a1a]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset("url")}
              className={`px-3 py-1.5  text-xs font-semibold transition-all cursor-pointer ${
                activePreset === "url"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-[#111] hover:bg-[#1a1a1a] text-gray-400"
              }`}
            >
              URL Slug (my-post-title)
            </button>
            <button
              type="button"
              onClick={() => applyPreset("filename")}
              className={`px-3 py-1.5  text-xs font-semibold transition-all cursor-pointer ${
                activePreset === "filename"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-[#111] hover:bg-[#1a1a1a] text-gray-400"
              }`}
            >
              Filename-Safe (my_file_name)
            </button>
            <button
              type="button"
              onClick={() => applyPreset("wordpress")}
              className={`px-3 py-1.5  text-xs font-semibold transition-all cursor-pointer ${
                activePreset === "wordpress"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-[#111] hover:bg-[#1a1a1a] text-gray-400"
              }`}
            >
              WordPress Style
            </button>
            <button
              type="button"
              onClick={() => applyPreset("seo-clean")}
              className={`px-3 py-1.5  text-xs font-semibold transition-all cursor-pointer ${
                activePreset === "seo-clean"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-[#111] hover:bg-[#1a1a1a] text-gray-400"
              }`}
            >
              SEO Clean (&lt;60 + No Stop Words)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInput(SAMPLE_TEXT)}
              className="px-3 py-1.5 text-xs font-medium bg-[#0a0a1a] hover:bg-[#0a0a1a] text-blue-400  transition-colors cursor-pointer"
            >
              Load Sample
            </button>
            <button
              type="button"
              onClick={() => setInput("")}
              disabled={!input}
              className="px-3 py-1.5 text-xs font-medium bg-[#111] hover:bg-rose-50 text-gray-400 hover:text-rose-600 disabled:opacity-40  transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Configuration Options Card */}
        <div className=" border border-[#1a1a1a] bg-black/70 p-4 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#1a1a1a]/80 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Slug Configuration &amp; Formatting Options
            </span>
            <span className="text-xs text-gray-400 font-mono">Real-time update</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Separator Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">
                Word Separator
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: "Hyphen (-)", val: "-" },
                  { label: "Underscore (_)", val: "_" },
                  { label: "Dot (.)", val: "." },
                  { label: "Slash (/)", val: "/" },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => {
                      setOptions({ ...options, separator: s.val });
                      setActivePreset("custom");
                    }}
                    className={`py-1.5 text-center text-xs font-mono font-bold  border transition-colors cursor-pointer ${
                      options.separator === s.val
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-[#0a0a0a] border-[#1a1a1a] text-gray-300 hover:bg-[#111]"
                    }`}
                    title={s.label}
                  >
                    {s.val}
                  </button>
                ))}
              </div>
            </div>

            {/* Letter Casing */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">
                Letter Casing
              </label>
              <select
                value={options.caseFormat}
                onChange={(e) => {
                  setOptions({
                    ...options,
                    caseFormat: e.target.value as SlugOptions["caseFormat"],
                  });
                  setActivePreset("custom");
                }}
                className="w-full p-2  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
              >
                <option value="lowercase">lowercase (recommended)</option>
                <option value="uppercase">UPPERCASE</option>
                <option value="preserve">Preserve Input Case</option>
              </select>
            </div>

            {/* Max Length Limit */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">
                Max Length (characters)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={options.maxLength === null ? "" : options.maxLength}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : null;
                    setOptions({ ...options, maxLength: val });
                    setActivePreset("custom");
                  }}
                  placeholder="Unlimited (default)"
                  className="w-full p-2  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                />
                {options.maxLength !== null && (
                  <button
                    type="button"
                    onClick={() => setOptions({ ...options, maxLength: null })}
                    className="p-2 text-xs text-gray-400 hover:text-gray-600"
                    title="Remove max length"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Quick Toggle Checkboxes */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={options.transliterateUnicode}
                  onChange={(e) => {
                    setOptions({ ...options, transliterateUnicode: e.target.checked });
                    setActivePreset("custom");
                  }}
                  className="w-3.5 h-3.5 text-blue-600 border-[#1a1a1a] focus:ring-blue-900"
                />
                <span>Convert Accents (é→e, ñ→n)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={options.convertSymbols}
                  onChange={(e) => {
                    setOptions({ ...options, convertSymbols: e.target.checked });
                    setActivePreset("custom");
                  }}
                  className="w-3.5 h-3.5 text-blue-600 border-[#1a1a1a] focus:ring-blue-900"
                />
                <span>Replace &amp; with &quot;and&quot;, @ with &quot;at&quot;</span>
              </label>
            </div>
          </div>

          {/* Secondary Toggles Row */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-[#1a1a1a] text-xs text-gray-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.removeSpecialChars}
                onChange={(e) => {
                  setOptions({ ...options, removeSpecialChars: e.target.checked });
                  setActivePreset("custom");
                }}
                className="w-3.5 h-3.5 text-blue-600 border-[#1a1a1a] focus:ring-blue-900"
              />
              <span>Remove Special Characters &amp; Emojis</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.removeStopWords}
                onChange={(e) => {
                  setOptions({ ...options, removeStopWords: e.target.checked });
                  setActivePreset("custom");
                }}
                className="w-3.5 h-3.5 text-blue-600 border-[#1a1a1a] focus:ring-blue-900"
              />
              <span>Remove Stop Words (&quot;a&quot;, &quot;the&quot;, &quot;in&quot;, &quot;with&quot;)</span>
            </label>

            {options.maxLength !== null && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={options.smartTruncate}
                  onChange={(e) => {
                    setOptions({ ...options, smartTruncate: e.target.checked });
                    setActivePreset("custom");
                  }}
                  className="w-3.5 h-3.5 text-blue-600 border-[#1a1a1a] focus:ring-blue-900"
                />
                <span>Smart Truncate (don&apos;t split words in half)</span>
              </label>
            )}
          </div>
        </div>

        {/* Two-Column Layout: Input on Left, Output on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Area */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor={inputId} className="text-sm font-semibold text-gray-400">
                Input Text or Multi-line Titles
              </label>
              <span className="text-xs text-gray-400 font-mono">
                {lines.length} {lines.length === 1 ? "line" : "lines"} | {input.length} chars
              </span>
            </div>

            <textarea
              id={inputId}
              rows={11}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type or paste titles, post headlines, or phrases here (one per line for bulk conversion)..."
              className="w-full p-3.5  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 font-sans text-sm focus:ring-1 focus:ring-blue-900 focus:outline-none resize-y shadow-inner leading-relaxed"
            />
          </div>

          {/* Output Area */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label htmlFor={outputId} className="text-sm font-semibold text-gray-400">
                  Generated Slugs
                </label>
                <span className="px-2 py-0.5 rounded-none text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {validSlugCount} {validSlugCount === 1 ? "slug" : "slugs"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!bulkOutput}
                  className="px-2.5 py-1 bg-[#111] hover:bg-[#1a1a1a] text-gray-400 disabled:opacity-40 text-xs font-medium transition-colors cursor-pointer"
                  title="Download all slugs as .txt"
                >
                  Download .txt
                </button>
                <button
                  type="button"
                  onClick={handleCopyAll}
                  disabled={!bulkOutput}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedAll ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied All!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      <span>Copy All</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <textarea
              id={outputId}
              rows={11}
              value={bulkOutput}
              readOnly
              placeholder="Generated slugs will appear here in real time..."
              className="w-full p-3.5  border border-[#1a1a1a] bg-black text-gray-200 font-mono text-sm focus:outline-none resize-y select-all shadow-inner leading-relaxed"
            />
          </div>
        </div>

        {/* Live URL Preview Card for the First/Primary Slug */}
        {slugs.length > 0 && slugs[0] && (
          <div className=" border border-blue-900 bg-[#0a0a1a]/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Primary URL Slug Mockup
              </span>
              <button
                type="button"
                onClick={() => handleCopySingle(`https://example.com/blog/${slugs[0]}`, 999)}
                className="text-xs text-blue-600 hover:text-blue-400 font-medium cursor-pointer"
              >
                {copiedIndex === 999 ? "Copied URL!" : "Copy Full URL"}
              </button>
            </div>
            <div className="p-2.5  bg-[#0a0a0a] border border-blue-100 font-mono text-xs text-gray-300 overflow-x-auto whitespace-nowrap">
              <span className="text-gray-400 select-none">https://example.com/blog/</span>
              <span className="font-bold text-blue-600">{slugs[0]}</span>
            </div>
          </div>
        )}

        {/* Detailed Item-by-Item Breakdown (Especially useful for multi-line inputs) */}
        {lines.length > 1 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-200">
                Individual Slugs Breakdown ({lines.length} items)
              </h3>
              <span className="text-xs text-gray-400">Click &quot;Copy&quot; on any individual slug</span>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {lines.map((rawLine, idx) => {
                const slugVal = slugs[idx] || "";
                const isCopied = copiedIndex === idx;

                if (!rawLine.trim()) return null;

                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3  border border-[#1a1a1a] bg-[#0a0a0a] hover:border-blue-300 transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="text-xs text-gray-500 truncate" title={rawLine}>
                        <span className="font-semibold text-gray-400 mr-1.5">#{idx + 1}</span>
                        {rawLine}
                      </div>
                      <div className="font-mono text-xs font-semibold text-gray-200 truncate">
                        {slugVal || <span className="text-gray-400 italic">No output</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-gray-400 font-mono">
                        {slugVal.length} chars
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopySingle(slugVal, idx)}
                        disabled={!slugVal}
                        className={`px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                          isCopied
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-[#111] hover:bg-[#1a1a1a] text-gray-400"
                        }`}
                      >
                        {isCopied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SEO & Developer Tips Section */}
        <div className="mt-8 pt-6 border-t border-[#1a1a1a] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
          <div className="p-3.5 bg-black  border border-[#1a1a1a]">
            <h4 className="font-bold text-gray-200 mb-1">SEO Best Practices</h4>
            <p>Keep slugs between 3 to 5 words (&lt;60 chars) and separate words with hyphens for optimal search engine crawling.</p>
          </div>
          <div className="p-3.5 bg-black  border border-[#1a1a1a]">
            <h4 className="font-bold text-gray-200 mb-1">Accent Transliteration</h4>
            <p>Accented characters from European languages (like é, ü, ç, ñ, ø, å, ß) are mapped to clean ASCII equivalents automatically.</p>
          </div>
          <div className="p-3.5 bg-black  border border-[#1a1a1a]">
            <h4 className="font-bold text-gray-200 mb-1">Bulk Line Processing</h4>
            <p>Paste multiple titles or list of article headlines at once to generate clean slugs for all items simultaneously.</p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
