/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";

interface ColorItem {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  population: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Simple color quantization by bucket clustering
function extractDominantColors(data: Uint8ClampedArray, colorCount = 8): ColorItem[] {
  const buckets: { [key: string]: { r: number; g: number; b: number; count: number } } = {};
  const step = 4 * 4; // Sample every 4th pixel for speed

  for (let i = 0; i < data.length; i += step) {
    const a = data[i + 3];
    if (a < 128) continue; // Skip transparent pixels

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Quantize into 32-step buckets
    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;

    if (!buckets[key]) {
      buckets[key] = { r: 0, g: 0, b: 0, count: 0 };
    }
    buckets[key].r += r;
    buckets[key].g += g;
    buckets[key].b += b;
    buckets[key].count++;
  }

  const sorted = Object.values(buckets)
    .sort((a, b) => b.count - a.count)
    .slice(0, colorCount);

  return sorted.map((item) => {
    const r = Math.round(item.r / item.count);
    const g = Math.round(item.g / item.count);
    const b = Math.round(item.b / item.count);
    return {
      hex: rgbToHex(r, g, b),
      rgb: { r, g, b },
      hsl: rgbToHsl(r, g, b),
      population: item.count,
    };
  });
}

export default function ColorPaletteExtractorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<ColorItem[]>([]);
  const [hoverColor, setHoverColor] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback((sourceFile: File) => {
    const img = new Image();
    const url = URL.createObjectURL(sourceFile);
    img.src = url;

    img.onload = () => {
      const canvas = canvasRef.current || document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const maxDim = 400;
      const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const colors = extractDominantColors(imgData.data, 8);
      setPalette(colors);
    };
  }, []);

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith("image/")) return;
    setFile(selected);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
    processImage(selected);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 1800);
  };

  const getCssVariables = () => {
    return `:root {\n` + palette.map((c, i) => `  --color-palette-${i + 1}: ${c.hex};`).join("\n") + `\n}`;
  };

  const getTailwindConfig = () => {
    const obj = palette.reduce((acc, c, i) => {
      acc[`color-${i + 1}`] = c.hex;
      return acc;
    }, {} as Record<string, string>);
    return `// tailwind.config.js\ncolors: ` + JSON.stringify(obj, null, 2);
  };

  return (
    <ToolLayout
      title="Image Color Palette Extractor"
      description="Extract dominant color palettes and hex codes from any image or artwork client-side. Export directly to CSS variables or Tailwind configs."
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
            {file ? file.name : "Drop photo, graphic, or wallpaper here"}
          </p>
          <p className="mt-1 text-xs text-[#666]">
            Supports PNG, JPEG, WebP, SVG.
          </p>
        </div>

        {/* Hidden Canvas for computation */}
        <canvas ref={canvasRef} className="hidden" />

        {previewUrl && palette.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Preview */}
            <div className="border border-[#181818] bg-[#0a0a0a] p-4 flex flex-col items-center justify-center">
              <img
                src={previewUrl}
                alt="Uploaded reference"
                className="max-h-80 w-auto object-contain border border-[#1e1e1e]"
              />
              {hoverColor && (
                <div className="mt-3 flex items-center gap-2 text-xs font-mono text-gray-300">
                  <div className="w-3.5 h-3.5 border border-white/20" style={{ backgroundColor: hoverColor }} />
                  <span>{hoverColor}</span>
                </div>
              )}
            </div>

            {/* Extracted Palette */}
            <div className="border border-[#181818] bg-[#0a0a0a] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#181818] pb-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#666]">
                  Dominant Colors ({palette.length})
                </h3>
                {copiedText && (
                  <span className="text-xs font-mono text-blue-400">Copied {copiedText}!</span>
                )}
              </div>

              {/* Swatches Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {palette.map((color, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoverColor(color.hex)}
                    onMouseLeave={() => setHoverColor(null)}
                    onClick={() => copyToClipboard(color.hex, color.hex)}
                    className="cursor-pointer border border-[#181818] bg-[#0e0e0e] hover:border-[#333] transition-all p-2 text-left group"
                  >
                    <div
                      className="w-full h-14 border border-black/20 mb-2 transition-transform group-hover:scale-[1.02]"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="font-mono text-xs text-gray-200 font-medium">{color.hex}</div>
                    <div className="font-mono text-[10px] text-[#555]">
                      rgb({color.rgb.r}, {color.rgb.g}, {color.rgb.b})
                    </div>
                  </div>
                ))}
              </div>

              {/* Export Buttons */}
              <div className="border-t border-[#181818] pt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => copyToClipboard(getCssVariables(), "CSS Variables")}
                  className="px-3 py-1.5 bg-[#141414] hover:bg-[#1f1f1f] border border-[#222] text-xs font-mono text-gray-300 transition-colors"
                >
                  Copy CSS Variables
                </button>
                <button
                  onClick={() => copyToClipboard(getTailwindConfig(), "Tailwind Config")}
                  className="px-3 py-1.5 bg-[#141414] hover:bg-[#1f1f1f] border border-[#222] text-xs font-mono text-gray-300 transition-colors"
                >
                  Copy Tailwind
                </button>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(palette.map((c) => c.hex)), "JSON")}
                  className="px-3 py-1.5 bg-[#141414] hover:bg-[#1f1f1f] border border-[#222] text-xs font-mono text-gray-300 transition-colors"
                >
                  Copy Hex Array
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
