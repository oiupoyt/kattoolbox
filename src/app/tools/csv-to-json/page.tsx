"use client";

import { useState, useCallback, useId, useTransition } from "react";
import ToolLayout from "@/components/ToolLayout";

interface StatusInfo {
  type: "idle" | "success" | "error";
  message?: string;
  rowCount?: number;
  colCount?: number;
  byteSize?: number;
  warning?: string;
}

const SAMPLE_CSV = `id,name,email,role,salary,active,address.city,address.state,skills
101,"Alex Johnson",alex.johnson@example.com,"Senior Engineer",125000,true,"San Francisco",CA,"[""TypeScript"",""React"",""Node.js""]"
102,"Sarah ""Dev"" Connor",sarah.c@example.com,"Product Designer",110000,true,Austin,TX,"[""Figma"",""UI/UX""]"
103,"Liam O'Connor
Remote Lead",liam.oc@example.com,"DevOps Engineer",130000,false,Seattle,WA,"[""Kubernetes"",""Docker"",""AWS""]"`;

function detectDelimiter(text: string): string {
  const sample = text.slice(0, 2000);
  const candidates = [",", ";", "\t", "|"];
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0, "|": 0 };

  let inQuotes = false;
  for (let i = 0; i < sample.length; i++) {
    const char = sample[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes && counts[char] !== undefined) {
      counts[char]++;
    }
  }

  let bestDelimiter = ",";
  let maxCount = -1;
  for (const d of candidates) {
    if (counts[d] > maxCount && counts[d] > 0) {
      maxCount = counts[d];
      bestDelimiter = d;
    }
  }

  return bestDelimiter;
}

function parseCSV(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i += 2;
      } else if (char === '"') {
        inQuotes = false;
        i++;
      } else {
        currentField += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (text.slice(i, i + delimiter.length) === delimiter) {
        currentRow.push(currentField);
        currentField = "";
        i += delimiter.length;
      } else if (char === "\r" && nextChar === "\n") {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
        i += 2;
      } else if (char === "\n" || char === "\r") {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
        i++;
      } else {
        currentField += char;
        i++;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  // Remove empty trailing lines
  while (rows.length > 0 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0].trim() === "") {
    rows.pop();
  }

  return rows;
}

function unflattenObject(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const parts = key.split(".");
    let current: Record<string, unknown> = result;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = value;
      } else {
        if (!current[part] || typeof current[part] !== "object" || Array.isArray(current[part])) {
          current[part] = {};
        }
        current = current[part] as Record<string, unknown>;
      }
    }
  }

  return result;
}

function parseCellValue(value: string, autoParseTypes: boolean): unknown {
  if (!autoParseTypes) return value;
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (trimmed.toLowerCase() === "null") return null;
  if (trimmed.toLowerCase() === "true") return true;
  if (trimmed.toLowerCase() === "false") return false;

  // Numeric check (avoid converting leading zeros like phone numbers / zip codes "01234" to numbers)
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    if (trimmed === "0" || !trimmed.startsWith("0") || trimmed.startsWith("0.")) {
      const num = Number(trimmed);
      if (!isNaN(num)) {
        return num;
      }
    }
  }

  // Check if cell is serialized JSON (e.g. nested array or object)
  if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fallback to string
    }
  }

  return value;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function CsvToJsonPage() {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [delimiterSetting, setDelimiterSetting] = useState<string>("auto");
  const [hasHeaders, setHasHeaders] = useState<boolean>(true);
  const [autoParseTypes, setAutoParseTypes] = useState<boolean>(true);
  const [unflatten, setUnflatten] = useState<boolean>(true);
  const [indent, setIndent] = useState<string>("2");
  const [status, setStatus] = useState<StatusInfo>({ type: "idle" });
  const [copied, setCopied] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  const delimiterSelectId = useId();
  const indentSelectId = useId();

  const convertCsvToJson = useCallback(
    (
      csvText: string,
      delimOpt: string,
      headersOpt: boolean,
      typesOpt: boolean,
      unflattenOpt: boolean,
      indentOpt: string
    ) => {
      if (!csvText.trim()) {
        setOutput("");
        setStatus({ type: "idle" });
        return;
      }

      try {
        const activeDelimiter = delimOpt === "auto" ? detectDelimiter(csvText) : delimOpt;
        const parsedRows = parseCSV(csvText, activeDelimiter);

        if (parsedRows.length === 0) {
          setOutput("[]");
          setStatus({
            type: "success",
            message: "Parsed 0 rows.",
            rowCount: 0,
            colCount: 0,
            byteSize: 2,
          });
          return;
        }

        let jsonResult: unknown;
        let columnCount = 0;
        let recordCount = 0;

        if (headersOpt) {
          const headerRow = parsedRows[0];
          columnCount = headerRow.length;
          const dataRows = parsedRows.slice(1);
          recordCount = dataRows.length;

          const records: Record<string, unknown>[] = [];
          for (const row of dataRows) {
            const record: Record<string, unknown> = {};
            for (let c = 0; c < headerRow.length; c++) {
              const header = headerRow[c]?.trim() || `column_${c + 1}`;
              const val = c < row.length ? row[c] : "";
              record[header] = parseCellValue(val, typesOpt);
            }

            if (unflattenOpt) {
              records.push(unflattenObject(record));
            } else {
              records.push(record);
            }
          }
          jsonResult = records;
        } else {
          // No headers: array of arrays or array of objects with generic column keys
          recordCount = parsedRows.length;
          columnCount = Math.max(...parsedRows.map((r) => r.length), 0);
          jsonResult = parsedRows.map((row) => row.map((cell) => parseCellValue(cell, typesOpt)));
        }

        const indentVal = indentOpt === "tab" ? "\t" : parseInt(indentOpt, 10);
        const formattedJson = JSON.stringify(jsonResult, null, indentVal);
        setOutput(formattedJson);

        const byteSize = new Blob([formattedJson]).size;
        setStatus({
          type: "success",
          message: `Successfully converted ${recordCount} record${recordCount === 1 ? "" : "s"} (${columnCount} columns)!`,
          rowCount: recordCount,
          colCount: columnCount,
          byteSize,
        });
      } catch (err) {
        setOutput("");
        setStatus({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to parse CSV data.",
        });
      }
    },
    []
  );

  const handleConvert = useCallback(() => {
    startTransition(() => {
      convertCsvToJson(input, delimiterSetting, hasHeaders, autoParseTypes, unflatten, indent);
    });
  }, [input, delimiterSetting, hasHeaders, autoParseTypes, unflatten, indent, convertCsvToJson]);

  const handleLoadSample = useCallback(() => {
    setInput(SAMPLE_CSV);
    startTransition(() => {
      convertCsvToJson(SAMPLE_CSV, delimiterSetting, hasHeaders, autoParseTypes, unflatten, indent);
    });
  }, [delimiterSetting, hasHeaders, autoParseTypes, unflatten, indent, convertCsvToJson]);

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
    const blob = new Blob([output], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [output]);

  const inputLineCount = input ? input.split("\n").length : 0;
  const outputLineCount = output ? output.split("\n").length : 0;

  return (
    <ToolLayout
      title="CSV to JSON Converter - Convert CSV Tables to JSON"
      description="Online CSV to JSON converter. Parse comma/semicolon/tab-separated values, handle multi-line strings, auto-detect data types, and unflatten nested keys into structured JSON."
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
              Convert to JSON
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
              <label htmlFor={delimiterSelectId} className="text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                Delimiter:
              </label>
              <select
                id={delimiterSelectId}
                value={delimiterSetting}
                onChange={(e) => setDelimiterSetting(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="auto">Auto-detect</option>
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="&#9;">Tab (\t)</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>

            {/* Indent Selector */}
            <div className="flex items-center gap-1.5">
              <label htmlFor={indentSelectId} className="text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                Indent:
              </label>
              <select
                id={indentSelectId}
                value={indent}
                onChange={(e) => setIndent(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="2">2 Spaces</option>
                <option value="4">4 Spaces</option>
                <option value="tab">Tab</option>
                <option value="0">Minified (0)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Toggles Strip */}
        <div className="flex flex-wrap items-center gap-5 text-xs text-gray-600 dark:text-gray-400">
          <label className="flex cursor-pointer items-center gap-1.5 select-none hover:text-gray-900 dark:hover:text-gray-100">
            <input
              type="checkbox"
              checked={hasHeaders}
              onChange={(e) => setHasHeaders(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            />
            <span className="font-medium">First row as headers (keys)</span>
          </label>

          <label className="flex cursor-pointer items-center gap-1.5 select-none hover:text-gray-900 dark:hover:text-gray-100">
            <input
              type="checkbox"
              checked={autoParseTypes}
              onChange={(e) => setAutoParseTypes(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            />
            <span>Auto-parse numbers, booleans &amp; null</span>
          </label>

          <label className="flex cursor-pointer items-center gap-1.5 select-none hover:text-gray-900 dark:hover:text-gray-100">
            <input
              type="checkbox"
              checked={unflatten}
              disabled={!hasHeaders}
              onChange={(e) => setUnflatten(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800"
            />
            <span>Unflatten dot keys (e.g. <code>address.city</code> &rarr; object)</span>
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
              <div>
                <p className="font-semibold text-red-800 dark:text-red-200">Error Parsing CSV</p>
                <p className="mt-1 font-mono text-xs text-red-700 dark:text-red-300">{status.message}</p>
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
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Input CSV</span>
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
                      // Permission denied
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
              placeholder="Paste raw CSV text here (comma, semicolon, or tab separated)..."
              rows={18}
              spellCheck={false}
              className="w-full flex-1 resize-y rounded-lg border border-gray-300 bg-white p-3 font-mono text-sm leading-relaxed text-gray-900 shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>

          {/* Output Area */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">JSON Output</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({outputLineCount} {outputLineCount === 1 ? "line" : "lines"}, {output.length} chars)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                  title="Download as JSON file"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download .json
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
                  title="Copy JSON to clipboard"
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
                      Copy JSON
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Formatted JSON array will appear here..."
              rows={18}
              spellCheck={false}
              className="w-full flex-1 resize-y rounded-lg border border-gray-300 bg-gray-50 p-3 font-mono text-sm leading-relaxed text-gray-900 shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>
        </div>

        {/* Feature Highlights & Guide */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50/70 p-5 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-800/30 dark:text-gray-400">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">About CSV to JSON Converter</h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">🔍 Smart Delimiter Detection</p>
              <p className="mt-1 text-xs leading-normal">
                Automatically detects whether your data uses commas, tabs, semicolons, or pipes, or choose manually.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">🌳 Nested Object Reconstruction</p>
              <p className="mt-1 text-xs leading-normal">
                Reconstitutes dot-notation headers (such as <code>address.city</code>) back into rich nested JSON objects.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">🛡️ Full RFC 4180 Support</p>
              <p className="mt-1 text-xs leading-normal">
                Properly processes escaped quotes, multi-line values, special characters, and numeric types.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
