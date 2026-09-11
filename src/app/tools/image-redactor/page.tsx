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

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

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

    boxes.forEach(drawSingleBox);

    if (currentBox) {
      drawSingleBox(currentBox);
      const rx = Math.min(currentBox.x, currentBox.x + currentBox.w);
      const ry = Math.min(currentBox.y, currentBox.y + currentBox.h);
      const rw = Math.abs(currentBox.w);
      const rh = Math.abs(currentBox.h);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1.5;
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
      title="Image Redactor"
      description="Apply permanent blackout or pixelated blur regions over confidential details before exporting."
    >
      <title>Redact &amp; Black Out Sensitive Info on Images Online | kattoolbox</title>
      <meta
        name="description"
        content="Free tool to black out or pixelate confidential text, credit cards, names, and faces in images directly in your browser. Files never leave your device."
      />
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode("blackout")}
              className={`px-3 py-1.5 text-xs font-mono border transition-colors cursor-pointer ${
                mode === "blackout"
                  ? "bg-blue-900/60 border-blue-600 text-blue-200"
                  : "bg-[#0c0c0c] border-[#222] text-gray-400 hover:text-gray-200"
              }`}
            >
              Blackout
            </button>
            <button
              onClick={() => setMode("pixelate")}
              className={`px-3 py-1.5 text-xs font-mono border transition-colors cursor-pointer ${
                mode === "pixelate"
                  ? "bg-blue-900/60 border-blue-600 text-blue-200"
                : "bg-[#0c0c0c] border-[#222] text-gray-400 hover:text-gray-200"
              }`}
            >
              Pixelate
            </button>
            <button
              onClick={handleUndo}
              disabled={boxes.length === 0}
              className="px-3 py-1.5 bg-[#0c0c0c] border border-[#222] hover:bg-[#151515] disabled:opacity-40 text-gray-400 text-xs font-mono transition-colors cursor-pointer"
            >
              Undo
            </button>
            <button
              onClick={handleClear}
              disabled={boxes.length === 0}
              className="px-3 py-1.5 bg-[#0c0c0c] border border-[#222] hover:bg-[#151515] disabled:opacity-40 text-red-400 text-xs font-mono transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>

          {file && (
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Download redacted image
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
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-[#444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-xs text-gray-300">
                Select an image to redact
              </p>
              <p className="text-[11px] text-[#555]">Click and drag boxes over confidential fields</p>
            </div>
          </div>
        )}

        {/* Canvas editor */}
        {file && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#666] font-mono">
              <span>{boxes.length} regions redacted</span>
              <button
                onClick={() => {
                  setFile(null);
                  setBoxes([]);
                }}
                className="text-red-400 hover:text-red-300 cursor-pointer"
              >
                Reset Image
              </button>
            </div>

            <div className="border border-[#1a1a1a] bg-[#050505] p-2 flex justify-center overflow-auto max-h-[600px]">
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

        {/* Technical overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-[#1a1a1a] text-xs text-[#555]">
          <div className="border border-[#141414] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">Pixel Overwrite</h4>
            <p>Target pixel values are directly overwritten in canvas memory, preventing layer extraction.</p>
          </div>
          <div className="border border-[#141414] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">Local Processing</h4>
            <p>Redactions are applied strictly in the browser. Zero image data is sent to external servers.</p>
          </div>
          <div className="border border-[#141414] p-3 bg-black">
            <h4 className="text-gray-300 font-medium mb-1">Clean Export</h4>
            <p>Export produces a flattened PNG output without proprietary revision histories.</p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
