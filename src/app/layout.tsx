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
    default: "DevToolbox — Free Online Developer Tools",
    template: "%s | DevToolbox",
  },
  description:
    "A collection of free, fast, and privacy-first online developer tools. JSON formatter, Base64 encoder, UUID generator, hash generator, and 20+ more. All tools run 100% in your browser.",
  keywords: [
    "developer tools",
    "online tools",
    "JSON formatter",
    "Base64 encoder",
    "UUID generator",
    "hash generator",
    "regex tester",
    "free dev tools",
  ],
  openGraph: {
    type: "website",
    title: "DevToolbox — Free Online Developer Tools",
    description:
      "20+ free, fast, privacy-first developer tools. JSON formatter, Base64 encoder, UUID generator, and more.",
    siteName: "DevToolbox",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevToolbox — Free Online Developer Tools",
    description:
      "20+ free, fast, privacy-first developer tools. JSON formatter, Base64 encoder, UUID generator, and more.",
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
        {/* Google AdSense — replace ca-pub-XXXXXXXXXXXXXXXX with your publisher ID */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
        />
      </head>
      <body className="flex min-h-full flex-col bg-black text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
