import Link from "next/link";
import SidebarAd from "@/components/SidebarAd";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  showSideAds?: boolean;
}

export default function ToolLayout({ title, description, children, showSideAds = true }: ToolLayoutProps) {
  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 py-6">
      <div className="flex justify-center items-start gap-6">
        {/* Left Side Ad (Ultra-wide screens) */}
        {showSideAds && (
          <div className="hidden 2xl:block sticky top-20 shrink-0">
            <SidebarAd format="vertical" slotId="kat-tool-left" />
          </div>
        )}

        {/* Main Tool Content */}
        <div className="flex-1 max-w-5xl min-w-0">
          <div className="mb-4">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#555] mb-1.5">
              <Link href="/" className="hover:text-gray-300 transition-colors">
                tools
              </Link>
              <span>/</span>
              <span className="text-[#888]">{title.toLowerCase()}</span>
            </div>
            <h1 className="text-base font-semibold text-white tracking-tight">{title}</h1>
            <p className="mt-1 text-xs text-[#666] leading-relaxed">{description}</p>
          </div>

          <div className="border border-[#1e1e1e] bg-[#0e0e0e] p-5 shadow-2xl">
            {children}
          </div>
        </div>

        {/* Right Side Ad (Desktop & Laptops) */}
        {showSideAds && (
          <div className="hidden xl:block sticky top-20 shrink-0">
            <SidebarAd format="vertical" slotId="kat-tool-right" />
          </div>
        )}
      </div>
    </div>
  );
}
