"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";

// Format relative time
function getRelativeTimeString(date: Date, now: Date): string {
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const isPast = diffSec < 0;
  const absSec = Math.abs(diffSec);

  if (absSec < 5) return "just now";
  if (absSec < 60) return isPast ? `${absSec} seconds ago` : `in ${absSec} seconds`;

  const absMin = Math.round(absSec / 60);
  if (absMin < 60) return isPast ? `${absMin} minute${absMin > 1 ? "s" : ""} ago` : `in ${absMin} minute${absMin > 1 ? "s" : ""}`;

  const absHours = Math.round(absMin / 60);
  if (absHours < 24) return isPast ? `${absHours} hour${absHours > 1 ? "s" : ""} ago` : `in ${absHours} hour${absHours > 1 ? "s" : ""}`;

  const absDays = Math.round(absHours / 24);
  if (absDays < 30) return isPast ? `${absDays} day${absDays > 1 ? "s" : ""} ago` : `in ${absDays} day${absDays > 1 ? "s" : ""}`;

  const absMonths = Math.round(absDays / 30.44);
  if (absMonths < 12) return isPast ? `${absMonths} month${absMonths > 1 ? "s" : ""} ago` : `in ${absMonths} month${absMonths > 1 ? "s" : ""}`;

  const absYears = Math.round(absDays / 365.25);
  return isPast ? `${absYears} year${absYears > 1 ? "s" : ""} ago` : `in ${absYears} year${absYears > 1 ? "s" : ""}`;
}

// Format local datetime string for <input type="datetime-local">
function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Get Day of Year
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime() + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// Get ISO Week Number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Is leap year
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export default function TimestampConverterPage() {
  // Live current timestamp ticker
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(() => Math.floor(Date.now() / 1000));
  const [isLivePaused, setIsLivePaused] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Timestamp -> Date state
  const [tsInput, setTsInput] = useState<string>(() => Math.floor(Date.now() / 1000).toString());
  const [unitMode, setUnitMode] = useState<"seconds" | "milliseconds" | "auto">("auto");

  // Date -> Timestamp state
  const [dateInput, setDateInput] = useState<string>(() => toDatetimeLocal(new Date()));
  const [dateInputTz, setDateInputTz] = useState<"local" | "utc">("local");

  // Active tab
  const [activeTab, setActiveTab] = useState<"tsToDate" | "dateToTs">("tsToDate");

  // Ticker effect
  useEffect(() => {
    if (isLivePaused) return;
    const interval = setInterval(() => {
      setCurrentTimestamp(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isLivePaused]);

  // Copy helper
  const copyToClipboard = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    }
  }, []);

  // Parse Timestamp input
  const parsedFromTs = useMemo(() => {
    const trimmed = tsInput.trim();
    if (!trimmed) {
      return { valid: false, error: "Please enter a timestamp" };
    }

    const num = Number(trimmed);
    if (isNaN(num)) {
      return { valid: false, error: "Invalid numeric timestamp" };
    }

    let isMs = false;
    if (unitMode === "milliseconds") {
      isMs = true;
    } else if (unitMode === "seconds") {
      isMs = false;
    } else {
      // Auto mode: if 13 digits or > 1e11, treat as milliseconds
      isMs = Math.abs(num) > 99999999999;
    }

    const msValue = isMs ? num : num * 1000;
    const date = new Date(msValue);

    if (isNaN(date.getTime())) {
      return { valid: false, error: "Timestamp out of range for Date object" };
    }

    return {
      valid: true,
      date,
      seconds: Math.floor(msValue / 1000),
      milliseconds: Math.floor(msValue),
      isMs,
    };
  }, [tsInput, unitMode]);

  // Parse Date input
  const parsedFromDate = useMemo(() => {
    if (!dateInput) {
      return { valid: false, error: "Please select or enter a date and time" };
    }

    let date: Date;
    if (dateInputTz === "utc") {
      // Parse as UTC
      const [datePart, timePart = "00:00:00"] = dateInput.split("T");
      const [year, month, day] = (datePart || "").split("-").map(Number);
      const [hour = 0, min = 0, sec = 0] = (timePart || "").split(":").map(Number);
      date = new Date(Date.UTC(year, (month || 1) - 1, day || 1, hour, min, sec));
    } else {
      date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) {
      return { valid: false, error: "Invalid date or time value" };
    }

    return {
      valid: true,
      date,
      seconds: Math.floor(date.getTime() / 1000),
      milliseconds: date.getTime(),
    };
  }, [dateInput, dateInputTz]);

  // Quick preset actions for Timestamp input
  const handleQuickTs = (type: "now" | "todayStart" | "todayEnd" | "plusHour" | "minusHour" | "plusDay" | "minusDay") => {
    const now = new Date();
    let target = now;

    if (type === "now") {
      target = new Date();
    } else if (type === "todayStart") {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (type === "todayEnd") {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (type === "plusHour") {
      const base = parsedFromTs.valid && parsedFromTs.date ? parsedFromTs.date : now;
      target = new Date(base.getTime() + 3600 * 1000);
    } else if (type === "minusHour") {
      const base = parsedFromTs.valid && parsedFromTs.date ? parsedFromTs.date : now;
      target = new Date(base.getTime() - 3600 * 1000);
    } else if (type === "plusDay") {
      const base = parsedFromTs.valid && parsedFromTs.date ? parsedFromTs.date : now;
      target = new Date(base.getTime() + 86400 * 1000);
    } else if (type === "minusDay") {
      const base = parsedFromTs.valid && parsedFromTs.date ? parsedFromTs.date : now;
      target = new Date(base.getTime() - 86400 * 1000);
    }

    const sec = Math.floor(target.getTime() / 1000);
    setTsInput(unitMode === "milliseconds" ? target.getTime().toString() : sec.toString());
  };

  // Quick preset actions for Date input
  const handleQuickDate = (type: "now" | "todayStart" | "todayEnd" | "plusDay" | "minusDay") => {
    const now = new Date();
    let target = now;

    if (type === "now") {
      target = new Date();
    } else if (type === "todayStart") {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (type === "todayEnd") {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 0);
    } else if (type === "plusDay") {
      const base = parsedFromDate.valid && parsedFromDate.date ? parsedFromDate.date : now;
      target = new Date(base.getTime() + 86400 * 1000);
    } else if (type === "minusDay") {
      const base = parsedFromDate.valid && parsedFromDate.date ? parsedFromDate.date : now;
      target = new Date(base.getTime() - 86400 * 1000);
    }

    setDateInput(toDatetimeLocal(target));
  };

  const nowDate = useMemo(() => new Date(currentTimestamp * 1000), [currentTimestamp]);

  return (
    <ToolLayout
      title="Unix Timestamp Converter"
      description="Convert between Unix timestamps and human-readable dates in UTC, ISO 8601, and local timezone formats."
    >
      <div className="space-y-8">
        {/* Live Current Timestamp Banner */}
        <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:border-blue-900/50 dark:from-blue-950/30 dark:to-indigo-950/30 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${
                      !isLivePaused ? "animate-ping" : ""
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-3 w-3 rounded-full ${
                      !isLivePaused ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  Current Unix Epoch Time {isLivePaused && "(Paused)"}
                </span>
              </div>
              <div className="mt-2 font-mono text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {currentTimestamp}
              </div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                <span className="font-medium text-gray-800 dark:text-gray-200">UTC:</span> {nowDate.toUTCString()}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(currentTimestamp.toString(), "live-ts")}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
              >
                {copiedKey === "live-ts" ? (
                  <>
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Copy Timestamp</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsLivePaused(!isLivePaused)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                {isLivePaused ? "Resume" : "Pause"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentTimestamp(Math.floor(Date.now() / 1000));
                  setTsInput(Math.floor(Date.now() / 1000).toString());
                  setDateInput(toDatetimeLocal(new Date()));
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                title="Reset to current time"
              >
                Reset to Now
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setActiveTab("tsToDate")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === "tsToDate"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Timestamp → Date / Time
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("dateToTs")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === "dateToTs"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Date / Time Picker → Timestamp
          </button>
        </div>

        {/* Tab 1: Timestamp to Date */}
        {activeTab === "tsToDate" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50 sm:p-5">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="ts-input" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Enter Unix Timestamp:
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Unit:</span>
                    <div className="inline-flex rounded-lg border border-gray-300 p-0.5 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <button
                        type="button"
                        onClick={() => setUnitMode("auto")}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                          unitMode === "auto"
                            ? "bg-blue-600 text-white"
                            : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        }`}
                      >
                        Auto
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnitMode("seconds")}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                          unitMode === "seconds"
                            ? "bg-blue-600 text-white"
                            : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        }`}
                      >
                        Seconds (s)
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnitMode("milliseconds")}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                          unitMode === "milliseconds"
                            ? "bg-blue-600 text-white"
                            : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        }`}
                      >
                        Milliseconds (ms)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <input
                    id="ts-input"
                    type="text"
                    value={tsInput}
                    onChange={(e) => setTsInput(e.target.value)}
                    placeholder="e.g. 1788114108"
                    className="w-full p-3 font-mono text-base sm:text-lg rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {tsInput && (
                    <button
                      type="button"
                      onClick={() => setTsInput("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Quick Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">Quick presets:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickTs("now")}
                    className="rounded bg-white px-2.5 py-1 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Now
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTs("todayStart")}
                    className="rounded bg-white px-2.5 py-1 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Start of Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTs("todayEnd")}
                    className="rounded bg-white px-2.5 py-1 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    End of Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTs("minusHour")}
                    className="rounded bg-white px-2.5 py-1 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    -1 Hour
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTs("plusHour")}
                    className="rounded bg-white px-2.5 py-1 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    +1 Hour
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTs("minusDay")}
                    className="rounded bg-white px-2.5 py-1 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    -1 Day
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTs("plusDay")}
                    className="rounded bg-white px-2.5 py-1 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    +1 Day
                  </button>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            {parsedFromTs.valid && parsedFromTs.date ? (
              <FormatResultsGrid
                date={parsedFromTs.date}
                nowDate={nowDate}
                copiedKey={copiedKey}
                onCopy={copyToClipboard}
                prefix="ts"
              />
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                ⚠️ {parsedFromTs.error}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Date to Timestamp */}
        {activeTab === "dateToTs" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50 sm:p-5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="datetime-picker" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Select Date & Time:
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Interpret as:</span>
                    <div className="inline-flex rounded-lg border border-gray-300 p-0.5 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <button
                        type="button"
                        onClick={() => setDateInputTz("local")}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          dateInputTz === "local"
                            ? "bg-blue-600 text-white"
                            : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        }`}
                      >
                        Local Timezone
                      </button>
                      <button
                        type="button"
                        onClick={() => setDateInputTz("utc")}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          dateInputTz === "utc"
                            ? "bg-blue-600 text-white"
                            : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        }`}
                      >
                        UTC Time
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <input
                      id="datetime-picker"
                      type="datetime-local"
                      step="1"
                      value={dateInput}
                      onChange={(e) => setDateInput(e.target.value)}
                      className="w-full p-3 font-mono text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDate("now")}
                      className="flex-1 py-3 px-3 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium transition-colors"
                    >
                      Set to Now
                    </button>
                  </div>
                </div>

                {/* Quick presets for date */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">Quick presets:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickDate("todayStart")}
                    className="rounded bg-white px-2.5 py-1 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Start of Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate("todayEnd")}
                    className="rounded bg-white px-2.5 py-1 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    End of Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate("minusDay")}
                    className="rounded bg-white px-2.5 py-1 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate("plusDay")}
                    className="rounded bg-white px-2.5 py-1 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Tomorrow
                  </button>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            {parsedFromDate.valid && parsedFromDate.date ? (
              <FormatResultsGrid
                date={parsedFromDate.date}
                nowDate={nowDate}
                copiedKey={copiedKey}
                onCopy={copyToClipboard}
                prefix="date"
              />
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                ⚠️ {parsedFromDate.error}
              </div>
            )}
          </div>
        )}

        {/* Cheat sheet / Developer Reference */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/50">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">
            Developer Reference: Getting Current Timestamp
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { lang: "JavaScript", code: "Math.floor(Date.now() / 1000)" },
              { lang: "Python", code: "import time; int(time.time())" },
              { lang: "PHP", code: "time()" },
              { lang: "Go", code: "time.Now().Unix()" },
              { lang: "Java", code: "Instant.now().getEpochSecond()" },
              { lang: "C# (.NET)", code: "DateTimeOffset.UtcNow.ToUnixTimeSeconds()" },
              { lang: "Ruby", code: "Time.now.to_i" },
              { lang: "Rust", code: "SystemTime::now().duration_since(UNIX_EPOCH)" },
              { lang: "SQL (Postgres)", code: "EXTRACT(EPOCH FROM NOW())" },
            ].map((item) => (
              <div
                key={item.lang}
                className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{item.lang}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(item.code, `code-${item.lang}`)}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {copiedKey === `code-${item.lang}` ? "Copied!" : "Copy"}
                  </button>
                </div>
                <code className="block font-mono text-xs text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-nowrap">
                  {item.code}
                </code>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div><strong className="text-gray-800 dark:text-gray-200">1 hour:</strong> 3,600 seconds</div>
            <div><strong className="text-gray-800 dark:text-gray-200">1 day:</strong> 86,400 seconds</div>
            <div><strong className="text-gray-800 dark:text-gray-200">1 week:</strong> 604,800 seconds</div>
            <div><strong className="text-gray-800 dark:text-gray-200">30 days:</strong> 2,592,000 seconds</div>
            <div><strong className="text-gray-800 dark:text-gray-200">365 days:</strong> 31,536,000 seconds</div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

// Subcomponent to display formatted results
interface FormatResultsGridProps {
  date: Date;
  nowDate: Date;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  prefix: string;
}

function FormatResultsGrid({ date, nowDate, copiedKey, onCopy, prefix }: FormatResultsGridProps) {
  const seconds = Math.floor(date.getTime() / 1000);
  const milliseconds = date.getTime();
  const iso = date.toISOString();
  const utc = date.toUTCString();
  const local = date.toString();
  const relative = getRelativeTimeString(date, nowDate);
  const dayOfYear = getDayOfYear(date);
  const weekNum = getWeekNumber(date);
  const leap = isLeapYear(date.getFullYear());

  const formats = [
    {
      id: "seconds",
      label: "Unix Timestamp (Seconds)",
      value: seconds.toString(),
      highlight: true,
    },
    {
      id: "milliseconds",
      label: "Unix Timestamp (Milliseconds)",
      value: milliseconds.toString(),
      highlight: true,
    },
    {
      id: "utc",
      label: "UTC / GMT Format",
      value: utc,
    },
    {
      id: "local",
      label: "Local Timezone Format",
      value: local,
    },
    {
      id: "iso",
      label: "ISO 8601 Format",
      value: iso,
    },
    {
      id: "relative",
      label: "Relative Time",
      value: relative,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
        Converted Formats
      </h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {formats.map((item) => {
          const key = `${prefix}-${item.id}`;
          const isCopied = copiedKey === key;

          return (
            <div
              key={item.id}
              className={`group flex flex-col justify-between rounded-xl border p-4 transition-all ${
                item.highlight
                  ? "border-blue-200 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20"
                  : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800/80"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {item.label}
                </span>
                <button
                  type="button"
                  onClick={() => onCopy(item.value, key)}
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors ${
                    isCopied
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                  }`}
                  title="Copy to clipboard"
                >
                  {isCopied ? (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="font-mono text-sm font-medium text-gray-900 dark:text-white break-all">
                {item.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Date metadata badges */}
      <div className="flex flex-wrap gap-2 pt-2 text-xs">
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">
          Day of Year: <strong className="ml-1 text-gray-900 dark:text-white">{dayOfYear}</strong>
        </span>
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">
          ISO Week: <strong className="ml-1 text-gray-900 dark:text-white">#{weekNum}</strong>
        </span>
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">
          Leap Year: <strong className="ml-1 text-gray-900 dark:text-white">{leap ? "Yes" : "No"}</strong>
        </span>
      </div>
    </div>
  );
}
