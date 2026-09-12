"use client";

import { useState, useRef, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";

export default function SvgToPngPage() {
  const [svgSource, setSvgSource] = useState<string>("");
  const [fileName, setFileName] = useState<string>("vector");
  const [naturalDimensions, setNaturalDimensions] = useState<{ w: number; h: number } | null>(null);
  const [scaleFactor, setScaleFactor] = useState<number>(2);
  const [customWidth, setCustomWidth] = useState<number>(0);
  const [customHeight, setCustomHeight] = useState<number>(0);
  const [useCustomSize, setUseCustomSize] = useState<boolean>(false);
  const [bgType, setBgType] = useState<"transparent" | "white" | "black">("transparent");
  const [exportFormat, setExportFormat] = useState<"image/png" | "image/webp">("image/png");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseSvgDimensions = useCallback((svgText: string): { w: number; h: number } => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const svgEl = doc.querySelector("svg");

    if (!svgEl) return { w: 512, h: 512 };

    const viewBox = svgEl.getAttribute("viewBox");
    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/).map(Number);
      if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
        return { w: parts[2], h: parts[3] };
      }
    }

    const wAttr = parseFloat(svgEl.getAttribute("width") || "0");
    const hAttr = parseFloat(svgEl.getAttribute("height") || "0");
    if (wAttr > 0 && hAttr > 0) {
      return { w: wAttr, h: hAttr };
    }

    return { w: 512, h: 512 };
  }, []);

  const handleFileSelect = (selected: File) => {
    if (!selected.name.endsWith(".svg") && selected.type !== "image/svg+xml") {
      setStatusMessage("Please upload a valid .svg file");
      return;
    }

    setFileName(selected.name.replace(/\.svg$/i, ""));
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setSvgSource(text);
      const dims = parseSvgDimensions(text);
      setNaturalDimensions(dims);
      setCustomWidth(dims.w * scaleFactor);
      setCustomHeight(dims.h * scaleFactor);
      setStatusMessage(`Loaded SVG (${dims.w}x${dims.h} base)`);
    };
    reader.readAsText(selected);
  };

  const handleExport = async () => {
    if (!svgSource || !naturalDimensions) return;
    setIsProcessing(true);
    setStatusMessage("Rendering high-resolution vector...");

    try {
      const targetW = useCustomSize ? customWidth : naturalDimensions.w * scaleFactor;
      const targetH = useCustomSize ? customHeight : naturalDimensions.h * scaleFactor;

      const blob = new Blob([svgSource], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.src = url;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Unable to rasterize SVG"));
      });

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      // Fill background if not transparent
      if (bgType === "white") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetW, targetH);
      } else if (bgType === "black") {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, targetW, targetH);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, targetW, targetH);

      URL.revokeObjectURL(url);

      const ext = exportFormat === "image/png" ? "png" : "webp";
      const outBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, exportFormat, 0.95));

      if (!outBlob) throw new Error("Export failed");

      const downloadUrl = URL.createObjectURL(outBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${fileName}_${targetW}x${targetH}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setStatusMessage(`Exported ${targetW}x${targetH} px successfully`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Render error";
      setStatusMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="SVG to High-Res Raster Converter"
      description="Rasterize scalable SVG vectors into ultra high-resolution PNG or WebP images (up to 8K) with custom dimensions and transparent backgrounds."
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
            accept=".svg,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
            }}
          />
          <p className="text-sm font-medium text-gray-200">
            {svgSource ? `${fileName}.svg loaded` : "Drop .svg vector file here"}
          </p>
          <p className="mt-1 text-xs text-[#666]">
            Supports standard SVG paths, shapes, gradients, and inline styles.
          </p>
          {naturalDimensions && (
            <p className="mt-2 text-xs font-mono text-blue-400">
              Base dimensions: {naturalDimensions.w}x{naturalDimensions.h} px
            </p>
          )}
        </div>

        {svgSource && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SVG Visual Preview */}
            <div className="border border-[#181818] bg-[#0a0a0a] p-6 flex flex-col items-center justify-center min-h-[300px]">
              <div
                className={`w-full h-full min-h-[240px] flex items-center justify-center p-4 border border-[#1e1e1e] ${
                  bgType === "transparent"
                    ? "bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:12px_12px]"
                    : bgType === "white"
                    ? "bg-white"
                    : "bg-black"
                }`}
                dangerouslySetInnerHTML={{ __html: svgSource }}
              />
            </div>

            {/* Render Settings */}
            <div className="border border-[#181818] bg-[#0a0a0a] p-6 space-y-6">
              {/* Scale Presets */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#666] mb-3">
                  Resolution Scale
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 4, 8, 16].map((scale) => (
                    <button
                      key={scale}
                      onClick={() => {
                        setScaleFactor(scale);
                        setUseCustomSize(false);
                      }}
                      className={`py-2 text-center border text-xs font-mono transition-colors ${
                        !useCustomSize && scaleFactor === scale
                          ? "border-blue-500/60 bg-blue-950/20 text-blue-200"
                          : "border-[#1c1c1c] bg-[#101010] text-gray-400 hover:border-[#282828]"
                      }`}
                    >
                      {scale}x
                    </button>
                  ))}
                </div>
                {naturalDimensions && (
                  <p className="mt-2 text-xs font-mono text-[#555]">
                    Output resolution: {naturalDimensions.w * scaleFactor}x{naturalDimensions.h * scaleFactor} px
                  </p>
                )}
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#666] mb-3">
                  Background
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["transparent", "white", "black"] as const).map((bg) => (
                    <button
                      key={bg}
                      onClick={() => setBgType(bg)}
                      className={`py-2 text-center border text-xs capitalize transition-colors ${
                        bgType === bg
                          ? "border-blue-500/60 bg-blue-950/20 text-blue-200"
                          : "border-[#1c1c1c] bg-[#101010] text-gray-400 hover:border-[#282828]"
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#666] mb-3">
                  Target Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportFormat("image/png")}
                    className={`py-2 text-center border text-xs transition-colors ${
                      exportFormat === "image/png"
                        ? "border-blue-500/60 bg-blue-950/20 text-blue-200"
                        : "border-[#1c1c1c] bg-[#101010] text-gray-400 hover:border-[#282828]"
                    }`}
                  >
                    PNG (Lossless)
                  </button>
                  <button
                    onClick={() => setExportFormat("image/webp")}
                    className={`py-2 text-center border text-xs transition-colors ${
                      exportFormat === "image/webp"
                        ? "border-blue-500/60 bg-blue-950/20 text-blue-200"
                        : "border-[#1c1c1c] bg-[#101010] text-gray-400 hover:border-[#282828]"
                    }`}
                  >
                    WebP (Compressed)
                  </button>
                </div>
              </div>

              {/* Action */}
              <div className="border-t border-[#181818] pt-4 flex items-center justify-between">
                <span className="text-xs font-mono text-[#555]">{statusMessage}</span>
                <button
                  onClick={handleExport}
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
                >
                  {isProcessing ? "Rendering..." : "Export High-Res Image"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
