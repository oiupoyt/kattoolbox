"use client";

import { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?~",
};

const AMBIGUOUS_CHARS = new Set(["i", "l", "1", "I", "o", "0", "O", "`", "'", '"', "|"]);

function getRandomInt(max: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface StrengthInfo {
  score: number; // 0 - 4
  label: "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";
  color: string;
  barWidth: string;
  entropy: number;
  crackTime: string;
}

function calculateStrength(password: string, poolSize: number): StrengthInfo {
  if (!password || poolSize === 0) {
    return {
      score: 0,
      label: "Very Weak",
      color: "bg-[#1a0a0a]0",
      barWidth: "10%",
      entropy: 0,
      crackTime: "Instant",
    };
  }

  const length = password.length;
  const entropy = Math.round(length * Math.log2(poolSize));

  if (entropy < 35) {
    return {
      score: 1,
      label: "Weak",
      color: "bg-[#1a0a0a]0",
      barWidth: "25%",
      entropy,
      crackTime: "< 1 second",
    };
  } else if (entropy < 55) {
    return {
      score: 2,
      label: "Fair",
      color: "bg-[#1a1a0a]0",
      barWidth: "50%",
      entropy,
      crackTime: "Several hours to days",
    };
  } else if (entropy < 80) {
    return {
      score: 3,
      label: "Strong",
      color: "bg-[#0a1a0a]0",
      barWidth: "75%",
      entropy,
      crackTime: "Thousands of years",
    };
  } else {
    return {
      score: 4,
      label: "Very Strong",
      color: "bg-emerald-600",
      barWidth: "100%",
      entropy,
      crackTime: "Trillions of centuries",
    };
  }
}

export default function PasswordGeneratorPage() {
  const [length, setLength] = useState<number>(16);
  const [useUppercase, setUseUppercase] = useState<boolean>(true);
  const [useLowercase, setUseLowercase] = useState<boolean>(true);
  const [useDigits, setUseDigits] = useState<boolean>(true);
  const [useSymbols, setUseSymbols] = useState<boolean>(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState<boolean>(false);

  const [password, setPassword] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [historyCopiedIndex, setHistoryCopiedIndex] = useState<number | null>(null);

  const generatePassword = useCallback(() => {
    let pool = "";
    const guaranteedChars: string[] = [];

    const getCleanCharset = (chars: string) => {
      if (!excludeAmbiguous) return chars;
      return chars
        .split("")
        .filter((c) => !AMBIGUOUS_CHARS.has(c))
        .join("");
    };

    if (useUppercase) {
      const set = getCleanCharset(CHARSETS.uppercase);
      if (set.length > 0) {
        pool += set;
        guaranteedChars.push(set[getRandomInt(set.length)]);
      }
    }
    if (useLowercase) {
      const set = getCleanCharset(CHARSETS.lowercase);
      if (set.length > 0) {
        pool += set;
        guaranteedChars.push(set[getRandomInt(set.length)]);
      }
    }
    if (useDigits) {
      const set = getCleanCharset(CHARSETS.digits);
      if (set.length > 0) {
        pool += set;
        guaranteedChars.push(set[getRandomInt(set.length)]);
      }
    }
    if (useSymbols) {
      const set = getCleanCharset(CHARSETS.symbols);
      if (set.length > 0) {
        pool += set;
        guaranteedChars.push(set[getRandomInt(set.length)]);
      }
    }

    if (pool.length === 0) {
      setPassword("");
      return;
    }

    const resultChars = [...guaranteedChars];
    const remainingCount = Math.max(0, length - guaranteedChars.length);

    for (let i = 0; i < remainingCount; i++) {
      resultChars.push(pool[getRandomInt(pool.length)]);
    }

    const shuffled = shuffleArray(resultChars).slice(0, length).join("");
    setPassword(shuffled);

    // Add to history if unique
    setHistory((prev) => {
      if (shuffled && !prev.includes(shuffled)) {
        return [shuffled, ...prev.slice(0, 4)];
      }
      return prev;
    });
  }, [length, useUppercase, useLowercase, useDigits, useSymbols, excludeAmbiguous]);

  // Generate on initial load and option changes
  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy password:", err);
    }
  };

  const handleCopyHistory = async (pwd: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(pwd);
      setHistoryCopiedIndex(idx);
      setTimeout(() => setHistoryCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy history item:", err);
    }
  };

  // Calculate pool size for entropy
  let poolSize = 0;
  if (useUppercase) poolSize += 26;
  if (useLowercase) poolSize += 26;
  if (useDigits) poolSize += 10;
  if (useSymbols) poolSize += CHARSETS.symbols.length;
  if (excludeAmbiguous) poolSize -= 10;

  const strength = calculateStrength(password, poolSize);
  const lengthPresets = [8, 12, 16, 24, 32, 64];

  // At least one charset should be selected
  const atLeastOneSelected = useUppercase || useLowercase || useDigits || useSymbols;

  return (
    <ToolLayout
      title="Password Generator"
      description="Generate strong, cryptographically secure random passwords with configurable character sets and live strength analysis."
    >
      <div className="space-y-6">
        {/* Generated Password Display Card */}
        <div className="relative  border border-[#1a1a1a] bg-black/70 p-5">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="w-full min-w-0 flex-1 overflow-x-auto py-1">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Generated Password
              </span>
              <p className="select-all break-all font-mono text-xl font-bold tracking-wider text-gray-200 sm:text-2xl">
                {password || (
                  <span className="text-sm font-normal text-red-500">
                    Select at least one character set below
                  </span>
                )}
              </p>
            </div>

            <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
              <button
                type="button"
                onClick={generatePassword}
                disabled={!atLeastOneSelected}
                title="Regenerate password"
                className="flex items-center gap-1.5  border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2.5 text-sm font-medium text-gray-400  transition-colors hover:bg-black disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                disabled={!password}
                className={`flex items-center gap-2  px-5 py-2.5 text-sm font-medium  transition-all disabled:opacity-50 ${
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
                    Copy Password
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Strength Bar */}
          <div className="mt-4 pt-3 border-t border-[#1a1a1a]">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-gray-600">
                Security Strength:{" "}
                <strong className="text-gray-200 font-semibold">
                  {strength.label}
                </strong>
              </span>
              <span className="text-gray-500">
                ~{strength.entropy} bits of entropy ({strength.crackTime})
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-none bg-[#1a1a1a]">
              <div
                className={`h-full transition-all duration-300 ${strength.color}`}
                style={{ width: strength.barWidth }}
              />
            </div>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className=" border border-[#1a1a1a] bg-[#0a0a0a] p-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Password Settings
          </h3>

          <div className="space-y-5">
            {/* Length Slider & Presets */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-400">
                  Password Length: <span className="font-bold text-blue-600">{length}</span> characters
                </label>
                <div className="flex gap-1">
                  {lengthPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setLength(preset)}
                      className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                        length === preset
                          ? "bg-blue-600 text-white"
                          : "bg-[#111] text-gray-400 hover:bg-[#1a1a1a]"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="8"
                  max="128"
                  value={length}
                  onChange={(e) => setLength(parseInt(e.target.value))}
                  className="h-2.5 w-full cursor-pointer appearance-none  bg-[#1a1a1a] accent-blue-600"
                />
                <input
                  type="number"
                  min="8"
                  max="128"
                  value={length}
                  onChange={(e) => {
                    const val = Math.min(Math.max(8, parseInt(e.target.value) || 8), 128);
                    setLength(val);
                  }}
                  className="w-18  border border-[#1a1a1a] bg-[#0a0a0a] px-2.5 py-1.5 text-center text-sm font-medium text-gray-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Character Set Checkboxes */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2">
              <label className="flex cursor-pointer items-center gap-2.5  border border-[#1a1a1a] p-3 transition-colors hover:bg-black">
                <input
                  type="checkbox"
                  checked={useUppercase}
                  onChange={(e) => setUseUppercase(e.target.checked)}
                  className="h-4 w-4 border-[#1a1a1a] text-blue-600 focus:ring-blue-900"
                />
                <div>
                  <div className="text-sm font-medium text-gray-200">
                    Uppercase
                  </div>
                  <div className="font-mono text-xs text-gray-500">
                    A-Z
                  </div>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-2.5  border border-[#1a1a1a] p-3 transition-colors hover:bg-black">
                <input
                  type="checkbox"
                  checked={useLowercase}
                  onChange={(e) => setUseLowercase(e.target.checked)}
                  className="h-4 w-4 border-[#1a1a1a] text-blue-600 focus:ring-blue-900"
                />
                <div>
                  <div className="text-sm font-medium text-gray-200">
                    Lowercase
                  </div>
                  <div className="font-mono text-xs text-gray-500">
                    a-z
                  </div>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-2.5  border border-[#1a1a1a] p-3 transition-colors hover:bg-black">
                <input
                  type="checkbox"
                  checked={useDigits}
                  onChange={(e) => setUseDigits(e.target.checked)}
                  className="h-4 w-4 border-[#1a1a1a] text-blue-600 focus:ring-blue-900"
                />
                <div>
                  <div className="text-sm font-medium text-gray-200">
                    Digits
                  </div>
                  <div className="font-mono text-xs text-gray-500">
                    0-9
                  </div>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-2.5  border border-[#1a1a1a] p-3 transition-colors hover:bg-black">
                <input
                  type="checkbox"
                  checked={useSymbols}
                  onChange={(e) => setUseSymbols(e.target.checked)}
                  className="h-4 w-4 border-[#1a1a1a] text-blue-600 focus:ring-blue-900"
                />
                <div>
                  <div className="text-sm font-medium text-gray-200">
                    Symbols
                  </div>
                  <div className="font-mono text-xs text-gray-500">
                    !@#$%^&amp;*...
                  </div>
                </div>
              </label>
            </div>

            {/* Ambiguous filter */}
            <div className="pt-1">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={excludeAmbiguous}
                  onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                  className="h-4 w-4 border-[#1a1a1a] text-blue-600 focus:ring-blue-900"
                />
                <span>Exclude ambiguous characters (e.g. <code>i, l, 1, I, o, 0, O</code>)</span>
              </label>
            </div>
          </div>
        </div>

        {/* History of Generated Passwords */}
        {history.length > 1 && (
          <div className=" border border-[#1a1a1a] bg-black/50 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
              Recent Passwords (Session History)
            </h3>
            <div className="divide-y divide-[#1a1a1a]">
              {history.map((pwd, idx) => (
                <div
                  key={`${pwd}-${idx}`}
                  className="flex items-center justify-between py-2 text-xs"
                >
                  <span className="truncate font-mono text-gray-300">
                    {pwd}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyHistory(pwd, idx)}
                    className="ml-2 shrink-0 bg-[#0a0a0a] px-2 py-1 font-medium text-gray-400 shadow-xs hover:bg-[#111]"
                  >
                    {historyCopiedIndex === idx ? "Copied!" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Information Grid */}
        <div className="grid grid-cols-1 gap-4 pt-2 text-xs text-gray-500 sm:grid-cols-3">
          <div className=" border border-gray-100 bg-black p-3.5">
            <h4 className="font-semibold text-gray-300">CSPRNG Powered</h4>
            <p className="mt-1">
              Uses <code>crypto.getRandomValues()</code> for cryptographically secure pseudo-random number generation directly in browser.
            </p>
          </div>
          <div className=" border border-gray-100 bg-black p-3.5">
            <h4 className="font-semibold text-gray-300">Zero Transmission</h4>
            <p className="mt-1">
              Passwords are never transmitted across a network, cached on a server, or stored persistently.
            </p>
          </div>
          <div className=" border border-gray-100 bg-black p-3.5">
            <h4 className="font-semibold text-gray-300">Guaranteed Distribution</h4>
            <p className="mt-1">
              Ensures every active character category is represented and evenly distributed via Fisher-Yates shuffle.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
