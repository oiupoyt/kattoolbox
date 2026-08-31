"use client";

import { useState, useCallback, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";

// Helper: clamp number
function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

// Convert RGB to HEX (6-digit)
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert RGBA to HEX8 (8-digit)
function rgbaToHex8(r: number, g: number, b: number, a: number): string {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0").toUpperCase();
  const alphaHex = clamp(Math.round(a * 255), 0, 255).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`;
}

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rNorm = clamp(r, 0, 255) / 255;
  const gNorm = clamp(g, 0, 255) / 255;
  const bNorm = clamp(b, 0, 255) / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const d = max - min;
  const l = (max + min) / 2;

  if (d === 0) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;

  if (max === rNorm) {
    h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
  } else if (max === gNorm) {
    h = (bNorm - rNorm) / d + 2;
  } else {
    h = (rNorm - gNorm) / d + 4;
  }

  h = Math.round(h * 60) % 360;
  return {
    h: h < 0 ? h + 360 : h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hNorm = ((h % 360) + 360) % 360 / 360;
  const sNorm = clamp(s, 0, 100) / 100;
  const lNorm = clamp(l, 0, 100) / 100;

  if (sNorm === 0) {
    const val = Math.round(lNorm * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tAdj = t;
    if (tAdj < 0) tAdj += 1;
    if (tAdj > 1) tAdj -= 1;
    if (tAdj < 1 / 6) return p + (q - p) * 6 * tAdj;
    if (tAdj < 1 / 2) return q;
    if (tAdj < 2 / 3) return p + (q - p) * (2 / 3 - tAdj) * 6;
    return p;
  };

  const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
  const p = 2 * lNorm - q;

  const r = Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, hNorm) * 255);
  const b = Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255);

  return { r, g, b };
}

// Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rNorm = clamp(r, 0, 255) / 255;
  const gNorm = clamp(g, 0, 255) / 255;
  const bNorm = clamp(b, 0, 255) / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const d = max - min;
  const v = max;

  if (max === 0) {
    return { h: 0, s: 0, v: 0 };
  }

  const s = d / max;
  let h = 0;

  if (d !== 0) {
    if (max === rNorm) {
      h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / d + 2;
    } else {
      h = (rNorm - gNorm) / d + 4;
    }
    h = Math.round(h * 60) % 360;
  }

  return {
    h: h < 0 ? h + 360 : h,
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

// Convert RGB to CMYK
function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  const rNorm = clamp(r, 0, 255) / 255;
  const gNorm = clamp(g, 0, 255) / 255;
  const bNorm = clamp(b, 0, 255) / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const k = 1 - max;

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = Math.round(((1 - rNorm - k) / (1 - k)) * 100);
  const m = Math.round(((1 - gNorm - k) / (1 - k)) * 100);
  const y = Math.round(((1 - bNorm - k) / (1 - k)) * 100);

  return {
    c: clamp(c, 0, 100),
    m: clamp(m, 0, 100),
    y: clamp(y, 0, 100),
    k: Math.round(k * 100),
  };
}

// Relative Luminance for WCAG
function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Contrast ratio
function getContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Parse various HEX formats (#RGB, #RGBA, #RRGGBB, #RRGGBBAA, and without #)
function parseHex(input: string): { r: number; g: number; b: number; a: number } | null {
  let cleaned = input.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) return null;

  if (cleaned.length === 3) {
    // RGB -> RRGGBB
    cleaned = cleaned
      .split("")
      .map((c) => c + c)
      .join("");
  } else if (cleaned.length === 4) {
    // RGBA -> RRGGBBAA
    cleaned = cleaned
      .split("")
      .map((c) => c + c)
      .join("");
  }

  if (cleaned.length === 6) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return { r, g, b, a: 1 };
  } else if (cleaned.length === 8) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    const a = Math.round((parseInt(cleaned.slice(6, 8), 16) / 255) * 100) / 100;
    return { r, g, b, a };
  }

  return null;
}

// Parse RGB / RGBA strings like "rgb(255, 87, 51)", "255, 87, 51", "rgba(255, 87, 51, 0.8)"
function parseRgbString(input: string): { r: number; g: number; b: number; a: number } | null {
  const match = input
    .trim()
    .match(/^(?:rgba?\(?\s*)?(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(?:[\s,/]+([\d.]+))?\s*\)?$/i);
  if (!match) return null;

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  const a = match[4] !== undefined ? parseFloat(match[4]) : 1;

  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || isNaN(a) || a < 0 || a > 1) {
    return null;
  }

  return { r, g, b, a };
}

// Parse HSL / HSLA strings like "hsl(11, 100%, 60%)", "11, 100, 60", "hsla(11, 100%, 60%, 0.8)"
function parseHslString(input: string): { h: number; s: number; l: number; a: number } | null {
  const match = input
    .trim()
    .match(
      /^(?:hsla?\(?\s*)?(\d{1,3}(?:\.\d+)?(?:deg)?|\d+(?:\.\d+)?)[\s,]+(\d{1,3}(?:\.\d+)?%?)[\s,]+(\d{1,3}(?:\.\d+)?%?)(?:[\s,/]+([\d.]+))?\s*\)?$/i
    );
  if (!match) return null;

  const h = parseFloat(match[1]);
  const s = parseFloat(match[2]);
  const l = parseFloat(match[3]);
  const a = match[4] !== undefined ? parseFloat(match[4]) : 1;

  if (isNaN(h) || isNaN(s) || isNaN(l) || s < 0 || s > 100 || l < 0 || l > 100 || isNaN(a) || a < 0 || a > 1) {
    return null;
  }

  return { h: ((Math.round(h) % 360) + 360) % 360, s: Math.round(s), l: Math.round(l), a };
}

const PRESET_PALETTES = [
  { name: "Coral Red", hex: "#FF5733" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Ocean Blue", hex: "#0284C7" },
  { name: "Royal Purple", hex: "#8B5CF6" },
  { name: "Amber Gold", hex: "#F59E0B" },
  { name: "Rose Pink", hex: "#F43F5E" },
  { name: "Cyan Teal", hex: "#06B6D4" },
  { name: "Dark Slate", hex: "#1E293B" },
];

export default function ColorConverterPage() {
  // Master color representation: RGB + Alpha
  const [color, setColor] = useState({ r: 255, g: 87, b: 51, a: 1 });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Editable input text state
  const [hexInput, setHexInput] = useState("#FF5733");
  const [rgbInput, setRgbInput] = useState("rgb(255, 87, 51)");
  const [hslInput, setHslInput] = useState("hsl(11, 100%, 60%)");
  const [rgbaInput, setRgbaInput] = useState("rgba(255, 87, 51, 1)");

  // Validation error states
  const [inputErrors, setInputErrors] = useState<{ [key: string]: string | null }>({});

  // Sync inputs from RGB+A
  const updateAllFromRgba = useCallback((r: number, g: number, b: number, a: number) => {
    setColor({ r, g, b, a });
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    const alphaFormatted = Number(a.toFixed(2));

    setHexInput(a < 1 ? rgbaToHex8(r, g, b, a) : hex);
    setRgbInput(`rgb(${r}, ${g}, ${b})`);
    setHslInput(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
    setRgbaInput(`rgba(${r}, ${g}, ${b}, ${alphaFormatted})`);
    setInputErrors({});
  }, []);

  // Handle HEX text input change
  const handleHexChange = (value: string) => {
    setHexInput(value);
    const parsed = parseHex(value);
    if (parsed) {
      setColor(parsed);
      const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
      setRgbInput(`rgb(${parsed.r}, ${parsed.g}, ${parsed.b})`);
      setHslInput(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
      setRgbaInput(`rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${Number(parsed.a.toFixed(2))})`);
      setInputErrors((prev) => ({ ...prev, hex: null }));
    } else {
      setInputErrors((prev) => ({ ...prev, hex: "Invalid HEX color format (e.g. #FF5733)" }));
    }
  };

  // Handle RGB text input change
  const handleRgbChange = (value: string) => {
    setRgbInput(value);
    const parsed = parseRgbString(value);
    if (parsed) {
      setColor((prev) => ({ ...parsed, a: prev.a }));
      const hex = rgbToHex(parsed.r, parsed.g, parsed.b);
      const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
      setHexInput(color.a < 1 ? rgbaToHex8(parsed.r, parsed.g, parsed.b, color.a) : hex);
      setHslInput(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
      setRgbaInput(`rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${Number(color.a.toFixed(2))})`);
      setInputErrors((prev) => ({ ...prev, rgb: null }));
    } else {
      setInputErrors((prev) => ({ ...prev, rgb: "Invalid RGB format (e.g. 255, 87, 51 or rgb(255, 87, 51))" }));
    }
  };

  // Handle HSL text input change
  const handleHslChange = (value: string) => {
    setHslInput(value);
    const parsed = parseHslString(value);
    if (parsed) {
      const rgb = hslToRgb(parsed.h, parsed.s, parsed.l);
      setColor((prev) => ({ ...rgb, a: prev.a }));
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      setHexInput(color.a < 1 ? rgbaToHex8(rgb.r, rgb.g, rgb.b, color.a) : hex);
      setRgbInput(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
      setRgbaInput(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Number(color.a.toFixed(2))})`);
      setInputErrors((prev) => ({ ...prev, hsl: null }));
    } else {
      setInputErrors((prev) => ({ ...prev, hsl: "Invalid HSL format (e.g. 11, 100%, 60% or hsl(11, 100%, 60%))" }));
    }
  };

  // Handle RGBA text input change
  const handleRgbaChange = (value: string) => {
    setRgbaInput(value);
    const parsed = parseRgbString(value);
    if (parsed) {
      setColor(parsed);
      const hex = rgbToHex(parsed.r, parsed.g, parsed.b);
      const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
      setHexInput(parsed.a < 1 ? rgbaToHex8(parsed.r, parsed.g, parsed.b, parsed.a) : hex);
      setRgbInput(`rgb(${parsed.r}, ${parsed.g}, ${parsed.b})`);
      setHslInput(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
      setInputErrors((prev) => ({ ...prev, rgba: null }));
    } else {
      setInputErrors((prev) => ({ ...prev, rgba: "Invalid RGBA format (e.g. rgba(255, 87, 51, 0.8))" }));
    }
  };

  // Handle Native Color Picker (<input type="color">)
  const handleColorPickerChange = (hexValue: string) => {
    const parsed = parseHex(hexValue);
    if (parsed) {
      updateAllFromRgba(parsed.r, parsed.g, parsed.b, color.a);
    }
  };

  // Handle Alpha Slider change
  const handleAlphaChange = (newAlpha: number) => {
    const clamped = clamp(newAlpha, 0, 1);
    updateAllFromRgba(color.r, color.g, color.b, clamped);
  };

  // Copy to clipboard helper
  const copyToClipboard = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
    }
  }, []);

  // Generate random color
  const generateRandomColor = () => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    updateAllFromRgba(r, g, b, 1);
  };

  // Computed values
  const currentHex = useMemo(() => rgbToHex(color.r, color.g, color.b), [color.r, color.g, color.b]);
  const currentHex8 = useMemo(
    () => rgbaToHex8(color.r, color.g, color.b, color.a),
    [color.r, color.g, color.b, color.a]
  );
  const currentHsl = useMemo(() => rgbToHsl(color.r, color.g, color.b), [color.r, color.g, color.b]);
  const currentHsv = useMemo(() => rgbToHsv(color.r, color.g, color.b), [color.r, color.g, color.b]);
  const currentCmyk = useMemo(() => rgbToCmyk(color.r, color.g, color.b), [color.r, color.g, color.b]);

  const cssRgbString = `rgb(${color.r}, ${color.g}, ${color.b})`;
  const cssRgbaString = `rgba(${color.r}, ${color.g}, ${color.b}, ${Number(color.a.toFixed(2))})`;
  const cssHslString = `hsl(${currentHsl.h}, ${currentHsl.s}%, ${currentHsl.l}%)`;
  const cssHslaString = `hsla(${currentHsl.h}, ${currentHsl.s}%, ${currentHsl.l}%, ${Number(color.a.toFixed(2))})`;
  const cssHsvString = `hsv(${currentHsv.h}, ${currentHsv.s}%, ${currentHsv.v}%)`;
  const cssCmykString = `cmyk(${currentCmyk.c}%, ${currentCmyk.m}%, ${currentCmyk.y}%, ${currentCmyk.k}%)`;

  // Luminance & WCAG
  const luminance = useMemo(() => getLuminance(color.r, color.g, color.b), [color.r, color.g, color.b]);
  const contrastWhite = useMemo(() => getContrastRatio(1.0, luminance), [luminance]);
  const contrastBlack = useMemo(() => getContrastRatio(luminance, 0.0), [luminance]);

  // Color Harmonies
  const harmonies = useMemo(() => {
    const { h, s, l } = currentHsl;
    const makeColor = (deg: number) => {
      const hNorm = ((deg % 360) + 360) % 360;
      const rgb = hslToRgb(hNorm, s, l);
      return {
        hex: rgbToHex(rgb.r, rgb.g, rgb.b),
        rgb,
        hsl: { h: hNorm, s, l },
      };
    };

    return {
      complementary: makeColor(h + 180),
      analogous1: makeColor(h - 30),
      analogous2: makeColor(h + 30),
      triadic1: makeColor(h + 120),
      triadic2: makeColor(h + 240),
      tints: [15, 30, 45, 60, 75, 90].map((lightness) => {
        const rgb = hslToRgb(h, s, lightness);
        return {
          hex: rgbToHex(rgb.r, rgb.g, rgb.b),
          rgb,
          lightness,
        };
      }),
    };
  }, [currentHsl]);

  return (
    <ToolLayout
      title="Color Converter"
      description="Convert colors between HEX, RGB, RGBA, HSL, HSLA, HSV, and CMYK formats with live preview and accessibility contrast analysis."
    >
      <div className="space-y-8">
        {/* Top: Swatch & Quick Picker Controls */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Large Color Swatch Box */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="relative h-56 sm:h-64 w-full  border border-[#1a1a1a] overflow-hidden shadow-inner">
              {/* Checkerboard backdrop for transparency */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
                    linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
                    linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
                  `,
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                }}
              />
              {/* Color Layer */}
              <div
                className="absolute inset-0 transition-colors duration-150 flex flex-col justify-between p-4"
                style={{
                  backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
                }}
              >
                <div className="flex justify-between items-center">
                  <span
                    className="inline-flex items-center px-2.5 py-1  text-xs font-bold  backdrop-blur-md bg-[#0a0a0a]/70 text-gray-200"
                  >
                    Alpha: {Math.round(color.a * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentHex, "swatch-hex")}
                    className="inline-flex items-center gap-1 px-2.5 py-1  text-xs font-bold  backdrop-blur-md bg-[#0a0a0a]/70 text-gray-200 hover:bg-[#0a0a0a] transition-colors"
                  >
                    {copiedKey === "swatch-hex" ? "Copied!" : currentHex}
                  </button>
                </div>

                <div className="text-center font-mono font-bold text-lg sm:text-xl drop-" style={{ color: contrastWhite >= contrastBlack ? "#FFFFFF" : "#000000" }}>
                  {cssRgbString}
                </div>
              </div>
            </div>

            {/* Native Color Picker button + Random Color */}
            <div className="mt-4 flex flex-wrap gap-2">
              <label className="relative flex-1 cursor-pointer">
                <input
                  type="color"
                  value={currentHex}
                  onChange={(e) => handleColorPickerChange(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center justify-center gap-2  border border-[#1a1a1a] bg-[#0a0a0a] py-2.5 px-4 text-sm font-semibold text-gray-400  hover:bg-black transition-colors">
                  <span
                    className="h-4 w-4 rounded-none border border-[#2a2a2a]"
                    style={{ backgroundColor: currentHex }}
                  />
                  <span>Pick Color (Visual)</span>
                </div>
              </label>

              <button
                type="button"
                onClick={generateRandomColor}
                className="flex items-center justify-center gap-1.5  border border-[#1a1a1a] bg-[#0a0a0a] py-2.5 px-4 text-sm font-semibold text-gray-400  hover:bg-black transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Random</span>
              </button>
            </div>
          </div>

          {/* Right Controls: Sliders & Quick Palettes */}
          <div className="lg:col-span-7 space-y-4">
            {/* Channel Sliders */}
            <div className=" border border-[#1a1a1a] bg-black p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Channel Controls
              </h3>

              {/* Red slider */}
              <div className="flex items-center gap-3">
                <span className="w-12 font-mono text-xs font-bold text-red-400">R: {color.r}</span>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={color.r}
                  onChange={(e) => updateAllFromRgba(Number(e.target.value), color.g, color.b, color.a)}
                  className="h-2 w-full cursor-pointer appearance-none  bg-red-200 accent-red-600"
                />
              </div>

              {/* Green slider */}
              <div className="flex items-center gap-3">
                <span className="w-12 font-mono text-xs font-bold text-emerald-600">G: {color.g}</span>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={color.g}
                  onChange={(e) => updateAllFromRgba(color.r, Number(e.target.value), color.b, color.a)}
                  className="h-2 w-full cursor-pointer appearance-none  bg-emerald-200 accent-emerald-600"
                />
              </div>

              {/* Blue slider */}
              <div className="flex items-center gap-3">
                <span className="w-12 font-mono text-xs font-bold text-blue-600">B: {color.b}</span>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={color.b}
                  onChange={(e) => updateAllFromRgba(color.r, color.g, Number(e.target.value), color.a)}
                  className="h-2 w-full cursor-pointer appearance-none  bg-blue-200 accent-blue-600"
                />
              </div>

              {/* Alpha slider */}
              <div className="flex items-center gap-3 pt-1 border-t border-[#1a1a1a]">
                <span className="w-12 font-mono text-xs font-bold text-gray-400">
                  A: {Math.round(color.a * 100)}%
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={color.a}
                  onChange={(e) => handleAlphaChange(parseFloat(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none  bg-[#222] accent-gray-800"
                />
              </div>
            </div>

            {/* Quick Preset Colors */}
            <div className=" border border-[#1a1a1a] bg-black p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600 block mb-2">
                Preset Palettes
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_PALETTES.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      const p = parseHex(preset.hex);
                      if (p) updateAllFromRgba(p.r, p.g, p.b, 1);
                    }}
                    className="flex items-center gap-1.5  border border-[#1a1a1a] bg-[#0a0a0a] px-2.5 py-1.5 text-xs font-medium text-gray-400  hover:scale-105 transition-all"
                    title={preset.name}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-none border border-black/10"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Two-Way Formats Conversion Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-200">
            Color Formats & Two-Way Editors
          </h2>
          <p className="text-xs text-gray-500">
            Edit any input below to convert instantly into all other formats.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* HEX Input Card */}
            <div className="flex flex-col justify-between  border border-[#1a1a1a] bg-[#0a0a0a] p-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="hex-field" className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    HEX Value
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentHex, "fmt-hex")}
                    className="text-xs font-medium text-blue-600 hover:text-blue-400 flex items-center gap-1"
                  >
                    {copiedKey === "fmt-hex" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <input
                  id="hex-field"
                  type="text"
                  value={hexInput}
                  onChange={(e) => handleHexChange(e.target.value)}
                  placeholder="#FF5733"
                  className="w-full p-3 font-mono text-base  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 focus:ring-1 focus:ring-blue-900 focus:outline-none"
                />
                {inputErrors.hex && <p className="mt-1 text-xs text-red-500">{inputErrors.hex}</p>}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>8-digit HEX (with Alpha):</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(currentHex8, "fmt-hex8")}
                  className="font-mono text-gray-300 hover:text-blue-600 font-semibold"
                >
                  {copiedKey === "fmt-hex8" ? "Copied!" : currentHex8}
                </button>
              </div>
            </div>

            {/* RGB Input Card */}
            <div className="flex flex-col justify-between  border border-[#1a1a1a] bg-[#0a0a0a] p-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="rgb-field" className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    RGB Value
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(cssRgbString, "fmt-rgb")}
                    className="text-xs font-medium text-blue-600 hover:text-blue-400 flex items-center gap-1"
                  >
                    {copiedKey === "fmt-rgb" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <input
                  id="rgb-field"
                  type="text"
                  value={rgbInput}
                  onChange={(e) => handleRgbChange(e.target.value)}
                  placeholder="rgb(255, 87, 51)"
                  className="w-full p-3 font-mono text-base  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 focus:ring-1 focus:ring-blue-900 focus:outline-none"
                />
                {inputErrors.rgb && <p className="mt-1 text-xs text-red-500">{inputErrors.rgb}</p>}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>Array values:</span>
                <span className="font-mono text-gray-300">
                  [{color.r}, {color.g}, {color.b}]
                </span>
              </div>
            </div>

            {/* RGBA Input Card */}
            <div className="flex flex-col justify-between  border border-[#1a1a1a] bg-[#0a0a0a] p-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="rgba-field" className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    RGBA Value (with Alpha)
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(cssRgbaString, "fmt-rgba")}
                    className="text-xs font-medium text-blue-600 hover:text-blue-400 flex items-center gap-1"
                  >
                    {copiedKey === "fmt-rgba" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <input
                  id="rgba-field"
                  type="text"
                  value={rgbaInput}
                  onChange={(e) => handleRgbaChange(e.target.value)}
                  placeholder="rgba(255, 87, 51, 1)"
                  className="w-full p-3 font-mono text-base  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 focus:ring-1 focus:ring-blue-900 focus:outline-none"
                />
                {inputErrors.rgba && <p className="mt-1 text-xs text-red-500">{inputErrors.rgba}</p>}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>CSS Output:</span>
                <span className="font-mono text-gray-300 truncate ml-2">{cssRgbaString}</span>
              </div>
            </div>

            {/* HSL Input Card */}
            <div className="flex flex-col justify-between  border border-[#1a1a1a] bg-[#0a0a0a] p-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="hsl-field" className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    HSL Value
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(cssHslString, "fmt-hsl")}
                    className="text-xs font-medium text-blue-600 hover:text-blue-400 flex items-center gap-1"
                  >
                    {copiedKey === "fmt-hsl" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <input
                  id="hsl-field"
                  type="text"
                  value={hslInput}
                  onChange={(e) => handleHslChange(e.target.value)}
                  placeholder="hsl(11, 100%, 60%)"
                  className="w-full p-3 font-mono text-base  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 focus:ring-1 focus:ring-blue-900 focus:outline-none"
                />
                {inputErrors.hsl && <p className="mt-1 text-xs text-red-500">{inputErrors.hsl}</p>}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>HSLA (with Alpha):</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(cssHslaString, "fmt-hsla")}
                  className="font-mono text-gray-300 hover:text-blue-600 font-semibold"
                >
                  {copiedKey === "fmt-hsla" ? "Copied!" : cssHslaString}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Formats (HSV & CMYK) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* HSV Card */}
          <div className="flex items-center justify-between  border border-[#1a1a1a] bg-black p-4">
            <div>
              <span className="text-xs font-semibold text-gray-500 block mb-1">
                HSV / HSB Format
              </span>
              <span className="font-mono text-sm font-bold text-gray-200">
                {cssHsvString}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(cssHsvString, "fmt-hsv")}
              className="rounded bg-[#0a0a0a] px-2.5 py-1.5 text-xs font-medium text-gray-400 border border-[#1a1a1a] hover:bg-[#111]"
            >
              {copiedKey === "fmt-hsv" ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* CMYK Card */}
          <div className="flex items-center justify-between  border border-[#1a1a1a] bg-black p-4">
            <div>
              <span className="text-xs font-semibold text-gray-500 block mb-1">
                CMYK Format (Print)
              </span>
              <span className="font-mono text-sm font-bold text-gray-200">
                {cssCmykString}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(cssCmykString, "fmt-cmyk")}
              className="rounded bg-[#0a0a0a] px-2.5 py-1.5 text-xs font-medium text-gray-400 border border-[#1a1a1a] hover:bg-[#111]"
            >
              {copiedKey === "fmt-cmyk" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Accessibility & Contrast Info */}
        <div className=" border border-[#1a1a1a] bg-black p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">
            WCAG Accessibility Contrast
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Contrast with White */}
            <div className=" border border-[#1a1a1a] bg-[#0a0a0a] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600">White Text (#FFFFFF)</span>
                <span className="font-mono text-sm font-bold text-gray-200">
                  {contrastWhite.toFixed(2)}:1
                </span>
              </div>
              <div
                className="h-10  flex items-center justify-center font-semibold text-white text-sm shadow-inner"
                style={{ backgroundColor: currentHex }}
              >
                Sample White Text
              </div>
              <div className="mt-2 flex gap-2 text-xs">
                <span
                  className={`px-2 py-0.5 font-medium ${
                    contrastWhite >= 4.5
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-[#1a0a0a] text-red-400"
                  }`}
                >
                  AA Normal {contrastWhite >= 4.5 ? "✓ Pass" : "✕ Fail"}
                </span>
                <span
                  className={`px-2 py-0.5 font-medium ${
                    contrastWhite >= 7
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-[#1a0a0a] text-red-400"
                  }`}
                >
                  AAA {contrastWhite >= 7 ? "✓ Pass" : "✕ Fail"}
                </span>
              </div>
            </div>

            {/* Contrast with Black */}
            <div className=" border border-[#1a1a1a] bg-[#0a0a0a] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600">Black Text (#000000)</span>
                <span className="font-mono text-sm font-bold text-gray-200">
                  {contrastBlack.toFixed(2)}:1
                </span>
              </div>
              <div
                className="h-10  flex items-center justify-center font-semibold text-black text-sm shadow-inner"
                style={{ backgroundColor: currentHex }}
              >
                Sample Black Text
              </div>
              <div className="mt-2 flex gap-2 text-xs">
                <span
                  className={`px-2 py-0.5 font-medium ${
                    contrastBlack >= 4.5
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-[#1a0a0a] text-red-400"
                  }`}
                >
                  AA Normal {contrastBlack >= 4.5 ? "✓ Pass" : "✕ Fail"}
                </span>
                <span
                  className={`px-2 py-0.5 font-medium ${
                    contrastBlack >= 7
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-[#1a0a0a] text-red-400"
                  }`}
                >
                  AAA {contrastBlack >= 7 ? "✓ Pass" : "✕ Fail"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Color Harmonies */}
        <div className=" border border-[#1a1a1a] bg-black p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">
            Harmonies & Shades (Click to load)
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Complementary */}
            <div>
              <span className="text-xs font-medium text-gray-500 block mb-1.5">
                Complementary
              </span>
              <button
                type="button"
                onClick={() => updateAllFromRgba(harmonies.complementary.rgb.r, harmonies.complementary.rgb.g, harmonies.complementary.rgb.b, 1)}
                className="w-full flex items-center gap-2 p-2  bg-[#0a0a0a] border border-[#1a1a1a] hover:scale-[1.02] transition-transform text-left"
              >
                <span
                  className="h-8 w-8  border border-black/10 shrink-0"
                  style={{ backgroundColor: harmonies.complementary.hex }}
                />
                <span className="font-mono text-xs font-medium text-gray-300 truncate">
                  {harmonies.complementary.hex}
                </span>
              </button>
            </div>

            {/* Analogous */}
            <div>
              <span className="text-xs font-medium text-gray-500 block mb-1.5">
                Analogous
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateAllFromRgba(harmonies.analogous1.rgb.r, harmonies.analogous1.rgb.g, harmonies.analogous1.rgb.b, 1)}
                  className="flex-1 flex items-center gap-1.5 p-2  bg-[#0a0a0a] border border-[#1a1a1a] hover:scale-[1.02] transition-transform text-left"
                >
                  <span
                    className="h-6 w-6  border border-black/10 shrink-0"
                    style={{ backgroundColor: harmonies.analogous1.hex }}
                  />
                  <span className="font-mono text-xs font-medium text-gray-300 truncate">
                    {harmonies.analogous1.hex}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => updateAllFromRgba(harmonies.analogous2.rgb.r, harmonies.analogous2.rgb.g, harmonies.analogous2.rgb.b, 1)}
                  className="flex-1 flex items-center gap-1.5 p-2  bg-[#0a0a0a] border border-[#1a1a1a] hover:scale-[1.02] transition-transform text-left"
                >
                  <span
                    className="h-6 w-6  border border-black/10 shrink-0"
                    style={{ backgroundColor: harmonies.analogous2.hex }}
                  />
                  <span className="font-mono text-xs font-medium text-gray-300 truncate">
                    {harmonies.analogous2.hex}
                  </span>
                </button>
              </div>
            </div>

            {/* Triadic */}
            <div>
              <span className="text-xs font-medium text-gray-500 block mb-1.5">
                Triadic
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateAllFromRgba(harmonies.triadic1.rgb.r, harmonies.triadic1.rgb.g, harmonies.triadic1.rgb.b, 1)}
                  className="flex-1 flex items-center gap-1.5 p-2  bg-[#0a0a0a] border border-[#1a1a1a] hover:scale-[1.02] transition-transform text-left"
                >
                  <span
                    className="h-6 w-6  border border-black/10 shrink-0"
                    style={{ backgroundColor: harmonies.triadic1.hex }}
                  />
                  <span className="font-mono text-xs font-medium text-gray-300 truncate">
                    {harmonies.triadic1.hex}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => updateAllFromRgba(harmonies.triadic2.rgb.r, harmonies.triadic2.rgb.g, harmonies.triadic2.rgb.b, 1)}
                  className="flex-1 flex items-center gap-1.5 p-2  bg-[#0a0a0a] border border-[#1a1a1a] hover:scale-[1.02] transition-transform text-left"
                >
                  <span
                    className="h-6 w-6  border border-black/10 shrink-0"
                    style={{ backgroundColor: harmonies.triadic2.hex }}
                  />
                  <span className="font-mono text-xs font-medium text-gray-300 truncate">
                    {harmonies.triadic2.hex}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Tints & Shades scale */}
          <div>
            <span className="text-xs font-medium text-gray-500 block mb-1.5">
              Lightness Spectrum (15% to 90%)
            </span>
            <div className="grid grid-cols-6 gap-1.5">
              {harmonies.tints.map((tint) => (
                <button
                  key={tint.lightness}
                  type="button"
                  onClick={() => updateAllFromRgba(tint.rgb.r, tint.rgb.g, tint.rgb.b, 1)}
                  className="h-10  border border-black/10 hover:scale-105 transition-transform flex items-center justify-center"
                  style={{ backgroundColor: tint.hex }}
                  title={`${tint.hex} (${tint.lightness}%)`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
