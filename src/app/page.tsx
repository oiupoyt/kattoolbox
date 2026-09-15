import ToolCard from "@/components/ToolCard";
import SidebarAd from "@/components/SidebarAd";
import { getToolsByCategory, tools } from "@/lib/tools";
import Link from "next/link";

export default function Home() {
  const toolsByCategory = getToolsByCategory();
  const featuredTools = tools.filter((t) => t.featured);

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 font-mono">
      <div className="flex justify-center items-start gap-6">
        {/* Left Side Rail (Ultra-wide) */}
        <div className="hidden 2xl:block sticky top-20 shrink-0">
          <SidebarAd format="vertical" slotId="kat-home-left" />
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-5xl min-w-0">
          {/* Header intro */}
          <div className="mb-8 border border-[#1e1e1e] bg-[#0e0e0e] p-6">
            <div className="text-[11px] font-mono text-[#666] mb-1.5 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-[#4ade80]" />
              <span>client-side execution</span>
              <span>•</span>
              <span>zero server uploads</span>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              browser-based file &amp; developer utilities
            </h1>
            <p className="mt-1.5 text-xs text-[#888] max-w-2xl leading-relaxed">
              Fast, privacy-focused utilities for image resizing, EXIF metadata scrubbing, PDF manipulation, hashing, formatting, and standard developer conversions. All processing runs entirely in client memory.
            </p>

            {/* Quick access row */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {featuredTools.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  className="group block border border-[#1f1f1f] bg-[#080808] hover:border-[#383838] hover:bg-[#141414] p-3 transition-colors"
                >
                  <div className="text-xs font-medium text-gray-200 group-hover:text-white transition-colors">
                    {t.name}
                  </div>
                  <p className="mt-1 text-[11px] text-[#666] line-clamp-2 leading-snug group-hover:text-[#888]">
                    {t.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Categorized tools */}
          {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
            <section key={category} className="mb-8">
              <div className="flex items-center gap-2.5 mb-3">
                <h2 className="text-xs font-mono uppercase tracking-wider text-gray-300 font-semibold">
                  {category}
                </h2>
                <span className="text-[10px] text-[#555] font-mono">[{categoryTools.length}]</span>
                <div className="h-px flex-1 bg-[#1a1a1a]" />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {categoryTools.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Right Side Rail */}
        <div className="hidden xl:block sticky top-20 shrink-0">
          <SidebarAd format="vertical" slotId="kat-home-right" />
        </div>
      </div>
    </div>
  );
}
