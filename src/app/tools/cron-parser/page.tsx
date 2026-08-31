"use client";

import { useState, useMemo, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";

interface FieldDefinition {
  name: string;
  key: string;
  min: number;
  max: number;
  namesMap?: Record<string, number>;
  reverseNamesMap?: Record<number, string>;
  description: string;
}

const MONTH_NAMES: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

const MONTH_NAMES_REV: Record<number, string> = {
  1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June",
  7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December",
};

const DOW_NAMES: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

const DOW_NAMES_REV: Record<number, string> = {
  0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday",
};

const FIELDS: FieldDefinition[] = [
  {
    name: "Minute",
    key: "minute",
    min: 0,
    max: 59,
    description: "Minutes past the hour (0 - 59)",
  },
  {
    name: "Hour",
    key: "hour",
    min: 0,
    max: 23,
    description: "Hours of the day (0 - 23, 24-hour clock)",
  },
  {
    name: "Day of Month",
    key: "dom",
    min: 1,
    max: 31,
    description: "Days of the month (1 - 31)",
  },
  {
    name: "Month",
    key: "month",
    min: 1,
    max: 12,
    namesMap: MONTH_NAMES,
    reverseNamesMap: MONTH_NAMES_REV,
    description: "Months of the year (1 - 12 or JAN - DEC)",
  },
  {
    name: "Day of Week",
    key: "dow",
    min: 0,
    max: 7,
    namesMap: DOW_NAMES,
    reverseNamesMap: DOW_NAMES_REV,
    description: "Days of the week (0 - 7 or SUN - SAT, 0 & 7 = Sunday)",
  },
];

interface ParsedField {
  raw: string;
  fieldDef: FieldDefinition;
  valid: boolean;
  error?: string;
  values: number[];
  isWildcard: boolean;
  isStep: boolean;
  explanation: string;
}

interface ParsedCron {
  valid: boolean;
  error?: string;
  fields: ParsedField[];
  humanExplanation: string;
}

// Helper to format hours in 12-hour AM/PM format
function formatHour12(h: number): string {
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${period}`;
}

// Helper to format full time in 12-hour format
function formatTime12(h: number, m: number): string {
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const padM = m.toString().padStart(2, "0");
  return `${hour12}:${padM} ${period}`;
}

// Helper for relative time description
function getRelativeTime(targetDate: Date, now: Date): string {
  const diffMs = targetDate.getTime() - now.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec <= 0) return "just now";
  if (diffSec < 60) return `in ${diffSec}s`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `in ${diffMin} min${diffMin > 1 ? "s" : ""}`;

  const diffHours = Math.floor(diffMin / 60);
  const remainingMins = diffMin % 60;
  if (diffHours < 24) {
    return `in ${diffHours}h ${remainingMins > 0 ? `${remainingMins}m` : ""}`;
  }

  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;
  if (diffDays === 1) return `tomorrow in ${diffHours}h`;
  if (diffDays < 30) return `in ${diffDays} days ${remainingHours > 0 ? `${remainingHours}h` : ""}`;

  const diffMonths = Math.floor(diffDays / 30);
  return `in ${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
}

// Parse a single cron field token
function parseCronField(raw: string, fieldDef: FieldDefinition): ParsedField {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      raw,
      fieldDef,
      valid: false,
      error: `Field "${fieldDef.name}" cannot be empty`,
      values: [],
      isWildcard: false,
      isStep: false,
      explanation: "",
    };
  }

  const isWildcard = trimmed === "*";
  const isStep = trimmed.includes("/");
  const valuesSet = new Set<number>();

  const convertTokenToNum = (tok: string): number | null => {
    const upper = tok.trim().toUpperCase();
    if (fieldDef.namesMap && fieldDef.namesMap[upper] !== undefined) {
      return fieldDef.namesMap[upper];
    }
    const n = Number(tok);
    if (!isNaN(n) && Number.isInteger(n)) {
      return n;
    }
    return null;
  };

  const parts = trimmed.split(",");

  for (const part of parts) {
    const subParts = part.split("/");

    if (subParts.length > 2) {
      return {
        raw,
        fieldDef,
        valid: false,
        error: `Invalid step expression "${part}" in ${fieldDef.name}`,
        values: [],
        isWildcard,
        isStep,
        explanation: "",
      };
    }

    let rangeStart = fieldDef.min;
    let rangeEnd = fieldDef.max;
    let step = 1;

    if (subParts.length === 2) {
      const stepNum = Number(subParts[1]);
      if (isNaN(stepNum) || stepNum < 1 || !Number.isInteger(stepNum)) {
        return {
          raw,
          fieldDef,
          valid: false,
          error: `Invalid step value "${subParts[1]}" in ${fieldDef.name}`,
          values: [],
          isWildcard,
          isStep,
          explanation: "",
        };
      }
      step = stepNum;
    }

    const basePart = subParts[0].trim();

    if (basePart === "*") {
      rangeStart = fieldDef.min;
      rangeEnd = fieldDef.max;
    } else if (basePart.includes("-")) {
      const rangeParts = basePart.split("-");
      if (rangeParts.length !== 2) {
        return {
          raw,
          fieldDef,
          valid: false,
          error: `Invalid range "${basePart}" in ${fieldDef.name}`,
          values: [],
          isWildcard,
          isStep,
          explanation: "",
        };
      }
      const startNum = convertTokenToNum(rangeParts[0]);
      const endNum = convertTokenToNum(rangeParts[1]);

      if (startNum === null || endNum === null) {
        return {
          raw,
          fieldDef,
          valid: false,
          error: `Invalid range bounds "${basePart}" in ${fieldDef.name}`,
          values: [],
          isWildcard,
          isStep,
          explanation: "",
        };
      }

      if (startNum < fieldDef.min || endNum > fieldDef.max) {
        return {
          raw,
          fieldDef,
          valid: false,
          error: `Range ${startNum}-${endNum} out of bounds (${fieldDef.min}-${fieldDef.max}) in ${fieldDef.name}`,
          values: [],
          isWildcard,
          isStep,
          explanation: "",
        };
      }

      if (startNum > endNum) {
        return {
          raw,
          fieldDef,
          valid: false,
          error: `Range start ${startNum} is greater than end ${endNum} in ${fieldDef.name}`,
          values: [],
          isWildcard,
          isStep,
          explanation: "",
        };
      }

      rangeStart = startNum;
      rangeEnd = endNum;
    } else {
      const singleNum = convertTokenToNum(basePart);
      if (singleNum === null) {
        return {
          raw,
          fieldDef,
          valid: false,
          error: `Invalid token "${basePart}" in ${fieldDef.name}`,
          values: [],
          isWildcard,
          isStep,
          explanation: "",
        };
      }

      if (singleNum < fieldDef.min || singleNum > fieldDef.max) {
        return {
          raw,
          fieldDef,
          valid: false,
          error: `Value ${singleNum} out of allowed range (${fieldDef.min}-${fieldDef.max}) in ${fieldDef.name}`,
          values: [],
          isWildcard,
          isStep,
          explanation: "",
        };
      }

      if (subParts.length === 2) {
        rangeStart = singleNum;
        rangeEnd = fieldDef.max;
      } else {
        rangeStart = singleNum;
        rangeEnd = singleNum;
      }
    }

    for (let i = rangeStart; i <= rangeEnd; i += step) {
      let val = i;
      // In Day of Week, 7 is also Sunday (0)
      if (fieldDef.key === "dow" && val === 7) {
        val = 0;
      }
      valuesSet.add(val);
    }
  }

  const values = Array.from(valuesSet).sort((a, b) => a - b);

  // Build field-level explanation
  let explanation = "";
  if (isWildcard) {
    explanation = `Every ${fieldDef.name.toLowerCase()}`;
  } else if (trimmed.startsWith("*/")) {
    const stepVal = trimmed.substring(2);
    explanation = `Every ${stepVal} ${fieldDef.name.toLowerCase()}s`;
  } else if (fieldDef.key === "dow") {
    const dayNames = values.map((v) => DOW_NAMES_REV[v] || v.toString());
    if (values.length === 5 && values.every((v, i) => v === i + 1)) {
      explanation = "Monday through Friday (weekdays)";
    } else if (values.length === 2 && values.includes(0) && values.includes(6)) {
      explanation = "Saturday and Sunday (weekends)";
    } else {
      explanation = `On ${dayNames.join(", ")}`;
    }
  } else if (fieldDef.key === "month") {
    const monthNames = values.map((v) => MONTH_NAMES_REV[v] || `Month ${v}`);
    explanation = `In ${monthNames.join(", ")}`;
  } else if (fieldDef.key === "hour") {
    if (values.length === 1) {
      explanation = `At ${formatHour12(values[0])} (${values[0].toString().padStart(2, "0")}:00)`;
    } else {
      explanation = `At hours ${values.map((v) => v.toString().padStart(2, "0")).join(", ")}`;
    }
  } else if (fieldDef.key === "minute") {
    if (values.length === 1) {
      explanation = `At minute ${values[0]}`;
    } else {
      explanation = `At minutes ${values.join(", ")}`;
    }
  } else if (fieldDef.key === "dom") {
    if (values.length === 1) {
      explanation = `On day ${values[0]} of the month`;
    } else {
      explanation = `On days ${values.join(", ")} of the month`;
    }
  }

  return {
    raw,
    fieldDef,
    valid: true,
    values,
    isWildcard,
    isStep,
    explanation,
  };
}

// Generate overall human-readable explanation
function generateCronExplanation(fields: ParsedField[]): string {
  if (fields.some((f) => !f.valid)) return "Invalid cron expression";

  const [minF, hourF, domF, monthF, dowF] = fields;

  const minRaw = minF.raw.trim();
  const hourRaw = hourF.raw.trim();
  const domRaw = domF.raw.trim();
  const monthRaw = monthF.raw.trim();
  const dowRaw = dowF.raw.trim();

  // 1. Every minute (* * * * *)
  if (minRaw === "*" && hourRaw === "*" && domRaw === "*" && monthRaw === "*" && dowRaw === "*") {
    return "At every minute of every day";
  }

  // 2. Every N minutes (*/5 * * * *)
  if (minRaw.startsWith("*/") && hourRaw === "*" && domRaw === "*" && monthRaw === "*" && dowRaw === "*") {
    const step = minRaw.replace("*/", "");
    return `Every ${step} minutes`;
  }

  // 3. Every hour on minute 0 (0 * * * *)
  if (minRaw === "0" && hourRaw === "*" && domRaw === "*" && monthRaw === "*" && dowRaw === "*") {
    return "At the start of every hour (minute 0)";
  }

  // 4. Every N hours (0 */2 * * *)
  if (minRaw === "0" && hourRaw.startsWith("*/") && domRaw === "*" && monthRaw === "*" && dowRaw === "*") {
    const step = hourRaw.replace("*/", "");
    return `Every ${step} hours, at minute 0`;
  }

  // Build natural description
  const timeDesc: string[] = [];

  if (minF.values.length === 1 && hourF.values.length === 1) {
    const h = hourF.values[0];
    const m = minF.values[0];
    timeDesc.push(`At ${formatTime12(h, m)} (${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")})`);
  } else if (minF.values.length === 1 && hourF.isWildcard) {
    timeDesc.push(`At minute ${minF.values[0]} of every hour`);
  } else if (minRaw.startsWith("*/") && hourF.values.length === 1) {
    const step = minRaw.replace("*/", "");
    timeDesc.push(`Every ${step} minutes, during hour ${hourF.values[0]}`);
  } else if (minRaw.startsWith("*/") && hourF.isWildcard) {
    const step = minRaw.replace("*/", "");
    timeDesc.push(`Every ${step} minutes`);
  } else {
    timeDesc.push(`${minF.explanation}, ${hourF.explanation.toLowerCase()}`);
  }

  const dateDesc: string[] = [];

  // Day of Month & Day of Week
  if (!domF.isWildcard && dowF.isWildcard) {
    dateDesc.push(`on day ${domF.values.join(", ")} of the month`);
  } else if (domF.isWildcard && !dowF.isWildcard) {
    if (dowF.values.length === 5 && [1, 2, 3, 4, 5].every((v) => dowF.values.includes(v))) {
      dateDesc.push("Monday through Friday (weekdays)");
    } else if (dowF.values.length === 2 && dowF.values.includes(0) && dowF.values.includes(6)) {
      dateDesc.push("on weekends (Saturday and Sunday)");
    } else {
      const days = dowF.values.map((v) => DOW_NAMES_REV[v] || v.toString());
      dateDesc.push(`every ${days.join(", ")}`);
    }
  } else if (!domF.isWildcard && !dowF.isWildcard) {
    const days = dowF.values.map((v) => DOW_NAMES_REV[v] || v.toString());
    dateDesc.push(`on day ${domF.values.join(", ")} of the month and on ${days.join(", ")}`);
  }

  // Month
  if (!monthF.isWildcard) {
    const months = monthF.values.map((v) => MONTH_NAMES_REV[v] || `Month ${v}`);
    dateDesc.push(`in ${months.join(", ")}`);
  }

  if (dateDesc.length === 0) {
    return `${timeDesc.join(", ")}, every day`;
  }

  return `${timeDesc.join(", ")}, ${dateDesc.join(", ")}`;
}

// Calculate next scheduled run times (up to count)
function computeNextRuns(fields: ParsedField[], count: number = 10, timezone: "local" | "utc" = "local"): Date[] {
  if (fields.some((f) => !f.valid)) return [];

  const [minF, hourF, domF, monthF, dowF] = fields;
  const minSet = new Set(minF.values);
  const hourSet = new Set(hourF.values);
  const domSet = new Set(domF.values);
  const monthSet = new Set(monthF.values);
  const dowSet = new Set(dowF.values);

  const results: Date[] = [];
  const start = new Date();

  // Start from next minute
  const current = new Date(start.getTime());
  current.setSeconds(0, 0);
  current.setMinutes(current.getMinutes() + 1);

  // Safety limit to avoid infinite loops (max 5 years or 500,000 steps)
  let steps = 0;
  const maxSteps = 500000;

  while (results.length < count && steps < maxSteps) {
    steps++;

    const getYear = timezone === "utc" ? current.getUTCFullYear() : current.getFullYear();
    const getMonth = (timezone === "utc" ? current.getUTCMonth() : current.getMonth()) + 1;
    const getDate = timezone === "utc" ? current.getUTCDate() : current.getDate();
    const getDay = timezone === "utc" ? current.getUTCDay() : current.getDay();
    const getHour = timezone === "utc" ? current.getUTCHours() : current.getHours();
    const getMin = timezone === "utc" ? current.getUTCMinutes() : current.getMinutes();

    // Check Month
    if (!monthSet.has(getMonth)) {
      // Advance to start of next month
      if (timezone === "utc") {
        current.setUTCMonth(current.getUTCMonth() + 1, 1);
        current.setUTCHours(0, 0, 0, 0);
      } else {
        current.setMonth(current.getMonth() + 1, 1);
        current.setHours(0, 0, 0, 0);
      }
      continue;
    }

    // Check Day of Month & Day of Week
    const domMatch = domSet.has(getDate);
    const dowMatch = dowSet.has(getDay);

    let dayMatch = false;
    if (domF.isWildcard && dowF.isWildcard) {
      dayMatch = true;
    } else if (!domF.isWildcard && dowF.isWildcard) {
      dayMatch = domMatch;
    } else if (domF.isWildcard && !dowF.isWildcard) {
      dayMatch = dowMatch;
    } else {
      // Both specified: standard cron OR matching
      dayMatch = domMatch || dowMatch;
    }

    if (!dayMatch) {
      // Advance to next day
      if (timezone === "utc") {
        current.setUTCDate(current.getUTCDate() + 1);
        current.setUTCHours(0, 0, 0, 0);
      } else {
        current.setDate(current.getDate() + 1);
        current.setHours(0, 0, 0, 0);
      }
      continue;
    }

    // Check Hour
    if (!hourSet.has(getHour)) {
      // Advance to next hour
      if (timezone === "utc") {
        current.setUTCHours(current.getUTCHours() + 1, 0, 0, 0);
      } else {
        current.setHours(current.getHours() + 1, 0, 0, 0);
      }
      continue;
    }

    // Check Minute
    if (minSet.has(getMin)) {
      results.push(new Date(current.getTime()));
    }

    // Advance 1 minute
    if (timezone === "utc") {
      current.setUTCMinutes(current.getUTCMinutes() + 1);
    } else {
      current.setMinutes(current.getMinutes() + 1);
    }
  }

  return results;
}

const PRESETS = [
  { name: "Every minute", cron: "* * * * *", category: "Frequent" },
  { name: "Every 5 minutes", cron: "*/5 * * * *", category: "Frequent" },
  { name: "Every 15 minutes", cron: "*/15 * * * *", category: "Frequent" },
  { name: "Every 30 minutes", cron: "*/30 * * * *", category: "Frequent" },
  { name: "Every hour", cron: "0 * * * *", category: "Hourly" },
  { name: "Every 2 hours", cron: "0 */2 * * *", category: "Hourly" },
  { name: "Every 6 hours", cron: "0 */6 * * *", category: "Hourly" },
  { name: "Every day at midnight", cron: "0 0 * * *", category: "Daily" },
  { name: "Every day at 9:00 AM", cron: "0 9 * * *", category: "Daily" },
  { name: "Every weekday at 9:00 AM", cron: "0 9 * * 1-5", category: "Weekly" },
  { name: "Every Monday at midnight", cron: "0 0 * * 1", category: "Weekly" },
  { name: "Every Sunday at midnight", cron: "0 0 * * 0", category: "Weekly" },
  { name: "Twice daily (12am & 12pm)", cron: "0 0,12 * * *", category: "Daily" },
  { name: "1st of every month (midnight)", cron: "0 0 1 * *", category: "Monthly" },
  { name: "1st & 15th of every month", cron: "0 0 1,15 * *", category: "Monthly" },
  { name: "Quarterly (Jan, Apr, Jul, Oct 1st)", cron: "0 0 1 1,4,7,10 *", category: "Monthly" },
];

export default function CronParserPage() {
  const [cronExpression, setCronExpression] = useState<string>("*/5 * * * *");
  const [runCount, setRunCount] = useState<number>(8);
  const [timezone, setTimezone] = useState<"local" | "utc">("local");
  const [copiedCron, setCopiedCron] = useState<boolean>(false);
  const [copiedSchedule, setCopiedSchedule] = useState<boolean>(false);

  // Parse 5-part cron expression
  const parsedCron = useMemo<ParsedCron>(() => {
    const rawTrimmed = cronExpression.trim();
    if (!rawTrimmed) {
      return {
        valid: false,
        error: "Please enter a 5-part cron expression",
        fields: [],
        humanExplanation: "",
      };
    }

    const tokens = rawTrimmed.split(/\s+/);
    if (tokens.length !== 5) {
      return {
        valid: false,
        error: `Expected 5 space-separated parts (Minute Hour Day-of-Month Month Day-of-Week), found ${tokens.length}`,
        fields: [],
        humanExplanation: "",
      };
    }

    const fields = tokens.map((token, index) => {
      return parseCronField(token, FIELDS[index]);
    });

    const invalidField = fields.find((f) => !f.valid);
    if (invalidField) {
      return {
        valid: false,
        error: invalidField.error || "Invalid cron field",
        fields,
        humanExplanation: "",
      };
    }

    const humanExplanation = generateCronExplanation(fields);

    return {
      valid: true,
      fields,
      humanExplanation,
    };
  }, [cronExpression]);

  // Compute next runs
  const nextRuns = useMemo(() => {
    if (!parsedCron.valid || parsedCron.fields.length !== 5) return [];
    return computeNextRuns(parsedCron.fields, runCount, timezone);
  }, [parsedCron, runCount, timezone]);

  // Copy Cron String
  const handleCopyCron = async () => {
    try {
      await navigator.clipboard.writeText(cronExpression.trim());
      setCopiedCron(true);
      setTimeout(() => setCopiedCron(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Copy Next Run Times
  const handleCopySchedule = async () => {
    if (nextRuns.length === 0) return;
    const text = nextRuns
      .map((d, i) => `${i + 1}. ${timezone === "utc" ? d.toUTCString() : d.toString()}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSchedule(true);
      setTimeout(() => setCopiedSchedule(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Handle single field input update
  const handleFieldChange = useCallback(
    (index: number, val: string) => {
      const tokens = cronExpression.trim().split(/\s+/);
      while (tokens.length < 5) tokens.push("*");
      tokens[index] = val || "*";
      setCronExpression(tokens.join(" "));
    },
    [cronExpression]
  );

  const now = useMemo(() => new Date(), []);

  return (
    <ToolLayout
      title="Cron Expression Parser"
      description="Parse, validate, and convert 5-field cron expressions into plain English explanations and calculate the next scheduled execution times."
    >
      <title>Cron Expression Parser Online — DevToolbox</title>
      <meta
        name="description"
        content="Free online cron expression parser and schedule calculator. Convert 5-part cron syntax (* * * * *) to human-readable English and calculate upcoming run dates."
      />

      <div className="space-y-6">
        {/* Top Preset Gallery */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 p-4 space-y-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/80 dark:border-gray-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Common Cron Presets
            </span>
            <span className="text-xs text-gray-400">Click any preset to load</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const isSelected = cronExpression.trim() === p.cron;
              return (
                <button
                  key={p.cron + p.name}
                  type="button"
                  onClick={() => setCronExpression(p.cron)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? "bg-blue-600 border-blue-600 text-white font-semibold shadow-xs"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700"
                  }`}
                >
                  <span>{p.name}</span>
                  <code
                    className={`font-mono text-[11px] px-1 py-0.5 rounded ${
                      isSelected
                        ? "bg-blue-700 text-blue-100"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {p.cron}
                  </code>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Cron Input Bar */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label htmlFor="cron-main-input" className="text-sm font-bold text-gray-900 dark:text-white">
              Enter Cron Expression (5 fields)
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 font-mono">Minute Hour Day Month Weekday</span>
              <button
                type="button"
                onClick={handleCopyCron}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                {copiedCron ? "Copied!" : "Copy Expression"}
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              id="cron-main-input"
              type="text"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              placeholder="* * * * *"
              className="w-full p-4 font-mono text-xl sm:text-2xl tracking-wider rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-inner"
            />
          </div>

          {/* Human Readable Explanation Banner */}
          {parsedCron.valid ? (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold mt-0.5">
                ✓
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                  Human-Readable Schedule
                </span>
                <p className="mt-0.5 text-base sm:text-lg font-bold">
                  “{parsedCron.humanExplanation}”
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50/80 dark:border-rose-900/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold mt-0.5">
                !
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                  Syntax Error
                </span>
                <p className="mt-0.5 text-sm font-medium">{parsedCron.error}</p>
              </div>
            </div>
          )}
        </div>

        {/* 5 Field Breakdown Interactive Cards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Cron Field Breakdown &amp; Structure
            </h3>
            <span className="text-xs text-gray-400">Edit individual fields directly below</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {FIELDS.map((fDef, idx) => {
              const parsedF = parsedCron.fields[idx];
              const rawToken = parsedF ? parsedF.raw : "";
              const isValid = parsedF ? parsedF.valid : true;

              return (
                <div
                  key={fDef.key}
                  className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all ${
                    isValid
                      ? "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850"
                      : "border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                        {fDef.name}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {fDef.min}-{fDef.max}
                      </span>
                    </div>

                    <input
                      type="text"
                      value={rawToken}
                      onChange={(e) => handleFieldChange(idx, e.target.value)}
                      placeholder="*"
                      className="w-full p-2 font-mono text-base font-bold text-center rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />

                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                      {fDef.description}
                    </p>
                  </div>

                  {parsedF && parsedF.valid && (
                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 block truncate">
                        {parsedF.explanation}
                      </span>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5 truncate" title={parsedF.values.join(", ")}>
                        Matches {parsedF.values.length} {parsedF.values.length === 1 ? "value" : "values"}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scheduled Runs Section */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold">
                ⏰
              </span>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Upcoming Scheduled Runs (Next {runCount})
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Timezone Toggle */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 dark:text-gray-400">Timezone:</span>
                <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-700 p-0.5 bg-gray-100 dark:bg-gray-800">
                  <button
                    type="button"
                    onClick={() => setTimezone("local")}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                      timezone === "local"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    Local Time
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimezone("utc")}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                      timezone === "utc"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    UTC
                  </button>
                </div>
              </div>

              {/* Count selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 dark:text-gray-400">Count:</span>
                <select
                  value={runCount}
                  onChange={(e) => setRunCount(Number(e.target.value))}
                  className="p-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none"
                >
                  <option value={5}>5 runs</option>
                  <option value={8}>8 runs</option>
                  <option value={10}>10 runs</option>
                  <option value={15}>15 runs</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleCopySchedule}
                disabled={nextRuns.length === 0}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 rounded text-xs font-medium transition-colors cursor-pointer"
              >
                {copiedSchedule ? "Copied List!" : "Copy Schedule"}
              </button>
            </div>
          </div>

          {nextRuns.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[420px] overflow-y-auto">
              {nextRuns.map((date, idx) => {
                const relative = getRelativeTime(date, now);
                const isLocal = timezone === "local";
                const dateStr = isLocal
                  ? date.toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : date.toUTCString().slice(0, 16);

                const timeStr = isLocal
                  ? date.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })
                  : date.toUTCString().slice(17, 25) + " UTC";

                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-lg transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white mr-2">
                          {dateStr}
                        </span>
                        <span className="font-mono text-gray-600 dark:text-gray-300">
                          {timeStr}
                        </span>
                      </div>
                    </div>

                    <div className="mt-1 sm:mt-0 flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-medium">
                        {relative}
                      </span>
                      <span className="font-mono text-[11px] text-gray-400 hidden md:inline">
                        {date.toISOString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">
              No upcoming runs calculated. Please check your cron expression.
            </div>
          )}
        </div>

        {/* Cron Syntax Cheat Sheet */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Cron Syntax Reference &amp; Special Characters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-gray-50 dark:bg-gray-850/60 rounded-xl border border-gray-200 dark:border-gray-800 space-y-1">
              <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">* (Asterisk)</div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">Wildcard (Any Value)</p>
              <p className="text-gray-500 dark:text-gray-400">
                Matches every possible value in the field. E.g. <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">*</code> in hour means every hour.
              </p>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-850/60 rounded-xl border border-gray-200 dark:border-gray-800 space-y-1">
              <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">, (Comma)</div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">Value List</p>
              <p className="text-gray-500 dark:text-gray-400">
                Specifies discrete multiple values. E.g. <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">1,15,30</code> in minute runs at minutes 1, 15, 30.
              </p>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-850/60 rounded-xl border border-gray-200 dark:border-gray-800 space-y-1">
              <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">- (Hyphen)</div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">Range of Values</p>
              <p className="text-gray-500 dark:text-gray-400">
                Specifies an inclusive range. E.g. <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">1-5</code> in weekday means Monday through Friday.
              </p>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-850/60 rounded-xl border border-gray-200 dark:border-gray-800 space-y-1">
              <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">/ (Slash)</div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">Step Values</p>
              <p className="text-gray-500 dark:text-gray-400">
                Specifies step increments. E.g. <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">*/15</code> in minute runs every 15 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
