"use client";

import { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et",
  "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis",
  "nostrud", "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip",
  "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "in",
  "reprehenderit", "in", "voluptate", "velit", "esse", "cillum", "dolore",
  "eu", "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat",
  "cupidatat", "non", "proident", "sunt", "in", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum", "curabitur",
  "pretium", "tincidunt", "lacus", "nulla", "gravida", "orci", "a",
  "odio", "nullam", "varius", "turpis", "et", "commodo", "pharetra",
  "est", "eros", "bibendum", "elit", "nec", "luctus", "magna", "felis",
  "sollicitudin", "mauris", "integer", "in", "mauris", "eu", "nibh",
  "euismod", "gravida", "duis", "ac", "tellus", "et", "risus", "vulputate",
  "vehicula", "donec", "lobortis", "risus", "a", "elit", "etiam", "tempor",
  "ut", "ullamcorper", "venenatis", "pellentesque", "faucibus", "viverra",
  "sapien", "auctor", "vitae", "massa", "porta", "semper", "quisque",
  "posuere", "feugiat", "nunc", "molestie", "efficitur", "rutrum"
];

const CLASSIC_INTRO = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

function getRandomWord(): string {
  const index = Math.floor(Math.random() * LOREM_WORDS.length);
  return LOREM_WORDS[index];
}

function generateSentence(targetWords: number): string {
  const words: string[] = [];
  for (let i = 0; i < targetWords; i++) {
    words.push(getRandomWord());
  }

  // Capitalize first letter
  if (words.length > 0) {
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  }

  // Add random comma for longer sentences
  if (words.length > 7 && Math.random() > 0.4) {
    const commaIndex = Math.floor(Math.random() * (words.length - 4)) + 2;
    words[commaIndex] = words[commaIndex] + ",";
  }

  return words.join(" ") + ".";
}

function generateParagraph(targetWordCount: number, isFirst: boolean, startWithLorem: boolean): string {
  if (isFirst && startWithLorem) {
    let currentWords = CLASSIC_INTRO.split(" ").length;
    const sentences = [CLASSIC_INTRO];

    while (currentWords < targetWordCount) {
      const sentenceLen = Math.floor(Math.random() * 8) + 6; // 6 - 13 words
      sentences.push(generateSentence(sentenceLen));
      currentWords += sentenceLen;
    }
    return sentences.join(" ");
  }

  let currentWords = 0;
  const sentences: string[] = [];

  while (currentWords < targetWordCount) {
    const sentenceLen = Math.floor(Math.random() * 8) + 6; // 6 - 13 words
    sentences.push(generateSentence(sentenceLen));
    currentWords += sentenceLen;
  }

  return sentences.join(" ");
}

type OutputFormat = "plain" | "html" | "markdown";
type ParagraphLength = "short" | "medium" | "long" | "custom";

const LENGTH_RANGES: Record<ParagraphLength, { min: number; max: number; label: string }> = {
  short: { min: 30, max: 45, label: "Short (~35 words)" },
  medium: { min: 65, max: 85, label: "Medium (~75 words)" },
  long: { min: 110, max: 140, label: "Long (~125 words)" },
  custom: { min: 20, max: 200, label: "Custom" },
};

export default function LoremIpsumPage() {
  const [numParagraphs, setNumParagraphs] = useState<number>(3);
  const [lengthPreset, setLengthPreset] = useState<ParagraphLength>("medium");
  const [customWords, setCustomWords] = useState<number>(75);
  const [startWithLorem, setStartWithLorem] = useState<boolean>(true);
  const [format, setFormat] = useState<OutputFormat>("plain");
  const [generatedText, setGeneratedText] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const generate = useCallback(() => {
    const targetWordsPerPara =
      lengthPreset === "custom"
        ? customWords
        : Math.floor(
            Math.random() * (LENGTH_RANGES[lengthPreset].max - LENGTH_RANGES[lengthPreset].min + 1)
          ) + LENGTH_RANGES[lengthPreset].min;

    const paras: string[] = [];
    for (let i = 0; i < numParagraphs; i++) {
      paras.push(generateParagraph(targetWordsPerPara, i === 0, startWithLorem));
    }

    if (format === "html") {
      setGeneratedText(paras.map((p) => `<p>${p}</p>`).join("\n\n"));
    } else if (format === "markdown") {
      setGeneratedText(paras.join("\n\n"));
    } else {
      setGeneratedText(paras.join("\n\n"));
    }
  }, [numParagraphs, lengthPreset, customWords, startWithLorem, format]);

  useEffect(() => {
    generate();
  }, [generate]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy lorem ipsum: ", err);
    }
  };

  const handleDownload = () => {
    const ext = format === "html" ? "html" : "txt";
    const mime = format === "html" ? "text/html" : "text/plain";
    const blob = new Blob([generatedText], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lorem-ipsum-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats calculation
  const wordCount = generatedText
    .replace(/<[^>]*>/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const charCount = generatedText.length;
  const paragraphCount = numParagraphs;

  return (
    <ToolLayout
      title="Lorem Ipsum Generator"
      description="Create customizable placeholder text for layouts, web designs, mockups, and typography previews."
    >
      <div className="space-y-6">
        {/* Controls Section */}
        <div className=" border border-[#1a1a1a] bg-black/60 p-4">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* Number of Paragraphs */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Paragraphs (1 - 20)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={numParagraphs}
                  onChange={(e) => {
                    const val = Math.min(Math.max(1, parseInt(e.target.value) || 1), 20);
                    setNumParagraphs(val);
                  }}
                  className="w-20  border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2 text-sm font-medium text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-900/20"
                />
                <div className="flex flex-wrap gap-1">
                  {[1, 3, 5, 10].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setNumParagraphs(count)}
                      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                        numParagraphs === count
                          ? "bg-blue-600 text-white"
                          : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222]"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Paragraph Length */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Paragraph Length
              </label>
              <select
                value={lengthPreset}
                onChange={(e) => setLengthPreset(e.target.value as ParagraphLength)}
                className="w-full  border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2 text-sm font-medium text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-900/20"
              >
                <option value="short">Short (~35 words)</option>
                <option value="medium">Medium (~75 words)</option>
                <option value="long">Long (~125 words)</option>
                <option value="custom">Custom word count</option>
              </select>

              {lengthPreset === "custom" && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Words:</span>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={customWords}
                    onChange={(e) =>
                      setCustomWords(Math.min(Math.max(10, parseInt(e.target.value) || 10), 300))
                    }
                    className="w-24 border border-[#1a1a1a] bg-[#0a0a0a] px-2 py-1 text-xs font-medium text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>
              )}
            </div>

            {/* Output Format */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Format
              </label>
              <div className="flex  border border-[#1a1a1a] bg-[#111] p-0.5">
                <button
                  type="button"
                  onClick={() => setFormat("plain")}
                  className={`flex-1  py-1.5 text-xs font-medium transition-colors ${
                    format === "plain"
                      ? "bg-[#0a0a0a] text-gray-200 shadow-xs"
                      : "text-gray-600 hover:text-gray-200"
                  }`}
                >
                  Plain Text
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("html")}
                  className={`flex-1  py-1.5 text-xs font-medium transition-colors ${
                    format === "html"
                      ? "bg-[#0a0a0a] text-gray-200 shadow-xs"
                      : "text-gray-600 hover:text-gray-200"
                  }`}
                >
                  HTML &lt;p&gt;
                </button>
              </div>
            </div>

            {/* Action Options */}
            <div className="flex flex-col justify-between">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Options
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={startWithLorem}
                  onChange={(e) => setStartWithLorem(e.target.checked)}
                  className="h-4 w-4 border-[#1a1a1a] text-blue-600 focus:ring-blue-900"
                />
                <span>Start with &ldquo;Lorem ipsum...&rdquo;</span>
              </label>

              <button
                type="button"
                onClick={generate}
                className="mt-3 flex w-full items-center justify-center gap-1.5  bg-blue-600 px-4 py-2 text-sm font-medium text-white  transition-colors hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:ring-offset-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Regenerate Text
              </button>
            </div>
          </div>
        </div>

        {/* Output Section Header with Stats & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1a1a1a] pb-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 font-medium text-gray-400">
              <span className="font-semibold text-blue-600">{paragraphCount}</span> paragraphs
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-medium text-gray-400">
              <span className="font-semibold text-blue-600">{wordCount}</span> words
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-medium text-gray-400">
              <span className="font-semibold text-blue-600">{charCount}</span> characters
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5  px-4 py-2 text-sm font-medium transition-all ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
              }`}
            >
              {copied ? (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy Text
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              title="Download text file"
              className="inline-flex items-center gap-1.5  bg-[#111] px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-[#1a1a1a]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download
            </button>
          </div>
        </div>

        {/* Text Area Output */}
        <div>
          <textarea
            readOnly
            value={generatedText}
            rows={12}
            className="w-full  border border-[#1a1a1a] bg-[#0a0a0a] p-4 font-sans text-sm leading-relaxed text-gray-200 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-900/20"
            aria-label="Generated Lorem Ipsum Text"
          />
        </div>

        {/* Informational Details */}
        <div className="grid grid-cols-1 gap-4 pt-2 text-xs text-gray-500 sm:grid-cols-2">
          <div className=" border border-gray-100 bg-black p-3.5">
            <h4 className="font-semibold text-gray-300">Origin of Lorem Ipsum</h4>
            <p className="mt-1 leading-normal">
              Lorem Ipsum has been standard placeholder text since the 1500s, adapted from Cicero&apos;s philosophical work <em>&ldquo;de Finibus Bonorum et Malorum&rdquo;</em> written in 45 BC.
            </p>
          </div>
          <div className=" border border-gray-100 bg-black p-3.5">
            <h4 className="font-semibold text-gray-300">Design &amp; Layout Utility</h4>
            <p className="mt-1 leading-normal">
              Using realistic filler text with natural word and sentence distribution avoids distracting reviewers with readable content while focusing purely on layout and typography.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
