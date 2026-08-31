"use client";

import { useState, useCallback, useId, useTransition } from "react";
import ToolLayout from "@/components/ToolLayout";

interface StatusInfo {
  type: "idle" | "success" | "error";
  message?: string;
  rowCount?: number;
  colCount?: number;
  byteSize?: number;
  line?: number;
  column?: number;
}

const SAMPLE_JSON = [
  {
    id: 101,
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    role: "Senior Engineer",
    active: true,
    salary: 125000,
    address: {
      street: "123 Market St, Suite 400",
      city: "San Francisco",
      state: "CA",
      zip: "94105",
      geo: {
        lat: 37.7749,
        lng: -122.4194
      }
    },
    skills: ["TypeScript", "React", "Node.js"],
    manager: null
  },
  {
    id: 102,
    name: "Sarah \"Dev\" Connor",
    email: "sarah.c@example.com",
    role: "Product Designer",
    active: true,
    salary: 110000,
    address: {
      street: "456 Oak Avenue",
      city: "Austin",
      state: "TX",
      zip: "78701",
      geo: {
        lat: 30.2672,
        lng: -97.7431
      }
    },
    skills: ["Figma", "UI/UX", "Tailwind CSS"],
    manager: "Alex Johnson"
  },
  {
    id: 103,
    name: "Liam O'Connor\nRemote Lead",
    email: "liam.oc@example.com",
    role: "DevOps Engineer",
    active: false,
    salary: 130000,
    address: {
      street: "789 Pine Road",
      city: "Seattle",
      state: "WA",
      zip: "98101",
      geo: {
        lat: 47.6062,
        lng: -122.3321
      }
    },
    skills: ["Kubernetes", "Docker", "AWS", "Terraform"],
    manager: "Alex Johnson"
  }
];

function flattenObject(
  obj: Record<string, unknown>,
  prefix = "",
  arrayMode: "json" | "join" = "join"
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (val !== null && typeof val === "object") {
      if (Array.isArray(val)) {
        if (arrayMode === "join" && val.every((v) => typeof v !== "object" || v === null)) {
          result[newKey] = val.map((v) => (v === null ? "" : String(v))).join("; ");
        } else {
          result[newKey] = JSON.stringify(val);
        }
      } else if (Object.keys(val).length > 0) {
        Object.assign(result, flattenObject(val as Record<string, unknown>, newKey, arrayMode));
      } else {
        result[newKey] = "{}";
      }
    } else {
      result[newKey] = val;
    }
  }

  return result;
}

function parseJsonError(input: string, err: unknown): { message: string; line?: number; column?: number } {
  if (!(err instanceof Error)) {
    return { message: String(err) };
  }
  const msg = err.message;
  const posMatch = msg.match(/at position (\d+)/i);
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10);
    const before = input.slice(0, pos);
    const lines = before.split("\n");
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    return { message: msg, line, column };
  }
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function JsonToCsvPage() {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [delimiter, setDelimiter] = useState<string>(",");
  const [flatten, setFlatten] = useState<boolean>(true);
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);
  const [quoteAll, setQuoteAll] = useState<boolean>(false);
  const [arrayMode, setArrayMode] = useState<"join" | "json">("join");
  const [status, setStatus] = useState<StatusInfo>({ type: "idle" });
  const [copied, setCopied] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  const delimiterId = useId();
  const arrayModeId = useId();

  const convertJsonToCsv = useCallback(
    (
      rawJson: string,
      currentDelimiter: string,
      shouldFlatten: boolean,
      headersEnabled: boolean,
      allQuotes: boolean,
      arrMode: "join" | "json"
    ) => {
      if (!rawJson.trim()) {
        setOutput("");
        setStatus({ type: "idle" });
        return;
      }

      try {
        const parsed = JSON.parse(rawJson);
        let array: unknown[] = [];

        if (Array.isArray(parsed)) {
          array = parsed;
        } else if (parsed !== null && typeof parsed === "object") {
          array = [parsed];
        } else {
          setStatus({
            type: "error",
            message: "JSON root must be an array of objects (e.g. `[{...}, {...}]`) or a single object.",
          });
          setOutput("");
          return;
        }

        if (array.length === 0) {
          setOutput("");
          setStatus({
            type: "success",
            message: "Empty array converted (0 rows, 0 columns).",
            rowCount: 0,
            colCount: 0,
            byteSize: 0,
          });
          return;
        }

        const processedRows: Record<string, unknown>[] = array.map((item) => {
          if (item === null || typeof item !== "object") {
            return { value: item };
          }
          if (shouldFlatten) {
            return flattenObject(item as Record<string, unknown>, "", arrMode);
          }
          return item as Record<string, unknown>;
        });

        // Collect all unique keys in order of discovery
        const headerSet = new Set<string>();
        for (const row of processedRows) {
          for (const key of Object.keys(row)) {
            headerSet.add(key);
          }
        }
        const headers = Array.from(headerSet);

        if (headers.length === 0) {
          setOutput("");
          setStatus({
            type: "success",
            message: "No data properties found.",
            rowCount: processedRows.length,
            colCount: 0,
            byteSize: 0,
          });
          return;
        }

        const escapeVal = (val: unknown): string => {
          if (val === null || val === undefined) return "";
          let str = typeof val === "object" ? JSON.stringify(val) : String(val);
          const needsQuote =
            allQuotes ||
            str.includes(currentDelimiter) ||
            str.includes('"') ||
            str.includes("\n") ||
            str.includes("\r");
          if (needsQuote) {
            str = `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        const lines: string[] = [];
        if (headersEnabled) {
          lines.push(headers.map((h) => escapeVal(h)).join(currentDelimiter));
        }

        for (const row of processedRows) {
          const rowValues = headers.map((header) => {
            const val = row[header];
            return escapeVal(val);
          });
          lines.push(rowValues.join(currentDelimiter));
        }

        const csvResult = lines.join("\n");
        setOutput(csvResult);

        const byteSize = new Blob([csvResult]).size;
        setStatus({
          type: "success",
          message: "JSON successfully converted to CSV!",
          rowCount: processedRows.length,
          colCount: headers.length,
          byteSize,
        });
      } catch (err) {
        const errorInfo = parseJsonError(rawJson, err);
        setOutput("");
        setStatus({
          type: "error",
          message: errorInfo.message,
          line: errorInfo.line,
          column: errorInfo.column,
        });
      }
    },
    []
  );

  const handleConvert = useCallback(() => {
    startTransition(() => {
      convertJsonToCsv(input, delimiter, flatten, includeHeaders, quoteAll, arrayMode);
    });
  }, [input, delimiter, flatten, includeHeaders, quoteAll, arrayMode, convertJsonToCsv]);

  const handleLoadSample = useCallback(() => {
    const sampleStr = JSON.stringify(SAMPLE_JSON, null, 2);
    setInput(sampleStr);
    startTransition(() => {
      convertJsonToCsv(sampleStr, delimiter, flatten, includeHeaders, quoteAll, arrayMode);
    });
  }, [delimiter, flatten, includeHeaders, quoteAll, arrayMode, convertJsonToCsv]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setStatus({ type: "idle" });
  }, []);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = output;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [output]);

  const inputLineCount = input ? input.split("\n").length : 0;
  const outputLineCount = output ? output.split("\n").length : 0;

  return (
    <ToolLayout
      title="JSON to CSV Converter - Convert JSON Arrays & Objects to CSV"
      description="Fast, free client-side JSON to CSV converter. Flatten nested JSON objects using dot notation, customize delimiters, export, and download CSV files instantly."
    >
      <div className="space-y-5">
        {/* Top Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleConvert}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 active:scale-95 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Convert to CSV
            </button>

            <button
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Load Sample Data
            </button>

            <button
              onClick={handleClear}
              disabled={!input && !output}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Options */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            {/* Delimiter */}
            <div className="flex items-center gap-1.5">
              <label htmlFor={delimiterId} className="text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                Delimiter:
              </label>
              <select
                id={delimiterId}
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="&#9;">Tab (\t)</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>

            {/* Array Mode */}
            <div className="flex items-center gap-1.5">
              <label htmlFor={arrayModeId} className="text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                Arrays:
              </label>
              <select
                id={arrayModeId}
                value={arrayMode}
                onChange={(e) => setArrayMode(e.target.value as "join" | "json")}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="join">Join with &quot;;&quot;</option>
                <option value="json">JSON String</option>
              </select>
            </div>
          </div>
        </div>

        {/* Toggles Strip */}
        <div className="flex flex-wrap items-center gap-5 text-xs text-gray-600 dark:text-gray-400">
          <label className="flex cursor-pointer items-center gap-1.5 select-none hover:text-gray-900 dark:hover:text-gray-100">
            <input
              type="checkbox"
              checked={flatten}
              onChange={(e) => setFlatten(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            />
            <span>Flatten nested objects (e.g. <code>address.city</code>)</span>
          </label>

          <label className="flex cursor-pointer items-center gap-1.5 select-none hover:text-gray-900 dark:hover:text-gray-100">
            <input
              type="checkbox"
              checked={includeHeaders}
              onChange={(e) => setIncludeHeaders(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            />
            <span>Include header row</span>
          </label>

          <label className="flex cursor-pointer items-center gap-1.5 select-none hover:text-gray-900 dark:hover:text-gray-100">
            <input
              type="checkbox"
              checked={quoteAll}
              onChange={(e) => setQuoteAll(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            />
            <span>Quote all fields</span>
          </label>
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
              {status.rowCount !== undefined && <span>Rows: <strong>{status.rowCount}</strong></span>}
              {status.colCount !== undefined && <span>Columns: <strong>{status.colCount}</strong></span>}
              {status.byteSize !== undefined && <span>Size: <strong>{formatBytes(status.byteSize)}</strong></span>}
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
                <p className="font-semibold text-red-800 dark:text-red-200">Error Parsing JSON</p>
                <p className="mt-1 font-mono text-xs text-red-700 dark:text-red-300">{status.message}</p>
                {(status.line !== undefined || status.column !== undefined) && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800 dark:bg-red-900/60 dark:text-red-200">
                    <span>📍 Location:</span>
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
                      // Clipboard permission denied
                    }
                  }}
                  className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 cursor-pointer"
                  title="Paste from clipboard"
                >
                  Paste
                </button>
                <button
                  onClick={() => setInput("")}
                  className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-red-400 cursor-pointer"
                  title="Clear input"
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste JSON array of objects here, e.g. [ { &quot;id&quot;: 1, &quot;name&quot;: &quot;Alice&quot; }, ... ]"
              rows={18}
              spellCheck={false}
              className="w-full flex-1 resize-y rounded-lg border border-gray-300 bg-white p-3 font-mono text-sm leading-relaxed text-gray-900 shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>

          {/* Output Area */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">CSV Output</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({outputLineCount} {outputLineCount === 1 ? "line" : "lines"}, {output.length} chars)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                  title="Download as CSV file"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download .csv
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
                  title="Copy CSV to clipboard"
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
                      Copy CSV
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Converted CSV tabular data will appear here..."
              rows={18}
              spellCheck={false}
              className="w-full flex-1 resize-y rounded-lg border border-gray-300 bg-gray-50 p-3 font-mono text-sm leading-relaxed text-gray-900 shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>
        </div>

        {/* Feature Highlights & Guide */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50/70 p-5 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-800/30 dark:text-gray-400">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">How to Convert JSON to CSV</h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">🌿 Nested Object Flattening</p>
              <p className="mt-1 text-xs leading-normal">
                Automatically unpacks deep nested objects into flat dot-notation headers such as <code>user.address.geo.lat</code>.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">🛡️ RFC 4180 Escaping</p>
              <p className="mt-1 text-xs leading-normal">
                Safely handles quotes, multi-line values, commas, and special delimiters with compliant CSV double-quote escaping.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">🔒 100% Client-Side Privacy</p>
              <p className="mt-1 text-xs leading-normal">
                Your data is processed directly inside your browser. No files or records are sent to any remote server.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
