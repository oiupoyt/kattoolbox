"use client";

import React, { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";

interface ColorStop {
  id: string;
  color: string;
  stop: number;
}

type GradientType = "linear" | "radial";

interface Preset {
  name: string;
  type: GradientType;
  angle?: number;
  shape?: "circle" | "ellipse";
  position?: string;
  stops: { color: string; stop: number }[];
}

const PRESETS: Preset[] = [
  {
    name: "Ocean Blue",
    type: "linear",
    angle: 135,
    stops: [
      { color: "#2563eb", stop: 0 },
      { color: "#06b6d4", stop: 100 },
    ],
  },
  {
    name: "Sunset Glow",
    type: "linear",
    angle: 135,
    stops: [
      { color: "#f97316", stop: 0 },
      { color: "#ec4899", stop: 100 },
    ],
  },
  {
    name: "Purple Haze",
    type: "linear",
    angle: 135,
    stops: [
      { color: "#6366f1", stop: 0 },
      { color: "#a855f7", stop: 50 },
      { color: "#ec4899", stop: 100 },
    ],
  },
  {
    name: "Emerald Forest",
    type: "linear",
    angle: 135,
    stops: [
      { color: "#059669", stop: 0 },
      { color: "#10b981", stop: 50 },
      { color: "#6ee7b7", stop: 100 },
    ],
  },
  {
    name: "Neon Cyber",
    type: "linear",
    angle: 90,
    stops: [
      { color: "#00f2fe", stop: 0 },
      { color: "#4facfe", stop: 100 },
    ],
  },
  {
    name: "Flame",
    type: "linear",
    angle: 45,
    stops: [
      { color: "#f12711", stop: 0 },
      { color: "#f5af19", stop: 100 },
    ],
  },
  {
    name: "Radial Glow",
    type: "radial",
    shape: "circle",
    position: "center",
    stops: [
      { color: "#3b82f6", stop: 0 },
      { color: "#1e1b4b", stop: 100 },
    ],
  },
  {
    name: "Midnight Aura",
    type: "radial",
    shape: "circle",
    position: "center",
    stops: [
      { color: "#8b5cf6", stop: 0 },
      { color: "#0f172a", stop: 100 },
    ],
  },
];

const LINEAR_DIRECTIONS = [
  { label: "→ Right", angle: 90, cssDir: "to right" },
  { label: "← Left", angle: 270, cssDir: "to left" },
  { label: "↓ Bottom", angle: 180, cssDir: "to bottom" },
  { label: "↑ Top", angle: 0, cssDir: "to top" },
  { label: "↗ Top Right", angle: 45, cssDir: "to top right" },
  { label: "↘ Bottom Right", angle: 135, cssDir: "to bottom right" },
  { label: "↙ Bottom Left", angle: 225, cssDir: "to bottom left" },
  { label: "↖ Top Left", angle: 315, cssDir: "to top left" },
];

const RADIAL_POSITIONS = [
  { label: "Center", value: "center" },
  { label: "Top", value: "top center" },
  { label: "Bottom", value: "bottom center" },
  { label: "Left", value: "center left" },
  { label: "Right", value: "center right" },
  { label: "Top Left", value: "top left" },
  { label: "Top Right", value: "top right" },
  { label: "Bottom Left", value: "bottom left" },
  { label: "Bottom Right", value: "bottom right" },
];

export default function CssGradientGeneratorPage() {
  const [gradientType, setGradientType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState<number>(135);
  const [radialShape, setRadialShape] = useState<"circle" | "ellipse">("circle");
  const [radialPosition, setRadialPosition] = useState<string>("center");

  const [colorStops, setColorStops] = useState<ColorStop[]>([
    { id: "1", color: "#3b82f6", stop: 0 },
    { id: "2", color: "#8b5cf6", stop: 100 },
  ]);

  const [copied, setCopied] = useState<boolean>(false);
  const [previewText, setPreviewText] = useState<boolean>(true);
  const [codeFormat, setCodeFormat] = useState<"standard" | "full" | "tailwind">("standard");

  // Sort stops for rendering CSS
  const sortedStops = useMemo(() => {
    return [...colorStops].sort((a, b) => a.stop - b.stop);
  }, [colorStops]);

  // Construct CSS gradient value
  const gradientValue = useMemo(() => {
    const stopsString = sortedStops
      .map((s) => `${s.color} ${s.stop}%`)
      .join(", ");

    if (gradientType === "linear") {
      return `linear-gradient(${angle}deg, ${stopsString})`;
    } else {
      return `radial-gradient(${radialShape} at ${radialPosition}, ${stopsString})`;
    }
  }, [gradientType, angle, radialShape, radialPosition, sortedStops]);

  // Output CSS code block
  const generatedCode = useMemo(() => {
    const fallbackColor = sortedStops[0]?.color || "#3b82f6";

    if (codeFormat === "tailwind") {
      return `className="bg-[${gradientValue}]"`;
    }

    if (codeFormat === "full") {
      return `/* Fallback for older browsers */\nbackground-color: ${fallbackColor};\n\n/* Modern CSS Gradient */\nbackground: ${gradientValue};`;
    }

    return `background: ${gradientValue};`;
  }, [gradientValue, sortedStops, codeFormat]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
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

  const updateStopColor = (id: string, newColor: string) => {
    setColorStops((prev) =>
      prev.map((stop) => (stop.id === id ? { ...stop, color: newColor } : stop))
    );
  };

  const updateStopPosition = (id: string, newStop: number) => {
    const clamped = Math.max(0, Math.min(100, isNaN(newStop) ? 0 : newStop));
    setColorStops((prev) =>
      prev.map((stop) => (stop.id === id ? { ...stop, stop: clamped } : stop))
    );
  };

  const addColorStop = () => {
    if (colorStops.length >= 6) return;

    // Pick a midpoint or random color
    const newId = Date.now().toString();
    if (colorStops.length === 2) {
      // Add a nice middle color
      const middleColor = "#ec4899";
      setColorStops([
        colorStops[0],
        { id: newId, color: middleColor, stop: 50 },
        colorStops[1],
      ]);
    } else {
      const lastStop = colorStops[colorStops.length - 1];
      const secondLast = colorStops[colorStops.length - 2];
      const midPosition = Math.round((lastStop.stop + (secondLast?.stop ?? 0)) / 2);
      setColorStops((prev) => [
        ...prev,
        { id: newId, color: "#10b981", stop: midPosition },
      ]);
    }
  };

  const removeColorStop = (id: string) => {
    if (colorStops.length <= 2) return;
    setColorStops((prev) => prev.filter((stop) => stop.id !== id));
  };

  const reverseColors = () => {
    setColorStops((prev) => {
      const reversed = [...prev].reverse();
      return reversed.map((stop, idx) => ({
        ...stop,
        stop: prev[idx].stop,
      }));
    });
  };

  const generateRandomGradient = () => {
    const randomHex = () =>
      "#" +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0");
    const count = colorStops.length;
    const newStops = colorStops.map((stop, idx) => ({
      ...stop,
      color: randomHex(),
      stop: Math.round((idx / (count - 1)) * 100),
    }));
    setColorStops(newStops);
    if (gradientType === "linear") {
      setAngle(Math.floor(Math.random() * 360));
    }
  };

  const applyPreset = (preset: Preset) => {
    setGradientType(preset.type);
    if (preset.angle !== undefined) setAngle(preset.angle);
    if (preset.shape) setRadialShape(preset.shape);
    if (preset.position) setRadialPosition(preset.position);
    setColorStops(
      preset.stops.map((s, idx) => ({
        id: (idx + 1).toString(),
        color: s.color,
        stop: s.stop,
      }))
    );
  };

  return (
    <ToolLayout
      title="CSS Gradient Generator"
      description="Create beautiful linear and radial CSS gradients visually, customize color stops, adjust angles, and copy clean CSS code instantly."
    >
      <div className="space-y-8">
        {/* Live Preview Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Live Preview
            </h2>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={previewText}
                  onChange={(e) => setPreviewText(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
                Show Text Overlay
              </label>
              <button
                type="button"
                onClick={generateRandomGradient}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Generate Random Gradient"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Randomize
              </button>
            </div>
          </div>

          <div
            className="relative w-full h-64 sm:h-72 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner flex items-center justify-center p-6 transition-all duration-300 overflow-hidden"
            style={{ background: gradientValue }}
          >
            {previewText && (
              <div className="bg-black/30 backdrop-blur-md text-white rounded-xl p-5 max-w-md text-center shadow-lg border border-white/10 transition-all">
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-1 drop-shadow-sm">
                  CSS Gradient Preview
                </h3>
                <p className="text-xs sm:text-sm text-gray-100/90 font-mono">
                  {gradientType === "linear" ? `${angle}° Linear` : `Radial ${radialShape}`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Presets Gallery */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Quick Presets
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
            {PRESETS.map((preset) => {
              const bgString =
                preset.type === "linear"
                  ? `linear-gradient(${preset.angle}deg, ${preset.stops.map((s) => `${s.color} ${s.stop}%`).join(", ")})`
                  : `radial-gradient(${preset.shape} at ${preset.position}, ${preset.stops.map((s) => `${s.color} ${s.stop}%`).join(", ")})`;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="group relative flex flex-col items-center gap-1.5 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-gray-800 transition-all hover:scale-[1.03] text-left"
                >
                  <div
                    className="w-full h-12 rounded-lg shadow-sm"
                    style={{ background: bgString }}
                  />
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Type & Direction Settings */}
          <div className="lg:col-span-5 space-y-6">
            {/* Gradient Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Gradient Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGradientType("linear")}
                  className={`py-2.5 px-4 text-sm font-medium rounded-lg border transition-all ${
                    gradientType === "linear"
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  Linear
                </button>
                <button
                  type="button"
                  onClick={() => setGradientType("radial")}
                  className={`py-2.5 px-4 text-sm font-medium rounded-lg border transition-all ${
                    gradientType === "radial"
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  Radial
                </button>
              </div>
            </div>

            {/* Linear Direction Options */}
            {gradientType === "linear" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Angle: <span className="font-mono text-blue-600 dark:text-blue-400">{angle}°</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="360"
                      value={angle}
                      onChange={(e) => setAngle(Number(e.target.value) % 361)}
                      className="w-20 px-2 py-1 text-sm font-mono text-right rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={angle}
                    onChange={(e) => setAngle(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                  />
                </div>

                {/* Quick Direction Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Quick Directions
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {LINEAR_DIRECTIONS.map((dir) => (
                      <button
                        key={dir.angle}
                        type="button"
                        onClick={() => setAngle(dir.angle)}
                        className={`py-2 px-1.5 text-xs font-medium rounded-lg border text-center transition-all ${
                          angle === dir.angle
                            ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300 font-semibold"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        {dir.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Radial Options */}
            {gradientType === "radial" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Radial Shape
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRadialShape("circle")}
                      className={`py-2 px-3 text-sm font-medium rounded-lg border transition-all ${
                        radialShape === "circle"
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      Circle
                    </button>
                    <button
                      type="button"
                      onClick={() => setRadialShape("ellipse")}
                      className={`py-2 px-3 text-sm font-medium rounded-lg border transition-all ${
                        radialShape === "ellipse"
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      Ellipse
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Radial Position
                  </label>
                  <select
                    value={radialPosition}
                    onChange={(e) => setRadialPosition(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {RADIAL_POSITIONS.map((pos) => (
                      <option key={pos.value} value={pos.value}>
                        {pos.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Color Stops */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Color Stops ({colorStops.length})
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Customize start, middle, and end colors with position stops.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={reverseColors}
                  className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
                  title="Reverse Color Order"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                  Swap
                </button>
                <button
                  type="button"
                  onClick={addColorStop}
                  disabled={colorStops.length >= 6}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                    colorStops.length >= 6
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Stop
                </button>
              </div>
            </div>

            {/* Stops List */}
            <div className="space-y-3">
              {colorStops.map((stop, index) => {
                const label =
                  index === 0
                    ? "Start Color"
                    : index === colorStops.length - 1
                    ? "End Color"
                    : `Stop ${index + 1} (Middle)`;

                return (
                  <div
                    key={stop.id}
                    className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-800/50 space-y-2.5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stop.color }} />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {label}
                        </span>
                      </div>

                      {colorStops.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeColorStop(stop.id)}
                          className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded"
                          title="Remove Stop"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      {/* Color Picker and Hex Input */}
                      <div className="sm:col-span-5 flex items-center gap-2">
                        <div className="relative flex-shrink-0 w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden shadow-inner cursor-pointer">
                          <input
                            type="color"
                            value={stop.color}
                            onChange={(e) => updateStopColor(stop.id, e.target.value)}
                            className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer border-0"
                          />
                        </div>
                        <input
                          type="text"
                          value={stop.color}
                          onChange={(e) => updateStopColor(stop.id, e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                          placeholder="#000000"
                        />
                      </div>

                      {/* Position Slider and Input */}
                      <div className="sm:col-span-7 flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={stop.stop}
                          onChange={(e) => updateStopPosition(stop.id, Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={stop.stop}
                            onChange={(e) => updateStopPosition(stop.id, Number(e.target.value))}
                            className="w-14 px-1.5 py-1 text-xs font-mono text-right rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Generated CSS Output Block */}
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Generated CSS
              </h2>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setCodeFormat("standard")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    codeFormat === "standard"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium shadow-xs"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => setCodeFormat("full")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    codeFormat === "full"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium shadow-xs"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                  }`}
                >
                  Full CSS
                </button>
                <button
                  type="button"
                  onClick={() => setCodeFormat("tailwind")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    codeFormat === "tailwind"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium shadow-xs"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                  }`}
                >
                  Tailwind
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm cursor-pointer"
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
            <pre className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-900 text-gray-100 font-mono text-sm overflow-x-auto leading-relaxed shadow-sm">
              <code>{generatedCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
