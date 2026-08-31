"use client";

import { useState, useCallback, useId } from "react";
import ToolLayout from "@/components/ToolLayout";

interface StatusInfo {
  type: "idle" | "success" | "error";
  message?: string;
  line?: number;
  column?: number;
  byteSize?: number;
  itemCount?: number;
  depth?: number;
  reduction?: number;
}

const SAMPLE_JSON = {
  name: "DevToolbox",
  version: "1.0.0",
  description: "Fast, privacy-first developer utilities",
  active: true,
  rating: 4.95,
  tags: ["developer", "tools", "utilities", "open-source"],
  author: {
    name: "DevToolbox Team",
    email: "support@example.com",
    social: {
      github: "https://github.com",
      twitter: null
    }
  },
  features: [
    { id: 1, name: "JSON Formatter", status: "ready" },
    { id: 2, name: "Markdown Preview", status: "ready" },
    { id: 3, name: "Base64 Encoder", status: "ready" }
  ],
  stats: {
    totalTools: 20,
    dailyUsers: 15400,
    uptimePercent: 99.98
  }
};

function parseJsonError(input: string, err: unknown): { message: string; line?: number; column?: number } {
  if (!(err instanceof Error)) {
    return { message: String(err) };
  }
  const msg = err.message;
  // Match "at position 123"
  const posMatch = msg.match(/at position (\d+)/i);
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10);
    const before = input.slice(0, pos);
    const lines = before.split("\n");
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    return { message: msg, line, column };
  }
  // Match "line X column Y"
  const lineColMatch = msg.match(/line (\d+) column (\d+)/i);
  if (lineColMatch) {
    return {
      message: msg,
      line: parseInt(lineColMatch[1], 10),
      column: parseInt(lineColMatch[2], 10),
    };
  }
  return { message: msg };
}

function sortJsonKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortJsonKeys);
  } else if (obj !== null && typeof obj === "object") {
    const sortedObj: Record<string, unknown> = {};
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    for (const key of keys) {
      sortedObj[key] = sortJsonKeys((obj as Record<string, unknown>)[key]);
    }
    return sortedObj;
  }
  return obj;
}

function calculateDepth(obj: unknown, currentDepth = 1): number {
  if (obj === null || typeof obj !== "object") return currentDepth;
  const values = Array.isArray(obj) ? obj : Object.values(obj as Record<string, unknown>);
  if (values.length === 0) return currentDepth;
  return Math.max(...values.map((v) => calculateDepth(v, currentDepth + 1)));
}

function countTotalKeys(obj: unknown): number {
  if (obj === null || typeof obj !== "object") return 0;
  let count = 0;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      count += countTotalKeys(item);
    }
  } else {
    const entries = Object.entries(obj as Record<string, unknown>);
    count += entries.length;
    for (const [, val] of entries) {
      count += countTotalKeys(val);
    }
  }
  return count;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function JsonFormatterPage() {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [indent, setIndent] = useState<string>("2");
  const [sortKeys, setSortKeys] = useState<boolean>(false);
  const [status, setStatus] = useState<StatusInfo>({ type: "idle" });
  const [copied, setCopied] = useState<boolean>(false);
  const indentSelectId = useId();

  const getIndentValue = useCallback(() => {
    if (indent === "tab") return "\t";
    return parseInt(indent, 10) || 2;
  }, [indent]);

  const handleFormat = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setStatus({ type: "idle" });
      return;
    }

    try {
      let parsed = JSON.parse(input);
      if (sortKeys) {
        parsed = sortJsonKeys(parsed);
      }
      const formatted = JSON.stringify(parsed, null, getIndentValue());
      setOutput(formatted);

      const byteSize = new Blob([formatted]).size;
      const keyCount = countTotalKeys(parsed);
      const depth = calculateDepth(parsed);

      setStatus({
        type: "success",
        message: "JSON formatted successfully! Valid JSON structure.",
        byteSize,
        itemCount: keyCount,
        depth,
      });
    } catch (err) {
      const errorInfo = parseJsonError(input, err);
      setStatus({
        type: "error",
        message: errorInfo.message,
        line: errorInfo.line,
        column: errorInfo.column,
      });
    }
  }, [input, sortKeys, getIndentValue]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setStatus({ type: "idle" });
      return;
    }

    try {
      let parsed = JSON.parse(input);
      if (sortKeys) {
        parsed = sortJsonKeys(parsed);
      }
      const minified = JSON.stringify(parsed);
      setOutput(minified);

      const origSize = new Blob([input]).size;
      const minSize = new Blob([minified]).size;
      const reduction = origSize > 0 ? Math.max(0, ((origSize - minSize) / origSize) * 100) : 0;

      setStatus({
        type: "success",
        message: `JSON minified! Saved ${reduction.toFixed(1)}% (${formatBytes(origSize - minSize)})`,
        byteSize: minSize,
        reduction,
      });
    } catch (err) {
      const errorInfo = parseJsonError(input, err);
      setStatus({
        type: "error",
        message: errorInfo.message,
        line: errorInfo.line,
        column: errorInfo.column,
      });
    }
  }, [input, sortKeys]);

  const handleValidate = useCallback(() => {
    if (!input.trim()) {
      setStatus({
        type: "error",
        message: "Input is empty. Please enter or paste JSON to validate.",
      });
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const byteSize = new Blob([input]).size;
      const keyCount = countTotalKeys(parsed);
      const depth = calculateDepth(parsed);

      setStatus({
        type: "success",
        message: "Valid JSON syntax! No parsing errors detected.",
        byteSize,
        itemCount: keyCount,
        depth,
      });
    } catch (err) {
      const errorInfo = parseJsonError(input, err);
      setStatus({
        type: "error",
        message: errorInfo.message,
        line: errorInfo.line,
        column: errorInfo.column,
      });
    }
  }, [input]);

  const handleLoadSample = useCallback(() => {
    const sampleStr = JSON.stringify(SAMPLE_JSON, null, getIndentValue());
    setInput(sampleStr);
    setOutput(sampleStr);
    const byteSize = new Blob([sampleStr]).size;
    const keyCount = countTotalKeys(SAMPLE_JSON);
    const depth = calculateDepth(SAMPLE_JSON);
    setStatus({
      type: "success",
      message: "Sample JSON loaded successfully.",
      byteSize,
      itemCount: keyCount,
      depth,
    });
  }, [getIndentValue]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setStatus({ type: "idle" });
  }, []);

  const handleCopy = useCallback(async () => {
    const textToCopy = output || input;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output, input]);

  const handleDownload = useCallback(() => {
    const textToDownload = output || input;
    if (!textToDownload) return;

    const blob = new Blob([textToDownload], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [output, input]);

  const inputLineCount = input ? input.split("\n").length : 0;
  const outputLineCount = output ? output.split("\n").length : 0;

  return (
    <ToolLayout
      title="JSON Formatter & Validator - Format, Beautify, Validate JSON"
      description="Free online JSON formatter, validator, and beautifier. Paste your JSON and format it instantly. Supports minification and validation with error messages."
    >
      <div className="space-y-5">
        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleFormat}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Format / Beautify
            </button>

            <button
              onClick={handleMinify}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 active:scale-95 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              Minify
            </button>

            <button
              onClick={handleValidate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 active:scale-95 dark:bg-emerald-700 dark:hover:bg-emerald-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Validate
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Indent Selector */}
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <label htmlFor={indentSelectId} className="text-xs font-medium uppercase tracking-wide">
                Indent:
              </label>
              <select
                id={indentSelectId}
                value={indent}
                onChange={(e) => setIndent(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-sm text-gray-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="2">2 Spaces</option>
                <option value="4">4 Spaces</option>
                <option value="tab">Tab</option>
                <option value="1">1 Space</option>
              </select>
            </div>

            {/* Sort Keys Toggle */}
            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-700 select-none dark:text-gray-300">
              <input
                type="checkbox"
                checked={sortKeys}
                onChange={(e) => setSortKeys(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
              />
              <span>Sort Keys</span>
            </label>

            <button
              onClick={handleLoadSample}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-600 underline-offset-2 hover:text-blue-600 hover:underline dark:text-gray-400 dark:hover:text-blue-400"
            >
              Load Sample
            </button>

            <button
              onClick={handleClear}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 underline-offset-2 hover:text-red-700 hover:underline dark:text-red-400 dark:hover:text-red-300"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Status Notification Banner */}
        {status.type === "success" && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">{status.message}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
              {status.byteSize !== undefined && <span>Size: <strong>{formatBytes(status.byteSize)}</strong></span>}
              {status.itemCount !== undefined && <span>Keys: <strong>{status.itemCount}</strong></span>}
              {status.depth !== undefined && <span>Depth: <strong>{status.depth}</strong></span>}
            </div>
          </div>
        )}

        {status.type === "error" && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            <div className="flex items-start gap-2">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-red-800 dark:text-red-200">Invalid JSON Syntax</p>
                <p className="mt-1 font-mono text-xs text-red-700 dark:text-red-300">{status.message}</p>
                {(status.line !== undefined || status.column !== undefined) && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800 dark:bg-red-900/60 dark:text-red-200">
                    <span>📍 Error location:</span>
                    {status.line !== undefined && <span>Line <strong>{status.line}</strong></span>}
                    {status.column !== undefined && <span>Column <strong>{status.column}</strong></span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Input & Output Split Editor */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Input Area */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Input JSON</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({inputLineCount} {inputLineCount === 1 ? "line" : "lines"}, {input.length} chars)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      setInput(text);
                    } catch {
                      // Clipboard permission denied or unavailable
                    }
                  }}
                  className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  title="Paste from clipboard"
                >
                  Paste
                </button>
                <button
                  onClick={() => setInput("")}
                  className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-red-400"
                  title="Clear input"
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste or type raw JSON here..."
              rows={18}
              spellCheck={false}
              className="w-full flex-1 resize-y rounded-lg border border-gray-300 bg-white p-3 font-mono text-sm leading-relaxed text-gray-900 shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>

          {/* Output Area */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Output Result</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({outputLineCount} {outputLineCount === 1 ? "line" : "lines"}, {output.length} chars)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output && !input}
                  className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800"
                  title="Download as JSON file"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output && !input}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-40"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy Output
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Formatted or minified output will appear here..."
              rows={18}
              spellCheck={false}
              className="w-full flex-1 resize-y rounded-lg border border-gray-300 bg-gray-50 p-3 font-mono text-sm leading-relaxed text-gray-900 shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>
        </div>

        {/* Feature Highlights & Guide */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50/70 p-5 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-800/30 dark:text-gray-400">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">About JSON Formatter & Validator</h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">✨ Beautify & Format</p>
              <p className="mt-1 text-xs leading-normal">
                Format unorganized or compact JSON with customizable 2-space, 4-space, or tab indentation for maximum readability.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">🔍 Strict Validation</p>
              <p className="mt-1 text-xs leading-normal">
                Identify syntax mistakes, unquoted keys, trailing commas, and locate exact line numbers and column coordinates instantly.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">🔒 100% Client-Side</p>
              <p className="mt-1 text-xs leading-normal">
                Your data never leaves your browser. Parsing and formatting run entirely on your local machine for complete privacy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
