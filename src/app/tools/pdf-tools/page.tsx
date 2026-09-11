"use client";

import { useState, useRef } from "react";
import ToolLayout from "@/components/ToolLayout";
import { PDFDocument, degrees } from "pdf-lib";

type ActiveTab = "merge" | "split" | "images" | "rotate";

export default function PdfToolsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("merge");

  // Merge state
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  // Split state
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitTotalPages, setSplitTotalPages] = useState<number>(0);
  const [pageRange, setPageRange] = useState<string>("1-2");
  const [isSplitting, setIsSplitting] = useState(false);

  // Images state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isConvertingImages, setIsConvertingImages] = useState(false);

  // Rotate state
  const [rotateFile, setRotateFile] = useState<File | null>(null);
  const [rotateAngle, setRotateAngle] = useState<number>(90);
  const [isRotating, setIsRotating] = useState(false);

  const [statusMessage, setStatusMessage] = useState<string>("");

  const mergeInputRef = useRef<HTMLInputElement>(null);
  const splitInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const rotateInputRef = useRef<HTMLInputElement>(null);

  // Helper download
  const triggerDownload = (bytes: Uint8Array, filename: string) => {
    // Copy to standard Uint8Array to avoid ArrayBuffer detachment issues
    const safeBytes = new Uint8Array(bytes.length);
    safeBytes.set(bytes);
    const blob = new Blob([safeBytes.buffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 1. Merge Handler
  const handleMerge = async () => {
    if (mergeFiles.length < 2) {
      alert("Please upload at least 2 PDF files to merge.");
      return;
    }
    setIsMerging(true);
    setStatusMessage("Merging PDF files offline in browser...");

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of mergeFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      triggerDownload(mergedPdfBytes, "merged-document.pdf");
      setStatusMessage("Merged PDF downloaded successfully!");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Error merging PDFs");
    } finally {
      setIsMerging(false);
    }
  };

  // 2. Split Handler
  const handleSplitLoad = async (file: File) => {
    setSplitFile(file);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const count = pdf.getPageCount();
      setSplitTotalPages(count);
      setPageRange(count > 1 ? `1-${Math.min(count, 3)}` : "1");
    } catch {
      alert("Failed to load PDF structure.");
    }
  };

  const handleSplit = async () => {
    if (!splitFile) return;
    setIsSplitting(true);
    setStatusMessage("Extracting requested pages...");

    try {
      const arrayBuffer = await splitFile.arrayBuffer();
      const srcPdf = await PDFDocument.load(arrayBuffer);
      const total = srcPdf.getPageCount();

      // Parse range string (e.g. "1, 3-5")
      const pagesToExtract = new Set<number>();
      const parts = pageRange.split(",");

      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes("-")) {
          const [startStr, endStr] = trimmed.split("-");
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = Math.max(1, start); i <= Math.min(total, end); i++) {
              pagesToExtract.add(i - 1); // 0-indexed
            }
          }
        } else {
          const p = parseInt(trimmed, 10);
          if (!isNaN(p) && p >= 1 && p <= total) {
            pagesToExtract.add(p - 1);
          }
        }
      }

      if (pagesToExtract.size === 0) {
        throw new Error("No valid page numbers found in specified range.");
      }

      const newPdf = await PDFDocument.create();
      const pageIndices = Array.from(pagesToExtract).sort((a, b) => a - b);
      const copied = await newPdf.copyPages(srcPdf, pageIndices);
      copied.forEach((p) => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();
      triggerDownload(pdfBytes, `${splitFile.name.replace(".pdf", "")}-extracted.pdf`);
      setStatusMessage(`Extracted ${copied.length} pages successfully!`);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Error extracting pages");
    } finally {
      setIsSplitting(false);
    }
  };

  // 3. Images to PDF
  const handleImagesToPdf = async () => {
    if (imageFiles.length === 0) return;
    setIsConvertingImages(true);
    setStatusMessage("Converting images to PDF pages...");

    try {
      const pdfDoc = await PDFDocument.create();

      for (const imgFile of imageFiles) {
        const arrayBuffer = await imgFile.arrayBuffer();
        let embeddedImage;

        if (imgFile.type === "image/png") {
          embeddedImage = await pdfDoc.embedPng(arrayBuffer);
        } else {
          embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
        }

        const { width, height } = embeddedImage;
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width,
          height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      triggerDownload(pdfBytes, "converted-images.pdf");
      setStatusMessage("Images converted to PDF and downloaded!");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Error converting images to PDF");
    } finally {
      setIsConvertingImages(false);
    }
  };

  // 4. Rotate PDF
  const handleRotate = async () => {
    if (!rotateFile) return;
    setIsRotating(true);
    setStatusMessage("Rotating PDF pages...");

    try {
      const arrayBuffer = await rotateFile.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pages = pdf.getPages();

      pages.forEach((page) => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotateAngle) % 360));
      });

      const pdfBytes = await pdf.save();
      triggerDownload(pdfBytes, `${rotateFile.name.replace(".pdf", "")}-rotated.pdf`);
      setStatusMessage("Rotated PDF downloaded successfully!");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Error rotating PDF");
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <ToolLayout
      title="Private In-Browser PDF Toolkit"
      description="Merge, split, extract pages, convert images, or rotate PDFs 100% locally. Your sensitive documents never leave your device."
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1a1a1a] gap-2">
          <button
            onClick={() => {
              setActiveTab("merge");
              setStatusMessage("");
            }}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
              activeTab === "merge"
                ? "border-blue-500 text-blue-400 bg-[#0e1626]"
                : "border-transparent text-[#666] hover:text-gray-300"
            }`}
          >
            Merge PDFs
          </button>
          <button
            onClick={() => {
              setActiveTab("split");
              setStatusMessage("");
            }}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
              activeTab === "split"
                ? "border-blue-500 text-blue-400 bg-[#0e1626]"
                : "border-transparent text-[#666] hover:text-gray-300"
            }`}
          >
            Split / Extract
          </button>
          <button
            onClick={() => {
              setActiveTab("images");
              setStatusMessage("");
            }}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
              activeTab === "images"
                ? "border-blue-500 text-blue-400 bg-[#0e1626]"
                : "border-transparent text-[#666] hover:text-gray-300"
            }`}
          >
            Images to PDF
          </button>
          <button
            onClick={() => {
              setActiveTab("rotate");
              setStatusMessage("");
            }}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
              activeTab === "rotate"
                ? "border-blue-500 text-blue-400 bg-[#0e1626]"
                : "border-transparent text-[#666] hover:text-gray-300"
            }`}
          >
            Rotate Pages
          </button>
        </div>

        {/* Tab 1: Merge */}
        {activeTab === "merge" && (
          <div className="space-y-4">
            <div
              onClick={() => mergeInputRef.current?.click()}
              className="border-2 border-dashed border-[#222] hover:border-blue-600/50 bg-[#080808] p-8 text-center cursor-pointer transition-colors"
            >
              <input
                ref={mergeInputRef}
                type="file"
                multiple
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    setMergeFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                  }
                }}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded border border-[#222] bg-[#111] flex items-center justify-center text-gray-400">
                  📑
                </div>
                <p className="text-sm font-medium text-gray-300">
                  Select 2 or more PDFs to combine
                </p>
                <p className="text-xs text-[#555]">All processing happens locally in your memory</p>
              </div>
            </div>

            {mergeFiles.length > 0 && (
              <div className="border border-[#1a1a1a] bg-[#0c0c0c] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Files to Merge ({mergeFiles.length})
                  </span>
                  <button
                    onClick={() => setMergeFiles([])}
                    className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="divide-y divide-[#181818]">
                  {mergeFiles.map((f, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <span className="text-gray-300 font-mono truncate max-w-sm">
                        {idx + 1}. {f.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[#666]">{(f.size / 1024).toFixed(1)} KB</span>
                        <button
                          onClick={() => setMergeFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-gray-500 hover:text-red-400 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleMerge}
                  disabled={isMerging || mergeFiles.length < 2}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {isMerging ? "Merging..." : "Merge & Download Single PDF"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Split / Extract */}
        {activeTab === "split" && (
          <div className="space-y-4">
            <div
              onClick={() => splitInputRef.current?.click()}
              className="border-2 border-dashed border-[#222] hover:border-blue-600/50 bg-[#080808] p-8 text-center cursor-pointer transition-colors"
            >
              <input
                ref={splitInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleSplitLoad(e.target.files[0]);
                  }
                }}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded border border-[#222] bg-[#111] flex items-center justify-center text-gray-400">
                  ✂️
                </div>
                <p className="text-sm font-medium text-gray-300">
                  Select a PDF file to extract or split
                </p>
                <p className="text-xs text-[#555]">Extract individual pages or custom ranges</p>
              </div>
            </div>

            {splitFile && (
              <div className="border border-[#1a1a1a] bg-[#0c0c0c] p-4 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300 font-medium">{splitFile.name}</span>
                  <span className="text-blue-400 font-mono">{splitTotalPages} total pages</span>
                </div>

                <div>
                  <label className="text-xs text-[#777] block mb-1">
                    Enter page range to extract (e.g. <code className="text-gray-300 font-mono">1, 3-5, 8</code>):
                  </label>
                  <input
                    type="text"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    placeholder="1-3"
                    className="w-full p-2.5 bg-[#050505] border border-[#222] text-sm font-mono text-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleSplit}
                  disabled={isSplitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-sm transition-colors cursor-pointer"
                >
                  {isSplitting ? "Extracting..." : "Extract & Download Pages"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Images to PDF */}
        {activeTab === "images" && (
          <div className="space-y-4">
            <div
              onClick={() => imageInputRef.current?.click()}
              className="border-2 border-dashed border-[#222] hover:border-blue-600/50 bg-[#080808] p-8 text-center cursor-pointer transition-colors"
            >
              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    setImageFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                  }
                }}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded border border-[#222] bg-[#111] flex items-center justify-center text-gray-400">
                  🖼️
                </div>
                <p className="text-sm font-medium text-gray-300">
                  Select JPG or PNG images to bundle into a PDF
                </p>
                <p className="text-xs text-[#555]">Each image will be placed onto its own page</p>
              </div>
            </div>

            {imageFiles.length > 0 && (
              <div className="border border-[#1a1a1a] bg-[#0c0c0c] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-400 uppercase tracking-wider">
                    Images Selected ({imageFiles.length})
                  </span>
                  <button
                    onClick={() => setImageFiles([])}
                    className="text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {imageFiles.map((img, i) => (
                    <div key={i} className="border border-[#1a1a1a] p-2 bg-black text-center text-xs">
                      <span className="text-gray-400 truncate block font-mono">{img.name}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleImagesToPdf}
                  disabled={isConvertingImages}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-sm transition-colors cursor-pointer"
                >
                  {isConvertingImages ? "Converting..." : "Convert All to Single PDF"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Rotate */}
        {activeTab === "rotate" && (
          <div className="space-y-4">
            <div
              onClick={() => rotateInputRef.current?.click()}
              className="border-2 border-dashed border-[#222] hover:border-blue-600/50 bg-[#080808] p-8 text-center cursor-pointer transition-colors"
            >
              <input
                ref={rotateInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setRotateFile(e.target.files[0]);
                  }
                }}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded border border-[#222] bg-[#111] flex items-center justify-center text-gray-400">
                  🔄
                </div>
                <p className="text-sm font-medium text-gray-300">
                  Select a PDF to rotate its orientation
                </p>
                <p className="text-xs text-[#555]">Fix upside-down or sideways scans locally</p>
              </div>
            </div>

            {rotateFile && (
              <div className="border border-[#1a1a1a] bg-[#0c0c0c] p-4 space-y-4">
                <div className="text-xs text-gray-300 font-medium">{rotateFile.name}</div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-[#666]">Rotation:</span>
                  {[90, 180, 270].map((deg) => (
                    <button
                      key={deg}
                      onClick={() => setRotateAngle(deg)}
                      className={`px-3 py-1.5 border transition-colors cursor-pointer ${
                        rotateAngle === deg
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-[#111] border-[#222] text-gray-400"
                      }`}
                    >
                      +{deg}°
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleRotate}
                  disabled={isRotating}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-sm transition-colors cursor-pointer"
                >
                  {isRotating ? "Rotating..." : `Rotate +${rotateAngle}° & Download`}
                </button>
              </div>
            )}
          </div>
        )}

        {statusMessage && (
          <div className="p-3 bg-[#0d1c12] border border-green-900/60 text-green-300 text-xs">
            {statusMessage}
          </div>
        )}

        {/* Security / Privacy Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-[#1a1a1a] text-xs text-[#666]">
          <div className="border border-[#181818] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">Confidential &amp; Safe</h4>
            <p>Financial statements, tax documents, and legal contracts never leave your browser.</p>
          </div>
          <div className="border border-[#181818] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">Zero File Size Limits</h4>
            <p>Process documents of any length without cloud queue times or paywalls.</p>
          </div>
          <div className="border border-[#181818] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">No Sign-up Required</h4>
            <p>Free, instant utility without logins, tracking cookies, or subscriptions.</p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
