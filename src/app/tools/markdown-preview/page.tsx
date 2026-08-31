"use client";

import { useState, useMemo, useCallback } from "react";
import { marked } from "marked";
import ToolLayout from "@/components/ToolLayout";

const SAMPLE_MARKDOWN = `# DevToolbox Markdown Preview

Welcome to the **live Markdown previewer**! Write or paste your Markdown in the editor on the left, and watch the formatted HTML update in *real time*.

---

## Typography & Formatting

You can format text with **bold**, *italic*, ***bold and italic***, or ~~strikethrough~~. You can also highlight \`inline code\` or add [links to DevToolbox](https://example.com).

> 💡 **Pro tip:** Markdown is lightweight, readable, and widely supported across GitHub, documentation sites, and content platforms.

---

## Lists & Checklists

### Features Roadmap
- [x] Instant client-side live rendering
- [x] Full GitHub Flavored Markdown (GFM) support
- [x] Syntax-styled tables & code blocks
- [ ] Export directly to PDF
- [ ] Custom CSS themes

### Developer Resources
1. **Frontend**: Next.js 15 App Router, React 19, Tailwind CSS 4
2. **Parsing**: High-performance \`marked\` engine
3. **Privacy**: 100% in-browser processing with zero server calls

---

## Code Blocks

\`\`\`typescript
interface UserProfile {
  id: string;
  name: string;
  role: "admin" | "developer" | "viewer";
  preferences: {
    theme: "light" | "dark" | "system";
    autoSave: boolean;
  };
}

function greet(user: UserProfile): string {
  return \`Hello, \${user.name}! Welcome back to DevToolbox.\`;
}
\`\`\`

---

## Structured Tables

| Tool Name | Category | Status | Speed |
| :--- | :--- | :---: | :--- |
| **JSON Formatter** | Formatters | ✅ Ready | Instant |
| **Markdown Preview** | Formatters | ✅ Ready | Instant |
| **Base64 Encoder** | Encoders | ✅ Ready | Instant |
| **UUID Generator** | Generators | ✅ Ready | Instant |

---

## Blockquotes & Citations

> "Simplicity is prerequisite for reliability."
> — *Edsger W. Dijkstra*
`;

export default function MarkdownPreviewPage() {
  const [markdown, setMarkdown] = useState<string>(SAMPLE_MARKDOWN);
  const [viewMode, setViewMode] = useState<"split" | "preview" | "rawHtml" | "edit">("split");
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
  const [copiedMd, setCopiedMd] = useState<boolean>(false);

  // Parse markdown live using marked
  const renderedHtml = useMemo(() => {
    try {
      return marked.parse(markdown, {
        gfm: true,
        breaks: true,
      }) as string;
    } catch (err) {
      return `<div class="text-red-500 font-semibold p-4">Error parsing markdown: ${String(err)}</div>`;
    }
  }, [markdown]);

  // Statistics
  const stats = useMemo(() => {
    const trimmed = markdown.trim();
    const chars = markdown.length;
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const lines = markdown ? markdown.split("\n").length : 0;
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
    return { chars, words, lines, readingTimeMinutes };
  }, [markdown]);

  const handleCopyHtml = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(renderedHtml);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = renderedHtml;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  }, [renderedHtml]);

  const handleCopyMarkdown = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = markdown;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    }
  }, [markdown]);

  const handleDownloadHtml = useCallback(() => {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rendered Markdown</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #24292e; }
    h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; }
    h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
    code { font-family: monospace; background: #f6f8fa; padding: 0.2em 0.4em; border-radius: 3px; }
    pre { background: #f6f8fa; padding: 16px; overflow: auto; border-radius: 6px; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #dfe2e5; padding: 0 1em; color: #6a737d; margin: 0; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    table th, table td { border: 1px solid #dfe2e5; padding: 6px 13px; }
    table tr:nth-child(2n) { background-color: #f6f8fa; }
  </style>
</head>
<body>
${renderedHtml}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [renderedHtml]);

  const handleDownloadMd = useCallback(() => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [markdown]);

  const insertSnippet = (prefix: string, suffix = "", placeholder = "") => {
    const textarea = document.getElementById("markdown-editor-input") as HTMLTextAreaElement | null;
    if (!textarea) {
      setMarkdown((prev) => prev + prefix + placeholder + suffix);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = markdown.substring(start, end) || placeholder;
    const replacement = prefix + selected + suffix;

    const updated = markdown.substring(0, start) + replacement + markdown.substring(end);
    setMarkdown(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  return (
    <ToolLayout
      title="Markdown Preview - Live Markdown to HTML Renderer"
      description="Free online Markdown preview tool. Write or paste Markdown and see the rendered HTML output in real-time."
    >
      <div className="space-y-4">
        {/* Style Block for Rendered HTML Typography */}
        <style dangerouslySetInnerHTML={{ __html: `
          .markdown-preview-output {
            color: inherit;
            line-height: 1.7;
          }
          .markdown-preview-output h1 {
            font-size: 1.875rem;
            font-weight: 700;
            line-height: 1.3;
            margin-top: 1.25rem;
            margin-bottom: 0.75rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid rgba(156, 163, 175, 0.3);
          }
          .markdown-preview-output h2 {
            font-size: 1.5rem;
            font-weight: 700;
            line-height: 1.35;
            margin-top: 1.25rem;
            margin-bottom: 0.6rem;
            padding-bottom: 0.35rem;
            border-bottom: 1px solid rgba(156, 163, 175, 0.2);
          }
          .markdown-preview-output h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-top: 1rem;
            margin-bottom: 0.5rem;
          }
          .markdown-preview-output h4 {
            font-size: 1.1rem;
            font-weight: 600;
            margin-top: 0.85rem;
            margin-bottom: 0.4rem;
          }
          .markdown-preview-output h5, .markdown-preview-output h6 {
            font-size: 0.95rem;
            font-weight: 600;
            margin-top: 0.75rem;
            margin-bottom: 0.35rem;
          }
          .markdown-preview-output p {
            margin-top: 0.6rem;
            margin-bottom: 0.6rem;
          }
          .markdown-preview-output strong {
            font-weight: 600;
          }
          .markdown-preview-output em {
            font-style: italic;
          }
          .markdown-preview-output del {
            text-decoration: line-through;
            opacity: 0.75;
          }
          .markdown-preview-output a {
            color: #2563eb;
            text-decoration: underline;
            text-underline-offset: 2px;
          }
          @media (prefers-color-scheme: dark) {
            .markdown-preview-output a {
              color: #60a5fa;
            }
          }
          .markdown-preview-output a:hover {
            color: #1d4ed8;
          }
          .markdown-preview-output ul {
            list-style-type: disc;
            padding-left: 1.5rem;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
          }
          .markdown-preview-output ol {
            list-style-type: decimal;
            padding-left: 1.5rem;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
          }
          .markdown-preview-output li {
            margin-top: 0.25rem;
            margin-bottom: 0.25rem;
          }
          .markdown-preview-output li > ul,
          .markdown-preview-output li > ol {
            margin-top: 0.2rem;
            margin-bottom: 0.2rem;
          }
          .markdown-preview-output input[type="checkbox"] {
            margin-right: 0.5rem;
            border-radius: 0.25rem;
            accent-color: #2563eb;
            vertical-align: middle;
          }
          .markdown-preview-output blockquote {
            border-left: 4px solid #3b82f6;
            padding: 0.5rem 1rem;
            margin: 1rem 0;
            background: rgba(59, 130, 246, 0.05);
            border-top-right-radius: 0.375rem;
            border-bottom-right-radius: 0.375rem;
            font-style: italic;
          }
          .markdown-preview-output code {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.85em;
            padding: 0.15em 0.35em;
            border-radius: 0.25rem;
            background-color: rgba(156, 163, 175, 0.18);
            color: #db2777;
          }
          @media (prefers-color-scheme: dark) {
            .markdown-preview-output code {
              color: #f472b6;
            }
          }
          .markdown-preview-output pre {
            background-color: #0f172a;
            color: #f8fafc;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1rem 0;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.875rem;
            line-height: 1.6;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .markdown-preview-output pre code {
            background-color: transparent;
            color: inherit;
            padding: 0;
            border-radius: 0;
            font-size: inherit;
          }
          .markdown-preview-output hr {
            margin: 1.5rem 0;
            border: 0;
            border-top: 1px solid rgba(156, 163, 175, 0.3);
          }
          .markdown-preview-output table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
            font-size: 0.875rem;
            border: 1px solid rgba(156, 163, 175, 0.25);
            border-radius: 0.5rem;
            overflow: hidden;
          }
          .markdown-preview-output th,
          .markdown-preview-output td {
            border: 1px solid rgba(156, 163, 175, 0.25);
            padding: 0.5rem 0.75rem;
            text-align: left;
          }
          .markdown-preview-output th {
            background-color: rgba(156, 163, 175, 0.12);
            font-weight: 600;
          }
          .markdown-preview-output tr:nth-child(even) {
            background-color: rgba(156, 163, 175, 0.05);
          }
          .markdown-preview-output img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            margin: 0.75rem 0;
          }
        ` }} />

        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1a1a1a] pb-3">
          {/* View Mode Switcher */}
          <div className="flex items-center  bg-[#111] p-1">
            <button
              onClick={() => setViewMode("split")}
              className={` px-3 py-1 text-xs font-medium transition-all ${
                viewMode === "split"
                  ? "bg-[#0a0a0a] text-blue-600 shadow-xs"
                  : "text-gray-600 hover:text-gray-200"
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={` px-3 py-1 text-xs font-medium transition-all ${
                viewMode === "preview"
                  ? "bg-[#0a0a0a] text-blue-600 shadow-xs"
                  : "text-gray-600 hover:text-gray-200"
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setViewMode("rawHtml")}
              className={` px-3 py-1 text-xs font-medium transition-all ${
                viewMode === "rawHtml"
                  ? "bg-[#0a0a0a] text-blue-600 shadow-xs"
                  : "text-gray-600 hover:text-gray-200"
              }`}
            >
              HTML Code
            </button>
            <button
              onClick={() => setViewMode("edit")}
              className={` px-3 py-1 text-xs font-medium transition-all ${
                viewMode === "edit"
                  ? "bg-[#0a0a0a] text-blue-600 shadow-xs"
                  : "text-gray-600 hover:text-gray-200"
              }`}
            >
              Editor Only
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyHtml}
              className="inline-flex items-center gap-1.5  bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 active:scale-95"
            >
              {copiedHtml ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  HTML Copied!
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
                  Copy HTML
                </>
              )}
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1  bg-[#1a1a1a] px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-[#222]"
            >
              {copiedMd ? "Markdown Copied!" : "Copy Markdown"}
            </button>

            <button
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1  border border-[#1a1a1a] bg-[#0a0a0a] px-2.5 py-1.5 text-xs font-medium text-gray-400 hover:bg-black"
              title="Download standalone HTML document"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              .html
            </button>

            <button
              onClick={handleDownloadMd}
              className="inline-flex items-center gap-1  border border-[#1a1a1a] bg-[#0a0a0a] px-2.5 py-1.5 text-xs font-medium text-gray-400 hover:bg-black"
              title="Download markdown file"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              .md
            </button>

            <button
              onClick={() => setMarkdown(SAMPLE_MARKDOWN)}
              className=" px-2.5 py-1 text-xs font-medium text-gray-600 underline-offset-2 hover:text-blue-600 hover:underline"
            >
              Reset Sample
            </button>

            <button
              onClick={() => setMarkdown("")}
              className=" px-2.5 py-1 text-xs font-medium text-red-400 underline-offset-2 hover:text-red-400 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Quick Markdown Insertion Toolbar */}
        <div className="flex flex-wrap items-center gap-1  border border-[#1a1a1a] bg-black/70 p-1.5 text-xs">
          <span className="px-2 font-medium text-gray-500">Insert:</span>
          <button
            type="button"
            onClick={() => insertSnippet("**", "**", "bold text")}
            className="rounded px-2 py-1 font-bold text-gray-400 hover:bg-[#1a1a1a]"
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("*", "*", "italic text")}
            className="rounded px-2 py-1 italic text-gray-400 hover:bg-[#1a1a1a]"
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("## ", "\n", "Heading 2")}
            className="rounded px-2 py-1 font-semibold text-gray-400 hover:bg-[#1a1a1a]"
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("### ", "\n", "Heading 3")}
            className="rounded px-2 py-1 font-semibold text-gray-400 hover:bg-[#1a1a1a]"
            title="Heading 3"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("[", "](https://example.com)", "link title")}
            className="rounded px-2 py-1 text-gray-400 hover:bg-[#1a1a1a]"
            title="Link"
          >
            🔗 Link
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("\n```javascript\n", "\n```\n", "// code here")}
            className="rounded px-2 py-1 font-mono text-gray-400 hover:bg-[#1a1a1a]"
            title="Code Block"
          >
            {"</>"} Code
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("\n> ", "\n", "Quote text")}
            className="rounded px-2 py-1 text-gray-400 hover:bg-[#1a1a1a]"
            title="Blockquote"
          >
            ❝ Quote
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("- ", "\n", "List item")}
            className="rounded px-2 py-1 text-gray-400 hover:bg-[#1a1a1a]"
            title="Bullet list"
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("- [ ] ", "\n", "Todo task")}
            className="rounded px-2 py-1 text-gray-400 hover:bg-[#1a1a1a]"
            title="Checklist task"
          >
            ☑ Task
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("\n| Column 1 | Column 2 |\n| :--- | :--- |\n| Value 1 | Value 2 |\n", "")}
            className="rounded px-2 py-1 text-gray-400 hover:bg-[#1a1a1a]"
            title="Table"
          >
            ▦ Table
          </button>
        </div>

        {/* Content Layout */}
        <div
          className={`grid gap-4 ${
            viewMode === "split"
              ? "grid-cols-1 lg:grid-cols-2"
              : "grid-cols-1"
          }`}
        >
          {/* Left Pane: Markdown Input */}
          {(viewMode === "split" || viewMode === "edit") && (
            <div className="flex flex-col">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-300">
                  Markdown Source
                </span>
                <span className="text-xs text-gray-500">
                  {stats.lines} lines · {stats.words} words · {stats.chars} chars
                </span>
              </div>
              <textarea
                id="markdown-editor-input"
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Type your markdown here..."
                rows={22}
                spellCheck={false}
                className="w-full flex-1 resize-y  border border-[#1a1a1a] bg-[#0a0a0a] p-4 font-mono text-sm leading-relaxed text-gray-200 shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-900 focus:outline-none"
              />
            </div>
          )}

          {/* Right Pane: Rendered Preview or Raw HTML */}
          {(viewMode === "split" || viewMode === "preview") && (
            <div className="flex flex-col">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-300">
                  Rendered Preview
                </span>
                <span className="text-xs text-gray-500">
                  Estimated read time: ~{stats.readingTimeMinutes} min
                </span>
              </div>
              <div
                className="markdown-preview-output min-h-[500px] flex-1 overflow-y-auto  border border-[#1a1a1a] bg-[#0a0a0a] p-5 text-gray-200 shadow-xs"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </div>
          )}

          {viewMode === "rawHtml" && (
            <div className="flex flex-col">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-300">
                  Generated HTML Code
                </span>
                <span className="text-xs text-gray-500">
                  {renderedHtml.length} characters
                </span>
              </div>
              <textarea
                value={renderedHtml}
                readOnly
                rows={22}
                className="w-full flex-1 resize-y  border border-[#1a1a1a] bg-black p-4 font-mono text-xs leading-relaxed text-gray-200 shadow-xs focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Informational Footer */}
        <div className="mt-8  border border-[#1a1a1a] bg-black/70 p-5 text-sm text-gray-600">
          <h3 className="font-semibold text-gray-200">About Live Markdown Preview</h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="font-medium text-gray-300">⚡ Live Rendering</p>
              <p className="mt-1 text-xs leading-normal">
                Real-time parsing as you type using the fast and robust marked compiler with Github Flavored Markdown (GFM) support.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-300">📋 Export & Share</p>
              <p className="mt-1 text-xs leading-normal">
                Instantly copy the generated HTML code or download standalone .html and .md files ready for publishing.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-300">🔒 100% Private</p>
              <p className="mt-1 text-xs leading-normal">
                Zero server requests. All markdown processing and parsing occurs strictly within your browser.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
