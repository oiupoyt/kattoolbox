"use client";

import { useState, useCallback, useId } from "react";
import ToolLayout from "@/components/ToolLayout";

interface StatusInfo {
  type: "idle" | "success" | "error";
  message?: string;
  charCount?: number;
  lineCount?: number;
  reduction?: number;
}

const SAMPLE_SQL = `SELECT 
u.id AS user_id, 
u.first_name || ' ' || u.last_name AS full_name, 
u.email, 
COUNT(DISTINCT o.id) AS total_orders, 
SUM(o.total_amount) AS total_spent, 
AVG(o.total_amount) AS avg_order_value, 
CASE 
WHEN SUM(o.total_amount) >= 10000 THEN 'VIP' 
WHEN SUM(o.total_amount) BETWEEN 5000 AND 9999 THEN 'Gold' 
WHEN SUM(o.total_amount) BETWEEN 1000 AND 4999 THEN 'Silver' 
ELSE 'Standard' 
END AS customer_tier 
FROM users u 
INNER JOIN orders o ON u.id = o.user_id 
LEFT JOIN payments p ON o.id = p.order_id 
WHERE o.status IN ('completed', 'delivered') 
AND o.created_at >= '2025-01-01' 
AND u.active = true 
AND (u.country = 'US' OR u.country = 'CA') 
GROUP BY u.id, u.first_name, u.last_name, u.email 
HAVING COUNT(o.id) >= 2 AND SUM(o.total_amount) > 500 
ORDER BY total_spent DESC, total_orders DESC 
LIMIT 50 OFFSET 0;`;

const MAJOR_CLAUSES = [
  "CREATE TABLE",
  "ALTER TABLE",
  "DROP TABLE",
  "INSERT INTO",
  "DELETE FROM",
  "LEFT OUTER JOIN",
  "RIGHT OUTER JOIN",
  "FULL OUTER JOIN",
  "CROSS JOIN",
  "INNER JOIN",
  "LEFT JOIN",
  "RIGHT JOIN",
  "FULL JOIN",
  "UNION ALL",
  "UNION",
  "SELECT DISTINCT",
  "SELECT",
  "FROM",
  "WHERE",
  "GROUP BY",
  "HAVING",
  "ORDER BY",
  "LIMIT",
  "OFFSET",
  "SET",
  "VALUES",
  "JOIN",
  "UPDATE",
  "DELETE",
  "CREATE",
  "ALTER",
  "DROP",
  "WITH",
];

const SUB_CLAUSES = [
  "AND",
  "OR",
  "ON",
  "WHEN",
  "THEN",
  "ELSE",
  "CASE",
  "END",
];

const KEYWORDS_LIST = [
  "SELECT", "FROM", "WHERE", "JOIN", "ON", "AND", "OR", "ORDER", "BY", "GROUP",
  "HAVING", "INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP", "SET",
  "VALUES", "INTO", "LIMIT", "OFFSET", "UNION", "INNER", "LEFT", "RIGHT", "OUTER",
  "CROSS", "AS", "IN", "NOT", "NULL", "IS", "BETWEEN", "LIKE", "EXISTS", "CASE",
  "WHEN", "THEN", "ELSE", "END", "DISTINCT", "COUNT", "SUM", "AVG", "MIN", "MAX",
  "ALL", "ANY", "ASC", "DESC", "TABLE", "DATABASE", "INDEX", "VIEW", "PRIMARY",
  "FOREIGN", "KEY", "REFERENCES", "DEFAULT", "CASCADE", "CONSTRAINT", "IF",
  "WITH", "RECURSIVE", "RETURNING", "FETCH", "FIRST", "ROWS", "ONLY", "TOP",
  "OVER", "PARTITION", "ROW_NUMBER", "RANK", "DENSE_RANK", "COALESCE", "NULLIF",
  "CAST", "CONVERT", "TRUE", "FALSE", "BOOLEAN", "VARCHAR", "INTEGER", "INT",
  "TEXT", "DECIMAL", "NUMERIC", "FLOAT", "DATE", "TIMESTAMP", "BIGINT", "SMALLINT"
];

const KEYWORDS_SET = new Set(KEYWORDS_LIST.map((k) => k.toUpperCase()));

interface RawToken {
  type: "word" | "string" | "comment" | "symbol" | "number" | "space";
  value: string;
}

function tokenizeSql(sql: string): RawToken[] {
  const tokens: RawToken[] = [];
  let i = 0;
  const n = sql.length;

  while (i < n) {
    const char = sql[i];
    const next = sql[i + 1];

    // Single-line comment (-- ...)
    if (char === "-" && next === "-") {
      let end = sql.indexOf("\n", i);
      if (end === -1) end = n;
      tokens.push({ type: "comment", value: sql.slice(i, end) });
      i = end;
      continue;
    }

    // Multi-line comment (/* ... */)
    if (char === "/" && next === "*") {
      let end = sql.indexOf("*/", i + 2);
      if (end === -1) end = n;
      else end += 2;
      tokens.push({ type: "comment", value: sql.slice(i, end) });
      i = end;
      continue;
    }

    // Single-quoted string ('...')
    if (char === "'") {
      let str = "'";
      i++;
      while (i < n) {
        if (sql[i] === "'") {
          str += "'";
          if (sql[i + 1] === "'") {
            str += "'";
            i += 2;
            continue;
          }
          i++;
          break;
        } else if (sql[i] === "\\") {
          str += sql[i] + (sql[i + 1] || "");
          i += 2;
        } else {
          str += sql[i];
          i++;
        }
      }
      tokens.push({ type: "string", value: str });
      continue;
    }

    // Double-quoted string or identifier ("...")
    if (char === '"' || char === "`") {
      const quote = char;
      let str = quote;
      i++;
      while (i < n) {
        if (sql[i] === quote) {
          str += quote;
          i++;
          break;
        } else if (sql[i] === "\\") {
          str += sql[i] + (sql[i + 1] || "");
          i += 2;
        } else {
          str += sql[i];
          i++;
        }
      }
      tokens.push({ type: "string", value: str });
      continue;
    }

    // Whitespace
    if (/\s/.test(char)) {
      let space = "";
      while (i < n && /\s/.test(sql[i])) {
        space += sql[i];
        i++;
      }
      tokens.push({ type: "space", value: space });
      continue;
    }

    // Numbers
    if (/[0-9]/.test(char)) {
      let num = "";
      while (i < n && /[0-9.eE+-]/.test(sql[i])) {
        num += sql[i];
        i++;
      }
      tokens.push({ type: "number", value: num });
      continue;
    }

    // Word / Identifier / Keyword
    if (/[a-zA-Z_#$]/.test(char)) {
      let word = "";
      while (i < n && /[a-zA-Z0-9_#$]/.test(sql[i])) {
        word += sql[i];
        i++;
      }
      tokens.push({ type: "word", value: word });
      continue;
    }

    // Multi-char operators (>=, <=, <>, !=, ||, :=)
    if (
      (char === ">" && next === "=") ||
      (char === "<" && (next === "=" || next === ">")) ||
      (char === "!" && next === "=") ||
      (char === "|" && next === "|") ||
      (char === ":" && next === "=")
    ) {
      tokens.push({ type: "symbol", value: sql.slice(i, i + 2) });
      i += 2;
      continue;
    }

    // Single-char symbols (comma, parens, semicolon, operators)
    tokens.push({ type: "symbol", value: char });
    i++;
  }

  return tokens;
}

function formatSql(
  sql: string,
  options: {
    indentStr: string;
    keywordCase: "upper" | "lower" | "preserve";
    breakCommas: boolean;
  }
): string {
  const rawTokens = tokenizeSql(sql);
  if (rawTokens.length === 0) return "";

  // Combine consecutive words for compound clauses (e.g. ORDER + BY -> ORDER BY, LEFT + JOIN -> LEFT JOIN)
  const tokens: { type: "clause" | "subclause" | "keyword" | "word" | "string" | "comment" | "symbol" | "number"; value: string }[] = [];

  for (let i = 0; i < rawTokens.length; i++) {
    const t = rawTokens[i];
    if (t.type === "space") continue;

    if (t.type === "word") {
      // Lookahead for 2-word or 3-word clauses
      let matchedClause: string | null = null;
      let consumed = 0;

      // Check 3 words
      if (i + 4 < rawTokens.length) {
        const t1 = rawTokens[i];
        const sp1 = rawTokens[i + 1];
        const t2 = rawTokens[i + 2];
        const sp2 = rawTokens[i + 3];
        const t3 = rawTokens[i + 4];
        if (t1.type === "word" && sp1.type === "space" && t2.type === "word" && sp2.type === "space" && t3.type === "word") {
          const phrase = `${t1.value} ${t2.value} ${t3.value}`.toUpperCase();
          if (MAJOR_CLAUSES.includes(phrase)) {
            matchedClause = phrase;
            consumed = 4;
          }
        }
      }

      // Check 2 words
      if (!matchedClause && i + 2 < rawTokens.length) {
        const t1 = rawTokens[i];
        const sp1 = rawTokens[i + 1];
        const t2 = rawTokens[i + 2];
        if (t1.type === "word" && sp1.type === "space" && t2.type === "word") {
          const phrase = `${t1.value} ${t2.value}`.toUpperCase();
          if (MAJOR_CLAUSES.includes(phrase)) {
            matchedClause = phrase;
            consumed = 2;
          }
        }
      }

      if (matchedClause) {
        tokens.push({ type: "clause", value: matchedClause });
        i += consumed;
        continue;
      }

      const upper = t.value.toUpperCase();
      if (MAJOR_CLAUSES.includes(upper)) {
        tokens.push({ type: "clause", value: upper });
      } else if (SUB_CLAUSES.includes(upper)) {
        tokens.push({ type: "subclause", value: upper });
      } else if (KEYWORDS_SET.has(upper)) {
        tokens.push({ type: "keyword", value: upper });
      } else {
        tokens.push({ type: "word", value: t.value });
      }
      continue;
    }

    tokens.push(t as { type: "string" | "comment" | "symbol" | "number"; value: string });
  }

  // Adjust keyword casing
  const applyCase = (kw: string) => {
    if (options.keywordCase === "upper") return kw.toUpperCase();
    if (options.keywordCase === "lower") return kw.toLowerCase();
    return kw;
  };

  let formatted = "";
  let indentLevel = 0;
  let inSelect = false;
  let inParentheses = 0;

  const getIndent = (lvl: number) => options.indentStr.repeat(Math.max(0, lvl));

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prevToken = i > 0 ? tokens[i - 1] : null;

    if (token.type === "clause") {
      const clauseUpper = token.value.toUpperCase();
      if (clauseUpper.startsWith("SELECT")) {
        inSelect = true;
      } else {
        inSelect = false;
      }

      if (formatted.length > 0 && !formatted.endsWith("\n")) {
        formatted += "\n";
      }
      formatted += getIndent(indentLevel) + applyCase(token.value);

      // Add a space after clause unless next token is newline or paren
      const nextToken = tokens[i + 1];
      if (nextToken && nextToken.value !== ";") {
        formatted += " ";
      }
      continue;
    }

    if (token.type === "subclause") {
      const upper = token.value.toUpperCase();
      if (upper === "CASE") {
        formatted += applyCase(token.value) + " ";
        indentLevel++;
      } else if (upper === "END") {
        indentLevel = Math.max(0, indentLevel - 1);
        formatted += "\n" + getIndent(indentLevel + 1) + applyCase(token.value);
        if (tokens[i + 1] && tokens[i + 1].value !== "," && tokens[i + 1].value !== ";") {
          formatted += " ";
        }
      } else if (upper === "WHEN" || upper === "THEN" || upper === "ELSE") {
        formatted += "\n" + getIndent(indentLevel + 1) + applyCase(token.value) + " ";
      } else if (upper === "AND" || upper === "OR" || upper === "ON") {
        formatted += "\n" + getIndent(indentLevel + 1) + applyCase(token.value) + " ";
      } else {
        formatted += applyCase(token.value) + " ";
      }
      continue;
    }

    if (token.type === "keyword") {
      formatted += applyCase(token.value);
      const next = tokens[i + 1];
      if (next && next.value !== "," && next.value !== ";" && next.value !== ")") {
        formatted += " ";
      }
      continue;
    }

    if (token.type === "symbol") {
      if (token.value === ",") {
        formatted += ",";
        if (inSelect && inParentheses === 0 && options.breakCommas) {
          formatted += "\n" + getIndent(indentLevel + 1);
        } else {
          formatted += " ";
        }
        continue;
      }

      if (token.value === "(") {
        inParentheses++;
        formatted += "(";
        // If next is SELECT (subquery)
        if (tokens[i + 1] && tokens[i + 1].type === "clause" && tokens[i + 1].value.toUpperCase().startsWith("SELECT")) {
          indentLevel++;
        }
        continue;
      }

      if (token.value === ")") {
        inParentheses = Math.max(0, inParentheses - 1);
        if (prevToken && prevToken.type === "clause") {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        formatted += ")";
        const next = tokens[i + 1];
        if (next && next.value !== "," && next.value !== ";" && next.value !== ")") {
          formatted += " ";
        }
        continue;
      }

      if (token.value === ";") {
        formatted += ";\n\n";
        indentLevel = 0;
        inSelect = false;
        continue;
      }

      if (["=", "+", "-", "*", "/", "<", ">", "<=", ">=", "<>", "!=", "||"].includes(token.value)) {
        formatted += ` ${token.value} `;
        continue;
      }

      formatted += token.value;
      continue;
    }

    if (token.type === "comment") {
      if (formatted.length > 0 && !formatted.endsWith("\n") && !formatted.endsWith(" ")) {
        formatted += " ";
      }
      formatted += token.value;
      if (token.value.startsWith("--")) {
        formatted += "\n" + getIndent(indentLevel);
      } else {
        formatted += " ";
      }
      continue;
    }

    // Default word / string / number
    formatted += token.value;
    const next = tokens[i + 1];
    if (next && next.value !== "," && next.value !== ";" && next.value !== ")" && next.value !== "." && token.value !== ".") {
      formatted += " ";
    }
  }

  return formatted.trim();
}

function minifySql(sql: string): string {
  const tokens = tokenizeSql(sql);
  let minified = "";

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === "space") continue;
    if (t.type === "comment") {
      // Omit single-line comments or preserve multi-line comments with minimal space
      if (t.value.startsWith("/*")) {
        minified += `${t.value} `;
      }
      continue;
    }

    minified += t.value;
    const next = tokens[i + 1];
    if (next && next.type !== "space" && next.type !== "comment" && next.value !== "," && next.value !== ";" && next.value !== ")" && next.value !== "(" && t.value !== "(" && t.value !== ".") {
      minified += " ";
    }
  }

  return minified.trim();
}

export default function SqlFormatterPage() {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [indentStr, setIndentStr] = useState<string>("  ");
  const [keywordCase, setKeywordCase] = useState<"upper" | "lower" | "preserve">("upper");
  const [breakCommas, setBreakCommas] = useState<boolean>(true);
  const [status, setStatus] = useState<StatusInfo>({ type: "idle" });
  const [copied, setCopied] = useState<boolean>(false);

  const indentSelectId = useId();
  const casingSelectId = useId();

  const handleFormat = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setStatus({ type: "idle" });
      return;
    }

    try {
      const formatted = formatSql(input, {
        indentStr,
        keywordCase,
        breakCommas,
      });

      setOutput(formatted);
      const lines = formatted.split("\n").length;
      setStatus({
        type: "success",
        message: "SQL formatted successfully with clean indentation!",
        charCount: formatted.length,
        lineCount: lines,
      });
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to format SQL.",
      });
    }
  }, [input, indentStr, keywordCase, breakCommas]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setStatus({ type: "idle" });
      return;
    }

    try {
      const minified = minifySql(input);
      setOutput(minified);

      const origLen = input.length;
      const minLen = minified.length;
      const reduction = origLen > 0 ? Math.max(0, Math.round(((origLen - minLen) / origLen) * 100)) : 0;

      setStatus({
        type: "success",
        message: `SQL minified to a single line! Saved ${reduction}% characters.`,
        charCount: minLen,
        lineCount: 1,
        reduction,
      });
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to minify SQL.",
      });
    }
  }, [input]);

  const handleLoadSample = useCallback(() => {
    setInput(SAMPLE_SQL);
    const formatted = formatSql(SAMPLE_SQL, {
      indentStr,
      keywordCase,
      breakCommas,
    });
    setOutput(formatted);
    setStatus({
      type: "success",
      message: "Sample SQL query loaded and beautified.",
      charCount: formatted.length,
      lineCount: formatted.split("\n").length,
    });
  }, [indentStr, keywordCase, breakCommas]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setStatus({ type: "idle" });
  }, []);

  const handleCopy = useCallback(async () => {
    const textToCopy = output || input;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output, input]);

  const inputLineCount = input ? input.split("\n").length : 0;
  const outputLineCount = output ? output.split("\n").length : 0;

  return (
    <ToolLayout
      title="SQL Formatter & Beautifier - Format, Indent & Minify SQL"
      description="Clean, free online SQL formatter and beautifier. Indent major clauses (SELECT, FROM, WHERE, JOIN), uppercase standard SQL keywords, and minify queries instantly."
    >
      <div className="space-y-5">
        {/* Top Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1a1a1a] pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleFormat}
              className="inline-flex items-center gap-1.5  bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 active:scale-95 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Format / Beautify
            </button>

            <button
              onClick={handleMinify}
              className="inline-flex items-center gap-1.5  bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-[#222] active:scale-95 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              Minify
            </button>

            <button
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5  bg-[#0a0a1a] px-3 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-[#0a0a1a] cursor-pointer"
            >
              Load Sample SQL
            </button>

            <button
              onClick={handleClear}
              disabled={!input && !output}
              className="inline-flex items-center gap-1.5  bg-[#111] px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Options */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
            {/* Indent Selector */}
            <div className="flex items-center gap-1.5">
              <label htmlFor={indentSelectId} className="text-xs font-semibold text-gray-500 uppercase">
                Indent:
              </label>
              <select
                id={indentSelectId}
                value={indentStr}
                onChange={(e) => setIndentStr(e.target.value)}
                className=" border border-[#1a1a1a] bg-[#0a0a0a] px-2 py-1 text-xs text-gray-300 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-900"
              >
                <option value="  ">2 Spaces</option>
                <option value="    ">4 Spaces</option>
                <option value="&#9;">Tab</option>
              </select>
            </div>

            {/* Keyword Casing */}
            <div className="flex items-center gap-1.5">
              <label htmlFor={casingSelectId} className="text-xs font-semibold text-gray-500 uppercase">
                Keywords:
              </label>
              <select
                id={casingSelectId}
                value={keywordCase}
                onChange={(e) => setKeywordCase(e.target.value as "upper" | "lower" | "preserve")}
                className=" border border-[#1a1a1a] bg-[#0a0a0a] px-2 py-1 text-xs text-gray-300 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-900"
              >
                <option value="upper">UPPERCASE</option>
                <option value="lower">lowercase</option>
                <option value="preserve">Preserve</option>
              </select>
            </div>

            {/* Column Line Break */}
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600 select-none hover:text-gray-200">
              <input
                type="checkbox"
                checked={breakCommas}
                onChange={(e) => setBreakCommas(e.target.checked)}
                className="h-4 w-4 border-[#1a1a1a] text-blue-600 focus:ring-blue-900"
              />
              <span>Column per line</span>
            </label>
          </div>
        </div>

        {/* Status Notification Banner */}
        {status.type === "success" && (
          <div className="flex flex-wrap items-center justify-between gap-2  border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 shrink-0 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">{status.message}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-800">
              {status.lineCount !== undefined && <span>Lines: <strong>{status.lineCount}</strong></span>}
              {status.charCount !== undefined && <span>Characters: <strong>{status.charCount}</strong></span>}
            </div>
          </div>
        )}

        {status.type === "error" && (
          <div className=" border border-red-900 bg-[#1a0a0a] p-4 text-sm text-red-900">
            <div className="flex items-start gap-2">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-semibold text-red-400">Formatting Error</p>
                <p className="mt-1 font-mono text-xs text-red-400">{status.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Input & Output Split Editor */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Input Area */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-300">Raw SQL Input</span>
                <span className="text-xs text-gray-500">
                  ({inputLineCount} {inputLineCount === 1 ? "line" : "lines"}, {input.length} chars)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      setInput(text);
                    } catch {
                      // Permission denied
                    }
                  }}
                  className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-[#111] cursor-pointer"
                  title="Paste from clipboard"
                >
                  Paste
                </button>
                <button
                  onClick={() => setInput("")}
                  className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-[#111] hover:text-red-400 cursor-pointer"
                  title="Clear input"
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter or paste unformatted SQL queries here..."
              rows={18}
              spellCheck={false}
              className="w-full flex-1 resize-y  border border-[#1a1a1a] bg-[#0a0a0a] p-3 font-mono text-sm leading-relaxed text-gray-200 shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-900 focus:outline-none"
            />
          </div>

          {/* Output Area */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-300">Formatted SQL Result</span>
                <span className="text-xs text-gray-500">
                  ({outputLineCount} {outputLineCount === 1 ? "line" : "lines"}, {output.length} chars)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!output && !input}
                  className="inline-flex items-center gap-1  bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
                  title="Copy SQL output"
                >
                  {copied ? (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy SQL
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Formatted SQL output will appear here..."
              rows={18}
              spellCheck={false}
              className="w-full flex-1 resize-y  border border-[#1a1a1a] bg-black p-3 font-mono text-sm leading-relaxed text-gray-200 shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Feature Highlights & Guide */}
        <div className="mt-8  border border-[#1a1a1a] bg-black/70 p-5 text-sm text-gray-600">
          <h3 className="font-semibold text-gray-200">About SQL Formatter</h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="font-medium text-gray-300">📐 Major Clause Alignment</p>
              <p className="mt-1 text-xs leading-normal">
                Aligns SELECT, FROM, JOIN, WHERE, GROUP BY, HAVING, ORDER BY, and sub-clauses for optimal clarity.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-300">🔤 Keyword Casing</p>
              <p className="mt-1 text-xs leading-normal">
                Standardize keywords to UPPERCASE or lowercase across ANSI SQL, MySQL, PostgreSQL, SQLite, and SQL Server.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-300">⚡ Single-Line Minify</p>
              <p className="mt-1 text-xs leading-normal">
                Remove unnecessary linebreaks and comments to compact SQL queries for embedding into code or scripts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
