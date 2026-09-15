import Link from "next/link";
import type { Tool } from "@/lib/tools";

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group block border border-[#1e1e1e] bg-[#0e0e0e] p-3.5 transition-all hover:bg-[#151515] hover:border-[#383838]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-gray-200 group-hover:text-white transition-colors">
          {tool.name}
        </div>
        <span className="text-xs font-mono text-[#555] group-hover:text-gray-200 group-hover:translate-x-0.5 transition-all">
          →
        </span>
      </div>
      <div className="mt-1.5 text-[11px] text-[#666] leading-relaxed group-hover:text-[#888] transition-colors">
        {tool.description}
      </div>
    </Link>
  );
}
