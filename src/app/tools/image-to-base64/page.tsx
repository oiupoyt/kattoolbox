"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";

type OutputFormat = "data-uri" | "raw" | "html" | "css";

interface ImageDetails {
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  dataUri: string;
  rawBase64: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function ImageToBase64Page() {
  const [image, setImage] = useState<ImageDetails | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<OutputFormat>("data-uri");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, SVG, WebP, GIF, etc.).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      if (!dataUri) {
        setError("Failed to read image file.");
        return;
      }

      // Extract raw base64 (after comma)
      const commaIndex = dataUri.indexOf(",");
      const rawBase64 = commaIndex !== -1 ? dataUri.substring(commaIndex + 1) : "";

      // Load dimensions
      const img = new Image();
      img.onload = () => {
        setImage({
          name: file.name,
          size: file.size,
          type: file.type || "image/png",
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          dataUri,
          rawBase64,
        });
      };
      img.onerror = () => {
        // Fallback for SVG or unusual images
        setImage({
          name: file.name,
          size: file.size,
          type: file.type || "image/png",
          width: 0,
          height: 0,
          dataUri,
          rawBase64,
        });
      };
      img.src = dataUri;
    };
    reader.onerror = () => {
      setError("An error occurred while reading the file.");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Support paste from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processFile]);

  const copyToClipboard = async (text: string, key: string) => {
    if (!text) return;
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

  const handleClear = () => {
    setImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Sample images
  const loadSampleImage = (type: "badge" | "icon") => {
    setError(null);
    if (type === "badge") {
      // 240x240 canvas badge
      const canvas = document.createElement("canvas");
      canvas.width = 240;
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 240, 240);
        grad.addColorStop(0, "#3B82F6");
        grad.addColorStop(1, "#8B5CF6");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(10, 10, 220, 220, 32);
        ctx.fill();

        // Icon circle
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.beginPath();
        ctx.arc(120, 100, 50, 0, Math.PI * 2);
        ctx.fill();

        // Text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 44px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🚀", 120, 100);

        ctx.font = "bold 20px sans-serif";
        ctx.fillText("DevToolbox", 120, 175);
        ctx.font = "14px sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillText("Fast & Secure", 120, 200);

        const dataUri = canvas.toDataURL("image/png");
        const rawBase64 = dataUri.substring(dataUri.indexOf(",") + 1);
        const approxSize = Math.round((rawBase64.length * 3) / 4);

        setImage({
          name: "sample-badge.png",
          size: approxSize,
          type: "image/png",
          width: 240,
          height: 240,
          dataUri,
          rawBase64,
        });
      }
    } else {
      // SVG Icon
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#10B981"/><stop offset="100%" stop-color="#06B6D4"/></linearGradient></defs><circle cx="50" cy="50" r="45" fill="url(#g)"/><path d="M30 52 L44 66 L72 36" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const file = new File([blob], "sample-check-icon.svg", { type: "image/svg+xml" });
      processFile(file);
    }
  };

  const getOutputText = (format: OutputFormat): string => {
    if (!image) return "";
    switch (format) {
      case "data-uri":
        return image.dataUri;
      case "raw":
        return image.rawBase64;
      case "html":
        return `<img src="${image.dataUri}" alt="${image.name}" width="${image.width || 100}" height="${image.height || 100}" />`;
      case "css":
        return `background-image: url("${image.dataUri}");`;
      default:
        return "";
    }
  };

  // Base64 calculation stats
  const base64CharCount = image ? image.dataUri.length : 0;
  const base64Bytes = base64CharCount; // Base64 string in memory (1 byte per char UTF-8)
  const originalBytes = image ? image.size : 0;
  const sizeDiffBytes = image ? Math.max(0, base64Bytes - originalBytes) : 0;
  const sizeIncreasePercent =
    image && originalBytes > 0
      ? ((sizeDiffBytes / originalBytes) * 100).toFixed(1)
      : "0";

  return (
    <ToolLayout
      title="Image to Base64 Converter"
      description="Convert any PNG, JPG, SVG, WebP, or GIF image into Base64 data URI format with instant preview, CSS, and HTML code snippets."
    >
      <title>Image to Base64 Converter Online — DevToolbox</title>
      <meta
        name="description"
        content="Free client-side Image to Base64 converter. Drag and drop images to generate Data URIs, raw Base64 strings, HTML img tags, and CSS background-image declarations."
      />

      <div className="space-y-6">
        {/* Top Action / Samples Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1a1a1a] pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer items-center gap-1.5  bg-blue-600 px-4 py-2 text-sm font-medium text-white  transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Choose Image File
            </button>

            {image && (
              <button
                type="button"
                onClick={handleClear}
                className="flex cursor-pointer items-center gap-1  bg-[#111] px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-[#1a0a0a] hover:text-red-400"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Image
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-gray-500">Try Sample:</span>
            <button
              type="button"
              onClick={() => loadSampleImage("badge")}
              className="cursor-pointer bg-[#111] px-2.5 py-1 text-gray-400 transition-colors hover:bg-[#1a1a1a]"
            >
              Badge (PNG)
            </button>
            <button
              type="button"
              onClick={() => loadSampleImage("icon")}
              className="cursor-pointer bg-[#111] px-2.5 py-1 text-gray-400 transition-colors hover:bg-[#1a1a1a]"
            >
              Vector Icon (SVG)
            </button>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Error notification */}
        {error && (
          <div className="flex items-start gap-3  border border-red-900 bg-[#1a0a0a] p-4 text-sm text-red-400">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold">Upload Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Drag & Drop Upload Box */}
        {!image ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center  border-2 border-dashed p-10 text-center transition-all ${
              isDragging
                ? "border-blue-500 bg-[#0a0a1a]/60 scale-[1.01]"
                : "border-[#1a1a1a] bg-[#0a0a0a] hover:border-blue-400 hover:bg-black/50"
            }`}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-none bg-[#0a0a1a] text-blue-600 mb-4">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            <p className="text-base font-semibold text-gray-300">
              Drag &amp; drop your image here, or <span className="text-blue-600 underline">browse files</span>
            </p>
            <p className="mt-1.5 text-xs text-gray-500">
              Supports PNG, JPG, JPEG, SVG, WebP, GIF, ICO, AVIF, BMP • Paste directly with Ctrl+V / ⌘V
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
              <span className="inline-block h-2 w-2 rounded-none bg-[#0a1a0a]0"></span>
              <span>100% Client-side processing — No files uploaded to servers</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Image Preview & Details Card */}
            <div className="grid grid-cols-1 gap-6  border border-[#1a1a1a] bg-[#0a0a0a] p-5  lg:grid-cols-12">
              {/* Preview Box */}
              <div className="flex flex-col items-center justify-center lg:col-span-4">
                <div className="relative flex max-h-56 min-h-[160px] w-full items-center justify-center overflow-hidden  border border-[#1a1a1a] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px](#374151_1px,transparent_1px)] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.dataUri}
                    alt={image.name}
                    className="max-h-48 max-w-full object-contain "
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                >
                  Change Image
                </button>
              </div>

              {/* Metadata & Quick Actions */}
              <div className="flex flex-col justify-between space-y-4 lg:col-span-8">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <h3 className="font-semibold text-gray-200 truncate max-w-xs sm:max-w-md" title={image.name}>
                      {image.name}
                    </h3>
                    <span className="rounded-none bg-[#0a0a1a] px-2.5 py-0.5 text-xs font-semibold text-blue-400">
                      {image.type}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className=" bg-black p-2.5 border border-[#1a1a1a]">
                      <span className="block text-[11px] font-medium text-gray-500 uppercase">Dimensions</span>
                      <span className="font-mono text-sm font-semibold text-gray-300">
                        {image.width > 0 ? `${image.width} × ${image.height} px` : "Vector (SVG)"}
                      </span>
                    </div>

                    <div className=" bg-black p-2.5 border border-[#1a1a1a]">
                      <span className="block text-[11px] font-medium text-gray-500 uppercase">Original Size</span>
                      <span className="font-mono text-sm font-semibold text-gray-300">
                        {formatBytes(image.size)}
                      </span>
                    </div>

                    <div className=" bg-black p-2.5 border border-[#1a1a1a]">
                      <span className="block text-[11px] font-medium text-gray-500 uppercase">Base64 Length</span>
                      <span className="font-mono text-sm font-semibold text-gray-300">
                        {image.dataUri.length.toLocaleString()} chars
                      </span>
                    </div>

                    <div className=" bg-black p-2.5 border border-[#1a1a1a]">
                      <span className="block text-[11px] font-medium text-gray-500 uppercase">Base64 Size</span>
                      <span className="font-mono text-sm font-semibold text-gray-300">
                        {formatBytes(base64Bytes)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Size Comparison Bar */}
                <div className=" bg-black p-3 border border-[#1a1a1a]">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium text-gray-400">
                    <span>Size Overhead Comparison</span>
                    <span className="font-mono text-amber-600">
                      +{sizeIncreasePercent}% (+{formatBytes(sizeDiffBytes)})
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-none bg-[#1a1a1a] flex">
                    <div
                      className="bg-blue-600 h-full"
                      style={{ width: `${Math.min(100, (originalBytes / base64Bytes) * 100)}%` }}
                      title={`Original File: ${formatBytes(originalBytes)}`}
                    />
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${Math.max(0, 100 - (originalBytes / base64Bytes) * 100)}%` }}
                      title={`Base64 Encoding Overhead: +${formatBytes(sizeDiffBytes)}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1.5">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-none bg-blue-600 inline-block"></span>
                      Original ({formatBytes(originalBytes)})
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-none bg-amber-500 inline-block"></span>
                      Base64 Overhead (~33% ASCII expansion)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Output Options & Formats */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Tabs */}
                <div className="inline-flex  border border-[#1a1a1a] bg-[#111] p-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("data-uri")}
                    className={`cursor-pointer  px-3 py-1.5 text-xs font-semibold transition-colors ${
                      activeTab === "data-uri"
                        ? "bg-[#0a0a0a] text-blue-600 "
                        : "text-gray-600 hover:text-gray-200"
                    }`}
                  >
                    Data URI
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("raw")}
                    className={`cursor-pointer  px-3 py-1.5 text-xs font-semibold transition-colors ${
                      activeTab === "raw"
                        ? "bg-[#0a0a0a] text-blue-600 "
                        : "text-gray-600 hover:text-gray-200"
                    }`}
                  >
                    Raw Base64
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("html")}
                    className={`cursor-pointer  px-3 py-1.5 text-xs font-semibold transition-colors ${
                      activeTab === "html"
                        ? "bg-[#0a0a0a] text-blue-600 "
                        : "text-gray-600 hover:text-gray-200"
                    }`}
                  >
                    HTML &lt;img&gt;
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("css")}
                    className={`cursor-pointer  px-3 py-1.5 text-xs font-semibold transition-colors ${
                      activeTab === "css"
                        ? "bg-[#0a0a0a] text-blue-600 "
                        : "text-gray-600 hover:text-gray-200"
                    }`}
                  >
                    CSS Background
                  </button>
                </div>

                {/* Primary Action for Current Tab */}
                <button
                  type="button"
                  onClick={() => copyToClipboard(getOutputText(activeTab), `active-${activeTab}`)}
                  className="flex cursor-pointer items-center gap-1.5  bg-blue-600 px-4 py-2 text-sm font-medium text-white  transition-colors hover:bg-blue-700 active:bg-blue-800"
                >
                  {copiedKey === `active-${activeTab}` ? (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied Active Format!
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy {activeTab === "data-uri" ? "Data URI" : activeTab === "raw" ? "Raw Base64" : activeTab === "html" ? "HTML Snippet" : "CSS Snippet"}
                    </>
                  )}
                </button>
              </div>

              {/* Textarea Output */}
              <div className="relative">
                <textarea
                  readOnly
                  rows={8}
                  value={getOutputText(activeTab)}
                  placeholder="Base64 output will appear here..."
                  className="w-full  border border-[#1a1a1a] bg-[#0a0a0a] p-3.5 font-mono text-xs text-gray-200 shadow-inner focus:outline-none leading-relaxed select-all"
                />
              </div>

              {/* Quick Copy Cards for All 4 Formats */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2">
                {/* 1. Data URI */}
                <div className="flex flex-col justify-between  border border-[#1a1a1a] bg-[#0a0a0a] p-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-300">Full Data URI</span>
                      <span className="text-[10px] text-gray-400">data:image/...</span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500 line-clamp-2 font-mono">
                      {image.dataUri}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(image.dataUri, "quick-data-uri")}
                    className="mt-2.5 w-full cursor-pointer bg-[#111] py-1.5 text-xs font-medium text-gray-400 hover:bg-[#1a1a1a] transition-colors flex items-center justify-center gap-1"
                  >
                    {copiedKey === "quick-data-uri" ? "✓ Copied!" : "Copy Data URI"}
                  </button>
                </div>

                {/* 2. Raw Base64 */}
                <div className="flex flex-col justify-between  border border-[#1a1a1a] bg-[#0a0a0a] p-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-300">Raw Base64</span>
                      <span className="text-[10px] text-gray-400">No header</span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500 line-clamp-2 font-mono">
                      {image.rawBase64}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(image.rawBase64, "quick-raw")}
                    className="mt-2.5 w-full cursor-pointer bg-[#111] py-1.5 text-xs font-medium text-gray-400 hover:bg-[#1a1a1a] transition-colors flex items-center justify-center gap-1"
                  >
                    {copiedKey === "quick-raw" ? "✓ Copied!" : "Copy Raw Base64"}
                  </button>
                </div>

                {/* 3. HTML <img> */}
                <div className="flex flex-col justify-between  border border-[#1a1a1a] bg-[#0a0a0a] p-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-300">HTML &lt;img&gt;</span>
                      <span className="text-[10px] text-gray-400">&lt;img src=...&gt;</span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500 line-clamp-2 font-mono">
                      {`<img src="${image.dataUri}" alt="${image.name}" />`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `<img src="${image.dataUri}" alt="${image.name}" width="${image.width || 100}" height="${image.height || 100}" />`,
                        "quick-html"
                      )
                    }
                    className="mt-2.5 w-full cursor-pointer bg-[#111] py-1.5 text-xs font-medium text-gray-400 hover:bg-[#1a1a1a] transition-colors flex items-center justify-center gap-1"
                  >
                    {copiedKey === "quick-html" ? "✓ Copied!" : "Copy HTML Tag"}
                  </button>
                </div>

                {/* 4. CSS background-image */}
                <div className="flex flex-col justify-between  border border-[#1a1a1a] bg-[#0a0a0a] p-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-300">CSS Background</span>
                      <span className="text-[10px] text-gray-400">background-image</span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500 line-clamp-2 font-mono">
                      {`background-image: url("${image.dataUri}");`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(`background-image: url("${image.dataUri}");`, "quick-css")
                    }
                    className="mt-2.5 w-full cursor-pointer bg-[#111] py-1.5 text-xs font-medium text-gray-400 hover:bg-[#1a1a1a] transition-colors flex items-center justify-center gap-1"
                  >
                    {copiedKey === "quick-css" ? "✓ Copied!" : "Copy CSS"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informational Cards */}
        <div className="mt-8 grid grid-cols-1 gap-4 border-t border-[#1a1a1a] pt-6 text-xs text-gray-600 md:grid-cols-3">
          <div className=" border border-[#1a1a1a] bg-black/50 p-4">
            <h4 className="font-semibold text-gray-300 mb-1">When to Use Base64 Images</h4>
            <p>
              Ideal for embedding small icons (&lt;10KB), logos in standalone HTML/emails, offline web apps, and preventing render-blocking HTTP requests.
            </p>
          </div>
          <div className=" border border-[#1a1a1a] bg-black/50 p-4">
            <h4 className="font-semibold text-gray-300 mb-1">Understanding the ~33% Overhead</h4>
            <p>
              Base64 encodes every 3 binary bytes into 4 ASCII characters (a 33.3% size expansion). For large photographs, standard image hosting with CDN caching is recommended.
            </p>
          </div>
          <div className=" border border-[#1a1a1a] bg-black/50 p-4">
            <h4 className="font-semibold text-gray-300 mb-1">Private &amp; In-Browser Execution</h4>
            <p>
              Your graphics never touch an external server or API. All binary-to-string transformation executes natively via HTML5 FileReader in your browser.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
