import ToolCard from "@/components/ToolCard";
import AdSlot from "@/components/AdSlot";
import { getToolsByCategory } from "@/lib/tools";

export default function Home() {
  const toolsByCategory = getToolsByCategory();

  return (
    <div className="flex w-full">
      {/* Left side ad */}
      <div className="ad-side hidden xl:flex w-[200px] shrink-0 justify-center pt-6 pl-2">
        <div className="sticky top-16">
          <AdSlot slot="home-left" format="vertical" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 max-w-4xl mx-auto px-4 py-8">
        <AdSlot slot="homepage-top" format="horizontal" />

        {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
          <section key={category} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px w-4 bg-emerald-900"></div>
              <h2 className="text-xs font-medium uppercase tracking-widest text-[#525252]">
                {category}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {categoryTools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        ))}

        <AdSlot slot="homepage-bottom" format="horizontal" />
      </div>

      {/* Right side ad */}
      <div className="ad-side hidden xl:flex w-[200px] shrink-0 justify-center pt-6 pr-2">
        <div className="sticky top-16">
          <AdSlot slot="home-right" format="vertical" />
        </div>
      </div>
    </div>
  );
}
