"use client";

import { useState, useMemo, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";

interface MatchItem {
  index: number;
  match: string;
  start: number;
  end: number;
  groups: string[];
  namedGroups: Record<string, string> | null;
}

const PRESETS = [
  {
    name: "Email Address",
    pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    flags: { g: true, i: true, m: false, s: false, u: false },
    test: "Contact our support at support@devtoolbox.co or reach john.doe@example.org. Invalid: @missing.com, test@.com",
  },
  {
    name: "URL / Web Link",
    pattern: "https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/\\/=]*)",
    flags: { g: true, i: true, m: false, s: false, u: false },
    test: "Visit https://devtoolbox.dev/tools/regex-tester or http://example.com:8080/path?query=1#section for details.",
  },
  {
    name: "IPv4 Address",
    pattern: "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b",
    flags: { g: true, i: false, m: false, s: false, u: false },
    test: "Server IPs: 192.168.1.1, 10.0.0.254, and 127.0.0.1. Invalid: 999.1.1.1, 192.168.1",
  },
  {
    name: "Date (YYYY-MM-DD)",
    pattern: "\\b(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\\b",
    flags: { g: true, i: false, m: false, s: false, u: false },
    test: "Event dates: 2026-08-30 (today), 2025-12-31 (New Year), 2024-02-29 (leap). Invalid: 2023-13-40",
  },
  {
    name: "Hex Color",
    pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b",
    flags: { g: true, i: true, m: false, s: false, u: false },
    test: "Primary colors: #3b82f6 (blue), #ef4444 (red), #10b981 (green), #fff, #000. Not color: #zz1122",
  },
  {
    name: "Phone Number (US)",
    pattern: "(?:\\+?1[-. ]?)?\\(?([0-9]{3})\\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})",
    flags: { g: true, i: false, m: false, s: false, u: false },
    test: "Call us at (555) 234-5678, +1-800-555-0199, or 555.867.5309 for assistance.",
  },
];

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState(
    "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
  );
  const [flags, setFlags] = useState<{
    g: boolean;
    i: boolean;
    m: boolean;
    s: boolean;
    u: boolean;
  }>({
    g: true,
    i: true,
    m: false,
    s: false,
    u: false,
  });
  const [testString, setTestString] = useState(
    "Contact our team at hello@devtoolbox.io or support@example.com! Invalid: @blank.com, admin@."
  );
  const [replacement, setReplacement] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedReplace, setCopiedReplace] = useState(false);

  const flagString = useMemo(() => {
    let f = "";
    if (flags.g) f += "g";
    if (flags.i) f += "i";
    if (flags.m) f += "m";
    if (flags.s) f += "s";
    if (flags.u) f += "u";
    return f;
  }, [flags]);

  const { matches, error, highlightedHtml, replacedText } = useMemo(() => {
    if (!pattern) {
      return {
        matches: [],
        error: null,
        highlightedHtml: escapeHtml(testString),
        replacedText: testString,
      };
    }

    try {
      const regex = new RegExp(pattern, flagString);
      const isGlobal = flags.g;
      const foundMatches: MatchItem[] = [];

      if (!testString) {
        return {
          matches: [],
          error: null,
          highlightedHtml: "",
          replacedText: "",
        };
      }

      if (isGlobal) {
        let m: RegExpExecArray | null;
        let iteration = 0;
        const maxMatches = 1000;

        while ((m = regex.exec(testString)) !== null) {
          iteration++;
          if (iteration > maxMatches) break;

          const groups = m.slice(1).map((g) => (g === undefined ? "" : g));
          const namedGroups = m.groups ? { ...m.groups } : null;

          foundMatches.push({
            index: foundMatches.length + 1,
            match: m[0],
            start: m.index,
            end: m.index + m[0].length,
            groups,
            namedGroups,
          });

          // Prevent infinite loops on zero-length matches (e.g. ^, $, \b, (?=...))
          if (m[0].length === 0) {
            regex.lastIndex++;
            if (regex.lastIndex > testString.length) break;
          }
        }
      } else {
        const m = regex.exec(testString);
        if (m) {
          const groups = m.slice(1).map((g) => (g === undefined ? "" : g));
          const namedGroups = m.groups ? { ...m.groups } : null;
          foundMatches.push({
            index: 1,
            match: m[0],
            start: m.index,
            end: m.index + m[0].length,
            groups,
            namedGroups,
          });
        }
      }

      // Build Highlighted HTML
      let html = "";
      let lastIndex = 0;

      for (let i = 0; i < foundMatches.length; i++) {
        const item = foundMatches[i];
        if (item.start > lastIndex) {
          html += escapeHtml(testString.substring(lastIndex, item.start));
        }

        if (item.match.length === 0) {
          // Zero-length match indicator
          html += `<span class="bg-amber-400 text-black font-bold px-0.5 rounded text-xs border border-amber-500" title="Zero-width match at index ${item.start}">|</span>`;
        } else {
          const colorClass =
            i % 2 === 0
              ? "bg-yellow-200 dark:bg-yellow-800/70 text-yellow-950 dark:text-yellow-100 border-b-2 border-yellow-500"
              : "bg-teal-200 dark:bg-teal-800/70 text-teal-950 dark:text-teal-100 border-b-2 border-teal-500";
          html += `<mark class="${colorClass} px-0.5 rounded-xs font-mono font-medium">${escapeHtml(
            item.match
          )}</mark>`;
        }
        lastIndex = item.end;
      }

      if (lastIndex < testString.length) {
        html += escapeHtml(testString.substring(lastIndex));
      }

      // Compute replaced text if substitution is used
      let repText = "";
      try {
        repText = testString.replace(new RegExp(pattern, flagString), replacement);
      } catch {
        repText = testString;
      }

      return {
        matches: foundMatches,
        error: null,
        highlightedHtml: html || "<span class='text-gray-400 italic'>No content</span>",
        replacedText: repText,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid regular expression";
      return {
        matches: [],
        error: msg,
        highlightedHtml: escapeHtml(testString),
        replacedText: testString,
      };
    }
  }, [pattern, flagString, flags.g, testString, replacement]);

  const handleCopyMatch = useCallback(async (matchText: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(matchText);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback
    }
  }, []);

  const handleCopyReplaced = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(replacedText);
      setCopiedReplace(true);
      setTimeout(() => setCopiedReplace(false), 2000);
    } catch {
      // Fallback
    }
  }, [replacedText]);

  const loadPreset = (p: (typeof PRESETS)[0]) => {
    setPattern(p.pattern);
    setFlags(p.flags);
    setTestString(p.test);
  };

  const toggleFlag = (flagKey: keyof typeof flags) => {
    setFlags((prev) => ({ ...prev, [flagKey]: !prev[flagKey] }));
  };

  return (
    <ToolLayout
      title="Regex Tester & Debugger"
      description="Test, validate, and debug regular expressions with real-time match highlighting, captured group extraction, and substitution."
    >
      <title>Regex Tester &amp; Debugger Online — DevToolbox</title>
      <meta
        name="description"
        content="Free online Regex tester with live match highlighting, capture group breakdown, regex flags (g, i, m, s, u), and substitution support."
      />

      <div className="space-y-6">
        {/* Preset Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => loadPreset(p)}
                  className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-gray-850 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-700 rounded-md transition-colors cursor-pointer shadow-xs"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setPattern("");
              setTestString("");
              setReplacement("");
            }}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            Clear All
          </button>
        </div>

        {/* Regex Pattern Input & Flags Bar */}
        <div className="space-y-3">
          <label
            htmlFor="regex-pattern-input"
            className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-between"
          >
            <span>Regular Expression Pattern</span>
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 font-mono">
              /{pattern}/{flagString}
            </span>
          </label>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <span className="absolute left-3.5 text-gray-400 dark:text-gray-500 font-mono text-base select-none pointer-events-none">
                /
              </span>
              <input
                id="regex-pattern-input"
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Enter regex pattern, e.g. [a-z0-9]+"
                className="w-full pl-7 pr-7 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
              />
              <span className="absolute right-3.5 text-gray-400 dark:text-gray-500 font-mono text-base select-none pointer-events-none">
                /
              </span>
            </div>

            {/* Flags Checkboxes */}
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/80 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-semibold px-1">Flags:</span>
              {[
                { key: "g", label: "g", title: "Global (match all)" },
                { key: "i", label: "i", title: "Case insensitive" },
                { key: "m", label: "m", title: "Multiline (^ and $ match line boundaries)" },
                { key: "s", label: "s", title: "DotAll (. matches newline)" },
                { key: "u", label: "u", title: "Unicode support" },
              ].map(({ key, label, title }) => {
                const k = key as keyof typeof flags;
                const active = flags[k];
                return (
                  <button
                    key={key}
                    type="button"
                    title={title}
                    onClick={() => toggleFlag(k)}
                    className={`px-2 py-1 rounded font-mono font-semibold transition-colors cursor-pointer ${
                      active
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-mono">
              <svg className="w-4 h-4 shrink-0 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Test String Input & Highlighted Result */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test String Textarea */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="regex-test-string" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Test String
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {testString.length} chars
              </span>
            </div>
            <textarea
              id="regex-test-string"
              rows={8}
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="Paste or type text to match against the pattern..."
              className="w-full p-3.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y leading-relaxed shadow-inner"
            />
          </div>

          {/* Highlighted Match Visualizer */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Live Match Highlight
                </label>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    matches.length > 0
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {matches.length} {matches.length === 1 ? "match" : "matches"}
                </span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Alternating highlights
              </span>
            </div>
            <div
              className="w-full p-3.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/60 text-gray-900 dark:text-gray-100 font-mono text-sm overflow-auto min-h-[190px] max-h-[300px] whitespace-pre-wrap break-words leading-relaxed select-text"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </div>
        </div>

        {/* Detailed Matches & Capture Groups List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>Match Details &amp; Captured Groups</span>
              <span className="text-xs font-normal text-gray-500">
                ({matches.length} {matches.length === 1 ? "item" : "items"})
              </span>
            </h3>
          </div>

          {matches.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm">
              {pattern ? "No matches found in the test string." : "Enter a regular expression pattern above to see matches."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {matches.map((item) => (
                <div
                  key={item.index}
                  className="p-3.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        Match #{item.index}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        pos: [{item.start}, {item.end}] ({item.match.length} chars)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyMatch(item.match, item.index)}
                      className="text-xs text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium cursor-pointer"
                    >
                      {copiedIndex === item.index ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  <div className="font-mono text-xs p-2 rounded bg-gray-50 dark:bg-gray-900/80 text-gray-900 dark:text-gray-100 break-all">
                    {item.match.length === 0 ? (
                      <span className="italic text-gray-400">&lt;empty match&gt;</span>
                    ) : (
                      item.match
                    )}
                  </div>

                  {/* Groups */}
                  {item.groups.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-gray-100 dark:border-gray-800 text-xs">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">
                        Captured Groups:
                      </span>
                      <div className="space-y-1">
                        {item.groups.map((grp, gIdx) => (
                          <div
                            key={gIdx}
                            className="flex items-start gap-2 font-mono text-xs pl-2 border-l-2 border-indigo-400"
                          >
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
                              Group {gIdx + 1}:
                            </span>
                            <span className="text-gray-800 dark:text-gray-200 break-all">
                              {grp !== "" ? `"${grp}"` : <span className="italic text-gray-400">undefined</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Named Groups */}
                  {item.namedGroups && Object.keys(item.namedGroups).length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-gray-100 dark:border-gray-800 text-xs">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">
                        Named Groups:
                      </span>
                      <div className="space-y-1">
                        {Object.entries(item.namedGroups).map(([name, val]) => (
                          <div
                            key={name}
                            className="flex items-start gap-2 font-mono text-xs pl-2 border-l-2 border-teal-400"
                          >
                            <span className="text-teal-600 dark:text-teal-400 font-semibold shrink-0">
                              ?&lt;{name}&gt;:
                            </span>
                            <span className="text-gray-800 dark:text-gray-200 break-all">
                              &quot;{val}&quot;
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Substitution / Replace Section */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-850 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Regex Substitution / Replace
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Supports $1, $2 group references
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="regex-replace-input"
                className="text-xs font-semibold text-gray-700 dark:text-gray-300"
              >
                Replacement String
              </label>
              <input
                id="regex-replace-input"
                type="text"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder="e.g. [$1] or REDACTED"
                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Result After Replacement
                </label>
                <button
                  type="button"
                  onClick={handleCopyReplaced}
                  disabled={!replacedText}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-40 cursor-pointer font-medium"
                >
                  {copiedReplace ? "Copied!" : "Copy Result"}
                </button>
              </div>
              <div className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-xs min-h-[42px] max-h-32 overflow-y-auto whitespace-pre-wrap break-words select-text">
                {replacedText}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
