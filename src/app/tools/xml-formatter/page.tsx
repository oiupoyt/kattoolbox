"use client";

import { useState, useCallback, useId } from "react";
import ToolLayout from "@/components/ToolLayout";

interface StatusInfo {
  type: "idle" | "success" | "error";
  message?: string;
  lineCount?: number;
  byteSize?: number;
  reduction?: number;
  line?: number;
  column?: number;
}

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore name="Developer Library" location="Global">
  <!-- Top Bestsellers for Software Engineers -->
  <book category="programming" inStock="true" id="bk101">
    <title lang="en">Clean Architecture: A Craftsman's Guide</title>
    <author>Robert C. Martin</author>
    <year>2017</year>
    <price currency="USD">34.99</price>
    <tags>
      <tag>Architecture</tag>
      <tag>Design Patterns</tag>
      <tag>Best Practices</tag>
    </tags>
    <description><![CDATA[Practical software structure rules from legendary expert Robert C. Martin.]]></description>
    <metadata isPublished="true" reviewScore="4.9" />
  </book>
  <book category="distributed-systems" inStock="true" id="bk102">
    <title lang="en">Designing Data-Intensive Applications</title>
    <author>Martin Kleppmann</author>
    <year>2017</year>
    <price currency="USD">42.50</price>
    <tags>
      <tag>Distributed Systems</tag>
      <tag>Databases</tag>
      <tag>Storage</tag>
    </tags>
    <description><![CDATA[The definitive guide to the architecture of modern large-scale reliable data systems.]]></description>
    <metadata isPublished="true" reviewScore="5.0" />
  </book>
</bookstore>`;

function escapeXmlText(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeXmlAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function validateXml(xml: string): { valid: boolean; error?: string; line?: number; column?: number } {
  if (!xml.trim()) {
    return { valid: false, error: "Input is empty. Please enter or paste XML to validate." };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const parserError = doc.querySelector("parsererror");

  if (parserError) {
    const fullErr = parserError.textContent || "XML Parsing Error";
    const cleanErr = fullErr.replace(/Below is a rendering of the page up to the first error\.[\s\S]*/, "").trim();

    const lineMatch = fullErr.match(/line\s+(\d+)/i) || fullErr.match(/error on line (\d+)/i);
    const colMatch = fullErr.match(/column\s+(\d+)/i) || fullErr.match(/at column (\d+)/i);

    return {
      valid: false,
      error: cleanErr,
      line: lineMatch ? parseInt(lineMatch[1], 10) : undefined,
      column: colMatch ? parseInt(colMatch[1], 10) : undefined,
    };
  }

  return { valid: true };
}

function serializeNode(
  node: Node,
  indentStr: string,
  currentDepth: number,
  collapseEmpty: boolean
): string {
  const indent = indentStr.repeat(currentDepth);

  if (node.nodeType === Node.COMMENT_NODE) {
    return `${indent}<!--${node.nodeValue}-->`;
  }

  if (node.nodeType === Node.CDATA_SECTION_NODE) {
    return `${indent}<![CDATA[${node.nodeValue}]]>`;
  }

  if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
    const pi = node as ProcessingInstruction;
    return `${indent}<?${pi.target} ${pi.data}?>`;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.nodeValue?.trim() || "";
    if (!text) return "";
    return `${indent}${escapeXmlText(text)}`;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    const tagName = el.tagName;

    let attrs = "";
    if (el.attributes && el.attributes.length > 0) {
      attrs =
        " " +
        Array.from(el.attributes)
          .map((a) => `${a.name}="${escapeXmlAttr(a.value)}"`)
          .join(" ");
    }

    const childNodes = Array.from(el.childNodes).filter((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        return (child.nodeValue || "").trim().length > 0;
      }
      return true;
    });

    if (childNodes.length === 0) {
      if (collapseEmpty) {
        return `${indent}<${tagName}${attrs} />`;
      } else {
        return `${indent}<${tagName}${attrs}></${tagName}>`;
      }
    }

    // Single inline text child
    if (childNodes.length === 1 && childNodes[0].nodeType === Node.TEXT_NODE) {
      const text = childNodes[0].nodeValue?.trim() || "";
      if (!text.includes("\n") && text.length < 80) {
        return `${indent}<${tagName}${attrs}>${escapeXmlText(text)}</${tagName}>`;
      }
    }

    // Single inline CDATA child
    if (childNodes.length === 1 && childNodes[0].nodeType === Node.CDATA_SECTION_NODE) {
      const cdata = childNodes[0].nodeValue || "";
      if (!cdata.includes("\n") && cdata.length < 80) {
        return `${indent}<${tagName}${attrs}><![CDATA[${cdata}]]></${tagName}>`;
      }
    }

    const childLines: string[] = [];
    for (const child of childNodes) {
      const serialized = serializeNode(child, indentStr, currentDepth + 1, collapseEmpty);
      if (serialized) {
        childLines.push(serialized);
      }
    }

    return `${indent}<${tagName}${attrs}>\n${childLines.join("\n")}\n${indent}</${tagName}>`;
  }

  return "";
}

function formatXmlDocument(
  xml: string,
  indentStr: string,
  collapseEmpty: boolean
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const parserError = doc.querySelector("parsererror");

  if (parserError) {
    const val = validateXml(xml);
    throw new Error(val.error || "XML parsing error");
  }

  // Preserve initial <?xml ...?> declaration if present in original string
  const declMatch = xml.trim().match(/^<\?xml\s+[^?]*\?>/i);
  const declaration = declMatch ? declMatch[0] : "";

  const lines: string[] = [];
  if (declaration) {
    lines.push(declaration);
  }

  for (const child of Array.from(doc.childNodes)) {
    const formatted = serializeNode(child, indentStr, 0, collapseEmpty);
    if (formatted) {
      lines.push(formatted);
    }
  }

  return lines.join("\n");
}

function minifyXmlString(xml: string): string {
  const val = validateXml(xml);
  if (!val.valid) {
    throw new Error(val.error || "Invalid XML syntax.");
  }

  // Strip whitespace between tags and compact spaces
  const minified = xml
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();

  return minified;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function XmlFormatterPage() {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [indentStr, setIndentStr] = useState<string>("  ");
  const [collapseEmpty, setCollapseEmpty] = useState<boolean>(true);
  const [status, setStatus] = useState<StatusInfo>({ type: "idle" });
  const [copied, setCopied] = useState<boolean>(false);

  const indentSelectId = useId();

  const handleFormat = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setStatus({ type: "idle" });
      return;
    }

    try {
      const formatted = formatXmlDocument(input, indentStr, collapseEmpty);
      setOutput(formatted);

      const byteSize = new Blob([formatted]).size;
      const lineCount = formatted.split("\n").length;

      setStatus({
        type: "success",
        message: "XML beautified and indented successfully!",
        lineCount,
        byteSize,
      });
    } catch (err) {
      const val = validateXml(input);
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to format XML.",
        line: val.line,
        column: val.column,
      });
    }
  }, [input, indentStr, collapseEmpty]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setStatus({ type: "idle" });
      return;
    }

    try {
      const minified = minifyXmlString(input);
      setOutput(minified);

      const origSize = new Blob([input]).size;
      const minSize = new Blob([minified]).size;
      const reduction = origSize > 0 ? Math.max(0, Math.round(((origSize - minSize) / origSize) * 100)) : 0;

      setStatus({
        type: "success",
        message: `XML minified! Removed whitespace between tags (saved ${reduction}%).`,
        lineCount: minified.split("\n").length,
        byteSize: minSize,
        reduction,
      });
    } catch (err) {
      const val = validateXml(input);
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to minify XML.",
        line: val.line,
        column: val.column,
      });
    }
  }, [input]);

  const handleValidate = useCallback(() => {
    if (!input.trim()) {
      setStatus({
        type: "error",
        message: "Input is empty. Please enter XML data to validate.",
      });
      return;
    }

    const val = validateXml(input);
    if (val.valid) {
      const byteSize = new Blob([input]).size;
      setStatus({
        type: "success",
        message: "XML is well-formed! No syntax or structure errors detected.",
        byteSize,
        lineCount: input.split("\n").length,
      });
    } else {
      setStatus({
        type: "error",
        message: val.error || "XML is not well-formed.",
        line: val.line,
        column: val.column,
      });
    }
  }, [input]);

  const handleLoadSample = useCallback(() => {
    setInput(SAMPLE_XML);
    try {
      const formatted = formatXmlDocument(SAMPLE_XML, indentStr, collapseEmpty);
      setOutput(formatted);
      setStatus({
        type: "success",
        message: "Sample XML loaded and formatted successfully.",
        lineCount: formatted.split("\n").length,
        byteSize: new Blob([formatted]).size,
      });
    } catch {
      setOutput(SAMPLE_XML);
    }
  }, [indentStr, collapseEmpty]);

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

    const blob = new Blob([textToDownload], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.xml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [output, input]);

  const inputLineCount = input ? input.split("\n").length : 0;
  const outputLineCount = output ? output.split("\n").length : 0;

  return (
    <ToolLayout
      title="XML Formatter & Validator - Format, Beautify & Validate XML"
      description="Free online XML formatter, beautifier, and validator. Pretty-print raw XML with custom indentation, self-closing tags, CDATA handling, and instant validation."
    >
      <div className="space-y-5">
        {/* Top Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleFormat}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 active:scale-95 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Format / Beautify
            </button>

            <button
              onClick={handleMinify}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 active:scale-95 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              Minify
            </button>

            <button
              onClick={handleValidate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 active:scale-95 dark:bg-emerald-700 dark:hover:bg-emerald-600 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Validate XML
            </button>

            <button
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 cursor-pointer"
            >
              Load Sample
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
            {/* Indent Selector */}
            <div className="flex items-center gap-1.5">
              <label htmlFor={indentSelectId} className="text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                Indent:
              </label>
              <select
                id={indentSelectId}
                value={indentStr}
                onChange={(e) => setIndentStr(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="  ">2 Spaces</option>
                <option value="    ">4 Spaces</option>
                <option value="&#9;">Tab</option>
              </select>
            </div>

            {/* Collapse Empty Tags */}
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600 select-none hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              <input
                type="checkbox"
                checked={collapseEmpty}
                onChange={(e) => setCollapseEmpty(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
              />
              <span>Self-close empty tags (<code>&lt;tag /&gt;</code>)</span>
            </label>
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
              {status.lineCount !== undefined && <span>Lines: <strong>{status.lineCount}</strong></span>}
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
                <p className="font-semibold text-red-800 dark:text-red-200">XML Parsing Error</p>
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
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Input XML</span>
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
              placeholder="Paste raw or unformatted XML here..."
              rows={18}
              spellCheck={false}
              className="w-full flex-1 resize-y rounded-lg border border-gray-300 bg-white p-3 font-mono text-sm leading-relaxed text-gray-900 shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>

          {/* Output Area */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Formatted XML Output</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({outputLineCount} {outputLineCount === 1 ? "line" : "lines"}, {output.length} chars)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output && !input}
                  className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                  title="Download as XML file"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download .xml
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output && !input}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
                  title="Copy XML output"
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
                      Copy XML
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Formatted XML output will appear here..."
              rows={18}
              spellCheck={false}
              className="w-full flex-1 resize-y rounded-lg border border-gray-300 bg-gray-50 p-3 font-mono text-sm leading-relaxed text-gray-900 shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>
        </div>

        {/* Feature Highlights & Guide */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50/70 p-5 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-800/30 dark:text-gray-400">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">About XML Formatter & Validator</h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">✨ Proper Tree Serialization</p>
              <p className="mt-1 text-xs leading-normal">
                Indents elements, handles namespaces, attributes, comments, processing instructions, and CDATA blocks.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">🔍 Real-time DOM Validation</p>
              <p className="mt-1 text-xs leading-normal">
                Validates XML well-formedness and points directly to unclosed tags, mismatching brackets, or invalid characters.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">🔒 100% Client-Side</p>
              <p className="mt-1 text-xs leading-normal">
                Uses the browser&apos;s native DOMParser engine. No XML payload ever leaves your computer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
