import ToolCard from "@/components/ToolCard";
import SidebarAd from "@/components/SidebarAd";
import { getToolsByCategory, tools } from "@/lib/tools";
import Link from "next/link";

export default function Home() {
  const toolsByCategory = getToolsByCategory();
  const featuredTools = tools.filter((t) => t.featured);

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 py-8">
      <div className="flex justify-center items-start gap-6">
        {/* Left Side Rail (Ultra-wide) */}
        <div className="hidden 2xl:block sticky top-20 shrink-0">
          <SidebarAd format="vertical" slotId="kat-home-left" />
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-5xl min-w-0">
          {/* Header intro */}
          <div className="mb-8 border border-[#1a1a1a] bg-[#090909] p-6">
            <div className="text-xs font-mono text-[#666] mb-1">
              Local execution • No uploads
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Browser-based file and developer utilities
            </h1>
            <p className="mt-1 text-xs text-gray-400 max-w-2xl leading-relaxed">
              Utilities for image resizing, metadata stripping, PDF manipulation, and standard developer conversions. All tasks execute locally in your browser.
            </p>

            {/* Quick access row */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {featuredTools.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  className="group block border border-[#1c1c1c] bg-[#060606] hover:border-[#333] hover:bg-[#0c0c0c] p-3 transition-colors"
                >
                  <div className="text-xs font-medium text-gray-200 group-hover:text-white transition-colors">
                    {t.name}
                  </div>
                  <p className="mt-1 text-[11px] text-[#555] line-clamp-2 leading-snug group-hover:text-[#777]">
                    {t.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Categorized tools */}
          {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
            <section key={category} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px w-3 bg-blue-900"></div>
                <h2 className="text-xs font-mono uppercase tracking-wider text-[#666]">
                  {category}
                </h2>
                <span className="text-[10px] text-[#444] font-mono">({categoryTools.length})</span>
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
