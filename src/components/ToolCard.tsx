import Link from "next/link";
import type { Tool } from "@/lib/tools";

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="block border border-gray-900 px-4 py-3 transition-colors hover:border-gray-600 hover:bg-gray-950 bg-black"
    >
      <div className="text-sm font-medium text-gray-200">
        {tool.icon} {tool.name}
      </div>
      <div className="mt-0.5 text-xs text-gray-600">{tool.description}</div>
    </Link>
  );
}
