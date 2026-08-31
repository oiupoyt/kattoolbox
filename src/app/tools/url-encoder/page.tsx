"use client";

import { useState, useCallback, useId } from "react";
import ToolLayout from "@/components/ToolLayout";

export default function UrlEncoderPage() {
  const inputId = useId();
  const outputId = useId();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [encodeMode, setEncodeMode] = useState<"component" | "fullUrl">("component");
  const [spaceAsPlus, setSpaceAsPlus] = useState(false);
  const [decodePlusAsSpace, setDecodePlusAsSpace] = useState(true);
  const [lastAction, setLastAction] = useState<"encode" | "decode" | null>(null);

  const encodeUrl = useCallback(
    (text: string, mode: "component" | "fullUrl", usePlusForSpace: boolean) => {
      if (!text) {
        setOutput("");
        setError(null);
        return;
      }
      try {
        let encoded = mode === "component" ? encodeURIComponent(text) : encodeURI(text);
        if (usePlusForSpace) {
          encoded = encoded.replace(/%20/g, "+");
        }
        setOutput(encoded);
        setError(null);
        setLastAction("encode");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to encode URL.");
        setOutput("");
      }
    },
    []
  );

  const decodeUrl = useCallback(
    (text: string, treatPlusAsSpace: boolean) => {
      if (!text) {
        setOutput("");
        setError(null);
        return;
      }
      try {
        let toDecode = text;
        if (treatPlusAsSpace) {
          toDecode = toDecode.replace(/\+/g, " ");
        }
        const decoded = decodeURIComponent(toDecode);
        setOutput(decoded);
        setError(null);
        setLastAction("decode");
      } catch (err) {
        setError(
          err instanceof URIError
            ? "Malformed URI sequence: The input contains invalid or incomplete percentage-encoded sequences."
            : err instanceof Error
            ? err.message
            : "Failed to decode URL."
        );
        setOutput("");
      }
    },
    []
  );

  const handleEncode = () => {
    encodeUrl(input, encodeMode, spaceAsPlus);
  };

  const handleDecode = () => {
    decodeUrl(input, decodePlusAsSpace);
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

  const loadSample = (type: "param" | "fullUrl" | "encoded") => {
    setError(null);
    if (type === "param") {
      const sample = "query=Developer Tools & Frameworks=Next.js & React 19! &lang=français";
      setInput(sample);
      encodeUrl(sample, encodeMode, spaceAsPlus);
    } else if (type === "fullUrl") {
      const sample = "https://example.com/search?q=hello world & category=web tools#section 1";
      setInput(sample);
      setEncodeMode("fullUrl");
      encodeUrl(sample, "fullUrl", spaceAsPlus);
    } else {
      const sample = "https%3A%2F%2Fapi.example.com%2Fv1%2Fusers%3Fname%3DJohn%20Doe%26status%3Dactive%20%26%20verified";
      setInput(sample);
      decodeUrl(sample, decodePlusAsSpace);
    }
  };

  return (
    <ToolLayout
      title="URL Encode / Decode"
      description="Encode special characters into percent-encoded URL components or decode them back to standard text."
    >
      <title>URL Encode &amp; Decode Online — DevToolbox</title>
      <meta
        name="description"
        content="Free online URL encoder and decoder. Encode and decode URI components, query strings, and complete URLs with support for RFC 3986."
      />

      <div className="space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#1a1a1a]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleEncode}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white  font-medium text-sm transition-colors  cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Encode URL
            </button>
            <button
              type="button"
              onClick={handleDecode}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white  font-medium text-sm transition-colors  cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Decode URL
            </button>
            <button
              type="button"
              onClick={handleSwap}
              disabled={!output && !input}
              className="px-3 py-2 bg-[#111] hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed text-gray-400  text-sm font-medium transition-colors cursor-pointer flex items-center gap-1"
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
              className="px-3 py-2 bg-[#111] hover:bg-[#1a0a0a] text-gray-400 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed  text-sm font-medium transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Sample buttons */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium">Samples:</span>
            <button
              type="button"
              onClick={() => loadSample("param")}
              className="px-2.5 py-1 bg-[#111] hover:bg-[#1a1a1a] text-gray-400 transition-colors cursor-pointer"
            >
              Query Param
            </button>
            <button
              type="button"
              onClick={() => loadSample("fullUrl")}
              className="px-2.5 py-1 bg-[#111] hover:bg-[#1a1a1a] text-gray-400 transition-colors cursor-pointer"
            >
              Full URL
            </button>
            <button
              type="button"
              onClick={() => loadSample("encoded")}
              className="px-2.5 py-1 bg-[#111] hover:bg-[#1a1a1a] text-gray-400 transition-colors cursor-pointer"
            >
              Encoded URI
            </button>
          </div>
        </div>

        {/* Encoding Options */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 bg-black p-3  border border-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <span className="font-medium text-xs text-gray-500 uppercase tracking-wider">Encode Mode:</span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="encodeMode"
                value="component"
                checked={encodeMode === "component"}
                onChange={() => {
                  setEncodeMode("component");
                  if (lastAction === "encode" && input) {
                    encodeUrl(input, "component", spaceAsPlus);
                  }
                }}
                className="w-4 h-4 text-blue-600 border-[#1a1a1a] focus:ring-blue-900"
              />
              <span>encodeURIComponent <span className="text-xs text-gray-500">(for query params &amp; values)</span></span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="encodeMode"
                value="fullUrl"
                checked={encodeMode === "fullUrl"}
                onChange={() => {
                  setEncodeMode("fullUrl");
                  if (lastAction === "encode" && input) {
                    encodeUrl(input, "fullUrl", spaceAsPlus);
                  }
                }}
                className="w-4 h-4 text-blue-600 border-[#1a1a1a] focus:ring-blue-900"
              />
              <span>encodeURI <span className="text-xs text-gray-500">(preserves full URL structure)</span></span>
            </label>
          </div>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={spaceAsPlus}
                onChange={(e) => {
                  const val = e.target.checked;
                  setSpaceAsPlus(val);
                  if (lastAction === "encode" && input) {
                    encodeUrl(input, encodeMode, val);
                  }
                }}
                className="w-4 h-4 text-blue-600 border-[#1a1a1a] focus:ring-blue-900"
              />
              <span>Encode spaces as <code className="text-xs bg-[#1a1a1a] px-1 py-0.5 font-mono">+</code></span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={decodePlusAsSpace}
                onChange={(e) => {
                  const val = e.target.checked;
                  setDecodePlusAsSpace(val);
                  if (lastAction === "decode" && input) {
                    decodeUrl(input, val);
                  }
                }}
                className="w-4 h-4 text-blue-600 border-[#1a1a1a] focus:ring-blue-900"
              />
              <span>Decode <code className="text-xs bg-[#1a1a1a] px-1 py-0.5 font-mono">+</code> as spaces</span>
            </label>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-[#1a0a0a] border border-red-900  text-red-400 text-sm">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold">URI Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Two-Column Editor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Area */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor={inputId} className="font-medium text-sm text-gray-400">
                Input Text or URL
              </label>
              <span className="text-xs text-gray-500 font-mono">
                {input.length} chars
              </span>
            </div>
            <textarea
              id={inputId}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter text or URL to encode or decode..."
              rows={12}
              className="w-full p-3  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 font-mono text-sm focus:ring-1 focus:ring-blue-900 focus:outline-none resize-y placeholder:text-gray-400 leading-relaxed shadow-inner"
            />
          </div>

          {/* Output Area */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label htmlFor={outputId} className="font-medium text-sm text-gray-400">
                  Output Result
                </label>
                {lastAction && (
                  <span className="px-2 py-0.5 text-xs rounded-none font-medium bg-[#0a0a1a] text-blue-400">
                    {lastAction === "encode" ? "URL Encoded" : "URL Decoded"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 font-mono">
                  {output.length} chars
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!output}
                  className="px-2.5 py-1 bg-[#111] hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed text-gray-400 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-400 font-semibold">Copied!</span>
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
              className="w-full p-3  border border-[#1a1a1a] bg-black text-gray-200 font-mono text-sm focus:outline-none resize-y placeholder:text-gray-400 leading-relaxed select-all"
            />
          </div>
        </div>

        {/* Common Reference Table */}
        <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Common URL Percent-Encoding Reference</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs font-mono">
            <div className="p-2 bg-black border border-[#1a1a1a] flex justify-between">
              <span className="text-gray-600">Space:</span>
              <span className="font-semibold text-blue-600">%20 or +</span>
            </div>
            <div className="p-2 bg-black border border-[#1a1a1a] flex justify-between">
              <span className="text-gray-600">/ (slash):</span>
              <span className="font-semibold text-blue-600">%2F</span>
            </div>
            <div className="p-2 bg-black border border-[#1a1a1a] flex justify-between">
              <span className="text-gray-600">: (colon):</span>
              <span className="font-semibold text-blue-600">%3A</span>
            </div>
            <div className="p-2 bg-black border border-[#1a1a1a] flex justify-between">
              <span className="text-gray-600">&amp; (ampersand):</span>
              <span className="font-semibold text-blue-600">%26</span>
            </div>
            <div className="p-2 bg-black border border-[#1a1a1a] flex justify-between">
              <span className="text-gray-600">? (question):</span>
              <span className="font-semibold text-blue-600">%3F</span>
            </div>
            <div className="p-2 bg-black border border-[#1a1a1a] flex justify-between">
              <span className="text-gray-600">= (equal):</span>
              <span className="font-semibold text-blue-600">%3D</span>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
