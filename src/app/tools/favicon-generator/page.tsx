/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import JSZip from "jszip";

interface IconSize {
  name: string;
  filename: string;
  size: number;
  purpose: string;
}

const ICON_SPECS: IconSize[] = [
  { name: "Favicon 16x16", filename: "favicon-16x16.png", size: 16, purpose: "Browser tabs" },
  { name: "Favicon 32x32", filename: "favicon-32x32.png", size: 32, purpose: "Taskbar / bookmarks" },
  { name: "Favicon 48x48", filename: "favicon-48x48.png", size: 48, purpose: "Desktop shortcut" },
  { name: "Apple Touch Icon", filename: "apple-touch-icon.png", size: 180, purpose: "iOS home screen" },
  { name: "Android Chrome 192", filename: "android-chrome-192x192.png", size: 192, purpose: "PWA icon" },
  { name: "Android Chrome 512", filename: "android-chrome-512x512.png", size: 512, purpose: "PWA splash screen" },
];

function getHtmlTags(title: string) {
  return `<!-- Favicon & App Icons -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="apple-mobile-web-app-title" content="${title || "App"}">
<meta name="theme-color" content="#ffffff">`;
}

function createIcoFromPngs(pngBuffers: { size: number; buffer: ArrayBuffer }[]): Blob {
  const numImages = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dataOffset = headerSize + dirEntrySize * numImages;

  const totalBytes = dataOffset + pngBuffers.reduce((acc, p) => acc + p.buffer.byteLength, 0);
  const out = new Uint8Array(totalBytes);
  const view = new DataView(out.buffer);

  // ICO Header
  view.setUint16(0, 0, true); // Reserved
  view.setUint16(2, 1, true); // Type 1 = ICO
  view.setUint16(4, numImages, true);

  let currentOffset = dataOffset;
  for (let i = 0; i < numImages; i++) {
    const item = pngBuffers[i];
    const entryPos = headerSize + i * dirEntrySize;
    const w = item.size >= 256 ? 0 : item.size;
    const h = item.size >= 256 ? 0 : item.size;

    out[entryPos] = w;
    out[entryPos + 1] = h;
    out[entryPos + 2] = 0; // Colors (0 = no palette)
    out[entryPos + 3] = 0; // Reserved
    view.setUint16(entryPos + 4, 1, true); // Color planes
    view.setUint16(entryPos + 6, 32, true); // Bits per pixel
    view.setUint32(entryPos + 8, item.buffer.byteLength, true); // Image data size
    view.setUint32(entryPos + 12, currentOffset, true); // Offset

    out.set(new Uint8Array(item.buffer), currentOffset);
    currentOffset += item.buffer.byteLength;
  }

  return new Blob([out], { type: "image/x-icon" });
}

export default function FaviconGeneratorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [appName, setAppName] = useState("My App");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIcons, setGeneratedIcons] = useState<{ filename: string; url: string; size: number }[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateIcons = useCallback(
    async (sourceFile: File, name: string) => {
      setIsGenerating(true);
      setStatusMessage("Generating icon packages...");

      try {
        const img = new Image();
        const objUrl = URL.createObjectURL(sourceFile);
        img.src = objUrl;

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Unable to load source image"));
        });

        const zip = new JSZip();
        const iconsList: { filename: string; url: string; size: number }[] = [];
        const icoInputs: { size: number; buffer: ArrayBuffer }[] = [];

        // Generate each PNG size
        for (const spec of ICON_SPECS) {
          const canvas = document.createElement("canvas");
          canvas.width = spec.size;
          canvas.height = spec.size;
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // Center crop to square
          const minSide = Math.min(img.naturalWidth, img.naturalHeight);
          const sx = (img.naturalWidth - minSide) / 2;
          const sy = (img.naturalHeight - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, spec.size, spec.size);

          const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
          if (!blob) continue;

          const buffer = await blob.arrayBuffer();
          zip.file(spec.filename, buffer);

          const url = URL.createObjectURL(blob);
          iconsList.push({ filename: spec.filename, url, size: spec.size });

          if ([16, 32, 48].includes(spec.size)) {
            icoInputs.push({ size: spec.size, buffer });
          }
        }

        // Generate favicon.ico
        if (icoInputs.length > 0) {
          const icoBlob = createIcoFromPngs(icoInputs);
          const icoBuffer = await icoBlob.arrayBuffer();
          zip.file("favicon.ico", icoBuffer);
          const icoUrl = URL.createObjectURL(icoBlob);
          iconsList.unshift({ filename: "favicon.ico", url: icoUrl, size: 32 });
        }

        // Generate site.webmanifest
        const webManifest = {
          name: name || "App",
          short_name: name || "App",
          icons: [
            { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
          ],
          theme_color: "#ffffff",
          background_color: "#ffffff",
          display: "standalone",
        };
        zip.file("site.webmanifest", JSON.stringify(webManifest, null, 2));

        // Generate README with HTML snippet
        const htmlSnippet = getHtmlTags(name);
        zip.file("head-tags.html", htmlSnippet);

        const packagedZip = await zip.generateAsync({ type: "blob" });
        setZipBlob(packagedZip);
        setGeneratedIcons(iconsList);
        setStatusMessage("Package ready for download");
        URL.revokeObjectURL(objUrl);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Generation failed";
        setStatusMessage(msg);
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith("image/")) {
      setStatusMessage("Please upload a valid image file");
      return;
    }
    setFile(selected);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
    generateIcons(selected, appName);
  };

  const handleDownloadZip = () => {
    if (!zipBlob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipBlob);
    link.download = "favicons.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(getHtmlTags(appName));
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  return (
    <ToolLayout
      title="Favicon & App Icon Generator"
      description="Convert any square logo or image into standard favicon.ico, Apple touch icons, Android PWA manifests, and HTML tags bundled into a ZIP."
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
            {file ? file.name : "Drop master image or logo here"}
          </p>
          <p className="mt-1 text-xs text-[#666]">
            Upload an image of at least 512x512 px for best quality.
          </p>
        </div>

        {/* Configurations */}
        <div className="border border-[#181818] bg-[#0c0c0c] p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-xs font-mono text-[#666] uppercase whitespace-nowrap">App Name:</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => {
                setAppName(e.target.value);
                if (file) generateIcons(file, e.target.value);
              }}
              className="px-3 py-1.5 bg-[#141414] border border-[#222] text-xs text-gray-200 focus:outline-none focus:border-blue-500 w-full sm:w-64"
              placeholder="e.g. My Company"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#555]">{statusMessage}</span>
            {zipBlob && (
              <button
                onClick={handleDownloadZip}
                disabled={isGenerating}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
              >
                Download Favicons (ZIP)
              </button>
            )}
          </div>
        </div>

        {/* Results Display */}
        {generatedIcons.length > 0 && (
          <div className="space-y-6">
            {/* Grid of Generated Icons */}
            <div className="border border-[#181818] bg-[#0a0a0a] p-6">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#666] mb-4">
                Generated Assets ({generatedIcons.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {generatedIcons.map((icon) => (
                  <div key={icon.filename} className="border border-[#161616] bg-[#0e0e0e] p-3 text-center flex flex-col items-center justify-between">
                    <div className="h-16 flex items-center justify-center mb-2">
                      <img
                        src={icon.url}
                        alt={icon.filename}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          width: Math.min(icon.size, 48),
                          height: Math.min(icon.size, 48),
                        }}
                      />
                    </div>
                    <div className="w-full">
                      <p className="text-[11px] font-mono text-gray-300 truncate">{icon.filename}</p>
                      <p className="text-[10px] font-mono text-[#555]">{icon.size}x{icon.size}</p>
                      <a
                        href={icon.url}
                        download={icon.filename}
                        className="mt-2 block text-[10px] text-blue-400 hover:underline"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HTML Code Snippet */}
            <div className="border border-[#181818] bg-[#0a0a0a] p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#666]">
                  HTML Head Tags
                </h3>
                <button
                  onClick={handleCopyHtml}
                  className="px-3 py-1 bg-[#141414] hover:bg-[#1f1f1f] border border-[#262626] text-xs text-gray-300 transition-colors"
                >
                  {copiedHtml ? "Copied" : "Copy Tags"}
                </button>
              </div>
              <pre className="p-4 bg-[#050505] border border-[#141414] font-mono text-xs text-gray-300 overflow-x-auto leading-relaxed">
                {getHtmlTags(appName)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
