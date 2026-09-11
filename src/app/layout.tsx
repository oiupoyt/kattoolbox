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
    default: "kattoolbox — Client-Side File & Developer Utilities",
    template: "%s | kattoolbox",
  },
  description:
    "Client-side file and developer tools. Compress images to size limits, strip EXIF metadata, merge and extract PDF pages, and run developer utilities directly in the browser.",
  keywords: [
    "file tools",
    "image compression",
    "discord image shrinker",
    "exif scrubber",
    "pdf merge",
    "client-side utilities",
    "kattoolbox",
  ],
  openGraph: {
    type: "website",
    title: "kattoolbox — Client-Side File & Developer Utilities",
    description:
      "Client-side file and developer tools running entirely in the browser.",
    siteName: "kattoolbox",
  },
  twitter: {
    card: "summary_large_image",
    title: "kattoolbox — Client-Side File & Developer Utilities",
    description:
      "Client-side file and developer tools running entirely in the browser.",
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
