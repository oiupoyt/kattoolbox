import ToolCard from "@/components/ToolCard";
import { getToolsByCategory } from "@/lib/tools";

export default function Home() {
  const toolsByCategory = getToolsByCategory();

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-6 py-8">
      {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
        <section key={category} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px w-4 bg-blue-900"></div>
            <h2 className="text-xs font-medium uppercase tracking-widest text-[#525252]">
              {category}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categoryTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
