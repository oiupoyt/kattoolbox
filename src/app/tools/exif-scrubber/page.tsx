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
  const [exifData, setExifData] = useState<Record<string, unknown> | null>(null);
  const [gpsData, setGpsData] = useState<GPSData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubbedUrl, setScrubbedUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selected: File) => {
    if (!selected.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    setFile(selected);
    setScrubbedUrl(null);
    setStatusMessage("");
    setIsAnalyzing(true);

    try {
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
    setStatusMessage("Removing metadata headers...");

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

      const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const blob: Blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b || new Blob()), outputType, 0.95);
      });

      URL.revokeObjectURL(objectUrl);

      const cleanUrl = URL.createObjectURL(blob);
      setScrubbedUrl(cleanUrl);
      setStatusMessage("All EXIF tags and GPS data stripped.");
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
      title="EXIF & GPS Scrubber"
      description="Inspect embedded camera parameters, device identifiers, and location tags. Strip metadata client-side before sharing."
    >
      <title>Remove EXIF &amp; GPS Location from Photos Online | kattoolbox</title>
      <meta
        name="description"
        content="Free tool to view hidden photo metadata and remove GPS location coordinates, camera serials, and device identifiers offline in your browser."
      />

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-xs text-gray-300">
              Drag and drop an image to inspect, or <span className="text-blue-400">browse</span>
            </p>
            <p className="text-[11px] text-[#555]">Extracts GPS, camera model, lens parameters, and timestamps</p>
          </div>
        </div>

        {isAnalyzing && (
          <div className="flex items-center gap-3 p-3 bg-[#0c121e] border border-blue-900/60 text-blue-300 text-xs">
            <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span>Inspecting metadata headers...</span>
          </div>
        )}

        {/* GPS alert banner */}
        {gpsData && (
          <div className="border border-red-900/60 bg-[#160a0a] p-4 text-xs space-y-1.5">
            <div className="font-medium text-red-300">
              Embedded GPS Coordinates Detected
            </div>
            <p className="text-red-400/80 leading-relaxed">
              This file contains geographic coordinates identifying where the photo was taken.
            </p>
            <div className="flex flex-wrap items-center gap-4 font-mono pt-1 text-red-200 text-[11px]">
              <span>Latitude: {gpsData.latitude.toFixed(6)}</span>
              <span>Longitude: {gpsData.longitude.toFixed(6)}</span>
              <a
                href={`https://www.google.com/maps?q=${gpsData.latitude},${gpsData.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Google Maps
              </a>
              <a
                href={`https://www.openstreetmap.org/?mlat=${gpsData.latitude}&mlon=${gpsData.longitude}#map=16/${gpsData.latitude}/${gpsData.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                OpenStreetMap
              </a>
            </div>
          </div>
        )}

        {/* File Actions */}
        {file && !isAnalyzing && (
          <div className="flex flex-wrap items-center justify-between gap-4 border border-[#1a1a1a] bg-[#090909] p-4">
            <div>
              <span className="text-[11px] font-mono text-[#555] uppercase block">Loaded File</span>
              <span className="text-xs font-medium text-gray-200">{file.name}</span>
              <span className="text-[11px] text-[#555] block">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!scrubbedUrl ? (
                <button
                  onClick={scrubMetadata}
                  disabled={isScrubbing}
                  className="px-4 py-2 bg-red-900/80 hover:bg-red-800 disabled:opacity-50 text-red-100 text-xs font-medium transition-colors cursor-pointer"
                >
                  Strip Metadata
                </button>
              ) : (
                <button
                  onClick={downloadCleanFile}
                  className="px-4 py-2 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 text-xs font-medium transition-colors cursor-pointer"
                >
                  Download sanitized image
                </button>
              )}
            </div>
          </div>
        )}

        {statusMessage && (
          <div className="p-3 bg-[#0a140f] border border-emerald-950 text-emerald-400 text-xs">
            {statusMessage}
          </div>
        )}

        {/* Metadata Table */}
        {file && !isAnalyzing && (
          <div className="border border-[#1a1a1a] bg-[#080808]">
            <div className="px-4 py-2 border-b border-[#181818] flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#666]">
                Metadata Tags ({exifData ? Object.keys(exifData).length : 0})
              </span>
            </div>

            {exifData && Object.keys(exifData).length > 0 ? (
              <div className="max-h-72 overflow-y-auto divide-y divide-[#121212]">
                {Object.entries(exifData).map(([key, value]) => {
                  const displayValue =
                    typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value);
                  return (
                    <div key={key} className="grid grid-cols-3 px-4 py-1.5 text-xs font-mono hover:bg-[#0c0c0c]">
                      <span className="text-[#666] truncate pr-2">{key}</span>
                      <span className="col-span-2 text-gray-300 break-all">{displayValue}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#555]">
                No EXIF metadata tags detected in this file.
              </div>
            )}
          </div>
        )}

        {/* Explanatory notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-[#1a1a1a] text-xs text-[#555]">
          <div className="border border-[#141414] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">Geotagging Removal</h4>
            <p>Smartphones and digital cameras store GPS coordinates in EXIF headers. Stripping purges this data.</p>
          </div>
          <div className="border border-[#141414] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">Hardware Fingerprints</h4>
            <p>Removes device serial numbers, lens specifications, and software version identifiers.</p>
          </div>
          <div className="border border-[#141414] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">Local Rasterization</h4>
            <p>Images are re-encoded locally via HTML5 canvas, ensuring stripped headers are physically unrecoverable.</p>
          </div>
        </div>

        {/* SEO FAQ section */}
        <section className="mt-8 pt-6 border-t border-[#1a1a1a] space-y-4 text-xs text-[#666]">
          <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400">
            Frequently Asked Questions
          </h3>
          <div className="space-y-3">
            <div>
              <h4 className="text-gray-300 font-medium mb-0.5">What is EXIF metadata?</h4>
              <p className="leading-relaxed">EXIF (Exchangeable Image File Format) is data embedded directly inside JPEG, PNG, and TIFF images. It includes camera model, shutter speed, focal length, date and time, and frequently GPS coordinates.</p>
            </div>
            <div>
              <h4 className="text-gray-300 font-medium mb-0.5">Why should I remove GPS data before sharing photos?</h4>
              <p className="leading-relaxed">Photos taken on iPhones or Android devices embed exact latitude and longitude coordinates. Sharing raw photos on forums or social channels can expose your home, school, or workplace address.</p>
            </div>
          </div>
        </section>
      </div>
    </ToolLayout>
  );
}
