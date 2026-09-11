"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";

interface RedactBox {
  x: number;
  y: number;
  w: number;
  h: number;
  style: "blackout" | "pixelate";
}

export default function ImageRedactorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [boxes, setBoxes] = useState<RedactBox[]>([]);
  const [mode, setMode] = useState<"blackout" | "pixelate">("blackout");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<RedactBox | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw base image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Helper to draw box
    const drawSingleBox = (box: RedactBox) => {
      const rx = Math.min(box.x, box.x + box.w);
      const ry = Math.min(box.y, box.y + box.h);
      const rw = Math.abs(box.w);
      const rh = Math.abs(box.h);

      if (rw === 0 || rh === 0) return;

      if (box.style === "blackout") {
        ctx.fillStyle = "#000000";
        ctx.fillRect(rx, ry, rw, rh);
      } else {
        // Pixelate
        try {
          const pixelSize = Math.max(8, Math.round(rw / 10));
          const subW = Math.max(1, Math.round(rw / pixelSize));
          const subH = Math.max(1, Math.round(rh / pixelSize));

          const offCanvas = document.createElement("canvas");
          offCanvas.width = subW;
          offCanvas.height = subH;
          const offCtx = offCanvas.getContext("2d");
          if (offCtx) {
            offCtx.drawImage(canvas, rx, ry, rw, rh, 0, 0, subW, subH);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(offCanvas, 0, 0, subW, subH, rx, ry, rw, rh);
            ctx.imageSmoothingEnabled = true;
          }
        } catch {
          ctx.fillStyle = "#111111";
          ctx.fillRect(rx, ry, rw, rh);
        }
      }
    };

    // Draw committed boxes
    boxes.forEach(drawSingleBox);

    // Draw preview box while dragging
    if (currentBox) {
      drawSingleBox(currentBox);
      // Border outline for visibility
      const rx = Math.min(currentBox.x, currentBox.x + currentBox.w);
      const ry = Math.min(currentBox.y, currentBox.y + currentBox.h);
      const rw = Math.abs(currentBox.w);
      const rh = Math.abs(currentBox.h);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ry, rw, rh);
    }
  }, [boxes, currentBox]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }
    setFile(selected);
    setBoxes([]);
    setCurrentBox(null);

    const img = new Image();
    const url = URL.createObjectURL(selected);
    img.src = url;
    img.onload = () => {
      imageObjRef.current = img;
      if (canvasRef.current) {
        canvasRef.current.width = img.naturalWidth;
        canvasRef.current.height = img.naturalHeight;
      }
      renderCanvas();
      URL.revokeObjectURL(url);
    };
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageObjRef.current) return;
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(coords);
    setCurrentBox({
      x: coords.x,
      y: coords.y,
      w: 0,
      h: 0,
      style: mode,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;
    const coords = getCanvasCoords(e);
    setCurrentBox({
      x: startPos.x,
      y: startPos.y,
      w: coords.x - startPos.x,
      h: coords.y - startPos.y,
      style: mode,
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentBox) return;
    setIsDrawing(false);
    if (Math.abs(currentBox.w) > 5 && Math.abs(currentBox.h) > 5) {
      setBoxes((prev) => [...prev, currentBox]);
    }
    setCurrentBox(null);
    setStartPos(null);
  };

  const handleUndo = () => {
    setBoxes((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setBoxes([]);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !file) return;
    const cleanUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = cleanUrl;
    const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
    a.download = `${baseName}-redacted.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <ToolLayout
      title="Private Document &amp; Image Redactor"
      description="Draw solid blackout or pixelate boxes over sensitive names, credit card numbers, faces, and addresses before sharing. 100% offline."
    >
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode("blackout")}
              className={`px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                mode === "blackout"
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-[#111] border-[#222] text-gray-400 hover:text-gray-200"
              }`}
            >
              ⬛ Blackout Box
            </button>
            <button
              onClick={() => setMode("pixelate")}
              className={`px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                mode === "pixelate"
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-[#111] border-[#222] text-gray-400 hover:text-gray-200"
              }`}
            >
              🏁 Pixelate Blur
            </button>
            <button
              onClick={handleUndo}
              disabled={boxes.length === 0}
              className="px-3 py-1.5 bg-[#111] border border-[#222] hover:bg-[#1a1a1a] disabled:opacity-40 text-gray-300 text-xs font-medium transition-colors cursor-pointer"
            >
              ↩ Undo
            </button>
            <button
              onClick={handleClear}
              disabled={boxes.length === 0}
              className="px-3 py-1.5 bg-[#111] border border-[#222] hover:bg-[#1a1a1a] disabled:opacity-40 text-red-400 text-xs font-medium transition-colors cursor-pointer"
            >
              Clear All
            </button>
          </div>

          {file && (
            <button
              onClick={handleDownload}
              className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Download Redacted Image</span>
            </button>
          )}
        </div>

        {/* Upload Box */}
        {!file && (
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
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded border border-[#222] bg-[#111] flex items-center justify-center text-gray-400">
                🔒
              </div>
              <p className="text-sm font-medium text-gray-300">
                Upload image to redact (screenshots, IDs, receipts, documents)
              </p>
              <p className="text-xs text-[#555]">Click and drag boxes to cover confidential sections</p>
            </div>
          </div>
        )}

        {/* Interactive Redaction Canvas */}
        {file && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#777]">
              <span>
                Draw boxes over sensitive areas ({boxes.length} redactions applied)
              </span>
              <button
                onClick={() => {
                  setFile(null);
                  setBoxes([]);
                }}
                className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
              >
                Change Image
              </button>
            </div>

            <div className="border border-[#1a1a1a] bg-[#050505] p-2 flex justify-center overflow-auto max-h-[650px]">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="cursor-crosshair max-w-full h-auto object-contain border border-[#181818]"
              />
            </div>
          </div>
        )}

        {/* Security & Use Case Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-[#1a1a1a] text-xs text-[#666]">
          <div className="border border-[#181818] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">Permanent Blackout</h4>
            <p>Pixels are physically overwritten on the raw image canvas, making recovery impossible.</p>
          </div>
          <div className="border border-[#181818] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">Safe Sharing</h4>
            <p>Ideal for redacting government IDs, social security numbers, banking details, or names.</p>
          </div>
          <div className="border border-[#181818] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">100% Offline</h4>
            <p>Runs entirely inside your browser memory. No files are transmitted to any server.</p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
