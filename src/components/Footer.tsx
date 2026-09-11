import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-auto border-t border-[#141414] px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-[#525252] bg-black/80 backdrop-blur-sm max-w-7xl mx-auto w-full">
      <span>Free, client-side developer and media utilities.</span>
      <div className="flex items-center gap-4">
        <Link href="/privacy" className="hover:text-gray-400 transition-colors">
          Privacy Policy
        </Link>
        <a
          href="https://github.com/oiupoyt/kattoolbox"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-400 transition-colors"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
