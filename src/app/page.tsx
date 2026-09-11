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
        {/* Left Side Ad (Ultra-wide screens) */}
        <div className="hidden 2xl:block sticky top-20 shrink-0">
          <SidebarAd format="vertical" slotId="kat-home-left" />
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-5xl min-w-0">
          {/* Hero / Privacy Banner */}
          <section className="mb-10 border border-[#1a1a1a] bg-gradient-to-b from-[#0a0a0a] to-black p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
                100% Client-Side • Zero Server Storage
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Fast, Private In-Browser Utilities
            </h1>
            <p className="mt-2 text-sm text-gray-400 max-w-2xl leading-relaxed">
              Clean media, shrink files for Discord and Gmail, redact sensitive data, and manipulate PDFs directly inside your browser. No files ever leave your machine.
            </p>

            {/* Quick Featured Launchpad */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {featuredTools.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  className="group block border border-[#222] bg-[#0c0c0c] hover:border-blue-500/50 hover:bg-[#121212] p-3 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{t.icon}</span>
                    <span className="text-xs font-semibold text-gray-200 group-hover:text-blue-400 transition-colors">
                      {t.name}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#666] line-clamp-2">
                    {t.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* Categorized Tools */}
          {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
            <section key={category} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px w-4 bg-blue-900"></div>
                <h2 className="text-xs font-medium uppercase tracking-widest text-[#525252]">
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

        {/* Right Side Ad (Desktops & Laptops) */}
        <div className="hidden xl:block sticky top-20 shrink-0">
          <SidebarAd format="vertical" slotId="kat-home-right" />
        </div>
      </div>
    </div>
  );
}
