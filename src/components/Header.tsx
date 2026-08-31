"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-semibold text-gray-900 dark:text-white">
          DevToolbox
        </Link>
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          All Tools
        </Link>
      </div>
    </header>
  );
}
