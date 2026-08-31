import ToolCard from "@/components/ToolCard";
import AdSlot from "@/components/AdSlot";
import { getToolsByCategory } from "@/lib/tools";

export default function Home() {
  const toolsByCategory = getToolsByCategory();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Developer Tools</h1>
      <p className="mb-6 mt-1 text-sm text-gray-400">Free. Private. Browser-based.</p>

      <AdSlot slot="homepage-top" format="horizontal" />

      {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
        <section key={category} className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {category}
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categoryTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      ))}

      <AdSlot slot="homepage-bottom" format="horizontal" />
    </div>
  );
}
