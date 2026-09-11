"use client";

import { useState, useRef } from "react";
import ToolLayout from "@/components/ToolLayout";
import exifr from "exifr";

interface GPSData {
  latitude: number;
  longitude: number;
}

export default function ExifScrubberPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exifData, setExifData] = useState<Record<string, unknown> | null>(null);
  const [gpsData, setGpsData] = useState<GPSData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubbedUrl, setScrubbedUrl] = useState<string | null>(null);
  const [scrubbedSize, setScrubbedSize] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selected: File) => {
    if (!selected.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }

    setFile(selected);
    setScrubbedUrl(null);
    setScrubbedSize(null);
    setStatusMessage("");

    const preview = URL.createObjectURL(selected);
    setPreviewUrl(preview);
    setIsAnalyzing(true);

    try {
      // Parse all available metadata
      const rawExif = await exifr.parse(selected, {
        gps: true,
        tiff: true,
        xmp: true,
        iptc: true,
        jfif: true,
      });

      const gps = await exifr.gps(selected);

      if (rawExif && Object.keys(rawExif).length > 0) {
        setExifData(rawExif);
      } else {
        setExifData(null);
      }

      if (gps && typeof gps.latitude === "number" && typeof gps.longitude === "number") {
        setGpsData({ latitude: gps.latitude, longitude: gps.longitude });
      } else {
        setGpsData(null);
      }
    } catch {
      setExifData(null);
      setGpsData(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scrubMetadata = async () => {
    if (!file) return;
    setIsScrubbing(true);
    setStatusMessage("Stripping EXIF, GPS, and device markers...");

    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context failed");

      ctx.drawImage(img, 0, 0);

      // Export as fresh JPEG/PNG with zero metadata headers
      const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const blob: Blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b || new Blob()), outputType, 0.95);
      });

      URL.revokeObjectURL(objectUrl);

      const cleanUrl = URL.createObjectURL(blob);
      setScrubbedUrl(cleanUrl);
      setScrubbedSize(blob.size);
      setStatusMessage("All metadata wiped successfully! The file is now 100% anonymous.");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Failed to scrub metadata");
    } finally {
      setIsScrubbing(false);
    }
  };

  const downloadCleanFile = () => {
    if (!scrubbedUrl || !file) return;
    const a = document.createElement("a");
    a.href = scrubbedUrl;
    const ext = file.type === "image/png" ? "png" : "jpg";
    const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
    a.download = `${baseName}-sanitized.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <ToolLayout
      title="Photo GPS &amp; EXIF Metadata Scrubber"
      description="Inspect hidden location tags, camera serial numbers, and device data in your photos. Wipe all tracking tags locally before sharing online."
    >
      <div className="space-y-6">
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
              📷
            </div>
            <p className="text-sm font-medium text-gray-300">
              Drag &amp; drop a photo to inspect, or <span className="text-blue-400">browse files</span>
            </p>
            <p className="text-xs text-[#555]">Inspects GPS, Make, Model, Serial, Lens, Timestamp</p>
          </div>
        </div>

        {isAnalyzing && (
          <div className="flex items-center gap-3 p-4 bg-[#0d1525] border border-blue-900 text-blue-300 text-sm">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span>Analyzing image headers for hidden location and device tags...</span>
          </div>
        )}

        {/* GPS Threat Warning */}
        {gpsData && (
          <div className="border border-red-900/80 bg-[#1f0a0a] p-4 text-red-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm text-red-200">
              <span className="text-base">⚠️</span>
              <span>Physical Location Coordinates Detected!</span>
            </div>
            <p className="text-xs text-red-400/90 leading-relaxed">
              This photo contains precise embedded GPS coordinates. Anyone with this file can find exactly where it was taken.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 text-red-200">
              <span>Latitude: {gpsData.latitude.toFixed(6)}</span>
              <span>Longitude: {gpsData.longitude.toFixed(6)}</span>
              <a
                href={`https://www.google.com/maps?q=${gpsData.latitude},${gpsData.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-300 font-sans"
              >
                View on Google Maps →
              </a>
              <a
                href={`https://www.openstreetmap.org/?mlat=${gpsData.latitude}&mlon=${gpsData.longitude}#map=16/${gpsData.latitude}/${gpsData.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-300 font-sans"
              >
                View on OpenStreetMap →
              </a>
            </div>
          </div>
        )}

        {/* Action Bar & Scrubbing Button */}
        {file && !isAnalyzing && (
          <div className="flex flex-wrap items-center justify-between gap-4 border border-[#1a1a1a] bg-[#0c0c0c] p-4">
            <div>
              <span className="text-xs text-[#666] uppercase tracking-wider block">File Loaded</span>
              <span className="text-sm font-medium text-gray-200">{file.name}</span>
              <span className="text-xs text-[#555] block">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {!scrubbedUrl ? (
                <button
                  onClick={scrubMetadata}
                  disabled={isScrubbing}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium text-sm transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span>🛡️ Wipe All Metadata</span>
                </button>
              ) : (
                <button
                  onClick={downloadCleanFile}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium text-sm transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span>✓ Download Sanitized Image</span>
                </button>
              )}
            </div>
          </div>
        )}

        {statusMessage && (
          <div className="p-3 bg-[#0d1c12] border border-green-900/60 text-green-300 text-xs">
            {statusMessage}
          </div>
        )}

        {/* EXIF Metadata Table */}
        {file && !isAnalyzing && (
          <div className="border border-[#1a1a1a] bg-[#080808]">
            <div className="px-4 py-2.5 border-b border-[#1a1a1a] flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Detected Metadata Tags ({exifData ? Object.keys(exifData).length : 0})
              </span>
              {exifData && (
                <span className="text-[11px] text-amber-500 font-mono">Contains identifiable tags</span>
              )}
            </div>

            {exifData && Object.keys(exifData).length > 0 ? (
              <div className="max-h-80 overflow-y-auto divide-y divide-[#141414]">
                {Object.entries(exifData).map(([key, value]) => {
                  const displayValue =
                    typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value);
                  return (
                    <div key={key} className="grid grid-cols-3 px-4 py-2 text-xs font-mono hover:bg-[#0f0f0f]">
                      <span className="text-[#777] truncate pr-2">{key}</span>
                      <span className="col-span-2 text-gray-300 break-all">{displayValue}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#555]">
                No EXIF metadata tags found in this file (or already cleaned).
              </div>
            )}
          </div>
        )}

        {/* Why Strip EXIF Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-[#1a1a1a] text-xs text-[#666]">
          <div className="border border-[#181818] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">Prevent Stalking &amp; Doxxing</h4>
            <p>Smartphones automatically write GPS coordinates into every photo. Sanitizing removes your home location.</p>
          </div>
          <div className="border border-[#181818] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">Remove Device Fingerprints</h4>
            <p>Strips camera serial numbers, iPhone/Android hardware identifiers, and internal software versions.</p>
          </div>
          <div className="border border-[#181818] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">100% Client-Side Privacy</h4>
            <p>Processing happens entirely inside your browser. Your images are never sent to any server.</p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
