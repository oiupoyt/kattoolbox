import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-auto border-t border-[#1f1f1f] px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#555] bg-[#0b0b0b]/90 backdrop-blur-sm max-w-7xl mx-auto w-full">
      <span>kattoolbox // zero-knowledge client execution</span>
      <div className="flex items-center gap-4">
        <Link href="/privacy" className="hover:text-gray-300 transition-colors">
          privacy
        </Link>
        <a
          href="https://github.com/oiupoyt/kattoolbox"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-300 transition-colors"
        >
          github
        </a>
      </div>
    </footer>
  );
}
