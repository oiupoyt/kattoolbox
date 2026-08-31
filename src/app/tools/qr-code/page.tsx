"use client";

import { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import QRCode from "qrcode";

type SizeOption = "small" | "medium" | "large";
type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

const SIZE_MAP: Record<SizeOption, { px: number; label: string }> = {
  small: { px: 200, label: "Small (200x200)" },
  medium: { px: 320, label: "Medium (320x320)" },
  large: { px: 500, label: "Large (500x500)" },
};

const ERROR_CORRECTION_DESCRIPTIONS: Record<ErrorCorrectionLevel, string> = {
  L: "Low (~7% recovery)",
  M: "Medium (~15% recovery)",
  Q: "Quartile (~25% recovery)",
  H: "High (~30% recovery)",
};

export default function QrCodePage() {
  const [inputText, setInputText] = useState<string>("https://devtoolbox.com");
  const [size, setSize] = useState<SizeOption>("medium");
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>("M");
  const [margin, setMargin] = useState<number>(2);
  const [fgColor, setFgColor] = useState<string>("#000000");
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [dataUrl, setDataUrl] = useState<string>("");
  const [svgString, setSvgString] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copiedDataUrl, setCopiedDataUrl] = useState<boolean>(false);

  const generateQRCode = useCallback(async () => {
    const textToEncode = inputText.trim();
    if (!textToEncode) {
      setDataUrl("");
      setSvgString("");
      setError(null);
      return;
    }

    try {
      const options = {
        width: SIZE_MAP[size].px,
        margin: margin,
        errorCorrectionLevel: errorCorrection,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      };

      const [url, svg] = await Promise.all([
        QRCode.toDataURL(textToEncode, options),
        QRCode.toString(textToEncode, { ...options, type: "svg" }),
      ]);

      setDataUrl(url);
      setSvgString(svg);
      setError(null);
    } catch (err: unknown) {
      console.error("QR Code generation error:", err);
      const message = err instanceof Error ? err.message : "Failed to generate QR code";
      setError(message);
      setDataUrl("");
    }
  }, [inputText, size, errorCorrection, margin, fgColor, bgColor]);

  useEffect(() => {
    generateQRCode();
  }, [generateQRCode]);

  const handleDownloadPng = () => {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `qrcode-${Date.now()}.png`;
    link.click();
  };

  const handleDownloadSvg = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qrcode-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyDataUrl = async () => {
    if (!dataUrl) return;
    try {
      await navigator.clipboard.writeText(dataUrl);
      setCopiedDataUrl(true);
      setTimeout(() => setCopiedDataUrl(false), 2000);
    } catch (err) {
      console.error("Failed to copy data url:", err);
    }
  };

  const presetTemplates = [
    { label: "Website URL", value: "https://github.com" },
    { label: "Wi-Fi Network", value: "WIFI:S:MyHomeWiFi;T:WPA;P:MySecretPassword;;" },
    { label: "Email", value: "mailto:support@example.com?subject=Hello&body=Hi there" },
    { label: "Phone", value: "tel:+1234567890" },
    { label: "SMS", value: "smsto:+1234567890:Hello!" },
  ];

  return (
    <ToolLayout
      title="QR Code Generator"
      description="Create high-resolution, custom QR codes for websites, Wi-Fi access, plain text, emails, and contact details with instant download."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Controls Column */}
          <div className="space-y-5 lg:col-span-7">
            {/* Text / Content Input */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="qr-input"
                  className="text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  Content / URL
                </label>
                {inputText && (
                  <button
                    type="button"
                    onClick={() => setInputText("")}
                    className="text-xs text-red-400 hover:text-red-400"
                  >
                    Clear
                  </button>
                )}
              </div>

              <textarea
                id="qr-input"
                rows={3}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter a URL, text, or select a template below..."
                className="w-full  border border-[#1a1a1a] bg-[#0a0a0a] p-3 font-mono text-sm text-gray-200 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-900/20"
              />

              {/* Presets */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-gray-500">Templates:</span>
                {presetTemplates.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => setInputText(tpl.value)}
                    className=" bg-[#111] px-2 py-1 text-xs font-medium text-gray-400 hover:bg-[#1a1a1a]"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Configuration Options */}
            <div className=" border border-[#1a1a1a] bg-black/50 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Customization Options
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Size Selector */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Export Resolution
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value as SizeOption)}
                    className="w-full  border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-900/20"
                  >
                    <option value="small">{SIZE_MAP.small.label}</option>
                    <option value="medium">{SIZE_MAP.medium.label}</option>
                    <option value="large">{SIZE_MAP.large.label}</option>
                  </select>
                </div>

                {/* Error Correction */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Error Correction Level
                  </label>
                  <select
                    value={errorCorrection}
                    onChange={(e) => setErrorCorrection(e.target.value as ErrorCorrectionLevel)}
                    className="w-full  border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-900/20"
                  >
                    <option value="L">L - {ERROR_CORRECTION_DESCRIPTIONS.L}</option>
                    <option value="M">M - {ERROR_CORRECTION_DESCRIPTIONS.M}</option>
                    <option value="Q">Q - {ERROR_CORRECTION_DESCRIPTIONS.Q}</option>
                    <option value="H">H - {ERROR_CORRECTION_DESCRIPTIONS.H}</option>
                  </select>
                </div>

                {/* Margin / Quiet Zone */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Margin / Border: {margin} module{margin > 1 ? "s" : ""}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="6"
                      value={margin}
                      onChange={(e) => setMargin(parseInt(e.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none  bg-[#1a1a1a] accent-blue-600"
                    />
                    <span className="w-6 text-center text-xs font-medium text-gray-400">
                      {margin}
                    </span>
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Colors (Foreground / Background)
                  </label>
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="h-8 w-8 cursor-pointer border border-[#1a1a1a] bg-transparent p-0.5"
                        title="Foreground color"
                      />
                      <span className="font-mono text-xs text-gray-400">
                        {fgColor}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="h-8 w-8 cursor-pointer border border-[#1a1a1a] bg-transparent p-0.5"
                        title="Background color"
                      />
                      <span className="font-mono text-xs text-gray-400">
                        {bgColor}
                      </span>
                    </div>

                    {(fgColor !== "#000000" || bgColor !== "#ffffff") && (
                      <button
                        type="button"
                        onClick={() => {
                          setFgColor("#000000");
                          setBgColor("#ffffff");
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Preview & Download Column */}
          <div className="flex flex-col items-center justify-center  border border-[#1a1a1a] bg-black/50 p-6 lg:col-span-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Live QR Preview
            </h3>

            {error ? (
              <div className="flex h-64 w-full flex-col items-center justify-center  border border-red-900 bg-[#1a0a0a] p-4 text-center">
                <svg className="mb-2 h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-xs font-medium text-red-400">{error}</p>
                <p className="mt-1 text-[11px] text-red-400">
                  Try shortening the text or lowering the error correction level.
                </p>
              </div>
            ) : dataUrl ? (
              <div className="flex flex-col items-center">
                <div className="overflow-hidden  border border-[#1a1a1a] bg-[#0a0a0a] p-3 ">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dataUrl}
                    alt={`QR Code for ${inputText}`}
                    className="max-h-64 max-w-full object-contain"
                    width={SIZE_MAP[size].px}
                    height={SIZE_MAP[size].px}
                  />
                </div>

                <p className="mt-2 text-center text-xs text-gray-400">
                  {SIZE_MAP[size].px} × {SIZE_MAP[size].px} px • Level {errorCorrection}
                </p>

                {/* Download Actions */}
                <div className="mt-5 flex w-full flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    className="flex w-full items-center justify-center gap-2  bg-blue-600 px-4 py-2.5 text-sm font-medium text-white  transition-colors hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:ring-offset-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download PNG
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadSvg}
                      className="flex-1  bg-[#1a1a1a] px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-[#222]"
                    >
                      Download SVG
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyDataUrl}
                      className="flex-1  bg-[#1a1a1a] px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-[#222]"
                    >
                      {copiedDataUrl ? "Copied Data URI!" : "Copy Data URI"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-64 w-full flex-col items-center justify-center  border border-dashed border-[#1a1a1a] p-4 text-center">
                <span className="text-3xl">📱</span>
                <p className="mt-2 text-xs text-gray-500">
                  Enter text or a URL above to render a live QR Code.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Informational Details */}
        <div className="grid grid-cols-1 gap-4 pt-4 text-xs text-gray-500 sm:grid-cols-3">
          <div className=" border border-gray-100 bg-black p-3">
            <h4 className="font-semibold text-gray-300">Error Correction (Reed-Solomon)</h4>
            <p className="mt-1">
              Higher error correction allows the QR code to be scanned even if damaged, partially obstructed, or printed on textured materials.
            </p>
          </div>
          <div className=" border border-gray-100 bg-black p-3">
            <h4 className="font-semibold text-gray-300">Universal Smartphone Support</h4>
            <p className="mt-1">
              Scannable natively with standard iOS and Android camera apps without requiring any third-party scanner software.
            </p>
          </div>
          <div className=" border border-gray-100 bg-black p-3">
            <h4 className="font-semibold text-gray-300">Zero Server Transfer</h4>
            <p className="mt-1">
              Your sensitive Wi-Fi passwords, contact cards, and URLs are encoded entirely in client JavaScript.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
