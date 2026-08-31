"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";

const SAMPLE_TEXT = `DevToolbox is a curated collection of fast, privacy-first developer utilities that run entirely in your web browser. None of your sensitive data, tokens, code snippets, or configuration files are sent to any external server.

Whether you need to format complex JSON payloads, test regular expressions with real-time capture groups, calculate precise text differences, or convert identifier cases across programming languages, DevToolbox delivers instant results without friction.

High performance and simplicity make development seamless and productive. Try exploring each utility to streamline your daily workflow!`;

export default function WordCounterPage() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const raw = text;
    const charCountWithSpaces = raw.length;
    const charCountWithoutSpaces = raw.replace(/\s/g, "").length;

    const trimmed = raw.trim();
    const wordsArray = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
    const wordCount = wordsArray.length;

    // Sentences: split on punctuation followed by whitespace or end of string
    const sentencesArray = trimmed
      ? raw
          .split(/[.!?]+(?:\s+|$)/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : [];
    const sentenceCount = sentencesArray.length;

    // Paragraphs: split on consecutive newlines
    const paragraphsArray = trimmed
      ? raw
          .split(/\n+/)
          .map((p) => p.trim())
          .filter((p) => p.length > 0)
      : [];
    const paragraphCount = paragraphsArray.length;

    // Lines count
    const lineCount = raw ? raw.split(/\r\n|\r|\n/).length : 0;

    // Average word length
    const totalWordLetters = wordsArray.reduce(
      (acc, w) => acc + w.replace(/[^a-zA-Z0-9]/g, "").length,
      0
    );
    const avgWordLength =
      wordCount > 0 ? (totalWordLetters / wordCount).toFixed(1) : "0";

    // Reading time (200 wpm)
    const readingTimeSec = Math.round((wordCount / 200) * 60);
    const readingMinutes = Math.floor(readingTimeSec / 60);
    const readingSeconds = readingTimeSec % 60;
    const readingTimeStr =
      wordCount === 0
        ? "0s"
        : readingMinutes === 0
        ? `${readingSeconds}s`
        : `${readingMinutes}m ${readingSeconds}s`;

    // Speaking time (130 wpm)
    const speakingTimeSec = Math.round((wordCount / 130) * 60);
    const speakingMinutes = Math.floor(speakingTimeSec / 60);
    const speakingSeconds = speakingTimeSec % 60;
    const speakingTimeStr =
      wordCount === 0
        ? "0s"
        : readingMinutes === 0
        ? `${speakingSeconds}s`
        : `${speakingMinutes}m ${speakingSeconds}s`;

    // Longest word
    let longestWord = "";
    for (const w of wordsArray) {
      const cleanW = w.replace(/[^a-zA-Z0-9_-]/g, "");
      if (cleanW.length > longestWord.length) {
        longestWord = cleanW;
      }
    }

    // Word frequency / Keyword density (top 6 words)
    const freqMap: Record<string, number> = {};
    wordsArray.forEach((w) => {
      const clean = w.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (clean.length >= 2) {
        freqMap[clean] = (freqMap[clean] || 0) + 1;
      }
    });

    const topKeywords = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([word, count]) => ({
        word,
        count,
        percentage:
          wordCount > 0 ? ((count / wordCount) * 100).toFixed(1) : "0",
      }));

    return {
      charCountWithSpaces,
      charCountWithoutSpaces,
      wordCount,
      sentenceCount,
      paragraphCount,
      lineCount,
      avgWordLength,
      readingTimeStr,
      speakingTimeStr,
      longestWord,
      topKeywords,
    };
  }, [text]);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleClear = () => {
    setText("");
  };

  const handleLoadSample = () => {
    setText(SAMPLE_TEXT);
  };

  const handleCleanWhitespace = () => {
    setText((prev) =>
      prev
        .split("\n")
        .map((line) => line.trim().replace(/[ \t]+/g, " "))
        .join("\n")
        .trim()
    );
  };

  return (
    <ToolLayout
      title="Word & Character Counter"
      description="Count characters, words, sentences, paragraphs, reading time, and analyze keyword frequency in real time."
    >
      <title>Word &amp; Character Counter — DevToolbox</title>
      <meta
        name="description"
        content="Free online word counter, character counter, sentence counter, paragraph counter, reading time estimator, and keyword density analyzer."
      />

      <div className="space-y-6">
        {/* Primary Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className=" border border-blue-100 bg-[#0a0a1a]/60 p-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Words
            </span>
            <p className="mt-1 text-2xl font-extrabold text-blue-950">
              {stats.wordCount.toLocaleString()}
            </p>
          </div>

          <div className=" border border-indigo-100 bg-indigo-50/60 p-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Characters
            </span>
            <p className="mt-1 text-2xl font-extrabold text-indigo-950">
              {stats.charCountWithSpaces.toLocaleString()}
            </p>
          </div>

          <div className=" border border-purple-100 bg-purple-50/60 p-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              No Spaces
            </span>
            <p className="mt-1 text-2xl font-extrabold text-purple-950">
              {stats.charCountWithoutSpaces.toLocaleString()}
            </p>
          </div>

          <div className=" border border-teal-100 bg-teal-50/60 p-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">
              Sentences
            </span>
            <p className="mt-1 text-2xl font-extrabold text-teal-950">
              {stats.sentenceCount.toLocaleString()}
            </p>
          </div>

          <div className=" border border-amber-100 bg-amber-50/60 p-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Paragraphs
            </span>
            <p className="mt-1 text-2xl font-extrabold text-amber-950">
              {stats.paragraphCount.toLocaleString()}
            </p>
          </div>

          <div className=" border border-emerald-100 bg-emerald-50/60 p-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Reading Time
            </span>
            <p className="mt-1 text-2xl font-extrabold text-emerald-950">
              {stats.readingTimeStr}
            </p>
          </div>
        </div>

        {/* Input Textarea Area */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="word-counter-input"
              className="text-sm font-semibold text-gray-400"
            >
              Enter or Paste Your Text
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-[#0a0a1a]  transition-colors cursor-pointer"
              >
                Load Sample
              </button>
              <button
                type="button"
                onClick={handleCleanWhitespace}
                disabled={!text}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-[#111]  disabled:opacity-40 transition-colors cursor-pointer"
              >
                Clean Spaces
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={!text}
                className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50  disabled:opacity-40 transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!text}
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white  disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1"
              >
                {copied ? "Copied!" : "Copy Text"}
              </button>
            </div>
          </div>

          <textarea
            id="word-counter-input"
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here to get instant word count, character statistics, sentence counts, and reading time..."
            className="w-full p-3.5  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 font-sans text-sm focus:ring-1 focus:ring-blue-900 focus:border-blue-500 focus:outline-none transition-shadow resize-y shadow-inner leading-relaxed"
          />
        </div>

        {/* Secondary Detailed Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className=" border border-[#1a1a1a] bg-black/70 p-3.5">
            <span className="text-xs text-gray-500">
              Average Word Length
            </span>
            <p className="mt-1 text-lg font-bold text-gray-300">
              {stats.avgWordLength}{" "}
              <span className="text-xs font-normal text-gray-500">chars</span>
            </p>
          </div>

          <div className=" border border-[#1a1a1a] bg-black/70 p-3.5">
            <span className="text-xs text-gray-500">
              Speaking Time (~130 wpm)
            </span>
            <p className="mt-1 text-lg font-bold text-gray-300">
              {stats.speakingTimeStr}
            </p>
          </div>

          <div className=" border border-[#1a1a1a] bg-black/70 p-3.5">
            <span className="text-xs text-gray-500">
              Total Lines
            </span>
            <p className="mt-1 text-lg font-bold text-gray-300">
              {stats.lineCount.toLocaleString()}
            </p>
          </div>

          <div className=" border border-[#1a1a1a] bg-black/70 p-3.5">
            <span className="text-xs text-gray-500">
              Longest Word
            </span>
            <p
              className="mt-1 text-lg font-bold text-gray-300 truncate"
              title={stats.longestWord || "None"}
            >
              {stats.longestWord || "—"}{" "}
              {stats.longestWord ? (
                <span className="text-xs font-normal text-gray-500">
                  ({stats.longestWord.length})
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {/* Top Keywords / Frequency Section */}
        {stats.topKeywords.length > 0 && (
          <div className=" border border-[#1a1a1a] bg-black/40 p-4">
            <h3 className="text-sm font-semibold text-gray-200">
              Top Keywords & Frequency
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Most frequently occurring terms in your text.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {stats.topKeywords.map((kw, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5  border border-[#1a1a1a]/80 bg-[#0a0a0a] text-xs shadow-xs"
                >
                  <span className="font-mono font-medium text-gray-300 truncate mr-2">
                    {kw.word}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded-none bg-[#0a0a1a] text-blue-400 font-semibold">
                      {kw.count}×
                    </span>
                    <span className="text-gray-400">
                      {kw.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
