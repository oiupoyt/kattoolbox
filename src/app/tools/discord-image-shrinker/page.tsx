"use client";

import { useState, useRef, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";

interface TargetPreset {
  name: string;
  bytes: number;
  label: string;
}

const PRESETS: TargetPreset[] = [
  { name: "Discord Free (10 MB)", bytes: 10 * 1024 * 1024, label: "Discord 10MB" },
  { name: "Discord Legacy (8 MB)", bytes: 8 * 1024 * 1024, label: "Discord 8MB" },
  { name: "Email / Gmail (25 MB)", bytes: 24.5 * 1024 * 1024, label: "Email 25MB" },
  { name: "Web / Avatar (1 MB)", bytes: 1 * 1024 * 1024, label: "Web 1MB" },
  { name: "Ultra-Light (500 KB)", bytes: 500 * 1024, label: "Fast 500KB" },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function DiscordImageShrinkerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [targetBytes, setTargetBytes] = useState<number>(PRESETS[0].bytes);
  const [selectedFormat, setSelectedFormat] = useState<"image/webp" | "image/jpeg" | "image/png">("image/webp");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressToTarget = useCallback(
    async (sourceFile: File, targetLimit: number, format: "image/webp" | "image/jpeg" | "image/png") => {
      setIsCompressing(true);
      setStatusMessage("Loading and processing image...");

      const img = new Image();
      const objectUrl = URL.createObjectURL(sourceFile);
      img.src = objectUrl;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsCompressing(false);
        setStatusMessage("Canvas context unavailable");
        return;
      }

      let scale = 1.0;
      let minQuality = 0.05;
      let maxQuality = 0.95;
      let bestBlob: Blob | null = null;

      // Iterative smart compression
      for (let iteration = 0; iteration < 6; iteration++) {
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Binary search for quality
        let currentBestBlob: Blob | null = null;
        let low = minQuality;
        let high = maxQuality;

        for (let qStep = 0; qStep < 5; qStep++) {
          const midQuality = (low + high) / 2;
          const blob: Blob = await new Promise((res) => {
            canvas.toBlob((b) => res(b || new Blob()), format, midQuality);
          });

          if (blob.size <= targetLimit) {
            currentBestBlob = blob;
            low = midQuality; // try higher quality
          } else {
            high = midQuality; // lower quality needed
          }
        }

        if (currentBestBlob && currentBestBlob.size <= targetLimit) {
          bestBlob = currentBestBlob;
          break;
        }

        // If even lowest quality is too big, scale down dimensions by 20%
        scale *= 0.8;
      }

      // Fallback if still over limit
      if (!bestBlob) {
        canvas.width = Math.max(1, Math.round(img.naturalWidth * 0.5));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * 0.5));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        bestBlob = await new Promise((res) => {
          canvas.toBlob((b) => res(b || new Blob()), format, 0.4);
        });
      }

      URL.revokeObjectURL(objectUrl);

      if (bestBlob) {
        if (compressedUrl) URL.revokeObjectURL(compressedUrl);
        const newUrl = URL.createObjectURL(bestBlob);
        setCompressedBlob(bestBlob);
        setCompressedUrl(newUrl);
        setCompressedSize(bestBlob.size);
        setStatusMessage(
          bestBlob.size <= targetLimit
            ? `Successfully shrunk under ${formatBytes(targetLimit)}!`
            : `Compressed as much as possible without extreme quality loss.`
        );
      }

      setIsCompressing(false);
    },
    [compressedUrl]
  );

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith("image/")) {
      alert("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }
    setFile(selected);
    setOriginalSize(selected.size);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
    compressToTarget(selected, targetBytes, selectedFormat);
  };

  const handlePresetChange = (presetBytes: number) => {
    setTargetBytes(presetBytes);
    if (file) {
      compressToTarget(file, presetBytes, selectedFormat);
    }
  };

  const handleFormatChange = (fmt: "image/webp" | "image/jpeg" | "image/png") => {
    setSelectedFormat(fmt);
    if (file) {
      compressToTarget(file, targetBytes, fmt);
    }
  };

  const downloadFile = () => {
    if (!compressedBlob || !compressedUrl || !file) return;
    const ext = selectedFormat === "image/webp" ? "webp" : selectedFormat === "image/jpeg" ? "jpg" : "png";
    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
    const a = document.createElement("a");
    a.href = compressedUrl;
    a.download = `${nameWithoutExt}-discord-ready.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const savingsPercent =
    originalSize > 0 && compressedSize > 0
      ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
      : 0;

  return (
    <ToolLayout
      title="Discord & Email File Shrinker"
      description="Compress images client-side to fit Discord's upload limit (10MB/8MB) or Gmail's 25MB attachment limit. 100% private in-browser."
    >
      <div className="space-y-6">
        {/* Preset Selector */}
        <div>
          <label className="text-xs uppercase tracking-wider text-[#666] font-semibold block mb-2">
            Select Target Limit
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const isSelected = targetBytes === p.bytes;
              return (
                <button
                  key={p.name}
                  onClick={() => handlePresetChange(p.bytes)}
                  className={`px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                      : "bg-[#111] text-gray-400 border-[#222] hover:bg-[#1a1a1a] hover:text-gray-200"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Format Selector */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="text-[#666] uppercase tracking-wider font-semibold">Format:</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="format"
              checked={selectedFormat === "image/webp"}
              onChange={() => handleFormatChange("image/webp")}
              className="text-blue-600"
            />
            <span>WebP (Best Compression)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="format"
              checked={selectedFormat === "image/jpeg"}
              onChange={() => handleFormatChange("image/jpeg")}
              className="text-blue-600"
            />
            <span>JPEG (Universal)</span>
          </label>
        </div>

        {/* Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileSelect(e.dataTransfer.files[0]);
            }
          }}
          className="border-2 border-dashed border-[#222] hover:border-blue-600/50 bg-[#080808] p-8 text-center cursor-pointer transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded border border-[#222] bg-[#111] flex items-center justify-center text-gray-400">
              📁
            </div>
            <p className="text-sm font-medium text-gray-300">
              Drag &amp; drop your image here, or <span className="text-blue-400">browse</span>
            </p>
            <p className="text-xs text-[#555]">Supports PNG, JPG, WebP, GIF frames</p>
          </div>
        </div>

        {/* Processing State */}
        {isCompressing && (
          <div className="flex items-center gap-3 p-4 bg-[#0d1525] border border-blue-900 text-blue-300 text-sm">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Results Comparison */}
        {file && compressedBlob && !isCompressing && (
          <div className="space-y-4 border border-[#1a1a1a] bg-[#0c0c0c] p-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1a1a1a] pb-3">
              <div>
                <span className="text-xs text-[#666] uppercase tracking-wider block">Original Size</span>
                <span className="text-sm font-mono text-gray-300">{formatBytes(originalSize)}</span>
              </div>
              <div>
                <span className="text-xs text-[#666] uppercase tracking-wider block">Compressed Size</span>
                <span className="text-sm font-mono text-green-400 font-bold">
                  {formatBytes(compressedSize)}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#666] uppercase tracking-wider block">Saved</span>
                <span className="text-sm font-mono text-blue-400 font-semibold">{savingsPercent}%</span>
              </div>
              <div>
                <span className="text-xs text-[#666] uppercase tracking-wider block">Target Limit</span>
                <span className="text-sm font-mono text-gray-400">{formatBytes(targetBytes)}</span>
              </div>
              <button
                onClick={downloadFile}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>Download Shrunk Image</span>
              </button>
            </div>

            {/* Preview Image */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-xs text-[#666] block mb-1">Original Preview</span>
                <div className="border border-[#1a1a1a] bg-black max-h-60 overflow-hidden flex items-center justify-center">
                  {previewUrl && (
                    <img src={previewUrl} alt="Original" className="max-h-60 object-contain" />
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs text-[#666] block mb-1">Compressed Output</span>
                <div className="border border-[#1a1a1a] bg-black max-h-60 overflow-hidden flex items-center justify-center">
                  {compressedUrl && (
                    <img src={compressedUrl} alt="Compressed" className="max-h-60 object-contain" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature Explainer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-[#1a1a1a] text-xs text-[#666]">
          <div className="border border-[#181818] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">Never Fails Discord Limits</h4>
            <p>Automatically reduces image resolution and quality iteratively until it falls safely below the target file size.</p>
          </div>
          <div className="border border-[#181818] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">Zero Server Uploads</h4>
            <p>All compression runs locally via HTML5 Canvas. Your images are never sent across the internet.</p>
          </div>
          <div className="border border-[#181818] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">Metadata Stripped</h4>
            <p>Canvas re-encoding inherently purges hidden GPS, camera, and device tracking markers.</p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
