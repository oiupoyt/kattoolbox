"use client";

import { useState, useMemo, useId } from "react";
import ToolLayout from "@/components/ToolLayout";

interface MetaTagState {
  // Basic SEO
  title: string;
  description: string;
  keywords: string;
  author: string;
  canonicalUrl: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  robotsNoArchive: boolean;
  robotsNoSnippet: boolean;
  viewport: boolean;
  charset: string;
  themeColor: string;
  language: string;

  // Open Graph
  ogType: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogImage: string;
  ogSiteName: string;

  // Twitter
  twitterCard: "summary" | "summary_large_image" | "app" | "player";
  twitterSite: string;
  twitterCreator: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
}

const INITIAL_STATE: MetaTagState = {
  title: "DevToolbox — Free Online Developer Tools & Utilities",
  description:
    "Fast, privacy-first developer utilities that run 100% in your browser. Format JSON, convert cases, generate meta tags, and test regex without server requests.",
  keywords: "developer tools, meta tag generator, SEO tags, open graph, twitter cards, online dev tools",
  author: "DevToolbox Team",
  canonicalUrl: "https://devtoolbox.co",
  robotsIndex: true,
  robotsFollow: true,
  robotsNoArchive: false,
  robotsNoSnippet: false,
  viewport: true,
  charset: "UTF-8",
  themeColor: "#2563eb",
  language: "en",

  ogType: "website",
  ogTitle: "DevToolbox — Free Online Developer Tools & Utilities",
  ogDescription:
    "Fast, privacy-first developer utilities that run 100% in your browser. Format JSON, convert cases, generate meta tags, and test regex without server requests.",
  ogUrl: "https://devtoolbox.co",
  ogImage: "https://devtoolbox.co/og-image.png",
  ogSiteName: "DevToolbox",

  twitterCard: "summary_large_image",
  twitterSite: "@devtoolbox",
  twitterCreator: "@devtoolbox",
  twitterTitle: "DevToolbox — Free Online Developer Tools & Utilities",
  twitterDescription:
    "Fast, privacy-first developer utilities that run 100% in your browser. Format JSON, convert cases, generate meta tags, and test regex without server requests.",
  twitterImage: "https://devtoolbox.co/twitter-image.png",
};

const SAMPLE_PRESETS: { name: string; state: Partial<MetaTagState> }[] = [
  {
    name: "SaaS / Homepage",
    state: {
      title: "TaskFlow — Modern Project Management for Agile Teams",
      description:
        "Streamline your engineering sprints, track issues in real-time, and collaborate seamlessly across remote teams with TaskFlow.",
      keywords: "project management, agile software, sprint planner, issue tracker, team collaboration",
      author: "TaskFlow Inc.",
      canonicalUrl: "https://taskflow.io",
      ogType: "website",
      ogTitle: "TaskFlow — Modern Project Management for Agile Teams",
      ogDescription: "Streamline your engineering sprints, track issues in real-time, and collaborate seamlessly.",
      ogUrl: "https://taskflow.io",
      ogImage: "https://taskflow.io/images/og-home.jpg",
      ogSiteName: "TaskFlow",
      twitterCard: "summary_large_image",
      twitterSite: "@taskflowapp",
      twitterCreator: "@taskflowapp",
      twitterTitle: "TaskFlow — Modern Project Management for Agile Teams",
      twitterDescription: "Streamline your engineering sprints, track issues in real-time, and collaborate seamlessly.",
      twitterImage: "https://taskflow.io/images/twitter-card.jpg",
      themeColor: "#4f46e5",
    },
  },
  {
    name: "Blog Post / Article",
    state: {
      title: "How to Build a High-Performance Next.js 15 App in 2025",
      description:
        "A comprehensive, step-by-step guide to mastering Next.js 15 Server Actions, React Compiler optimizations, and static site generation.",
      keywords: "nextjs, react 19, web development, javascript, performance, frontend tutorial",
      author: "Sarah Connor",
      canonicalUrl: "https://blog.techpulse.dev/posts/nextjs-15-guide",
      ogType: "article",
      ogTitle: "How to Build a High-Performance Next.js 15 App in 2025",
      ogDescription:
        "Step-by-step guide exploring Server Actions, React Compiler, and static generation optimizations.",
      ogUrl: "https://blog.techpulse.dev/posts/nextjs-15-guide",
      ogImage: "https://blog.techpulse.dev/assets/nextjs-15-cover.png",
      ogSiteName: "TechPulse Blog",
      twitterCard: "summary_large_image",
      twitterSite: "@techpulseblog",
      twitterCreator: "@sarahconnor_dev",
      twitterTitle: "How to Build a High-Performance Next.js 15 App in 2025",
      twitterDescription: "Step-by-step guide exploring Next.js 15 Server Actions and performance tuning.",
      twitterImage: "https://blog.techpulse.dev/assets/nextjs-15-cover.png",
      themeColor: "#000000",
    },
  },
  {
    name: "E-Commerce Product",
    state: {
      title: "Ergonomic Mechanical Keyboard RGB — Precision Wireless",
      description:
        "Upgrade your typing experience with hot-swappable tactile switches, aircraft-grade aluminum casing, and ultra-low latency wireless connectivity.",
      keywords: "mechanical keyboard, ergonomic typing, custom switches, wireless keyboard, gaming accessories",
      author: "KeyCraft Studio",
      canonicalUrl: "https://keycraft.shop/products/ergo-rgb-pro",
      ogType: "product",
      ogTitle: "Ergonomic Mechanical Keyboard RGB — Precision Wireless",
      ogDescription:
        "Hot-swappable switches, aircraft-grade aluminum casing, and ultra-low latency wireless connectivity.",
      ogUrl: "https://keycraft.shop/products/ergo-rgb-pro",
      ogImage: "https://keycraft.shop/images/keyboard-hero.jpg",
      ogSiteName: "KeyCraft Shop",
      twitterCard: "summary_large_image",
      twitterSite: "@keycraft_shop",
      twitterCreator: "@keycraft_shop",
      twitterTitle: "Ergonomic Mechanical Keyboard RGB — Precision Wireless",
      twitterDescription: "Upgrade your typing experience with hot-swappable tactile switches and wireless freedom.",
      twitterImage: "https://keycraft.shop/images/keyboard-hero.jpg",
      themeColor: "#059669",
    },
  },
];

export default function MetaTagGeneratorPage() {
  const [state, setState] = useState<MetaTagState>(INITIAL_STATE);
  const [copied, setCopied] = useState(false);
  const [previewTab, setPreviewTab] = useState<"html" | "google" | "facebook" | "twitter">("html");

  const titleId = useId();
  const descId = useId();
  const keywordsId = useId();
  const authorId = useId();
  const canonicalId = useId();

  // Character counter helper with styling and feedback
  const titleLen = state.title.length;
  const descLen = state.description.length;

  const getTitleStatus = (len: number) => {
    if (len === 0) return { label: "Empty", color: "text-gray-400", bg: "bg-[#1a1a1a]", border: "border-[#1a1a1a]" };
    if (len <= 60) return { label: "Optimal (<60)", color: "text-emerald-600", bg: "bg-emerald-500", border: "border-emerald-500" };
    if (len <= 70) return { label: "Slightly Long (61-70)", color: "text-amber-600", bg: "bg-amber-500", border: "border-amber-500" };
    return { label: "Too Long (>70)", color: "text-rose-600", bg: "bg-rose-500", border: "border-rose-500" };
  };

  const getDescStatus = (len: number) => {
    if (len === 0) return { label: "Empty", color: "text-gray-400", bg: "bg-[#1a1a1a]", border: "border-[#1a1a1a]" };
    if (len <= 160) return { label: "Optimal (<160)", color: "text-emerald-600", bg: "bg-emerald-500", border: "border-emerald-500" };
    if (len <= 180) return { label: "Slightly Long (161-180)", color: "text-amber-600", bg: "bg-amber-500", border: "border-amber-500" };
    return { label: "Too Long (>180)", color: "text-rose-600", bg: "bg-rose-500", border: "border-rose-500" };
  };

  const titleStatus = getTitleStatus(titleLen);
  const descStatus = getDescStatus(descLen);

  // Sync Open Graph and Twitter from Basic Meta
  const handleSyncToSocial = () => {
    setState((prev) => ({
      ...prev,
      ogTitle: prev.title,
      ogDescription: prev.description,
      ogUrl: prev.canonicalUrl,
      twitterTitle: prev.title,
      twitterDescription: prev.description,
    }));
  };

  // Generate robots tag string
  const robotsDirectives = useMemo(() => {
    const parts: string[] = [];
    parts.push(state.robotsIndex ? "index" : "noindex");
    parts.push(state.robotsFollow ? "follow" : "nofollow");
    if (state.robotsNoArchive) parts.push("noarchive");
    if (state.robotsNoSnippet) parts.push("nosnippet");
    return parts.join(", ");
  }, [state.robotsIndex, state.robotsFollow, state.robotsNoArchive, state.robotsNoSnippet]);

  // Generate clean HTML output
  const generatedHtml = useMemo(() => {
    const lines: string[] = [];

    lines.push("<!-- Primary Meta Tags -->");
    if (state.charset) lines.push(`<meta charset="${state.charset}">`);
    if (state.viewport) lines.push(`<meta name="viewport" content="width=device-width, initial-scale=1.0">`);
    if (state.title) lines.push(`<title>${state.title}</title>`);
    if (state.title) lines.push(`<meta name="title" content="${state.title}">`);
    if (state.description) lines.push(`<meta name="description" content="${state.description}">`);
    if (state.keywords) lines.push(`<meta name="keywords" content="${state.keywords}">`);
    if (state.author) lines.push(`<meta name="author" content="${state.author}">`);
    if (robotsDirectives) lines.push(`<meta name="robots" content="${robotsDirectives}">`);
    if (state.canonicalUrl) lines.push(`<link rel="canonical" href="${state.canonicalUrl}">`);
    if (state.themeColor) lines.push(`<meta name="theme-color" content="${state.themeColor}">`);

    // Open Graph
    lines.push("");
    lines.push("<!-- Open Graph / Facebook -->");
    if (state.ogType) lines.push(`<meta property="og:type" content="${state.ogType}">`);
    if (state.ogUrl) lines.push(`<meta property="og:url" content="${state.ogUrl}">`);
    if (state.ogTitle) lines.push(`<meta property="og:title" content="${state.ogTitle}">`);
    if (state.ogDescription) lines.push(`<meta property="og:description" content="${state.ogDescription}">`);
    if (state.ogImage) lines.push(`<meta property="og:image" content="${state.ogImage}">`);
    if (state.ogSiteName) lines.push(`<meta property="og:site_name" content="${state.ogSiteName}">`);

    // Twitter
    lines.push("");
    lines.push("<!-- Twitter / X -->");
    if (state.twitterCard) lines.push(`<meta name="twitter:card" content="${state.twitterCard}">`);
    if (state.ogUrl || state.canonicalUrl) lines.push(`<meta name="twitter:url" content="${state.ogUrl || state.canonicalUrl}">`);
    if (state.twitterTitle) lines.push(`<meta name="twitter:title" content="${state.twitterTitle}">`);
    if (state.twitterDescription) lines.push(`<meta name="twitter:description" content="${state.twitterDescription}">`);
    if (state.twitterImage) lines.push(`<meta name="twitter:image" content="${state.twitterImage}">`);
    if (state.twitterSite) lines.push(`<meta name="twitter:site" content="${state.twitterSite}">`);
    if (state.twitterCreator) lines.push(`<meta name="twitter:creator" content="${state.twitterCreator}">`);

    return lines.join("\n");
  }, [state, robotsDirectives]);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = generatedHtml;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setState({
      title: "",
      description: "",
      keywords: "",
      author: "",
      canonicalUrl: "",
      robotsIndex: true,
      robotsFollow: true,
      robotsNoArchive: false,
      robotsNoSnippet: false,
      viewport: true,
      charset: "UTF-8",
      themeColor: "#2563eb",
      language: "en",
      ogType: "website",
      ogTitle: "",
      ogDescription: "",
      ogUrl: "",
      ogImage: "",
      ogSiteName: "",
      twitterCard: "summary_large_image",
      twitterSite: "",
      twitterCreator: "",
      twitterTitle: "",
      twitterDescription: "",
      twitterImage: "",
    });
  };

  const handleApplyPreset = (presetState: Partial<MetaTagState>) => {
    setState((prev) => ({
      ...prev,
      ...presetState,
    }));
  };

  return (
    <ToolLayout
      title="Meta Tag Generator"
      description="Create comprehensive SEO meta tags, Open Graph properties, and Twitter Cards with real-time preview and character limit checks."
    >
      <title>Meta Tag Generator — DevToolbox</title>
      <meta
        name="description"
        content="Free online meta tag generator for SEO, Open Graph, and Twitter Cards. Live social previews, Google search snippet preview, and instant HTML export."
      />

      <div className="space-y-8">
        {/* Top Controls and Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1a1a1a]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Presets:</span>
            {SAMPLE_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p.state)}
                className="px-2.5 py-1 text-xs font-medium bg-[#111] hover:bg-[#1a1a1a] text-gray-400  transition-colors cursor-pointer"
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncToSocial}
              className="px-3 py-1 text-xs font-medium bg-[#0a0a1a] hover:bg-[#0a0a1a] text-blue-400  transition-colors cursor-pointer flex items-center gap-1"
              title="Copy Title & Description into Open Graph and Twitter Card fields"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync to Social Cards
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1 text-xs font-medium bg-[#111] hover:bg-rose-50 text-gray-400 hover:text-rose-600  transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Form Inputs and Output / Previews Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Fields (7 cols on large screens) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Section 1: Basic SEO Meta Tags */}
            <div className=" border border-[#1a1a1a] bg-[#0a0a0a] p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <span className="flex h-6 w-6 items-center justify-center  bg-[#0a0a1a] text-blue-400 text-xs font-bold">
                  1
                </span>
                <h2 className="text-sm font-bold text-gray-200">
                  Basic SEO &amp; Search Engine Tags
                </h2>
              </div>

              {/* Title Field with Character Warning */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor={titleId} className="text-xs font-semibold text-gray-400">
                    Page Title <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-medium ${titleStatus.color}`}>
                      {titleLen}/60 chars ({titleStatus.label})
                    </span>
                  </div>
                </div>
                <input
                  id={titleId}
                  type="text"
                  value={state.title}
                  onChange={(e) => setState({ ...state, title: e.target.value })}
                  placeholder="e.g. My Website — High Performance Developer Utilities"
                  className="w-full p-2.5  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 text-sm focus:ring-1 focus:ring-blue-900 focus:outline-none font-sans"
                />
                {/* Visual Progress Bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-none bg-[#111]">
                  <div
                    className={`h-full transition-all duration-300 ${titleStatus.bg}`}
                    style={{ width: `${Math.min((titleLen / 60) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Description Field with Character Warning */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor={descId} className="text-xs font-semibold text-gray-400">
                    Meta Description <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-medium ${descStatus.color}`}>
                      {descLen}/160 chars ({descStatus.label})
                    </span>
                  </div>
                </div>
                <textarea
                  id={descId}
                  rows={3}
                  value={state.description}
                  onChange={(e) => setState({ ...state, description: e.target.value })}
                  placeholder="A concise summary of your webpage for search engine results..."
                  className="w-full p-2.5  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 text-sm focus:ring-1 focus:ring-blue-900 focus:outline-none resize-y font-sans leading-relaxed"
                />
                {/* Visual Progress Bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-none bg-[#111]">
                  <div
                    className={`h-full transition-all duration-300 ${descStatus.bg}`}
                    style={{ width: `${Math.min((descLen / 160) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Keywords and Author Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor={keywordsId} className="text-xs font-semibold text-gray-400">
                    Keywords (comma-separated)
                  </label>
                  <input
                    id={keywordsId}
                    type="text"
                    value={state.keywords}
                    onChange={(e) => setState({ ...state, keywords: e.target.value })}
                    placeholder="tools, developer, seo, open graph"
                    className="w-full p-2.5  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 text-sm focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor={authorId} className="text-xs font-semibold text-gray-400">
                    Author
                  </label>
                  <input
                    id={authorId}
                    type="text"
                    value={state.author}
                    onChange={(e) => setState({ ...state, author: e.target.value })}
                    placeholder="Jane Doe or Organization"
                    className="w-full p-2.5  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 text-sm focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Canonical URL & Theme Color */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label htmlFor={canonicalId} className="text-xs font-semibold text-gray-400">
                    Canonical URL
                  </label>
                  <input
                    id={canonicalId}
                    type="url"
                    value={state.canonicalUrl}
                    onChange={(e) => setState({ ...state, canonicalUrl: e.target.value })}
                    placeholder="https://example.com/page-url"
                    className="w-full p-2.5  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 text-sm font-mono focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={state.themeColor || "#2563eb"}
                      onChange={(e) => setState({ ...state, themeColor: e.target.value })}
                      className="h-9 w-9 p-0.5 border border-[#1a1a1a] bg-[#0a0a0a] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={state.themeColor}
                      onChange={(e) => setState({ ...state, themeColor: e.target.value })}
                      placeholder="#2563eb"
                      className="flex-1 p-2  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 font-mono text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Robots Directives Checkboxes */}
              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-400 block mb-2">
                  Robots &amp; Crawler Indexing Directives
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2  border border-[#1a1a1a] bg-black/50 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={state.robotsIndex}
                      onChange={(e) => setState({ ...state, robotsIndex: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-[#1a1a1a] focus:ring-blue-900"
                    />
                    <span className="font-medium text-gray-300">
                      {state.robotsIndex ? "Index (allow)" : "NoIndex (block)"}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2  border border-[#1a1a1a] bg-black/50 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={state.robotsFollow}
                      onChange={(e) => setState({ ...state, robotsFollow: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-[#1a1a1a] focus:ring-blue-900"
                    />
                    <span className="font-medium text-gray-300">
                      {state.robotsFollow ? "Follow links" : "NoFollow links"}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2  border border-[#1a1a1a] bg-black/50 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={state.robotsNoArchive}
                      onChange={(e) => setState({ ...state, robotsNoArchive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-[#1a1a1a] focus:ring-blue-900"
                    />
                    <span className="text-gray-400">NoArchive</span>
                  </label>

                  <label className="flex items-center gap-2 p-2  border border-[#1a1a1a] bg-black/50 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={state.robotsNoSnippet}
                      onChange={(e) => setState({ ...state, robotsNoSnippet: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-[#1a1a1a] focus:ring-blue-900"
                    />
                    <span className="text-gray-400">NoSnippet</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 2: Open Graph (Facebook / LinkedIn / Discord) */}
            <div className=" border border-[#1a1a1a] bg-[#0a0a0a] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center  bg-indigo-100 text-indigo-700 text-xs font-bold">
                    2
                  </span>
                  <h2 className="text-sm font-bold text-gray-200">
                    Open Graph Tags (Facebook, LinkedIn, Discord)
                  </h2>
                </div>
                <span className="text-xs text-gray-400 font-mono">og:*</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">
                    OG Type (og:type)
                  </label>
                  <select
                    value={state.ogType}
                    onChange={(e) => setState({ ...state, ogType: e.target.value })}
                    className="w-full p-2.5  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 text-sm focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  >
                    <option value="website">website</option>
                    <option value="article">article</option>
                    <option value="product">product</option>
                    <option value="profile">profile</option>
                    <option value="book">book</option>
                    <option value="video.other">video</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">
                    Site Name (og:site_name)
                  </label>
                  <input
                    type="text"
                    value={state.ogSiteName}
                    onChange={(e) => setState({ ...state, ogSiteName: e.target.value })}
                    placeholder="e.g. My Awesome Site"
                    className="w-full p-2.5  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 text-sm focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">
                  OG Title (og:title)
                </label>
                <input
                  type="text"
                  value={state.ogTitle}
                  onChange={(e) => setState({ ...state, ogTitle: e.target.value })}
                  placeholder="Custom title for social shares..."
                  className="w-full p-2.5  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 text-sm focus:ring-1 focus:ring-blue-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">
                  OG Description (og:description)
                </label>
                <textarea
                  rows={2}
                  value={state.ogDescription}
                  onChange={(e) => setState({ ...state, ogDescription: e.target.value })}
                  placeholder="Custom description for social card shares..."
                  className="w-full p-2.5  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 text-sm focus:ring-1 focus:ring-blue-900 focus:outline-none resize-y leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">
                    OG Image URL (og:image)
                  </label>
                  <input
                    type="url"
                    value={state.ogImage}
                    onChange={(e) => setState({ ...state, ogImage: e.target.value })}
                    placeholder="https://example.com/og-image.jpg"
                    className="w-full p-2.5  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 font-mono text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">
                    OG URL (og:url)
                  </label>
                  <input
                    type="url"
                    value={state.ogUrl}
                    onChange={(e) => setState({ ...state, ogUrl: e.target.value })}
                    placeholder="https://example.com/page"
                    className="w-full p-2.5  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 font-mono text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Twitter / X Cards */}
            <div className=" border border-[#1a1a1a] bg-[#0a0a0a] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center  bg-sky-100 text-sky-700 text-xs font-bold">
                    3
                  </span>
                  <h2 className="text-sm font-bold text-gray-200">
                    Twitter / X Card Tags
                  </h2>
                </div>
                <span className="text-xs text-gray-400 font-mono">twitter:*</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">
                    Card Type
                  </label>
                  <select
                    value={state.twitterCard}
                    onChange={(e) =>
                      setState({
                        ...state,
                        twitterCard: e.target.value as MetaTagState["twitterCard"],
                      })
                    }
                    className="w-full p-2.5  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 text-sm focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  >
                    <option value="summary_large_image">summary_large_image (Large Hero)</option>
                    <option value="summary">summary (Small Thumbnail)</option>
                    <option value="app">app</option>
                    <option value="player">player</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">
                    Site Handle (@username)
                  </label>
                  <input
                    type="text"
                    value={state.twitterSite}
                    onChange={(e) => setState({ ...state, twitterSite: e.target.value })}
                    placeholder="@company"
                    className="w-full p-2.5  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 text-sm font-mono focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">
                    Creator Handle (@author)
                  </label>
                  <input
                    type="text"
                    value={state.twitterCreator}
                    onChange={(e) => setState({ ...state, twitterCreator: e.target.value })}
                    placeholder="@creator"
                    className="w-full p-2.5  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 text-sm font-mono focus:ring-1 focus:ring-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">
                  Twitter Card Title (optional override)
                </label>
                <input
                  type="text"
                  value={state.twitterTitle}
                  onChange={(e) => setState({ ...state, twitterTitle: e.target.value })}
                  placeholder="Leave empty or fill to override standard title..."
                  className="w-full p-2.5  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 text-sm focus:ring-1 focus:ring-blue-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">
                  Twitter Image URL
                </label>
                <input
                  type="url"
                  value={state.twitterImage}
                  onChange={(e) => setState({ ...state, twitterImage: e.target.value })}
                  placeholder="https://example.com/twitter-image.jpg"
                  className="w-full p-2.5  border border-[#1a1a1a] bg-[#0a0a0a] text-gray-200 font-mono text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Previews & Generated Code (5 cols on large screens) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-6 space-y-4">
              {/* Tab Navigation */}
              <div className="flex  border border-[#1a1a1a] bg-[#111] p-1">
                <button
                  type="button"
                  onClick={() => setPreviewTab("html")}
                  className={`flex-1 py-1.5  text-xs font-semibold transition-all cursor-pointer ${
                    previewTab === "html"
                      ? "bg-[#0a0a0a] text-blue-600 shadow-xs"
                      : "text-gray-600 hover:text-gray-200"
                  }`}
                >
                  HTML Tags
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("google")}
                  className={`flex-1 py-1.5  text-xs font-semibold transition-all cursor-pointer ${
                    previewTab === "google"
                      ? "bg-[#0a0a0a] text-blue-600 shadow-xs"
                      : "text-gray-600 hover:text-gray-200"
                  }`}
                >
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("facebook")}
                  className={`flex-1 py-1.5  text-xs font-semibold transition-all cursor-pointer ${
                    previewTab === "facebook"
                      ? "bg-[#0a0a0a] text-blue-600 shadow-xs"
                      : "text-gray-600 hover:text-gray-200"
                  }`}
                >
                  Facebook / OG
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("twitter")}
                  className={`flex-1 py-1.5  text-xs font-semibold transition-all cursor-pointer ${
                    previewTab === "twitter"
                      ? "bg-[#0a0a0a] text-blue-600 shadow-xs"
                      : "text-gray-600 hover:text-gray-200"
                  }`}
                >
                  Twitter / X
                </button>
              </div>

              {/* Tab 1: HTML Output */}
              {previewTab === "html" && (
                <div className=" border border-[#1a1a1a] bg-gray-900 text-gray-100 overflow-hidden ">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-950/80 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-none bg-[#1a0a0a]0/80 inline-block" />
                      <span className="h-3 w-3 rounded-none bg-amber-500/80 inline-block" />
                      <span className="h-3 w-3 rounded-none bg-emerald-500/80 inline-block" />
                      <span className="ml-2 text-xs font-mono text-gray-400">&lt;head&gt; tags</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {copied ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Copied HTML!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          <span>Copy All Meta Tags</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-4 max-h-[560px] overflow-y-auto overflow-x-auto text-xs font-mono leading-relaxed select-all">
                    <pre className="text-gray-300">
                      <code>{generatedHtml}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Tab 2: Google Search Snippet Preview */}
              {previewTab === "google" && (
                <div className=" border border-[#1a1a1a] bg-[#0a0a0a] p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Google Search Result Snippet
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">Desktop &amp; Mobile</span>
                  </div>

                  <div className="p-4  border border-gray-100 bg-black/50 space-y-1.5 font-sans">
                    {/* Breadcrumbs & URL */}
                    <div className="flex items-center gap-2 text-xs text-gray-600 truncate">
                      <div className="w-4 h-4 rounded-none bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                        G
                      </div>
                      <span className="text-gray-200 font-medium">
                        {state.ogSiteName || "Website"}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500 font-mono text-[11px] truncate">
                        {state.canonicalUrl || "https://example.com"}
                      </span>
                    </div>

                    {/* Google Blue Link Title */}
                    <h3 className="text-base sm:text-lg font-medium text-blue-400 hover:underline cursor-pointer line-clamp-1 leading-snug">
                      {state.title || "Untitled Page — Please enter a title"}
                    </h3>

                    {/* Meta Description snippet */}
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {state.description || "No description provided yet. Enter a meta description to see how your site will appear in Google search results."}
                    </p>
                  </div>

                  <div className="text-[11px] text-gray-500 space-y-1 pt-2">
                    <div>
                      <strong>Google Title:</strong> {titleLen}/60 characters ({titleStatus.label})
                    </div>
                    <div>
                      <strong>Google Snippet:</strong> {descLen}/160 characters ({descStatus.label})
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Facebook / Open Graph Card Preview */}
              {previewTab === "facebook" && (
                <div className=" border border-[#1a1a1a] bg-[#0a0a0a] p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Facebook / LinkedIn / Discord Card
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">1200 × 630 px</span>
                  </div>

                  <div className=" border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden ">
                    {/* Card Image Area */}
                    <div className="aspect-[1.91/1] w-full bg-[#1a1a1a] relative flex items-center justify-center overflow-hidden border-b border-[#1a1a1a]">
                      {state.ogImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={state.ogImage}
                          alt="Open Graph preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="text-center p-4">
                          <svg className="w-10 h-10 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs text-gray-500 font-mono">1200 × 630 Preview Image</span>
                        </div>
                      )}
                    </div>

                    {/* Card Meta Content */}
                    <div className="p-3.5 space-y-1 bg-black">
                      <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold block truncate">
                        {state.ogUrl ? new URL(state.ogUrl, "https://example.com").hostname : "EXAMPLE.COM"}
                      </span>
                      <h4 className="text-sm font-bold text-gray-200 line-clamp-1 leading-snug">
                        {state.ogTitle || state.title || "Your Open Graph Title"}
                      </h4>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {state.ogDescription || state.description || "Your Open Graph description will appear here on social networks."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Twitter / X Card Preview */}
              {previewTab === "twitter" && (
                <div className=" border border-[#1a1a1a] bg-[#0a0a0a] p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Twitter / X Card Preview
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">{state.twitterCard}</span>
                  </div>

                  {state.twitterCard === "summary_large_image" ? (
                    /* Large Image Card */
                    <div className=" border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden ">
                      <div className="aspect-[2/1] w-full bg-[#111] relative flex items-center justify-center overflow-hidden border-b border-[#1a1a1a]">
                        {state.twitterImage || state.ogImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={state.twitterImage || state.ogImage}
                            alt="Twitter Card preview"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="text-center p-4">
                            <span className="text-xs text-gray-500 font-mono">Summary Large Image Preview</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 space-y-0.5 bg-[#0a0a0a]">
                        <span className="text-[11px] text-gray-500 block truncate">
                          {state.canonicalUrl ? new URL(state.canonicalUrl, "https://example.com").hostname : "example.com"}
                        </span>
                        <h4 className="text-sm font-semibold text-gray-200 line-clamp-1">
                          {state.twitterTitle || state.title || "Twitter Card Title"}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {state.twitterDescription || state.description || "Twitter card description summary..."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Summary Small Thumbnail Card */
                    <div className="flex  border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden ">
                      <div className="w-28 h-28 bg-[#111] shrink-0 flex items-center justify-center border-r border-[#1a1a1a] overflow-hidden">
                        {state.twitterImage || state.ogImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={state.twitterImage || state.ogImage}
                            alt="Twitter Card Thumbnail"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-[10px] text-gray-400 text-center p-1 font-mono">Thumbnail</span>
                        )}
                      </div>
                      <div className="p-2.5 flex-1 flex flex-col justify-center space-y-0.5 overflow-hidden">
                        <span className="text-[10px] text-gray-500 truncate">
                          {state.canonicalUrl ? new URL(state.canonicalUrl, "https://example.com").hostname : "example.com"}
                        </span>
                        <h4 className="text-xs font-semibold text-gray-200 line-clamp-1">
                          {state.twitterTitle || state.title || "Twitter Card Title"}
                        </h4>
                        <p className="text-[11px] text-gray-600 line-clamp-2">
                          {state.twitterDescription || state.description || "Twitter card description..."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
