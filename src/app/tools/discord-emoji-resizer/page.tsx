/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";

interface Preset {
  id: string;
  name: string;
  dimension: number;
  maxBytes: number;
  format: "image/png" | "image/webp";
  description: string;
}

const PRESETS: Preset[] = [
  {
    id: "emoji",
    name: "Discord Emoji",
    dimension: 128,
    maxBytes: 256 * 1024,
    format: "image/png",
    description: "128x128 px, under 256 KB limit",
  },
  {
    id: "sticker",
    name: "Discord Sticker",
    dimension: 320,
    maxBytes: 512 * 1024,
    format: "image/png",
    description: "320x320 px, under 512 KB limit",
  },
  {
    id: "custom",
    name: "High-Res Emoji (WebP)",
    dimension: 256,
    maxBytes: 256 * 1024,
    format: "image/webp",
    description: "256x256 px, WebP compression under 256 KB",
  },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function DiscordEmojiResizerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ w: number; h: number } | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<Preset>(PRESETS[0]);
  const [cropMode, setCropMode] = useState<"crop" | "fit">("crop");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(
    async (sourceFile: File, preset: Preset, mode: "crop" | "fit") => {
      setIsProcessing(true);
      setStatusMessage("Resizing and optimizing...");

      try {
        const img = new Image();
        const objUrl = URL.createObjectURL(sourceFile);
        img.src = objUrl;

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Unable to load image file"));
        });

        const targetDim = preset.dimension;
        const canvas = document.createElement("canvas");
        canvas.width = targetDim;
        canvas.height = targetDim;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("2D canvas context unavailable");
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        if (mode === "crop") {
          // Center crop to square
          const minSide = Math.min(img.naturalWidth, img.naturalHeight);
          const sx = (img.naturalWidth - minSide) / 2;
          const sy = (img.naturalHeight - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetDim, targetDim);
        } else {
          // Fit with transparent background
          const scale = Math.min(targetDim / img.naturalWidth, targetDim / img.naturalHeight);
          const drawW = img.naturalWidth * scale;
          const drawH = img.naturalHeight * scale;
          const dx = (targetDim - drawW) / 2;
          const dy = (targetDim - drawH) / 2;
          ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, dy, drawW, drawH);
        }

        // Binary search compression for target file size
        let finalBlob: Blob | null = null;
        let low = 0.1;
        let high = 1.0;
        let bestUnderLimit: Blob | null = null;

        // Try PNG first if format is PNG
        if (preset.format === "image/png") {
          const pngBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
          if (pngBlob && pngBlob.size <= preset.maxBytes) {
            finalBlob = pngBlob;
          }
        }

        if (!finalBlob) {
          // Compress via WebP or JPEG to meet strict size constraints
          const compressionFormat = preset.format === "image/png" ? "image/webp" : preset.format;
          for (let iter = 0; iter < 7; iter++) {
            const mid = (low + high) / 2;
            const testBlob = await new Promise<Blob | null>((res) =>
              canvas.toBlob(res, compressionFormat, mid)
            );

            if (!testBlob) break;

            if (testBlob.size <= preset.maxBytes) {
              bestUnderLimit = testBlob;
              low = mid;
            } else {
              high = mid;
            }
          }
          finalBlob = bestUnderLimit;
        }

        URL.revokeObjectURL(objUrl);

        if (!finalBlob) {
          const fallback = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.5));
          finalBlob = fallback;
        }

        if (finalBlob) {
          if (resultUrl) URL.revokeObjectURL(resultUrl);
          const resUrl = URL.createObjectURL(finalBlob);
          setResultBlob(finalBlob);
          setResultUrl(resUrl);
          setStatusMessage(`Complete: ${preset.dimension}x${preset.dimension} px (${formatBytes(finalBlob.size)})`);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Processing failed";
        setStatusMessage(errorMsg);
      } finally {
        setIsProcessing(false);
      }
    },
    [resultUrl]
  );

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith("image/")) {
      setStatusMessage("Please upload a valid image file (PNG, JPG, WebP, SVG, GIF)");
      return;
    }
    setFile(selected);
    const url = URL.createObjectURL(selected);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      setOriginalDimensions({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(url);
    };

    processImage(selected, activePreset, cropMode);
  };

  const handlePresetChange = (preset: Preset) => {
    setActivePreset(preset);
    if (file) {
      processImage(file, preset, cropMode);
    }
  };

  const handleCropModeChange = (mode: "crop" | "fit") => {
    setCropMode(mode);
    if (file) {
      processImage(file, activePreset, mode);
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !resultUrl) return;
    const ext = resultBlob.type === "image/webp" ? "webp" : "png";
    const link = document.createElement("a");
    link.href = resultUrl;
    link.download = `${activePreset.id}_${activePreset.dimension}x${activePreset.dimension}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ToolLayout
      title="Discord Emoji & Sticker Resizer"
      description="Resize, square-crop, and compress images to Discord emoji (128x128, <256KB) and sticker (320x320, <512KB) standards client-side."
    >
      <div className="space-y-6">
        {/* Upload Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
          }}
          className="cursor-pointer border-2 border-dashed border-[#222] bg-[#0c0c0c] hover:border-[#444] transition-colors p-8 text-center"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
            }}
          />
          <p className="text-sm font-medium text-gray-200">
            {file ? file.name : "Drop image here or click to browse"}
          </p>
          <p className="mt-1 text-xs text-[#666]">
            Supports PNG, JPEG, WebP, SVG, and static GIF.
          </p>
          {originalDimensions && (
            <p className="mt-2 text-xs font-mono text-blue-400">
              Original: {originalDimensions.w}x{originalDimensions.h} px ({formatBytes(file?.size || 0)})
            </p>
          )}
        </div>

        {/* Configuration Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-[#181818] bg-[#0c0c0c] p-4">
            <label className="block text-xs font-mono uppercase tracking-wider text-[#666] mb-3">
              Target Preset
            </label>
            <div className="space-y-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p)}
                  className={`w-full text-left p-3 border transition-colors ${
                    activePreset.id === p.id
                      ? "border-blue-500/60 bg-blue-950/20 text-blue-200"
                      : "border-[#1c1c1c] bg-[#101010] text-gray-300 hover:border-[#282828]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span>{p.name}</span>
                    <span className="font-mono text-[11px] text-[#666]">{p.dimension}x{p.dimension} px</span>
                  </div>
                  <div className="mt-1 text-[11px] text-[#555]">{p.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="border border-[#181818] bg-[#0c0c0c] p-4">
            <label className="block text-xs font-mono uppercase tracking-wider text-[#666] mb-3">
              Fit & Framing Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCropModeChange("crop")}
                className={`p-3 text-center border transition-colors ${
                  cropMode === "crop"
                    ? "border-blue-500/60 bg-blue-950/20 text-blue-200"
                    : "border-[#1c1c1c] bg-[#101010] text-gray-400 hover:border-[#282828]"
                }`}
              >
                <div className="text-xs font-medium">Center Crop</div>
                <div className="mt-1 text-[10px] text-[#555]">Fills square, clips edges</div>
              </button>

              <button
                onClick={() => handleCropModeChange("fit")}
                className={`p-3 text-center border transition-colors ${
                  cropMode === "fit"
                    ? "border-blue-500/60 bg-blue-950/20 text-blue-200"
                    : "border-[#1c1c1c] bg-[#101010] text-gray-400 hover:border-[#282828]"
                }`}
              >
                <div className="text-xs font-medium">Fit & Pad</div>
                <div className="mt-1 text-[10px] text-[#555]">Transparent padding</div>
              </button>
            </div>

            <div className="mt-6 border-t border-[#181818] pt-4">
              <div className="flex items-center justify-between text-xs text-[#666]">
                <span>Status:</span>
                <span className="font-mono text-gray-300">{statusMessage || "Idle"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Previews */}
        {resultUrl && (
          <div className="border border-[#181818] bg-[#0a0a0a] p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#181818] pb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-200">Optimized Output</h3>
                <p className="text-xs font-mono text-[#666]">
                  {activePreset.dimension}x{activePreset.dimension} px | {resultBlob ? formatBytes(resultBlob.size) : ""} | Limit: {formatBytes(activePreset.maxBytes)}
                </p>
              </div>

              <button
                onClick={handleDownload}
                disabled={isProcessing}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
              >
                Download {activePreset.name}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              {/* Actual Dimension */}
              <div className="flex flex-col items-center justify-center p-4 border border-[#161616] bg-[#0e0e0e]">
                <p className="text-[11px] font-mono text-[#666] mb-3">Actual Size</p>
                <div className="p-2 border border-dashed border-[#222] bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:8px_8px]">
                  <img
                    src={resultUrl}
                    alt="Actual size"
                    width={activePreset.dimension}
                    height={activePreset.dimension}
                    className="block"
                  />
                </div>
              </div>

              {/* Chat Preview (Dark Background) */}
              <div className="flex flex-col items-center justify-center p-4 border border-[#161616] bg-[#2b2d31]">
                <p className="text-[11px] font-mono text-gray-400 mb-3">Discord Dark Theme</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#1e1f22] flex items-center justify-center text-[10px] text-gray-400 font-bold">
                    U
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-semibold text-white">Member: </span>
                    <img
                      src={resultUrl}
                      alt="Discord preview"
                      className="inline-block align-middle ml-1"
                      style={{ width: activePreset.id === "sticker" ? 120 : 32, height: activePreset.id === "sticker" ? 120 : 32 }}
                    />
                  </div>
                </div>
              </div>

              {/* Chat Preview (Light Background) */}
              <div className="flex flex-col items-center justify-center p-4 border border-[#161616] bg-[#f2f3f5]">
                <p className="text-[11px] font-mono text-gray-600 mb-3">Discord Light Theme</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#e0e2e5] flex items-center justify-center text-[10px] text-gray-600 font-bold">
                    U
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-semibold text-[#313338]">Member: </span>
                    <img
                      src={resultUrl}
                      alt="Discord light preview"
                      className="inline-block align-middle ml-1"
                      style={{ width: activePreset.id === "sticker" ? 120 : 32, height: activePreset.id === "sticker" ? 120 : 32 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
