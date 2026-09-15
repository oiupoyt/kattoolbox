import SidebarAd from "@/components/SidebarAd";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  showSideAds?: boolean;
}

export default function ToolLayout({ title, description, children, showSideAds = true }: ToolLayoutProps) {
  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 py-8">
      <div className="flex justify-center items-start gap-6">
        {/* Left Side Ad (Ultra-wide screens) */}
        {showSideAds && (
          <div className="hidden 2xl:block sticky top-20 shrink-0">
            <SidebarAd format="vertical" slotId="kat-tool-left" />
          </div>
        )}

        {/* Main Tool Content */}
        <div className="flex-1 max-w-5xl min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-px w-4 bg-blue-900"></div>
            <h1 className="text-lg font-semibold text-white">{title}</h1>
          </div>
          <p className="mb-5 text-sm text-[#525252] ml-6">{description}</p>

          <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-5">
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
