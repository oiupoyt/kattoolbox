import Link from "next/link";
import type { Tool } from "@/lib/tools";

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="block rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:border-gray-400 dark:border-gray-800 dark:hover:border-gray-600"
    >
      <div className="text-sm font-medium text-gray-900 dark:text-white">
        {tool.icon} {tool.name}
      </div>
      <div className="mt-0.5 text-xs text-gray-400">{tool.description}</div>
    </Link>
  );
}
