"use client";

import { useState, useId, useCallback, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";

// Helper to extract words from various formats (camelCase, PascalCase, snake_case, kebab-case, normal text)
function getWords(str: string): string[] {
  if (!str) return [];
  return (
    str
      // Insert space before capital letters in camelCase / PascalCase
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      // Insert space between consecutive uppercase letters followed by lowercase (e.g. "JSONParser" -> "JSON Parser")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      // Replace punctuation, underscores, hyphens, slashes, dots with space
      .replace(/[-_./\\:[\](){}<>]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
  );
}

// Case conversion algorithms
const CONVERTERS: Record<
  string,
  { name: string; description: string; example: string; fn: (text: string) => string }
> = {
  uppercase: {
    name: "UPPERCASE",
    description: "Convert all characters to uppercase",
    example: "HELLO WORLD",
    fn: (text) => text.toUpperCase(),
  },
  lowercase: {
    name: "lowercase",
    description: "Convert all characters to lowercase",
    example: "hello world",
    fn: (text) => text.toLowerCase(),
  },
  titleCase: {
    name: "Title Case",
    description: "Capitalize the first letter of every word",
    example: "Hello World",
    fn: (text) =>
      text
        .toLowerCase()
        .replace(/(^|\s|[-_./])([a-z0-9])/g, (_, boundary, char) => boundary + char.toUpperCase()),
  },
  sentenceCase: {
    name: "Sentence case",
    description: "Capitalize the first letter of each sentence",
    example: "Hello world. This is a sentence.",
    fn: (text) =>
      text
        .toLowerCase()
        .replace(/(^\s*|\.\s*|\?\s*|!\s*|\n\s*)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase()),
  },
  camelCase: {
    name: "camelCase",
    description: "First word lowercase, subsequent words capitalized without spaces",
    example: "helloWorld",
    fn: (text) => {
      const lines = text.split("\n");
      return lines
        .map((line) => {
          const words = getWords(line);
          if (words.length === 0) return "";
          return (
            words[0].toLowerCase() +
            words
              .slice(1)
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
              .join("")
          );
        })
        .join("\n");
    },
  },
  pascalCase: {
    name: "PascalCase",
    description: "Capitalize every word without spaces",
    example: "HelloWorld",
    fn: (text) => {
      const lines = text.split("\n");
      return lines
        .map((line) => {
          const words = getWords(line);
          return words
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join("");
        })
        .join("\n");
    },
  },
  snakeCase: {
    name: "snake_case",
    description: "Lowercase words separated by underscores",
    example: "hello_world",
    fn: (text) => {
      const lines = text.split("\n");
      return lines
        .map((line) => {
          const words = getWords(line);
          return words.map((w) => w.toLowerCase()).join("_");
        })
        .join("\n");
    },
  },
  kebabCase: {
    name: "kebab-case",
    description: "Lowercase words separated by hyphens",
    example: "hello-world",
    fn: (text) => {
      const lines = text.split("\n");
      return lines
        .map((line) => {
          const words = getWords(line);
          return words.map((w) => w.toLowerCase()).join("-");
        })
        .join("\n");
    },
  },
  constantCase: {
    name: "CONSTANT_CASE",
    description: "Uppercase words separated by underscores",
    example: "HELLO_WORLD",
    fn: (text) => {
      const lines = text.split("\n");
      return lines
        .map((line) => {
          const words = getWords(line);
          return words.map((w) => w.toUpperCase()).join("_");
        })
        .join("\n");
    },
  },
  dotCase: {
    name: "dot.case",
    description: "Lowercase words separated by dots",
    example: "hello.world",
    fn: (text) => {
      const lines = text.split("\n");
      return lines
        .map((line) => {
          const words = getWords(line);
          return words.map((w) => w.toLowerCase()).join(".");
        })
        .join("\n");
    },
  },
  headerCase: {
    name: "Header-Case",
    description: "Capitalized words separated by hyphens (Train-Case)",
    example: "Hello-World",
    fn: (text) => {
      const lines = text.split("\n");
      return lines
        .map((line) => {
          const words = getWords(line);
          return words
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join("-");
        })
        .join("\n");
    },
  },
  pathCase: {
    name: "path/case",
    description: "Lowercase words separated by forward slashes",
    example: "hello/world",
    fn: (text) => {
      const lines = text.split("\n");
      return lines
        .map((line) => {
          const words = getWords(line);
          return words.map((w) => w.toLowerCase()).join("/");
        })
        .join("\n");
    },
  },
  alternatingCase: {
    name: "aLtErNaTiNg cAsE",
    description: "Alternate between lowercase and uppercase characters",
    example: "hElLo wOrLd",
    fn: (text) => {
      let isUpper = false;
      return text
        .split("")
        .map((char) => {
          if (/[a-zA-Z]/.test(char)) {
            const res = isUpper ? char.toUpperCase() : char.toLowerCase();
            isUpper = !isUpper;
            return res;
          }
          return char;
        })
        .join("");
    },
  },
  inverseCase: {
    name: "InVeRsE cAsE",
    description: "Invert case of each individual character",
    example: "hELLO wORLD",
    fn: (text) =>
      text
        .split("")
        .map((c) =>
          c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()
        )
        .join(""),
  },
};

const SAMPLE_TEXT =
  "the quick brown fox jumps over the lazy dog. developer tools make life easier!";

export default function CaseConverterPage() {
  const inputId = useId();
  const outputId = useId();

  const [input, setInput] = useState(SAMPLE_TEXT);
  const [output, setOutput] = useState("");
  const [activeCaseKey, setActiveCaseKey] = useState<string>("titleCase");
  const [copied, setCopied] = useState(false);
  const [previewCopiedKey, setPreviewCopiedKey] = useState<string | null>(null);

  // Auto-convert when input or activeCaseKey changes
  const applyConversion = useCallback(
    (key: string, textToConvert: string) => {
      const converter = CONVERTERS[key];
      if (converter) {
        setOutput(converter.fn(textToConvert));
      }
    },
    []
  );

  useEffect(() => {
    applyConversion(activeCaseKey, input);
  }, [input, activeCaseKey, applyConversion]);

  const handleCaseButtonClick = (key: string) => {
    setActiveCaseKey(key);
    applyConversion(key, input);
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyPreview = async (val: string, key: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setPreviewCopiedKey(key);
      setTimeout(() => setPreviewCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSwap = () => {
    const temp = output;
    setInput(temp);
    setOutput(input);
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
  };

  const handleLoadSample = () => {
    setInput(SAMPLE_TEXT);
  };

  return (
    <ToolLayout
      title="Case Converter"
      description="Convert text between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, and more."
    >
      <title>Case Converter Online — DevToolbox</title>
      <meta
        name="description"
        content="Free online text case converter. Convert between UPPERCASE, lowercase, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, and dot.case."
      />

      <div className="space-y-6">
        {/* Top Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#1a1a1a]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-3 py-1.5 bg-[#0a0a1a] hover:bg-[#0a0a1a] text-blue-400  text-xs font-semibold transition-colors cursor-pointer"
            >
              Load Sample
            </button>
            <button
              type="button"
              onClick={handleSwap}
              disabled={!output && !input}
              className="px-3 py-1.5 bg-[#111] hover:bg-[#1a1a1a] disabled:opacity-40 text-gray-400  text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Swap
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!input && !output}
              className="px-3 py-1.5 bg-[#111] hover:bg-rose-50 disabled:opacity-40 text-gray-400 hover:text-rose-600  text-xs font-semibold transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="text-xs text-gray-500">
            Click any case button below to transform immediately
          </div>
        </div>

        {/* Case Transformation Buttons Grid */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
            Choose Transformation Case
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {Object.entries(CONVERTERS).map(([key, conv]) => {
              const isActive = activeCaseKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCaseButtonClick(key)}
                  className={`p-2.5  border text-left transition-all cursor-pointer shadow-xs ${
                    isActive
                      ? "bg-blue-600 border-blue-600 text-white ring-2 ring-blue-500/40"
                      : "bg-[#0a0a0a] border-[#1a1a1a] text-gray-200 hover:bg-[#0a0a1a]/70 hover:border-blue-300"
                  }`}
                >
                  <div className="font-semibold text-xs truncate">{conv.name}</div>
                  <div
                    className={`text-[10px] font-mono mt-0.5 truncate ${
                      isActive
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {conv.example}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input & Output Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Area */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor={inputId}
                className="text-sm font-semibold text-gray-400"
              >
                Input Text
              </label>
              <span className="text-xs text-gray-500 font-mono">
                {input.length} chars | {input.trim() ? input.trim().split(/\s+/).length : 0} words
              </span>
            </div>
            <textarea
              id={inputId}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter or paste text to convert..."
              rows={10}
              className="w-full p-3.5  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 font-mono text-sm focus:ring-1 focus:ring-blue-900 focus:outline-none resize-y leading-relaxed shadow-inner"
            />
          </div>

          {/* Output Area */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label
                  htmlFor={outputId}
                  className="text-sm font-semibold text-gray-400"
                >
                  Converted Output
                </label>
                <span className="px-2 py-0.5 rounded-none text-xs font-semibold bg-[#0a0a1a] text-blue-400">
                  {CONVERTERS[activeCaseKey]?.name || "Result"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 font-mono">
                  {output.length} chars
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!output}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied!</span>
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
              placeholder="Converted result will appear here..."
              rows={10}
              className="w-full p-3.5  border border-[#1a1a1a] bg-black text-gray-200 font-mono text-sm focus:outline-none resize-y leading-relaxed select-all"
            />
          </div>
        </div>

        {/* All Cases Live Preview Cards */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-200">
              Live Preview of All Cases
            </h3>
            <span className="text-xs text-gray-500">
              Click &quot;Apply&quot; or &quot;Copy&quot; on any case
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(CONVERTERS).map(([key, conv]) => {
              const convertedVal = input ? conv.fn(input) : conv.example;
              const isSelected = activeCaseKey === key;
              return (
                <div
                  key={key}
                  className={`p-3  border transition-all ${
                    isSelected
                      ? "border-blue-500 bg-[#0a0a1a]/40"
                      : "border-[#1a1a1a] bg-[#0a0a0a]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-gray-200">
                        {conv.name}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] px-1.5 py-0.2 font-bold bg-[#0a0a1a] text-blue-400">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCaseButtonClick(key)}
                        className="px-2 py-0.5 text-xs text-blue-600 hover:bg-[#0a0a1a] transition-colors cursor-pointer font-medium"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyPreview(convertedVal, key)}
                        className="px-2 py-0.5 text-xs text-gray-600 hover:bg-[#111] transition-colors cursor-pointer"
                      >
                        {previewCopiedKey === key ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="font-mono text-xs text-gray-300 p-2 bg-black truncate">
                    {convertedVal || <span className="text-gray-400 italic">Empty</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
