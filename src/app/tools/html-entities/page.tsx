"use client";

import { useState, useCallback, useId } from "react";
import ToolLayout from "@/components/ToolLayout";

const BASIC_ENTITIES_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const EXTENDED_ENTITIES_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "©": "&copy;",
  "®": "&reg;",
  "™": "&trade;",
  "€": "&euro;",
  "£": "&pound;",
  "¥": "&yen;",
  "¢": "&cent;",
  "§": "&sect;",
  "°": "&deg;",
  "±": "&plusmn;",
  "«": "&laquo;",
  "»": "&raquo;",
  "•": "&bull;",
  "…": "&hellip;",
  "—": "&mdash;",
  "–": "&ndash;",
  "“": "&ldquo;",
  "”": "&rdquo;",
  "‘": "&lsquo;",
  "’": "&rsquo;",
  "×": "&times;",
  "÷": "&divide;",
  "µ": "&micro;",
  "¶": "&para;",
  "¼": "&frac14;",
  "½": "&frac12;",
  "¾": "&frac34;",
};

type EncodeMode = "basic" | "extended" | "decimal" | "hex";

export default function HtmlEntitiesPage() {
  const inputId = useId();
  const outputId = useId();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [encodeMode, setEncodeMode] = useState<EncodeMode>("basic");
  const [lastAction, setLastAction] = useState<"encode" | "decode" | null>(null);

  const encodeText = useCallback((text: string, mode: EncodeMode) => {
    if (!text) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      let result = "";
      if (mode === "basic") {
        result = text.replace(/[&<>"']/g, (char) => BASIC_ENTITIES_MAP[char] || char);
      } else if (mode === "extended") {
        result = text.replace(
          /[&<>"'©®™€£¥¢§°±«»•…—–“”‘’×÷µ¶¼½¾]/g,
          (char) => EXTENDED_ENTITIES_MAP[char] || char
        );
      } else if (mode === "decimal") {
        result = text.replace(/[&<>"']|[^\x20-\x7E\r\n\t]/g, (char) => {
          const code = char.codePointAt(0);
          return code !== undefined ? `&#${code};` : char;
        });
      } else if (mode === "hex") {
        result = text.replace(/[&<>"']|[^\x20-\x7E\r\n\t]/g, (char) => {
          const code = char.codePointAt(0);
          return code !== undefined ? `&#x${code.toString(16).toUpperCase()};` : char;
        });
      }
      setOutput(result);
      setError(null);
      setLastAction("encode");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to encode HTML entities.");
      setOutput("");
    }
  }, []);

  const decodeText = useCallback((text: string) => {
    if (!text) {
      setOutput("");
      setError(null);
      return;
    }
    try {
      const textarea = document.createElement("textarea");
      textarea.innerHTML = text;
      const decoded = textarea.value;
      setOutput(decoded);
      setError(null);
      setLastAction("decode");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decode HTML entities.");
      setOutput("");
    }
  }, []);

  const handleEncode = () => {
    encodeText(input, encodeMode);
  };

  const handleDecode = () => {
    decodeText(input);
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

  const loadSample = (type: "html" | "symbols" | "entities") => {
    setError(null);
    if (type === "html") {
      const sample = '<div class="alert alert-info">\n  <h1>Title: "Welcome & Enjoy"</h1>\n  <p>5 > 3 and 2 < 4 are true \'math\' facts!</p>\n</div>';
      setInput(sample);
      encodeText(sample, encodeMode);
    } else if (type === "symbols") {
      const sample = 'Price: €99.99 / £85.00 © 2026 DevToolbox™ — "Fast & Secure" — 100° angle • ½ cup';
      setInput(sample);
      setEncodeMode("extended");
      encodeText(sample, "extended");
    } else {
      const sample = '&lt;div class=&quot;card&quot;&gt;\n  &lt;h2&gt;Hello &amp;amp; Welcome!&lt;/h2&gt;\n  &lt;p&gt;Price: &amp;euro;50 &amp;copy; 2026&lt;/p&gt;\n&lt;/div&gt;';
      setInput(sample);
      decodeText(sample);
    }
  };

  return (
    <ToolLayout
      title="HTML Entity Encode / Decode"
      description="Convert special characters to their corresponding HTML entity codes or decode HTML entities back to plain text."
    >
      <title>HTML Entity Encode &amp; Decode Online — DevToolbox</title>
      <meta
        name="description"
        content="Free online HTML entity encoder and decoder. Convert <, >, &, quotes, symbols to named, decimal, and hex HTML entities."
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Encode HTML Entities
            </button>
            <button
              type="button"
              onClick={handleDecode}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white  font-medium text-sm transition-colors  cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Decode to Plain Text
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
              onClick={() => loadSample("html")}
              className="px-2.5 py-1 bg-[#111] hover:bg-[#1a1a1a] text-gray-400 transition-colors cursor-pointer"
            >
              HTML Code
            </button>
            <button
              type="button"
              onClick={() => loadSample("symbols")}
              className="px-2.5 py-1 bg-[#111] hover:bg-[#1a1a1a] text-gray-400 transition-colors cursor-pointer"
            >
              Symbols &amp; Quotes
            </button>
            <button
              type="button"
              onClick={() => loadSample("entities")}
              className="px-2.5 py-1 bg-[#111] hover:bg-[#1a1a1a] text-gray-400 transition-colors cursor-pointer"
            >
              Encoded Entities
            </button>
          </div>
        </div>

        {/* Encoding Mode Selector */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 bg-black p-3  border border-[#1a1a1a]">
          <span className="font-medium text-xs text-gray-500 uppercase tracking-wider">
            Encoding Format:
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="encodeMode"
                value="basic"
                checked={encodeMode === "basic"}
                onChange={() => {
                  setEncodeMode("basic");
                  if (lastAction === "encode" && input) {
                    encodeText(input, "basic");
                  }
                }}
                className="w-4 h-4 text-blue-600 border-[#1a1a1a] focus:ring-blue-900"
              />
              <span>Basic Special Chars <code className="text-xs bg-[#1a1a1a] px-1 py-0.5 font-mono">(&lt; &gt; &amp; &quot; &#39;)</code></span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="encodeMode"
                value="extended"
                checked={encodeMode === "extended"}
                onChange={() => {
                  setEncodeMode("extended");
                  if (lastAction === "encode" && input) {
                    encodeText(input, "extended");
                  }
                }}
                className="w-4 h-4 text-blue-600 border-[#1a1a1a] focus:ring-blue-900"
              />
              <span>Extended Named <code className="text-xs bg-[#1a1a1a] px-1 py-0.5 font-mono">(&amp;copy;, &amp;euro;, etc.)</code></span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="encodeMode"
                value="decimal"
                checked={encodeMode === "decimal"}
                onChange={() => {
                  setEncodeMode("decimal");
                  if (lastAction === "encode" && input) {
                    encodeText(input, "decimal");
                  }
                }}
                className="w-4 h-4 text-blue-600 border-[#1a1a1a] focus:ring-blue-900"
              />
              <span>Decimal Numeric <code className="text-xs bg-[#1a1a1a] px-1 py-0.5 font-mono">(&amp;#60;)</code></span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="encodeMode"
                value="hex"
                checked={encodeMode === "hex"}
                onChange={() => {
                  setEncodeMode("hex");
                  if (lastAction === "encode" && input) {
                    encodeText(input, "hex");
                  }
                }}
                className="w-4 h-4 text-blue-600 border-[#1a1a1a] focus:ring-blue-900"
              />
              <span>Hexadecimal <code className="text-xs bg-[#1a1a1a] px-1 py-0.5 font-mono">(&amp;#x3C;)</code></span>
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
              <p className="font-semibold">Error</p>
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
                Input Text / HTML
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
              placeholder="Type or paste HTML code or text to encode/decode..."
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
                    {lastAction === "encode" ? "HTML Entities Encoded" : "Decoded Plain Text"}
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
              placeholder="Output will appear here..."
              rows={12}
              className="w-full p-3  border border-[#1a1a1a] bg-black text-gray-200 font-mono text-sm focus:outline-none resize-y placeholder:text-gray-400 leading-relaxed select-all"
            />
          </div>
        </div>

        {/* HTML Entities Reference Table */}
        <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Key HTML Entities Reference</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
            <div className="p-2 bg-black border border-[#1a1a1a] flex justify-between items-center">
              <span className="text-gray-600 font-sans">&lt; (Less than)</span>
              <span className="font-semibold text-blue-600">&amp;lt;</span>
            </div>
            <div className="p-2 bg-black border border-[#1a1a1a] flex justify-between items-center">
              <span className="text-gray-600 font-sans">&gt; (Greater)</span>
              <span className="font-semibold text-blue-600">&amp;gt;</span>
            </div>
            <div className="p-2 bg-black border border-[#1a1a1a] flex justify-between items-center">
              <span className="text-gray-600 font-sans">&amp; (Ampersand)</span>
              <span className="font-semibold text-blue-600">&amp;amp;</span>
            </div>
            <div className="p-2 bg-black border border-[#1a1a1a] flex justify-between items-center">
              <span className="text-gray-600 font-sans">&quot; (Double quote)</span>
              <span className="font-semibold text-blue-600">&amp;quot;</span>
            </div>
            <div className="p-2 bg-black border border-[#1a1a1a] flex justify-between items-center">
              <span className="text-gray-600 font-sans">&#39; (Single quote)</span>
              <span className="font-semibold text-blue-600">&amp;#39;</span>
            </div>
            <div className="p-2 bg-black border border-[#1a1a1a] flex justify-between items-center">
              <span className="text-gray-600 font-sans">&copy; (Copyright)</span>
              <span className="font-semibold text-blue-600">&amp;copy;</span>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
