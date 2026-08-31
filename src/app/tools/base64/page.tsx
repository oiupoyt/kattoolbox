"use client";

import { useState, useCallback, useId } from "react";
import ToolLayout from "@/components/ToolLayout";

export default function Base64Page() {
  const inputId = useId();
  const outputId = useId();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [urlSafe, setUrlSafe] = useState(false);
  const [splitLines, setSplitLines] = useState(false);
  const [lastAction, setLastAction] = useState<"encode" | "decode" | null>(null);

  const encodeBase64 = useCallback((text: string, isUrlSafe: boolean, isSplit: boolean) => {
    if (!text) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      const bytes = new TextEncoder().encode(text);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      let base64 = btoa(binary);
      if (isUrlSafe) {
        base64 = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      }
      if (isSplit && base64.length > 76) {
        base64 = base64.match(/.{1,76}/g)?.join("\n") || base64;
      }
      setOutput(base64);
      setError(null);
      setLastAction("encode");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to encode input.");
      setOutput("");
    }
  }, []);

  const decodeBase64 = useCallback((text: string) => {
    if (!text.trim()) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      let cleaned = text.trim().replace(/\s+/g, "");
      cleaned = cleaned.replace(/-/g, "+").replace(/_/g, "/");
      while (cleaned.length % 4 !== 0) {
        cleaned += "=";
      }

      if (!/^[A-Za-z0-9+/=]+$/.test(cleaned)) {
        throw new Error("Invalid Base64 string: Contains characters outside the Base64 alphabet.");
      }

      const binary = atob(cleaned);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      try {
        const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        setOutput(decoded);
      } catch {
        setOutput(binary);
      }
      setError(null);
      setLastAction("decode");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid Base64 string. Please check your input and try again."
      );
      setOutput("");
    }
  }, []);

  const handleEncode = () => {
    encodeBase64(input, urlSafe, splitLines);
  };

  const handleDecode = () => {
    decodeBase64(input);
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = output;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSwap = () => {
    const temp = output;
    setInput(temp);
    setOutput(input);
    setError(null);
    if (lastAction === "encode") {
      setLastAction("decode");
    } else if (lastAction === "decode") {
      setLastAction("encode");
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError(null);
    setLastAction(null);
  };

  const loadSample = (type: "text" | "unicode" | "base64") => {
    setError(null);
    if (type === "text") {
      const sample = "Hello, Developer! DevToolbox makes Base64 encoding fast and easy.";
      setInput(sample);
      encodeBase64(sample, urlSafe, splitLines);
    } else if (type === "unicode") {
      const sample = "Unicode test: 🚀 🌍 Привет! こんにちは 你好 €100 — café & naïve.";
      setInput(sample);
      encodeBase64(sample, urlSafe, splitLines);
    } else {
      const sample = "SGVsbG8sIFdvcmxkISBUaGlzIGlzIGEgZGVjb2RlZCBCYXNlNjQgbWVzc2FnZS4=";
      setInput(sample);
      decodeBase64(sample);
    }
  };

  const inputBytes = new TextEncoder().encode(input).length;
  const outputBytes = new TextEncoder().encode(output).length;

  return (
    <ToolLayout
      title="Base64 Encode / Decode"
      description="Encode and decode text to and from Base64 format with full Unicode and UTF-8 support."
    >
      <title>Base64 Encode &amp; Decode Online — DevToolbox</title>
      <meta
        name="description"
        content="Free online Base64 encoder and decoder. Supports UTF-8, Unicode, URL-safe Base64, line wrapping, and instant copy."
      />

      <div className="space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleEncode}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-medium text-sm transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Encode to Base64
            </button>
            <button
              type="button"
              onClick={handleDecode}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg font-medium text-sm transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Decode from Base64
            </button>
            <button
              type="button"
              onClick={handleSwap}
              disabled={!output && !input}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1"
              title="Swap input and output"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Swap
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!input && !output}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Sample buttons */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 dark:text-gray-400 font-medium">Samples:</span>
            <button
              type="button"
              onClick={() => loadSample("text")}
              className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded transition-colors cursor-pointer"
            >
              Plain Text
            </button>
            <button
              type="button"
              onClick={() => loadSample("unicode")}
              className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded transition-colors cursor-pointer"
            >
              Unicode / Emojis
            </button>
            <button
              type="button"
              onClick={() => loadSample("base64")}
              className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded transition-colors cursor-pointer"
            >
              Base64
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(e) => {
                const val = e.target.checked;
                setUrlSafe(val);
                if (lastAction === "encode" && input) {
                  encodeBase64(input, val, splitLines);
                }
              }}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-700"
            />
            <span>URL-safe Base64 <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">(-_ instead of +/)</code></span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={splitLines}
              onChange={(e) => {
                const val = e.target.checked;
                setSplitLines(val);
                if (lastAction === "encode" && input) {
                  encodeBase64(input, urlSafe, val);
                }
              }}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-700"
            />
            <span>Wrap lines at 76 characters (MIME)</span>
          </label>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold">Decoding Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Two-Column Editor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Area */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor={inputId} className="font-medium text-sm text-gray-700 dark:text-gray-300">
                Input String
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {input.length} chars | {inputBytes} bytes
              </span>
            </div>
            <textarea
              id={inputId}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter or paste text to encode, or Base64 string to decode..."
              rows={12}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y placeholder:text-gray-400 dark:placeholder:text-gray-500 leading-relaxed shadow-inner"
            />
          </div>

          {/* Output Area */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label htmlFor={outputId} className="font-medium text-sm text-gray-700 dark:text-gray-300">
                  Output Result
                </label>
                {lastAction && (
                  <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                    {lastAction === "encode" ? "Base64 Encoded" : "Decoded Text"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {output.length} chars | {outputBytes} bytes
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!output}
                  className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-600 dark:text-green-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              id={outputId}
              value={output}
              readOnly
              placeholder="Encoded or decoded output will appear here..."
              rows={12}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none resize-y placeholder:text-gray-400 dark:placeholder:text-gray-500 leading-relaxed select-all"
            />
          </div>
        </div>

        {/* Information & Feature Highlights */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700/60">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Full UTF-8 Unicode Support</h4>
            <p>Handles international character sets, special symbols, and emojis accurately without Latin1 byte truncation errors.</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700/60">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">100% Client-Side &amp; Private</h4>
            <p>Your data never leaves your browser. All encoding and decoding operations execute locally in JavaScript.</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700/60">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">URL-Safe &amp; MIME Formatting</h4>
            <p>Convert standard Base64 characters into URL-friendly variants or wrap output lines for MIME/email standards.</p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
