"use client";

import { useState, useMemo, useSyncExternalStore, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";

function subscribeHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function getHashSnapshot() {
  return typeof window !== "undefined" ? window.location.hash : "";
}

function getServerSnapshot() {
  return "";
}

// Utility helpers for Uint8Array <-> Base64URL
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export default function SecretSharePage() {
  const [secretText, setSecretText] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const hash = useSyncExternalStore(subscribeHash, getHashSnapshot, getServerSnapshot);
  const [explicitMode, setExplicitMode] = useState<"create" | "view" | null>(null);

  const hasSecretInHash = useMemo(() => {
    const raw = hash.startsWith("#") ? hash.substring(1) : hash;
    const params = new URLSearchParams(raw);
    return Boolean(params.get("d") && params.get("k"));
  }, [hash]);

  const mode = explicitMode ?? (hasSecretInHash ? "view" : "create");
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const handleCreateSecret = async () => {
    if (!secretText.trim()) return;

    try {
      // 1. Generate 256-bit AES-GCM key
      const key = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );

      // 2. Export raw key bytes
      const exportedKey = await crypto.subtle.exportKey("raw", key);
      const keyB64 = bufferToBase64Url(exportedKey);

      // 3. Random 12-byte initialization vector (IV)
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const plaintext = encoder.encode(secretText);

      // 4. Encrypt
      const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        plaintext
      );

      // Pack IV (12 bytes) + Ciphertext into single payload
      const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(ciphertext), iv.byteLength);

      const dataB64 = bufferToBase64Url(combined.buffer);

      const origin = window.location.origin;
      const path = window.location.pathname;
      const fullUrl = `${origin}${path}#d=${dataB64}&k=${keyB64}`;

      setGeneratedLink(fullUrl);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecrypt = useCallback(async () => {
    setIsDecrypting(true);
    setDecryptError(null);

    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const dataB64 = params.get("d");
      const keyB64 = params.get("k");

      if (!dataB64 || !keyB64) {
        throw new Error("Invalid or corrupted secret link parameters");
      }

      const keyBuffer = base64UrlToBuffer(keyB64);
      const dataBuffer = base64UrlToBuffer(dataB64);

      if (dataBuffer.byteLength < 13) {
        throw new Error("Ciphertext too short or corrupted");
      }

      const iv = new Uint8Array(dataBuffer.slice(0, 12));
      const ciphertext = dataBuffer.slice(12);

      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBuffer,
        "AES-GCM",
        false,
        ["decrypt"]
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        ciphertext
      );

      const decoder = new TextDecoder();
      setDecryptedText(decoder.decode(decrypted));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Decryption failed";
      setDecryptError(msg);
    } finally {
      setIsDecrypting(false);
    }
  }, []);

  const handleDestroy = () => {
    setDecryptedText(null);
    setDecryptError(null);
    if (typeof window !== "undefined") {
      window.location.hash = "";
    }
    setExplicitMode("create");
    setSecretText("");
    setGeneratedLink("");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <ToolLayout
      title="Client-Side Secret Link"
      description="Zero-knowledge password & token sharing. Encrypted client-side via AES-256-GCM. The decryption key stays strictly in the URL hash and never touches any server."
    >
      <div className="space-y-6">
        {mode === "create" ? (
          <>
            <div className="border border-[#181818] bg-[#0c0c0c] p-6 space-y-4">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#666]">
                Confidential Secret / Note
              </label>
              <textarea
                value={secretText}
                onChange={(e) => setSecretText(e.target.value)}
                rows={6}
                placeholder="Paste API keys, database credentials, passwords, or private messages..."
                className="w-full p-4 bg-[#050505] border border-[#222] text-xs font-mono text-gray-200 placeholder-[#444] focus:outline-none focus:border-blue-500"
              />

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <p className="text-[11px] text-[#555]">
                  Encrypted locally using browser Web Crypto API (AES-GCM 256-bit).
                </p>
                <button
                  onClick={handleCreateSecret}
                  disabled={!secretText.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
                >
                  Generate Encrypted Link
                </button>
              </div>
            </div>

            {generatedLink && (
              <div className="border border-[#181818] bg-[#0a0a0a] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#666]">
                    Shareable Link
                  </h3>
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-1.5 bg-[#141414] hover:bg-[#1f1f1f] border border-[#262626] text-xs text-gray-200 transition-colors"
                  >
                    {isCopied ? "Copied to Clipboard" : "Copy Link"}
                  </button>
                </div>

                <div className="p-3 bg-[#050505] border border-[#141414] font-mono text-xs text-blue-400 break-all select-all">
                  {generatedLink}
                </div>

                <div className="p-4 border border-[#1c1c1c] bg-[#101010] text-xs text-[#777] leading-relaxed">
                  <strong className="text-gray-300">How this works:</strong> The URL hash (`#d=...&k=...`) stores the 256-bit encryption key and ciphertext. Per internet standards (RFC 3986), URL hashes are never transmitted across HTTP requests, meaning neither our servers nor your ISP can intercept or read the message.
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="border border-[#181818] bg-[#0c0c0c] p-6 space-y-6">
            <div className="border-b border-[#181818] pb-4">
              <h3 className="text-sm font-medium text-gray-200">Encrypted Secret Received</h3>
              <p className="mt-1 text-xs text-[#666]">
                This message was encrypted using AES-256-GCM. Click decrypt to decode using the key embedded in your URL fragment.
              </p>
            </div>

            {decryptedText === null ? (
              <div className="text-center py-8">
                <button
                  onClick={handleDecrypt}
                  disabled={isDecrypting}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold tracking-wider uppercase transition-colors"
                >
                  {isDecrypting ? "Decrypting..." : "Decrypt Secret"}
                </button>
                {decryptError && (
                  <p className="mt-4 text-xs font-mono text-red-400">{decryptError}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#666]">
                    Decrypted Content
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(decryptedText)}
                      className="px-3 py-1 bg-[#141414] hover:bg-[#1f1f1f] border border-[#262626] text-xs text-gray-300 transition-colors"
                    >
                      Copy Secret
                    </button>
                    <button
                      onClick={handleDestroy}
                      className="px-3 py-1 bg-red-950/30 hover:bg-red-900/40 border border-red-800/40 text-xs text-red-300 transition-colors"
                    >
                      Destroy & Clear
                    </button>
                  </div>
                </div>

                <pre className="p-4 bg-[#050505] border border-[#181818] font-mono text-xs text-gray-200 whitespace-pre-wrap break-all select-all leading-relaxed">
                  {decryptedText}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
