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
  { name: "Email Attachment (25 MB)", bytes: 24.5 * 1024 * 1024, label: "Email 25MB" },
  { name: "Web (1 MB)", bytes: 1 * 1024 * 1024, label: "Web 1MB" },
  { name: "Optimized (500 KB)", bytes: 500 * 1024, label: "500KB" },
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
      setStatusMessage("Processing image...");

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
      const minQuality = 0.05;
      const maxQuality = 0.95;
      let bestBlob: Blob | null = null;

      for (let iteration = 0; iteration < 6; iteration++) {
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

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
            low = midQuality;
          } else {
            high = midQuality;
          }
        }

        if (currentBestBlob && currentBestBlob.size <= targetLimit) {
          bestBlob = currentBestBlob;
          break;
        }

        scale *= 0.8;
      }

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
            ? `Compressed to ${formatBytes(bestBlob.size)} (under ${formatBytes(targetLimit)} threshold).`
            : `Compressed to lowest viable threshold (${formatBytes(bestBlob.size)}).`
        );
      }

      setIsCompressing(false);
    },
    [compressedUrl]
  );

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
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
    a.download = `${nameWithoutExt}-compressed.${ext}`;
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
      title="File Shrinker"
      description="Compress images to target file sizes for Discord, email attachments, or web delivery. Processing runs in browser memory."
    >
      <div className="space-y-6">
        {/* Preset Selector */}
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-[#666] block mb-2">
            Target Size Threshold
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const isSelected = targetBytes === p.bytes;
              return (
                <button
                  key={p.name}
                  onClick={() => handlePresetChange(p.bytes)}
                  className={`px-3 py-1.5 text-xs font-mono border transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-blue-900/60 text-blue-200 border-blue-600"
                      : "bg-[#0d0d0d] text-gray-400 border-[#222] hover:bg-[#151515] hover:text-gray-200"
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
          <span className="text-[#666] font-mono uppercase tracking-wider">Output Format:</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="format"
              checked={selectedFormat === "image/webp"}
              onChange={() => handleFormatChange("image/webp")}
              className="text-blue-600"
            />
            <span>WebP (Optimal compression)</span>
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
          className="border border-dashed border-[#222] hover:border-[#3a3a3a] bg-[#070707] p-8 text-center cursor-pointer transition-colors"
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
            <svg className="w-8 h-8 text-[#444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8 8m4-4l4 4" />
            </svg>
            <p className="text-xs text-gray-300">
              Drag and drop an image, or <span className="text-blue-400">browse</span>
            </p>
            <p className="text-[11px] text-[#555]">PNG, JPG, WebP supported</p>
          </div>
        </div>

        {/* Processing Indicator */}
        {isCompressing && (
          <div className="flex items-center gap-3 p-3 bg-[#0c121e] border border-blue-900/60 text-blue-300 text-xs">
            <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Results */}
        {file && compressedBlob && !isCompressing && (
          <div className="space-y-4 border border-[#1a1a1a] bg-[#090909] p-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#181818] pb-3">
              <div>
                <span className="text-[11px] font-mono text-[#555] uppercase block">Original</span>
                <span className="text-xs font-mono text-gray-300">{formatBytes(originalSize)}</span>
              </div>
              <div>
                <span className="text-[11px] font-mono text-[#555] uppercase block">Compressed</span>
                <span className="text-xs font-mono text-emerald-400 font-medium">
                  {formatBytes(compressedSize)}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-mono text-[#555] uppercase block">Reduction</span>
                <span className="text-xs font-mono text-blue-400">{savingsPercent}%</span>
              </div>
              <div>
                <span className="text-[11px] font-mono text-[#555] uppercase block">Target</span>
                <span className="text-xs font-mono text-gray-400">{formatBytes(targetBytes)}</span>
              </div>
              <button
                onClick={downloadFile}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Download compressed file
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-[11px] text-[#555] block mb-1">Source Preview</span>
                <div className="border border-[#181818] bg-black max-h-56 overflow-hidden flex items-center justify-center p-2">
                  {previewUrl && (
                    <img src={previewUrl} alt="Source" className="max-h-52 object-contain" />
                  )}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-[#555] block mb-1">Result Preview</span>
                <div className="border border-[#181818] bg-black max-h-56 overflow-hidden flex items-center justify-center p-2">
                  {compressedUrl && (
                    <img src={compressedUrl} alt="Result" className="max-h-52 object-contain" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Technical details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-[#1a1a1a] text-xs text-[#555]">
          <div className="border border-[#141414] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">Target Size Convergence</h4>
            <p>Iteratively scales dimensions and adjusts encoder quality until file size conforms to selected limit.</p>
          </div>
          <div className="border border-[#141414] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">In-Memory Execution</h4>
            <p>Processing occurs via HTML5 Canvas in local browser memory. Files are not transmitted externally.</p>
          </div>
          <div className="border border-[#141414] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">Metadata Stripping</h4>
            <p>Canvas rasterization automatically removes embedded camera metadata and GPS coordinates.</p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
