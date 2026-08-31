"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import ToolLayout from "@/components/ToolLayout";

interface PresetSize {
  name: string;
  width: number;
  height: number;
  category?: string;
}

const PRESET_SIZES: PresetSize[] = [
  { name: "Thumbnail", width: 150, height: 150 },
  { name: "Social (OG)", width: 1200, height: 630 },
  { name: "Banner", width: 728, height: 90 },
  { name: "Avatar", width: 64, height: 64 },
  { name: "HD (1080p)", width: 1920, height: 1080 },
  { name: "Square Post", width: 1080, height: 1080 },
  { name: "Medium Box", width: 300, height: 250 },
  { name: "Mobile Screen", width: 390, height: 844 },
];

const COLOR_PALETTES = [
  { name: "Default Gray", bg: "#CCCCCC", text: "#666666" },
  { name: "Slate Dark", bg: "#1E293B", text: "#94A3B8" },
  { name: "Indigo Modern", bg: "#4F46E5", text: "#EEF2FF" },
  { name: "Sky Light", bg: "#E0F2FE", text: "#0369A1" },
  { name: "Emerald Fresh", bg: "#D1FAE5", text: "#065F46" },
  { name: "Amber Warm", bg: "#FEF3C7", text: "#92400E" },
  { name: "Rose Soft", bg: "#FFE4E6", text: "#9F1239" },
  { name: "Pure Dark", bg: "#111827", text: "#F9FAFB" },
];

export default function PlaceholderImagePage() {
  const widthId = useId();
  const heightId = useId();
  const textId = useId();
  const fontSizeId = useId();

  const [width, setWidth] = useState<number>(400);
  const [height, setHeight] = useState<number>(300);
  const [bgColor, setBgColor] = useState<string>("#CCCCCC");
  const [textColor, setTextColor] = useState<string>("#666666");
  const [customText, setCustomText] = useState<string>("");
  const [isAutoFontSize, setIsAutoFontSize] = useState<boolean>(true);
  const [manualFontSize, setManualFontSize] = useState<number>(28);
  const [fontFamily, setFontFamily] = useState<string>("sans-serif");
  const [fontWeight, setFontWeight] = useState<string>("600");
  const [showBorder, setShowBorder] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute active text to show
  const displayText = customText.trim()
    ? customText
        .replace(/\{w\}/gi, String(width))
        .replace(/\{h\}/gi, String(height))
    : `${width} × ${height}`;

  // Calculate font size
  const calculatedFontSize = isAutoFontSize
    ? Math.max(12, Math.min(Math.round(Math.min(width, height) / 8), 120))
    : manualFontSize;

  // Draw on Canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set real canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Optional border / outline
    if (showBorder) {
      ctx.strokeStyle = textColor;
      ctx.lineWidth = Math.max(2, Math.min(width, height) * 0.015);
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(6, 6, width - 12, height - 12);
      ctx.setLineDash([]);
    }

    // Text formatting
    ctx.fillStyle = textColor;
    const fontSpec = `${fontWeight} ${calculatedFontSize}px ${fontFamily}, system-ui, -apple-system, sans-serif`;
    ctx.font = fontSpec;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Support multiline text
    const lines = displayText.split("\n");
    const lineHeight = calculatedFontSize * 1.25;
    const totalHeight = lines.length * lineHeight;
    const startY = height / 2 - totalHeight / 2 + lineHeight / 2;

    lines.forEach((line, index) => {
      ctx.fillText(line, width / 2, startY + index * lineHeight);
    });
  }, [width, height, bgColor, textColor, displayText, calculatedFontSize, fontFamily, fontWeight, showBorder]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Generate SVG Markup
  const generateSvgMarkup = useCallback((): string => {
    const lines = displayText.split("\n");
    const lineHeight = calculatedFontSize * 1.25;
    const startYPercent = lines.length === 1 ? 50 : 50 - ((lines.length - 1) * 1.25 * (calculatedFontSize / height) * 50);

    const textElements = lines
      .map((line, idx) => {
        const dy = idx === 0 ? "0" : `${lineHeight}px`;
        return `<tspan x="50%" dy="${dy}">${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</tspan>`;
      })
      .join("");

    const borderElement = showBorder
      ? `<rect x="6" y="6" width="${width - 12}" height="${height - 12}" fill="none" stroke="${textColor}" stroke-width="2" stroke-dasharray="8 6" />`
      : "";

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  ${borderElement}
  <text x="50%" y="${startYPercent}%" dominant-baseline="middle" text-anchor="middle" font-family="${fontFamily}, system-ui, sans-serif" font-size="${calculatedFontSize}px" font-weight="${fontWeight}" fill="${textColor}">
    ${textElements}
  </text>
</svg>`;
  }, [width, height, bgColor, textColor, displayText, calculatedFontSize, fontFamily, fontWeight, showBorder]);

  // Actions
  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `placeholder-${width}x${height}.png`;
    link.click();
  };

  const handleDownloadSvg = () => {
    const svgMarkup = generateSvgMarkup();
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `placeholder-${width}x${height}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleCopyDataUri = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    copyToClipboard(dataUrl, "dataUri");
  };

  const handleCopySvgDataUri = () => {
    const svgMarkup = generateSvgMarkup();
    const base64Svg = btoa(unescape(encodeURIComponent(svgMarkup)));
    const dataUri = `data:image/svg+xml;base64,${base64Svg}`;
    copyToClipboard(dataUri, "svgDataUri");
  };

  const handleCopySvgCode = () => {
    copyToClipboard(generateSvgMarkup(), "svgCode");
  };

  const handleCopyImgTag = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const tag = `<img src="${dataUrl}" width="${width}" height="${height}" alt="Placeholder ${width}x${height}" />`;
    copyToClipboard(tag, "imgTag");
  };

  const handleSwapColors = () => {
    const temp = bgColor;
    setBgColor(textColor);
    setTextColor(temp);
  };

  const applyPreset = (preset: PresetSize) => {
    setWidth(preset.width);
    setHeight(preset.height);
  };

  return (
    <ToolLayout
      title="Placeholder Image Generator"
      description="Create custom mockups and placeholder images in any dimension, color, and text. Export instantly as PNG, SVG, or Data URI."
    >
      <title>Placeholder Image Generator Online — DevToolbox</title>
      <meta
        name="description"
        content="Free online placeholder image generator. Create custom dummy images with custom dimensions, background colors, text, and download as PNG or SVG."
      />

      <div className="space-y-6">
        {/* Preset Sizes Bar */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Popular Presets
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Click to apply size</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_SIZES.map((preset) => {
              const isSelected = width === preset.width && height === preset.height;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="font-semibold">{preset.name}</span>
                  <span className="ml-1.5 text-[11px] opacity-75 font-mono">
                    {preset.width}×{preset.height}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Controls + Live Canvas Preview */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Controls Column (7 Cols) */}
          <div className="space-y-5 lg:col-span-6">
            {/* Dimensions */}
            <div className="rounded-xl border border-gray-200 bg-white p-4.5 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Dimensions (Pixels)
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor={widthId} className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Width (px)
                  </label>
                  <input
                    id={widthId}
                    type="number"
                    min="10"
                    max="4000"
                    step="1"
                    value={width}
                    onChange={(e) => setWidth(Math.max(10, Math.min(4000, parseInt(e.target.value) || 10)))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900/60 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label htmlFor={heightId} className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Height (px)
                  </label>
                  <input
                    id={heightId}
                    type="number"
                    min="10"
                    max="4000"
                    step="1"
                    value={height}
                    onChange={(e) => setHeight(Math.max(10, Math.min(4000, parseInt(e.target.value) || 10)))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900/60 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Colors & Palette Swatches */}
            <div className="rounded-xl border border-gray-200 bg-white p-4.5 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Colors &amp; Theme
                </h3>
                <button
                  type="button"
                  onClick={handleSwapColors}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400 font-medium cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  Swap Colors
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Background Color */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-9 w-10 cursor-pointer rounded border border-gray-300 bg-transparent p-0.5 dark:border-gray-600"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      maxLength={7}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 font-mono text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900/60 dark:text-gray-100 uppercase"
                    />
                  </div>
                </div>

                {/* Text Color */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Text Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-9 w-10 cursor-pointer rounded border border-gray-300 bg-transparent p-0.5 dark:border-gray-600"
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      maxLength={7}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 font-mono text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900/60 dark:text-gray-100 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Palette swatches */}
              <div>
                <span className="mb-1.5 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Quick Palettes
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PALETTES.map((palette) => (
                    <button
                      key={palette.name}
                      type="button"
                      onClick={() => {
                        setBgColor(palette.bg);
                        setTextColor(palette.text);
                      }}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-1.5 text-[11px] transition-all hover:border-blue-400 hover:shadow-xs dark:border-gray-700"
                      title={palette.name}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600"
                          style={{ backgroundColor: palette.bg }}
                        />
                        <span
                          className="h-3 w-3 rounded-full border border-gray-300 dark:border-gray-600 -ml-2"
                          style={{ backgroundColor: palette.text }}
                        />
                      </div>
                      <span className="truncate text-[10px] text-gray-600 dark:text-gray-300">
                        {palette.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Text & Typography */}
            <div className="rounded-xl border border-gray-200 bg-white p-4.5 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Custom Text &amp; Typography
              </h3>

              <div>
                <label htmlFor={textId} className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Label Text <span className="text-[11px] text-gray-400">(leave blank for W×H, use {"{w}"} and {"{h}"} for dynamic dimensions)</span>
                </label>
                <input
                  id={textId}
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={`${width} × ${height}`}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900/60 dark:text-gray-100"
                />
              </div>

              {/* Font settings */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Font Family
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900/60 dark:text-gray-100"
                  >
                    <option value="sans-serif">Sans-Serif</option>
                    <option value="monospace">Monospace</option>
                    <option value="serif">Serif</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Font Weight
                  </label>
                  <select
                    value={fontWeight}
                    onChange={(e) => setFontWeight(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900/60 dark:text-gray-100"
                  >
                    <option value="400">Normal (400)</option>
                    <option value="600">Semibold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="900">Black (900)</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1 flex items-end pb-1">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showBorder}
                      onChange={(e) => setShowBorder(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span>Dashed Border</span>
                  </label>
                </div>
              </div>

              {/* Font Size Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor={fontSizeId} className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Font Size: <span className="font-semibold text-gray-900 dark:text-gray-100">{calculatedFontSize}px</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAutoFontSize}
                      onChange={(e) => setIsAutoFontSize(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span>Auto calculate</span>
                  </label>
                </div>

                {!isAutoFontSize && (
                  <div className="flex items-center gap-3">
                    <input
                      id={fontSizeId}
                      type="range"
                      min="10"
                      max="140"
                      value={manualFontSize}
                      onChange={(e) => setManualFontSize(parseInt(e.target.value) || 10)}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 dark:bg-gray-700"
                    />
                    <span className="w-8 text-right font-mono text-xs text-gray-700 dark:text-gray-300">
                      {manualFontSize}px
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Canvas Preview & Export Actions Column (6 Cols) */}
          <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Live Canvas Preview
                </h3>
                <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                  {width} × {height} px
                </span>
              </div>

              {/* Responsive Canvas Container with Checkerboard Background */}
              <div className="relative flex min-h-[260px] max-h-[360px] w-full items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px] p-3 dark:border-gray-700 dark:bg-[radial-gradient(#374151_1px,transparent_1px)] shadow-inner">
                <canvas
                  ref={canvasRef}
                  className="max-h-full max-w-full rounded-md shadow-md object-contain transition-transform"
                  style={{
                    aspectRatio: `${width} / ${height}`,
                  }}
                />
              </div>
            </div>

            {/* Export & Download Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PNG
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 active:bg-indigo-800"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download SVG
                </button>
              </div>

              {/* Secondary Copy Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyDataUri}
                  className="cursor-pointer rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
                >
                  {copiedKey === "dataUri" ? "✓ Copied Data URI!" : "Copy PNG Data URI"}
                </button>

                <button
                  type="button"
                  onClick={handleCopySvgDataUri}
                  className="cursor-pointer rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
                >
                  {copiedKey === "svgDataUri" ? "✓ Copied SVG URI!" : "Copy SVG Data URI"}
                </button>

                <button
                  type="button"
                  onClick={handleCopySvgCode}
                  className="cursor-pointer rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
                >
                  {copiedKey === "svgCode" ? "✓ Copied SVG Code!" : "Copy SVG Markup"}
                </button>

                <button
                  type="button"
                  onClick={handleCopyImgTag}
                  className="cursor-pointer rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
                >
                  {copiedKey === "imgTag" ? "✓ Copied HTML Tag!" : "Copy <img> Tag"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Informative Grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 border-t border-gray-200 pt-6 text-xs text-gray-600 dark:border-gray-800 dark:text-gray-400 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700/60 dark:bg-gray-800/40">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Standard Aspect Ratios</h4>
            <p>
              Includes pre-configured dimensions for Open Graph social cards (1200×630), leaderboard ad banners (728×90), and avatars (64×64).
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700/60 dark:bg-gray-800/40">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Crisp Vector SVG &amp; PNG</h4>
            <p>
              Export as scalable XML vector graphics for lightweight mockups or rasterized PNG files for maximum software compatibility.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700/60 dark:bg-gray-800/40">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Client-Side Canvas Rendering</h4>
            <p>
              Zero network requests required. Placeholders render instantly inside your browser canvas with zero server overhead.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
