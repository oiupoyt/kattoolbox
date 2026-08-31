"use client";

import { useState, useMemo, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";

type DiffType = "unchanged" | "added" | "removed";

interface DiffItem {
  type: DiffType;
  text: string;
  origLine?: number;
  modLine?: number;
}

const SAMPLE_ORIGINAL = `// User Authentication Service
function authenticateUser(username, password) {
  if (!username || !password) {
    return { success: false, error: "Missing credentials" };
  }

  const user = database.findUserByUsername(username);
  if (!user) {
    return { success: false, error: "User not found" };
  }

  // Legacy plain text check (insecure)
  if (user.password === password) {
    return { success: true, token: "legacy-session-token" };
  }

  return { success: false, error: "Invalid password" };
}`;

const SAMPLE_MODIFIED = `// User Authentication Service v2.0
import { verifyPasswordHash, generateJwtToken } from "@/lib/auth";

export async function authenticateUser(username, password) {
  if (!username || !password) {
    return { success: false, error: "Missing credentials" };
  }

  const user = await database.findUserByUsername(username);
  if (!user || !user.isActive) {
    return { success: false, error: "User not found or disabled" };
  }

  // Secure bcrypt password verification
  const isValid = await verifyPasswordHash(password, user.passwordHash);
  if (isValid) {
    const token = generateJwtToken(user.id, user.role);
    return { success: true, token, user: { id: user.id, name: user.name } };
  }

  return { success: false, error: "Invalid credentials" };
}`;

function computeLcsDiff(
  originalText: string,
  modifiedText: string,
  ignoreWhitespace: boolean,
  ignoreCase: boolean
): DiffItem[] {
  const origLines = originalText ? originalText.split(/\r\n|\r|\n/) : [];
  const modLines = modifiedText ? modifiedText.split(/\r\n|\r|\n/) : [];

  const norm = (line: string) => {
    let s = line;
    if (ignoreWhitespace) s = s.trim().replace(/\s+/g, " ");
    if (ignoreCase) s = s.toLowerCase();
    return s;
  };

  const n = origLines.length;
  const m = modLines.length;

  if (n === 0 && m === 0) return [];

  // 2D LCS Table
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0)
  );

  for (let i = 1; i <= n; i++) {
    const s1 = norm(origLines[i - 1]);
    for (let j = 1; j <= m; j++) {
      const s2 = norm(modLines[j - 1]);
      if (s1 === s2) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  let i = n;
  let j = m;
  const result: DiffItem[] = [];

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      norm(origLines[i - 1]) === norm(modLines[j - 1])
    ) {
      result.push({
        type: "unchanged",
        text: origLines[i - 1],
        origLine: i,
        modLine: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({
        type: "added",
        text: modLines[j - 1],
        modLine: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.push({
        type: "removed",
        text: origLines[i - 1],
        origLine: i,
      });
      i--;
    }
  }

  return result.reverse();
}

export default function DiffCheckerPage() {
  const [original, setOriginal] = useState(SAMPLE_ORIGINAL);
  const [modified, setModified] = useState(SAMPLE_MODIFIED);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [viewMode, setViewMode] = useState<"unified" | "split">("unified");
  const [copiedPatch, setCopiedPatch] = useState(false);

  const diffResult = useMemo(() => {
    return computeLcsDiff(original, modified, ignoreWhitespace, ignoreCase);
  }, [original, modified, ignoreWhitespace, ignoreCase]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let unchanged = 0;

    diffResult.forEach((d) => {
      if (d.type === "added") added++;
      else if (d.type === "removed") removed++;
      else if (d.type === "unchanged") unchanged++;
    });

    const totalLines = added + removed + unchanged;
    const similarity =
      totalLines > 0
        ? Math.round((unchanged / (unchanged + Math.max(added, removed))) * 100)
        : 100;

    return { added, removed, unchanged, totalLines, similarity };
  }, [diffResult]);

  const handleSwap = () => {
    const temp = original;
    setOriginal(modified);
    setModified(temp);
  };

  const handleClear = () => {
    setOriginal("");
    setModified("");
  };

  const handleLoadSample = () => {
    setOriginal(SAMPLE_ORIGINAL);
    setModified(SAMPLE_MODIFIED);
  };

  const handleCopyUnifiedDiff = useCallback(async () => {
    if (diffResult.length === 0) return;
    const patchHeader = `--- original\n+++ modified\n@@ -1,${stats.unchanged + stats.removed} +1,${stats.unchanged + stats.added} @@\n`;
    const patchBody = diffResult
      .map((d) => {
        const prefix = d.type === "added" ? "+" : d.type === "removed" ? "-" : " ";
        return `${prefix} ${d.text}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(patchHeader + patchBody);
      setCopiedPatch(true);
      setTimeout(() => setCopiedPatch(false), 2000);
    } catch {
      // Fallback
    }
  }, [diffResult, stats]);

  // Generate split view rows
  const splitRows = useMemo(() => {
    const rows: {
      left?: { text: string; line?: number; type: "unchanged" | "removed" };
      right?: { text: string; line?: number; type: "unchanged" | "added" };
    }[] = [];

    let i = 0;
    while (i < diffResult.length) {
      const item = diffResult[i];
      if (item.type === "unchanged") {
        rows.push({
          left: { text: item.text, line: item.origLine, type: "unchanged" },
          right: { text: item.text, line: item.modLine, type: "unchanged" },
        });
        i++;
      } else if (item.type === "removed") {
        // Check if immediately followed by an added line (replacement)
        if (i + 1 < diffResult.length && diffResult[i + 1].type === "added") {
          rows.push({
            left: { text: item.text, line: item.origLine, type: "removed" },
            right: {
              text: diffResult[i + 1].text,
              line: diffResult[i + 1].modLine,
              type: "added",
            },
          });
          i += 2;
        } else {
          rows.push({
            left: { text: item.text, line: item.origLine, type: "removed" },
          });
          i++;
        }
      } else if (item.type === "added") {
        rows.push({
          right: { text: item.text, line: item.modLine, type: "added" },
        });
        i++;
      }
    }
    return rows;
  }, [diffResult]);

  return (
    <ToolLayout
      title="Text Diff Checker"
      description="Compare two text files or code snippets line by line. Highlight added, removed, and modified content in unified or split views."
    >
      <title>Text Diff Checker Online — DevToolbox</title>
      <meta
        name="description"
        content="Free online text and code diff comparison tool. Compare two strings line-by-line with Longest Common Subsequence diffing, added/removed stats, and split view."
      />

      <div className="space-y-6">
        {/* Controls and Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSwap}
              className="px-3.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Swap Sides
            </button>
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Load Sample
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!original && !modified}
              className="px-3.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-40 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Options & View mode */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-gray-700 dark:text-gray-300 select-none">
              <input
                type="checkbox"
                checked={ignoreWhitespace}
                onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              />
              <span>Ignore whitespace</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-gray-700 dark:text-gray-300 select-none">
              <input
                type="checkbox"
                checked={ignoreCase}
                onChange={(e) => setIgnoreCase(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              />
              <span>Ignore case</span>
            </label>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("unified")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "unified"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Unified
              </button>
              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "split"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Split
              </button>
            </div>
          </div>
        </div>

        {/* Input Textareas Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="diff-original-text"
                className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center gap-1.5"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Original Text
              </label>
              <span className="text-xs text-gray-400 font-mono">
                {original ? original.split("\n").length : 0} lines
              </span>
            </div>
            <textarea
              id="diff-original-text"
              rows={8}
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              placeholder="Paste original / before text..."
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y leading-relaxed shadow-inner"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="diff-modified-text"
                className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center gap-1.5"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Modified Text
              </label>
              <span className="text-xs text-gray-400 font-mono">
                {modified ? modified.split("\n").length : 0} lines
              </span>
            </div>
            <textarea
              id="diff-modified-text"
              rows={8}
              value={modified}
              onChange={(e) => setModified(e.target.value)}
              placeholder="Paste modified / after text..."
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y leading-relaxed shadow-inner"
            />
          </div>
        </div>

        {/* Diff Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20 p-3 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              + Lines Added
            </span>
            <p className="mt-1 text-2xl font-extrabold text-emerald-900 dark:text-emerald-200">
              +{stats.added}
            </p>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/20 p-3 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              - Lines Removed
            </span>
            <p className="mt-1 text-2xl font-extrabold text-rose-900 dark:text-rose-200">
              -{stats.removed}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-850 p-3 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Unchanged Lines
            </span>
            <p className="mt-1 text-2xl font-extrabold text-gray-800 dark:text-gray-200">
              {stats.unchanged}
            </p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/70 dark:border-blue-900/50 dark:bg-blue-950/20 p-3 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Similarity
            </span>
            <p className="mt-1 text-2xl font-extrabold text-blue-900 dark:text-blue-200">
              {stats.similarity}%
            </p>
          </div>
        </div>

        {/* Diff Output Viewer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>Diff Comparison Output</span>
              <span className="text-xs font-normal text-gray-500">
                ({viewMode === "unified" ? "Unified View" : "Split View"})
              </span>
            </h3>

            <button
              type="button"
              onClick={handleCopyUnifiedDiff}
              disabled={diffResult.length === 0}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              {copiedPatch ? "Copied Patch!" : "Copy Diff Patch"}
            </button>
          </div>

          {diffResult.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-400 text-sm">
              Enter original and modified texts above to calculate diff.
            </div>
          ) : viewMode === "unified" ? (
            /* Unified Diff View */
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden font-mono text-xs shadow-xs">
              <div className="max-h-[500px] overflow-y-auto overflow-x-auto divide-y divide-gray-100 dark:divide-gray-800">
                {diffResult.map((item, idx) => {
                  let bgClass = "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200";
                  let badge = <span className="text-gray-300 dark:text-gray-600 select-none">&nbsp;</span>;
                  let borderClass = "border-l-4 border-transparent";

                  if (item.type === "added") {
                    bgClass = "bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200";
                    borderClass = "border-l-4 border-emerald-500";
                    badge = <span className="text-emerald-600 dark:text-emerald-400 font-bold select-none">+</span>;
                  } else if (item.type === "removed") {
                    bgClass = "bg-rose-50/80 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200";
                    borderClass = "border-l-4 border-rose-500";
                    badge = <span className="text-rose-600 dark:text-rose-400 font-bold select-none">-</span>;
                  }

                  return (
                    <div
                      key={idx}
                      className={`flex items-stretch hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${bgClass} ${borderClass}`}
                    >
                      {/* Line numbers */}
                      <div className="w-10 py-1 pr-2 text-right text-gray-400 dark:text-gray-500 select-none border-r border-gray-200 dark:border-gray-800 shrink-0">
                        {item.origLine || ""}
                      </div>
                      <div className="w-10 py-1 pr-2 text-right text-gray-400 dark:text-gray-500 select-none border-r border-gray-200 dark:border-gray-800 shrink-0">
                        {item.modLine || ""}
                      </div>
                      {/* Symbol */}
                      <div className="w-6 py-1 text-center shrink-0">
                        {badge}
                      </div>
                      {/* Line content */}
                      <div className="flex-1 py-1 pr-4 whitespace-pre-wrap break-all leading-relaxed select-text">
                        {item.text || <span className="opacity-0">.</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Split Diff View */
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden font-mono text-xs shadow-xs">
              <div className="grid grid-cols-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-1.5 px-3 text-xs font-semibold text-gray-600 dark:text-gray-300">
                <div>Original (Before)</div>
                <div>Modified (After)</div>
              </div>
              <div className="max-h-[500px] overflow-y-auto overflow-x-auto divide-y divide-gray-100 dark:divide-gray-800">
                {splitRows.map((row, rIdx) => (
                  <div key={rIdx} className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-800">
                    {/* Left Column */}
                    <div
                      className={`flex items-stretch ${
                        row.left
                          ? row.left.type === "removed"
                            ? "bg-rose-50/80 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200 border-l-4 border-rose-500"
                            : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-l-4 border-transparent"
                          : "bg-gray-50 dark:bg-gray-950/50"
                      }`}
                    >
                      <div className="w-9 py-1 pr-1.5 text-right text-gray-400 dark:text-gray-500 select-none border-r border-gray-200 dark:border-gray-800 shrink-0">
                        {row.left?.line || ""}
                      </div>
                      <div className="w-5 py-1 text-center shrink-0 font-bold select-none">
                        {row.left?.type === "removed" ? <span className="text-rose-600">-</span> : ""}
                      </div>
                      <div className="flex-1 py-1 pr-2 whitespace-pre-wrap break-all leading-relaxed select-text">
                        {row.left?.text || ""}
                      </div>
                    </div>

                    {/* Right Column */}
                    <div
                      className={`flex items-stretch ${
                        row.right
                          ? row.right.type === "added"
                            ? "bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 border-l-4 border-emerald-500"
                            : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-l-4 border-transparent"
                          : "bg-gray-50 dark:bg-gray-950/50"
                      }`}
                    >
                      <div className="w-9 py-1 pr-1.5 text-right text-gray-400 dark:text-gray-500 select-none border-r border-gray-200 dark:border-gray-800 shrink-0">
                        {row.right?.line || ""}
                      </div>
                      <div className="w-5 py-1 text-center shrink-0 font-bold select-none">
                        {row.right?.type === "added" ? <span className="text-emerald-600">+</span> : ""}
                      </div>
                      <div className="flex-1 py-1 pr-2 whitespace-pre-wrap break-all leading-relaxed select-text">
                        {row.right?.text || ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
