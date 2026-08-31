import Link from "next/link";
import type { Tool } from "@/lib/tools";

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex items-start gap-3 border border-[#1a1a1a] bg-[#0a0a0a]/80 px-5 py-4 transition-all hover:bg-[#111] hover:border-[#2a2a2a]"
    >
      <span className="text-lg mt-0.5 grayscale group-hover:grayscale-0 transition-all">{tool.icon}</span>
      <div>
        <div className="text-sm font-medium text-gray-300 group-hover:text-blue-400 transition-colors">
          {tool.name}
        </div>
        <div className="mt-0.5 text-xs text-[#525252] leading-relaxed">{tool.description}</div>
      </div>
    </Link>
  );
}
