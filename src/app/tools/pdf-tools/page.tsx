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

  const triggerDownload = (bytes: Uint8Array, filename: string) => {
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

  // 1. Merge
  const handleMerge = async () => {
    if (mergeFiles.length < 2) {
      alert("Select at least 2 PDF files to merge.");
      return;
    }
    setIsMerging(true);
    setStatusMessage("Merging PDF files...");

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
      setStatusMessage("Merged PDF downloaded.");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Error merging PDFs");
    } finally {
      setIsMerging(false);
    }
  };

  // 2. Split
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
    setStatusMessage("Extracting pages...");

    try {
      const arrayBuffer = await splitFile.arrayBuffer();
      const srcPdf = await PDFDocument.load(arrayBuffer);
      const total = srcPdf.getPageCount();

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
              pagesToExtract.add(i - 1);
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
      setStatusMessage(`Extracted ${copied.length} pages.`);
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
    setStatusMessage("Converting images to PDF...");

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
      setStatusMessage("Converted PDF downloaded.");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Error converting images to PDF");
    } finally {
      setIsConvertingImages(false);
    }
  };

  // 4. Rotate
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
      setStatusMessage("Rotated PDF downloaded.");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Error rotating PDF");
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <ToolLayout
      title="PDF Toolkit"
      description="Merge, extract pages, convert images, or rotate PDF documents. Operations execute locally via WebAssembly."
    >
      <title>Merge, Split &amp; Extract PDF Pages Online — Private &amp; Offline | kattoolbox</title>
      <meta
        name="description"
        content="Free offline PDF tools. Merge multiple PDF documents, extract page ranges, convert images to PDF, or rotate pages 100% locally in your browser without uploading files."
      />
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1a1a1a] gap-1">
          {(["merge", "split", "images", "rotate"] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setStatusMessage("");
              }}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
                activeTab === tab
                  ? "border-blue-500 text-blue-400 bg-[#0d121c]"
                  : "border-transparent text-[#666] hover:text-gray-300"
              }`}
            >
              {tab === "merge" && "Merge"}
              {tab === "split" && "Split / Extract"}
              {tab === "images" && "Images to PDF"}
              {tab === "rotate" && "Rotate"}
            </button>
          ))}
        </div>

        {/* Tab 1: Merge */}
        {activeTab === "merge" && (
          <div className="space-y-4">
            <div
              onClick={() => mergeInputRef.current?.click()}
              className="border border-dashed border-[#222] hover:border-[#3a3a3a] bg-[#070707] p-8 text-center cursor-pointer transition-colors"
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
                <svg className="w-8 h-8 text-[#444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-xs text-gray-300">
                  Select 2 or more PDF files to merge
                </p>
                <p className="text-[11px] text-[#555]">Merged in browser memory without server upload</p>
              </div>
            </div>

            {mergeFiles.length > 0 && (
              <div className="border border-[#1a1a1a] bg-[#090909] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#666]">
                    Queued Files ({mergeFiles.length})
                  </span>
                  <button
                    onClick={() => setMergeFiles([])}
                    className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>

                <div className="divide-y divide-[#141414]">
                  {mergeFiles.map((f, idx) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-300 truncate max-w-sm">
                        {idx + 1}. {f.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[#555]">{(f.size / 1024).toFixed(1)} KB</span>
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
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  {isMerging ? "Merging..." : "Merge and download PDF"}
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
              className="border border-dashed border-[#222] hover:border-[#3a3a3a] bg-[#070707] p-8 text-center cursor-pointer transition-colors"
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
                <svg className="w-8 h-8 text-[#444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                <p className="text-xs text-gray-300">
                  Select a PDF file to extract pages
                </p>
                <p className="text-[11px] text-[#555]">Extract single pages or ranges</p>
              </div>
            </div>

            {splitFile && (
              <div className="border border-[#1a1a1a] bg-[#090909] p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300 font-medium">{splitFile.name}</span>
                  <span className="text-blue-400 font-mono">{splitTotalPages} pages</span>
                </div>

                <div>
                  <label className="text-[11px] text-[#666] block mb-1">
                    Page range (e.g. <code className="text-gray-300 font-mono">1, 3-5</code>):
                  </label>
                  <input
                    type="text"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    placeholder="1-3"
                    className="w-full p-2 bg-[#050505] border border-[#222] text-xs font-mono text-gray-200 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  onClick={handleSplit}
                  disabled={isSplitting}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  {isSplitting ? "Extracting..." : "Extract pages"}
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
              className="border border-dashed border-[#222] hover:border-[#3a3a3a] bg-[#070707] p-8 text-center cursor-pointer transition-colors"
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
                <svg className="w-8 h-8 text-[#444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs text-gray-300">
                  Select JPG or PNG images to compile into a PDF
                </p>
                <p className="text-[11px] text-[#555]">Each image creates one PDF page</p>
              </div>
            </div>

            {imageFiles.length > 0 && (
              <div className="border border-[#1a1a1a] bg-[#090909] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#666] uppercase">
                    Images ({imageFiles.length})
                  </span>
                  <button
                    onClick={() => setImageFiles([])}
                    className="text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {imageFiles.map((img, i) => (
                    <div key={i} className="border border-[#181818] p-2 bg-black text-center text-[11px]">
                      <span className="text-gray-400 truncate block font-mono">{img.name}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleImagesToPdf}
                  disabled={isConvertingImages}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  {isConvertingImages ? "Converting..." : "Convert images to PDF"}
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
              className="border border-dashed border-[#222] hover:border-[#3a3a3a] bg-[#070707] p-8 text-center cursor-pointer transition-colors"
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
                <svg className="w-8 h-8 text-[#444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <p className="text-xs text-gray-300">
                  Select a PDF to rotate
                </p>
                <p className="text-[11px] text-[#555]">Adjust page orientation in 90-degree steps</p>
              </div>
            </div>

            {rotateFile && (
              <div className="border border-[#1a1a1a] bg-[#090909] p-4 space-y-3">
                <div className="text-xs text-gray-300 font-medium">{rotateFile.name}</div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#666] font-mono">Rotation:</span>
                  {[90, 180, 270].map((deg) => (
                    <button
                      key={deg}
                      onClick={() => setRotateAngle(deg)}
                      className={`px-2.5 py-1 font-mono border transition-colors cursor-pointer ${
                        rotateAngle === deg
                          ? "bg-blue-900/60 border-blue-600 text-blue-200"
                          : "bg-[#0c0c0c] border-[#222] text-gray-400"
                      }`}
                    >
                      +{deg}°
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleRotate}
                  disabled={isRotating}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  {isRotating ? "Rotating..." : `Rotate +${rotateAngle}° and download`}
                </button>
              </div>
            )}
          </div>
        )}

        {statusMessage && (
          <div className="p-3 bg-[#0a140f] border border-emerald-950 text-emerald-400 text-xs">
            {statusMessage}
          </div>
        )}

        {/* Notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-[#1a1a1a] text-xs text-[#555]">
          <div className="border border-[#141414] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">Local Processing</h4>
            <p>Documents are parsed using pdf-lib inside browser memory without network requests.</p>
          </div>
          <div className="border border-[#141414] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">No File Constraints</h4>
            <p>Operates without arbitrary page caps or upload queue restrictions.</p>
          </div>
          <div className="border border-[#141414] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">Zero Accounts</h4>
            <p>Stateless architecture requires no login, telemetry, or storage.</p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
