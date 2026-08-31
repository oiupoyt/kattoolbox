"use client";

import { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";

// Pure JavaScript MD5 Implementation (RFC 1321)
function md5(string: string): string {
  function add32(a: number, b: number): number {
    return (a + b) & 0xffffffff;
  }

  function cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }

  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }

  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  function md5cycle(x: number[], k: number[]) {
    let a = x[0],
      b = x[1],
      c = x[2],
      d = x[3];

    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(d, a, b, c, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }

  const utf8 = new TextEncoder().encode(string);
  const n = utf8.length;
  const state = [1732584193, -271733879, -1732584194, 271733878];

  let i = 0;
  for (i = 64; i <= n; i += 64) {
    const blk: number[] = [];
    for (let j = 0; j < 64; j += 4) {
      const idx = i - 64 + j;
      blk[j >> 2] =
        utf8[idx] | (utf8[idx + 1] << 8) | (utf8[idx + 2] << 16) | (utf8[idx + 3] << 24);
    }
    md5cycle(state, blk);
  }

  const tail = utf8.slice(i - 64);
  const tailBlk: number[] = new Array(16).fill(0);
  for (let j = 0; j < tail.length; j++) {
    tailBlk[j >> 2] |= tail[j] << ((j % 4) << 3);
  }
  tailBlk[tail.length >> 2] |= 0x80 << ((tail.length % 4) << 3);

  if (tail.length > 55) {
    md5cycle(state, tailBlk);
    for (let j = 0; j < 16; j++) tailBlk[j] = 0;
  }

  const bitLen = n * 8;
  tailBlk[14] = bitLen & 0xffffffff;
  tailBlk[15] = Math.floor(bitLen / 0x100000000);
  md5cycle(state, tailBlk);

  const hex_chr = "0123456789abcdef";
  let result = "";
  for (let j = 0; j < 4; j++) {
    const val = state[j];
    for (let k = 0; k <= 3; k++) {
      result += hex_chr[(val >> (k * 8 + 4)) & 0x0f] + hex_chr[(val >> (k * 8)) & 0x0f];
    }
  }

  return result;
}

interface HashResult {
  algorithm: string;
  name: string;
  bitLength: number;
  hash: string;
  securityNote: string;
}

export default function HashGeneratorPage() {
  const [inputText, setInputText] = useState<string>("Hello, DevToolbox!");
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [hashes, setHashes] = useState<HashResult[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  const computeHashes = useCallback(async (text: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    // 1. MD5
    const md5Hash = md5(text);

    // 2. Web Crypto subtle digests
    const getSubtleHash = async (algo: string): Promise<string> => {
      try {
        const buffer = await crypto.subtle.digest(algo, data);
        const hashArray = Array.from(new Uint8Array(buffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      } catch (err) {
        console.error(`Failed to calculate ${algo}:`, err);
        return "";
      }
    };

    const [sha1Hash, sha256Hash, sha384Hash, sha512Hash] = await Promise.all([
      getSubtleHash("SHA-1"),
      getSubtleHash("SHA-256"),
      getSubtleHash("SHA-384"),
      getSubtleHash("SHA-512"),
    ]);

    setHashes([
      {
        algorithm: "MD5",
        name: "MD5 (Message Digest 5)",
        bitLength: 128,
        hash: md5Hash,
        securityNote: "Legacy / Checksums only (vulnerable to collisions)",
      },
      {
        algorithm: "SHA-1",
        name: "SHA-1 (Secure Hash Algorithm 1)",
        bitLength: 160,
        hash: sha1Hash,
        securityNote: "Legacy (Git commits, legacy checksums)",
      },
      {
        algorithm: "SHA-256",
        name: "SHA-256 (SHA-2 Family)",
        bitLength: 256,
        hash: sha256Hash,
        securityNote: "Industry Standard (High security, SSL, Bitcoin)",
      },
      {
        algorithm: "SHA-384",
        name: "SHA-384 (SHA-2 Family)",
        bitLength: 384,
        hash: sha384Hash,
        securityNote: "High Security (Government & enterprise grade)",
      },
      {
        algorithm: "SHA-512",
        name: "SHA-512 (SHA-2 Family)",
        bitLength: 512,
        hash: sha512Hash,
        securityNote: "Maximum Security (64-bit optimized systems)",
      },
    ]);
  }, []);

  useEffect(() => {
    computeHashes(inputText);
  }, [inputText, computeHashes]);

  const copyHash = async (hashValue: string, key: string) => {
    const formatted = uppercase ? hashValue.toUpperCase() : hashValue.toLowerCase();
    try {
      await navigator.clipboard.writeText(formatted);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error("Failed to copy hash: ", err);
    }
  };

  const copyAllHashes = async () => {
    const allFormatted = hashes
      .map((h) => {
        const val = uppercase ? h.hash.toUpperCase() : h.hash.toLowerCase();
        return `${h.algorithm}: ${val}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(allFormatted);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error("Failed to copy all hashes: ", err);
    }
  };

  const sampleTexts = [
    { label: "Hello World", text: "Hello, world!" },
    { label: "Password", text: "correct horse battery staple" },
    { label: "Empty String", text: "" },
    { label: "Quick Fox", text: "The quick brown fox jumps over the lazy dog" },
  ];

  const byteLength = new TextEncoder().encode(inputText).length;

  return (
    <ToolLayout
      title="Hash Generator"
      description="Compute MD5, SHA-1, SHA-256, SHA-384, and SHA-512 cryptographic message digests in real-time with zero server latency."
    >
      <div className="space-y-6">
        {/* Input Section */}
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="hash-input"
              className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
            >
              Input Text
            </label>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>{inputText.length} characters</span>
              <span>•</span>
              <span>{byteLength} UTF-8 bytes</span>
            </div>
          </div>

          <textarea
            id="hash-input"
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste text to generate cryptographic hashes..."
            className="w-full rounded-lg border border-gray-300 bg-white p-3 font-mono text-sm text-gray-900 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />

          {/* Quick Presets and Clear */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-gray-500 dark:text-gray-400">Samples:</span>
              {sampleTexts.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => setInputText(sample.text)}
                  className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            {inputText && (
              <button
                type="button"
                onClick={() => setInputText("")}
                className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Clear input
              </button>
            )}
          </div>
        </div>

        {/* Hashes Section Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3 dark:border-gray-700">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Computed Hashes
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <span>UPPERCASE HEX</span>
            </label>

            <button
              type="button"
              onClick={copyAllHashes}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                copiedAll
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {copiedAll ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  All Copied!
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy All Hashes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hashes List */}
        <div className="space-y-4">
          {hashes.map((item) => {
            const displayHash = uppercase ? item.hash.toUpperCase() : item.hash.toLowerCase();
            const isCopied = copiedKey === item.algorithm;

            return (
              <div
                key={item.algorithm}
                className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 transition-all hover:border-gray-300 dark:border-gray-700/80 dark:bg-gray-800/40 dark:hover:border-gray-600"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {item.algorithm}
                    </span>
                    <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {item.bitLength}-bit ({item.hash.length} chars)
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {item.securityNote}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 overflow-hidden rounded-md border border-gray-300 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900">
                    <p className="select-all break-all font-mono text-xs font-medium text-gray-800 dark:text-gray-200 sm:text-sm">
                      {displayHash || "—"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyHash(item.hash, item.algorithm)}
                    aria-label={`Copy ${item.algorithm} hash`}
                    className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                      isCopied
                        ? "bg-green-600 text-white"
                        : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied
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
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Educational / Comparison Guide */}
        <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-4 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400">
          <h4 className="mb-2 font-semibold text-gray-800 dark:text-gray-200">
            About Cryptographic Hashes
          </h4>
          <p className="leading-relaxed">
            A cryptographic hash function is a one-way deterministic mathematical algorithm that maps arbitrary-size data to a fixed-size string. Hashes are widely used for data integrity verification, password storage with salt, digital signatures, and content-addressable storage systems.
          </p>
        </div>
      </div>
    </ToolLayout>
  );
}
