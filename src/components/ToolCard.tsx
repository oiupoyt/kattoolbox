import Link from "next/link";
import type { Tool } from "@/lib/tools";

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group block border border-[#181818] bg-[#0a0a0a] p-4 transition-colors hover:bg-[#101010] hover:border-[#282828]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-gray-200 group-hover:text-blue-400 transition-colors">
          {tool.name}
        </div>
        <span className="text-xs text-[#444] group-hover:text-gray-300 transition-colors">→</span>
      </div>
      <div className="mt-1 text-xs text-[#666] leading-relaxed">
        {tool.description}
      </div>
    </Link>
  );
}
