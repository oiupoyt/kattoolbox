import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "kattoolbox — Private In-Browser Utilities & File Tools",
    template: "%s | kattoolbox",
  },
  description:
    "Free, fast, and 100% private browser tools. Shrink images for Discord (10MB/8MB) and Gmail (25MB), scrub photo GPS/EXIF metadata, merge & split PDFs offline, redact sensitive images, and 30+ developer utilities. Zero server uploads.",
  keywords: [
    "discord image compressor",
    "shrink image for discord",
    "strip exif metadata online",
    "photo gps scrubber",
    "private pdf merger",
    "extract pdf pages offline",
    "image redactor",
    "developer toolbox",
    "client-side file tools",
    "kattoolbox",
  ],
  openGraph: {
    type: "website",
    title: "kattoolbox — Private In-Browser Utilities & File Tools",
    description:
      "Shrink images for Discord, scrub photo EXIF/GPS, merge/split PDFs, and 30+ dev tools. 100% private in-browser.",
    siteName: "kattoolbox",
  },
  twitter: {
    card: "summary_large_image",
    title: "kattoolbox — Private In-Browser Utilities & File Tools",
    description:
      "Shrink images for Discord, scrub photo EXIF/GPS, merge/split PDFs, and 30+ dev tools. 100% private in-browser.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Google AdSense — Non-intrusive side placement */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
        />
      </head>
      <body className="dot-bg-fade flex min-h-full flex-col bg-black text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
