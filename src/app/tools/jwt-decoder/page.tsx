"use client";

import { useState, useMemo, useId } from "react";
import ToolLayout from "@/components/ToolLayout";

interface DecodedToken {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string;
  rawHeader: string;
  rawPayload: string;
  rawSignature: string;
}

function base64UrlDecode(str: string): string {
  let base64 = str.trim().replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8").decode(bytes);
}

function formatTimestamp(timestamp: number): { formatted: string; relative: string; isExpired: boolean; diffMs: number } {
  const date = new Date(timestamp > 1e11 ? timestamp : timestamp * 1000);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const isExpired = diffMs <= 0;

  const formatted = date.toUTCString() + ` (${date.toLocaleString()})`;

  const absDiffSec = Math.floor(Math.abs(diffMs) / 1000);
  const days = Math.floor(absDiffSec / 86400);
  const hours = Math.floor((absDiffSec % 86400) / 3600);
  const minutes = Math.floor((absDiffSec % 3600) / 60);
  const seconds = absDiffSec % 60;

  let relative = "";
  if (days > 0) relative += `${days}d `;
  if (hours > 0 || days > 0) relative += `${hours}h `;
  if (minutes > 0 || hours > 0 || days > 0) relative += `${minutes}m `;
  relative += `${seconds}s`;

  if (isExpired) {
    relative = `Expired ${relative} ago`;
  } else {
    relative = `Expires in ${relative}`;
  }

  return { formatted, relative, isExpired, diffMs };
}

// Pre-computed sample tokens
const SAMPLE_VALID =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkphbmUgRG9lIiwiZW1haWwiOiJqYW5lLmRvZUBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczNTY4OTYwMCwiZXhwIjoyMDgwNzg5NjAwLCJpc3MiOiJodHRwczovL2F1dGguZGV2dG9vbGJveC5pbyIsImF1ZCI6Imh0dHBzOi8vYXBpLmRldnRvb2xib3guaW8ifQ." +
  "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const SAMPLE_EXPIRED =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiJ1c3JfOTA4MTIzNDU2IiwibmFtZSI6IkFsZXggSm9obnNvbiIsImVtYWlsIjoiYWxleEBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjcyNTMxMjAwLCJleHAiOjE2NzI1MzQ4MDAsImlzcyI6Imh0dHBzOi8vYXV0aC5leGFtcGxlLmNvbSJ9." +
  "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

const SAMPLE_FIREBASE =
  "eyJhbGciOiJSUzI1NiIsImtpZCI6ImFkNWUxMWExYmRlODFjODg3ZjAwOGQ0NDYwNWI1MzA0NDAxMjM0NTYiLCJ0eXAiOiJKV1QifQ." +
  "eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbXktYXBwIiwiYXVkIjoibXktYXBwIiwiYXV0aF90aW1lIjoxNzM1Njg5NjAwLCJ1c2VyX2lkIjoidzlVejFXcDlQWlhrOHRNYkEiLCJzdWIiOiJ3OVV6MVdwOVBaWGs4dE1iQSIsImlhdCI6MTczNTY4OTYwMCwiZXhwIjoyMDgwNzg5NjAwLCJlbWFpbCI6ImRldkBkZXZ0b29sYm94LmlvIiwiZW1haWxfdmVyaWZpZWQiOnRydWV9." +
  "K3wF9m5R6Y3N2X4a9_7L8P1Q0Z3v9R6Y3N2X4a9_7L8P1Q0Z3v9R6Y3N2X4a9_7L8P1Q0Z3v";

export default function JwtDecoderPage() {
  const inputId = useId();
  const [tokenInput, setTokenInput] = useState<string>(SAMPLE_VALID);
  const [copiedHeader, setCopiedHeader] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const decodedResult = useMemo(() => {
    const raw = tokenInput.trim();
    if (!raw) {
      return { token: null, error: null, parts: [] };
    }

    const parts = raw.split(".");
    if (parts.length !== 3) {
      return {
        token: null,
        error: `Invalid JWT format: A JSON Web Token must contain exactly 3 dot-separated parts (header.payload.signature). Found ${parts.length} part(s).`,
        parts,
      };
    }

    const [rawHeader, rawPayload, rawSignature] = parts;
    let headerObj: Record<string, unknown> | null = null;
    let payloadObj: Record<string, unknown> | null = null;

    try {
      const decodedHeaderJson = base64UrlDecode(rawHeader);
      headerObj = JSON.parse(decodedHeaderJson);
    } catch (err) {
      return {
        token: null,
        error: `Failed to decode JWT Header: ${err instanceof Error ? err.message : "Invalid Base64URL or JSON"}`,
        parts,
      };
    }

    try {
      const decodedPayloadJson = base64UrlDecode(rawPayload);
      payloadObj = JSON.parse(decodedPayloadJson);
    } catch (err) {
      return {
        token: null,
        error: `Failed to decode JWT Payload: ${err instanceof Error ? err.message : "Invalid Base64URL or JSON"}`,
        parts,
      };
    }

    const token: DecodedToken = {
      header: headerObj,
      payload: payloadObj,
      signature: rawSignature,
      rawHeader,
      rawPayload,
      rawSignature,
    };

    return { token, error: null, parts };
  }, [tokenInput]);

  const { token, error, parts } = decodedResult;

  const copyToClipboard = async (text: string, setFn: (val: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setFn(true);
      setTimeout(() => setFn(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setFn(true);
      setTimeout(() => setFn(false), 2000);
    }
  };

  const expClaim = token?.payload && typeof token.payload.exp === "number" ? token.payload.exp : null;
  const iatClaim = token?.payload && typeof token.payload.iat === "number" ? token.payload.iat : null;
  const nbfClaim = token?.payload && typeof token.payload.nbf === "number" ? token.payload.nbf : null;

  const expInfo = expClaim ? formatTimestamp(expClaim) : null;
  const iatInfo = iatClaim ? formatTimestamp(iatClaim) : null;
  const nbfInfo = nbfClaim ? formatTimestamp(nbfClaim) : null;

  const headerString = token?.header ? JSON.stringify(token.header, null, 2) : "";
  const payloadString = token?.payload ? JSON.stringify(token.payload, null, 2) : "";

  return (
    <ToolLayout
      title="JWT Decoder"
      description="Decode and inspect JSON Web Tokens (JWT) client-side. View decoded header, payload claims, expiration status, and signature."
    >
      <title>JWT Decoder Online — DevToolbox</title>
      <meta
        name="description"
        content="Free online JWT Decoder. Inspect JSON Web Token header, payload, claims, and signature with color-coded syntax and expiration validator."
      />

      <div className="space-y-6">
        {/* Samples & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Sample Tokens:</span>
            <button
              type="button"
              onClick={() => setTokenInput(SAMPLE_VALID)}
              className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors cursor-pointer"
            >
              Active Token
            </button>
            <button
              type="button"
              onClick={() => setTokenInput(SAMPLE_EXPIRED)}
              className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors cursor-pointer"
            >
              Expired Token
            </button>
            <button
              type="button"
              onClick={() => setTokenInput(SAMPLE_FIREBASE)}
              className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors cursor-pointer"
            >
              RS256 Token
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(tokenInput, setCopiedToken)}
              disabled={!tokenInput}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              {copiedToken ? (
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
                  <span>Copy Token</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setTokenInput("")}
              disabled={!tokenInput}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs font-medium transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="font-semibold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <span>Encoded JWT Token</span>
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                (Paste token below)
              </span>
            </label>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                Header
              </span>
              <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                Payload
              </span>
              <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
                Signature
              </span>
            </div>
          </div>

          <textarea
            id={inputId}
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Paste a JSON Web Token here (e.g. eyJhbGciOi...)"
            rows={4}
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y leading-relaxed shadow-inner"
          />

          {/* Color-Coded Token Preview Bar */}
          {tokenInput.trim() && parts.length === 3 && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/70 rounded-lg font-mono text-xs break-all leading-relaxed">
              <span className="text-rose-600 dark:text-rose-400 font-semibold">{parts[0]}</span>
              <span className="text-gray-400 dark:text-gray-600 font-bold">.</span>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">{parts[1]}</span>
              <span className="text-gray-400 dark:text-gray-600 font-bold">.</span>
              <span className="text-sky-600 dark:text-sky-400 font-semibold">{parts[2]}</span>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold">Invalid JWT Token</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Expiration Status Banner */}
        {token && (
          <div>
            {expInfo ? (
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  expInfo.isExpired
                    ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-300"
                    : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      expInfo.isExpired
                        ? "bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300"
                        : "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300"
                    }`}
                  >
                    {expInfo.isExpired ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <span>{expInfo.isExpired ? "Token is Expired" : "Token is Active"}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide bg-white/60 dark:bg-black/30">
                        {expInfo.relative}
                      </span>
                    </h3>
                    <p className="text-xs opacity-90 mt-0.5">
                      <strong>Expiration (exp):</strong> {expInfo.formatted}
                    </p>
                  </div>
                </div>

                {iatInfo && (
                  <div className="text-xs opacity-80 sm:text-right">
                    <p><strong>Issued At (iat):</strong> {iatInfo.formatted}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-300 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>No expiration (<code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">exp</code>) claim present in this token payload.</span>
              </div>
            )}
          </div>
        )}

        {/* Decoded Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Header Panel */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  Decoded Header
                </h3>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-mono">
                  (Algorithm &amp; Token Type)
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(headerString, setCopiedHeader)}
                disabled={!headerString}
                className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                {copiedHeader ? (
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
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200 font-mono text-xs leading-relaxed min-h-[140px] overflow-auto select-all shadow-inner">
              {headerString || "// Decoded header JSON will appear here"}
            </pre>

            {token?.header && (
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Algorithm (alg):</span>{" "}
                  <span className="font-semibold text-rose-600 dark:text-rose-400">{String(token.header.alg || "none")}</span>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Type (typ):</span>{" "}
                  <span className="font-semibold text-rose-600 dark:text-rose-400">{String(token.header.typ || "JWT")}</span>
                </div>
              </div>
            )}
          </div>

          {/* Payload Panel */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  Decoded Payload
                </h3>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-mono">
                  (Data Claims)
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(payloadString, setCopiedPayload)}
                disabled={!payloadString}
                className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                {copiedPayload ? (
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
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-lg border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 text-purple-950 dark:text-purple-200 font-mono text-xs leading-relaxed min-h-[140px] overflow-auto select-all shadow-inner">
              {payloadString || "// Decoded payload JSON will appear here"}
            </pre>

            {token?.payload && (
              <div className="space-y-1.5 text-xs font-mono">
                {token.payload.sub !== undefined && (
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Subject (sub):</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">{String(token.payload.sub)}</span>
                  </div>
                )}
                {token.payload.iss !== undefined && (
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Issuer (iss):</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">{String(token.payload.iss)}</span>
                  </div>
                )}
                {token.payload.aud !== undefined && (
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Audience (aud):</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">{String(token.payload.aud)}</span>
                  </div>
                )}
                {nbfInfo && (
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Not Before (nbf):</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">{nbfInfo.formatted}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Signature Inspection Card */}
        {token && (
          <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/40 dark:bg-sky-950/20 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-500"></span>
              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                Signature Component
              </h4>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              The signature is calculated by taking the encoded header, the encoded payload, a secret key, and signing them using the specified algorithm ({String(token.header?.alg || "HS256")}).
            </p>
            <div className="p-2.5 bg-white dark:bg-gray-900 rounded border border-sky-200 dark:border-sky-800 font-mono text-xs text-sky-700 dark:text-sky-300 break-all select-all">
              {token.signature || "// No signature"}
            </div>
          </div>
        )}

        {/* Informative Guide */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700/60">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">🔴 Header (Red)</h4>
            <p>Contains metadata about the token, such as the signing algorithm (e.g. HS256, RS256) and token type (JWT).</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700/60">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">🟣 Payload (Purple)</h4>
            <p>Contains the claims and entity statements (user ID, roles, permissions, expiration timestamps).</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700/60">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">🔵 Signature (Blue)</h4>
            <p>Cryptographic hash used by the server to verify that the message wasn&apos;t changed along the way.</p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
