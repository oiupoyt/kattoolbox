"use client";

import React, { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";

interface ShadowPreset {
  name: string;
  horizontal: number;
  vertical: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  inset: boolean;
}

const PRESETS: ShadowPreset[] = [
  {
    name: "Default Soft",
    horizontal: 5,
    vertical: 5,
    blur: 10,
    spread: 0,
    color: "#000000",
    opacity: 0.3,
    inset: false,
  },
  {
    name: "Subtle Card",
    horizontal: 0,
    vertical: 4,
    blur: 6,
    spread: -1,
    color: "#000000",
    opacity: 0.1,
    inset: false,
  },
  {
    name: "Floating Depth",
    horizontal: 0,
    vertical: 20,
    blur: 25,
    spread: -5,
    color: "#000000",
    opacity: 0.15,
    inset: false,
  },
  {
    name: "Hard Brutalism",
    horizontal: 6,
    vertical: 6,
    blur: 0,
    spread: 0,
    color: "#000000",
    opacity: 1,
    inset: false,
  },
  {
    name: "Blue Glow",
    horizontal: 0,
    vertical: 0,
    blur: 25,
    spread: 5,
    color: "#3b82f6",
    opacity: 0.5,
    inset: false,
  },
  {
    name: "Purple Halo",
    horizontal: 0,
    vertical: 12,
    blur: 30,
    spread: 2,
    color: "#8b5cf6",
    opacity: 0.35,
    inset: false,
  },
  {
    name: "Inset Well",
    horizontal: 0,
    vertical: 4,
    blur: 8,
    spread: 0,
    color: "#000000",
    opacity: 0.25,
    inset: true,
  },
  {
    name: "Emerald Light",
    horizontal: 0,
    vertical: 8,
    blur: 20,
    spread: -2,
    color: "#10b981",
    opacity: 0.4,
    inset: false,
  },
];

// Helper to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num) || cleanHex.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export default function BoxShadowGeneratorPage() {
  // Shadow state variables
  const [horizontal, setHorizontal] = useState<number>(5);
  const [vertical, setVertical] = useState<number>(5);
  const [blur, setBlur] = useState<number>(10);
  const [spread, setSpread] = useState<number>(0);
  const [color, setColor] = useState<string>("#000000");
  const [opacity, setOpacity] = useState<number>(0.3);
  const [inset, setInset] = useState<boolean>(false);

  // Box & Preview customization
  const [boxColor, setBoxColor] = useState<string>("#ffffff");
  const [borderRadius, setBorderRadius] = useState<number>(16);
  const [previewBg, setPreviewBg] = useState<"light" | "dark" | "checker">("light");
  const [includeVendorPrefixes, setIncludeVendorPrefixes] = useState<boolean>(false);
  const [codeFormat, setCodeFormat] = useState<"standard" | "full" | "tailwind">("standard");

  const [copied, setCopied] = useState<boolean>(false);

  // Computed RGBA string
  const rgbaColor = useMemo(() => {
    const { r, g, b } = hexToRgb(color);
    const roundedOpacity = Math.round(opacity * 100) / 100;
    return `rgba(${r}, ${g}, ${b}, ${roundedOpacity})`;
  }, [color, opacity]);

  // Computed box-shadow value
  const shadowValue = useMemo(() => {
    const insetText = inset ? "inset " : "";
    return `${insetText}${horizontal}px ${vertical}px ${blur}px ${spread}px ${rgbaColor}`;
  }, [inset, horizontal, vertical, blur, spread, rgbaColor]);

  // Generated CSS Code
  const generatedCode = useMemo(() => {
    if (codeFormat === "tailwind") {
      const tailwindArbitrary = shadowValue.replace(/\s+/g, "_");
      return `className="shadow-[${tailwindArbitrary}]"`;
    }

    let code = "";
    if (includeVendorPrefixes) {
      code += `-webkit-box-shadow: ${shadowValue};\n`;
      code += `-moz-box-shadow: ${shadowValue};\n`;
    }
    code += `box-shadow: ${shadowValue};`;

    if (codeFormat === "full") {
      return `.my-custom-box {\n  background-color: ${boxColor};\n  border-radius: ${borderRadius}px;\n  ${code.split("\n").join("\n  ")}\n}`;
    }

    return code;
  }, [shadowValue, includeVendorPrefixes, codeFormat, boxColor, borderRadius]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = generatedCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const applyPreset = (preset: ShadowPreset) => {
    setHorizontal(preset.horizontal);
    setVertical(preset.vertical);
    setBlur(preset.blur);
    setSpread(preset.spread);
    setColor(preset.color);
    setOpacity(preset.opacity);
    setInset(preset.inset);
  };

  const resetDefaults = () => {
    setHorizontal(5);
    setVertical(5);
    setBlur(10);
    setSpread(0);
    setColor("#000000");
    setOpacity(0.3);
    setInset(false);
    setBoxColor("#ffffff");
    setBorderRadius(16);
  };

  return (
    <ToolLayout
      title="CSS Box Shadow Generator"
      description="Design and preview CSS box shadows visually with real-time sliders for offset, blur, spread, opacity, and inset effects."
    >
      <div className="space-y-8">
        {/* Live Preview Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Live Preview
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 hidden sm:inline">
                Background:
              </span>
              <div className="flex items-center gap-1 bg-[#111] p-0.5  text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewBg("light")}
                  className={`px-2.5 py-1  transition-colors ${
                    previewBg === "light"
                      ? "bg-[#0a0a0a] text-gray-200 font-medium shadow-xs"
                      : "text-gray-600 hover:text-gray-200"
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg("dark")}
                  className={`px-2.5 py-1  transition-colors ${
                    previewBg === "dark"
                      ? "bg-[#0a0a0a] text-gray-200 font-medium shadow-xs"
                      : "text-gray-600 hover:text-gray-200"
                  }`}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg("checker")}
                  className={`px-2.5 py-1  transition-colors ${
                    previewBg === "checker"
                      ? "bg-[#0a0a0a] text-gray-200 font-medium shadow-xs"
                      : "text-gray-600 hover:text-gray-200"
                  }`}
                >
                  Pattern
                </button>
              </div>
            </div>
          </div>

          <div
            className={`relative w-full h-72 sm:h-80  border border-[#1a1a1a] flex items-center justify-center p-6 overflow-hidden transition-all ${
              previewBg === "light"
                ? "bg-[#111]"
                : previewBg === "dark"
                ? "bg-gray-950"
                : "bg-[radial-gradient(#cbd5e1_1px,transparent_1px)](#334155_1px,transparent_1px)] [background-size:16px_16px] bg-[#111]"
            }`}
          >
            {/* The Shadow Card */}
            <div
              className="w-52 h-44 sm:w-64 sm:h-52 flex flex-col items-center justify-center p-6 text-center transition-all duration-150 select-none"
              style={{
                backgroundColor: boxColor,
                borderRadius: `${borderRadius}px`,
                boxShadow: shadowValue,
              }}
            >
              <div className="w-10 h-10 rounded-none bg-[#0a0a1a] flex items-center justify-center text-blue-600 mb-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-200">
                Shadow Preview
              </h3>
              <p className="text-[11px] font-mono text-gray-500 mt-1">
                {horizontal}px {vertical}px {blur}px {spread}px
              </p>
            </div>
          </div>
        </div>

        {/* Presets Gallery */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Quick Presets
            </h2>
            <button
              type="button"
              onClick={resetDefaults}
              className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
            >
              Reset to Default
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
            {PRESETS.map((preset) => {
              const { r, g, b } = hexToRgb(preset.color);
              const pRgba = `rgba(${r}, ${g}, ${b}, ${preset.opacity})`;
              const pShadow = `${preset.inset ? "inset " : ""}${preset.horizontal}px ${preset.vertical}px ${preset.blur}px ${preset.spread}px ${pRgba}`;

              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="group flex flex-col items-center justify-center p-3  border border-[#1a1a1a] bg-[#0a0a0a] hover:border-blue-500 transition-all hover:scale-[1.03]"
                >
                  <div
                    className="w-10 h-8  bg-[#0a0a0a] border border-gray-100 transition-all mb-2"
                    style={{ boxShadow: pShadow }}
                  />
                  <span className="text-[11px] font-medium text-gray-400 text-center w-full truncate">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Shadow Control Sliders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls Column 1: Dimensions & Geometry */}
          <div className="space-y-5 p-5  border border-[#1a1a1a] bg-black/50">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
              Shadow Geometry
            </h3>

            {/* Horizontal Offset */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-400">
                  Horizontal Offset (X)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="-50"
                    max="50"
                    value={horizontal}
                    onChange={(e) => setHorizontal(Number(e.target.value))}
                    className="w-16 px-1.5 py-0.5 text-xs font-mono text-right  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500 font-mono">px</span>
                </div>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={horizontal}
                onChange={(e) => setHorizontal(Number(e.target.value))}
                className="w-full h-2 bg-[#1a1a1a]  appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>-50px</span>
                <span>0px</span>
                <span>50px</span>
              </div>
            </div>

            {/* Vertical Offset */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-400">
                  Vertical Offset (Y)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="-50"
                    max="50"
                    value={vertical}
                    onChange={(e) => setVertical(Number(e.target.value))}
                    className="w-16 px-1.5 py-0.5 text-xs font-mono text-right  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500 font-mono">px</span>
                </div>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={vertical}
                onChange={(e) => setVertical(Number(e.target.value))}
                className="w-full h-2 bg-[#1a1a1a]  appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>-50px</span>
                <span>0px</span>
                <span>50px</span>
              </div>
            </div>

            {/* Blur Radius */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-400">
                  Blur Radius
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={blur}
                    onChange={(e) => setBlur(Math.max(0, Number(e.target.value)))}
                    className="w-16 px-1.5 py-0.5 text-xs font-mono text-right  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500 font-mono">px</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={blur}
                onChange={(e) => setBlur(Number(e.target.value))}
                className="w-full h-2 bg-[#1a1a1a]  appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>0px</span>
                <span>50px</span>
                <span>100px</span>
              </div>
            </div>

            {/* Spread Radius */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-400">
                  Spread Radius
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="-50"
                    max="50"
                    value={spread}
                    onChange={(e) => setSpread(Number(e.target.value))}
                    className="w-16 px-1.5 py-0.5 text-xs font-mono text-right  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500 font-mono">px</span>
                </div>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={spread}
                onChange={(e) => setSpread(Number(e.target.value))}
                className="w-full h-2 bg-[#1a1a1a]  appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>-50px</span>
                <span>0px</span>
                <span>50px</span>
              </div>
            </div>
          </div>

          {/* Controls Column 2: Color, Opacity & Box Appearance */}
          <div className="space-y-5 p-5  border border-[#1a1a1a] bg-black/50">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
              Shadow Color & Box Styling
            </h3>

            {/* Shadow Color & Inset Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">
                  Shadow Color
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-shrink-0 w-9 h-9  border border-[#1a1a1a] overflow-hidden shadow-inner cursor-pointer">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer border-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 focus:ring-1 focus:ring-blue-900 focus:outline-none uppercase"
                  />
                </div>
              </div>

              {/* Inset Toggle Checkbox */}
              <div className="flex flex-col justify-center space-y-1.5 pt-1">
                <label className="text-xs font-medium text-gray-400">
                  Shadow Type
                </label>
                <label className="flex items-center gap-2.5 p-2  border border-[#1a1a1a] bg-[#0a0a0a] cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={inset}
                    onChange={(e) => setInset(e.target.checked)}
                    className="w-4 h-4 border-[#1a1a1a] text-blue-600 focus:ring-blue-900"
                  />
                  <span className="text-xs font-medium text-gray-300">
                    Inset Shadow (Inner)
                  </span>
                </label>
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-400">
                  Shadow Opacity
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={opacity}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(1, Number(e.target.value)));
                      setOpacity(isNaN(val) ? 0 : val);
                    }}
                    className="w-16 px-1.5 py-0.5 text-xs font-mono text-right  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500 font-mono">
                    ({Math.round(opacity * 100)}%)
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full h-2 bg-[#1a1a1a]  appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>0 (Transparent)</span>
                <span>0.5</span>
                <span>1.0 (Opaque)</span>
              </div>
            </div>

            {/* Box Appearance: Box Background & Border Radius */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#1a1a1a]">
              {/* Box Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400">
                  Box Background Color
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-shrink-0 w-8 h-8  border border-[#1a1a1a] overflow-hidden shadow-inner cursor-pointer">
                    <input
                      type="color"
                      value={boxColor}
                      onChange={(e) => setBoxColor(e.target.value)}
                      className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={boxColor}
                    onChange={(e) => setBoxColor(e.target.value)}
                    className="w-full px-2 py-1 text-xs font-mono  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 focus:ring-1 focus:ring-blue-900 focus:outline-none uppercase"
                  />
                </div>
              </div>

              {/* Border Radius */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-gray-400">
                    Border Radius
                  </label>
                  <span className="text-xs font-mono text-gray-500">
                    {borderRadius}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(Number(e.target.value))}
                  className="w-full h-2 bg-[#1a1a1a]  appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Generated CSS Code Block */}
        <div className="space-y-3 pt-4 border-t border-[#1a1a1a]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Generated CSS
              </h2>
              <div className="flex items-center gap-1 bg-[#111] p-0.5  text-xs">
                <button
                  type="button"
                  onClick={() => setCodeFormat("standard")}
                  className={`px-2.5 py-1  transition-colors ${
                    codeFormat === "standard"
                      ? "bg-[#0a0a0a] text-gray-200 font-medium shadow-xs"
                      : "text-gray-600 hover:text-gray-200"
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => setCodeFormat("full")}
                  className={`px-2.5 py-1  transition-colors ${
                    codeFormat === "full"
                      ? "bg-[#0a0a0a] text-gray-200 font-medium shadow-xs"
                      : "text-gray-600 hover:text-gray-200"
                  }`}
                >
                  Full CSS Class
                </button>
                <button
                  type="button"
                  onClick={() => setCodeFormat("tailwind")}
                  className={`px-2.5 py-1  transition-colors ${
                    codeFormat === "tailwind"
                      ? "bg-[#0a0a0a] text-gray-200 font-medium shadow-xs"
                      : "text-gray-600 hover:text-gray-200"
                  }`}
                >
                  Tailwind
                </button>
              </div>

              {codeFormat !== "tailwind" && (
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer ml-2">
                  <input
                    type="checkbox"
                    checked={includeVendorPrefixes}
                    onChange={(e) => setIncludeVendorPrefixes(e.target.checked)}
                    className="rounded border-[#1a1a1a] text-blue-600 focus:ring-blue-900"
                  />
                  Vendor prefixes (-webkit, -moz)
                </label>
              )}
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white  font-medium text-sm transition-colors  cursor-pointer"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                  Copy CSS
                </>
              )}
            </button>
          </div>

          <div className="relative group">
            <pre className="w-full p-4  border border-[#1a1a1a] bg-gray-900 text-gray-100 font-mono text-sm overflow-x-auto leading-relaxed ">
              <code>{generatedCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
