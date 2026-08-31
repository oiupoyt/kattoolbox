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
      <div className="flex-1 min-w-0 max-w-4xl mx-auto px-4 py-6">
        <AdSlot slot="homepage-top" format="horizontal" />

        {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
          <section key={category} className="mb-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {category}
            </h2>
            <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3 border border-gray-900">
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
