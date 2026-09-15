import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://toolbox.oiupoyt.space"),
  title: {
    default: "kattoolbox — Client-Side File & Developer Utilities",
    template: "%s | kattoolbox",
  },
  description:
    "Free client-side utilities. Compress images under Discord/Gmail limits, strip EXIF GPS metadata, merge and extract PDF pages, and run developer tools without server uploads.",
  keywords: [
    "compress image for discord",
    "shrink image to 10mb",
    "strip photo gps online",
    "remove exif data",
    "merge pdf client side",
    "redact image online",
    "developer utilities",
    "kattoolbox",
  ],
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "t_GK2K5w97K3W9jIuzdmPKGu-STw4fagx-5jYQib4yE",
  },
  openGraph: {
    type: "website",
    title: "kattoolbox — Client-Side File & Developer Utilities",
    description:
      "Client-side file and developer tools running entirely in the browser.",
    siteName: "kattoolbox",
    url: "https://toolbox.oiupoyt.space",
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
      className={`${jetbrainsMono.variable} h-full antialiased font-mono`}
    >
      <head>
        <meta
          name="google-site-verification"
          content="t_GK2K5w97K3W9jIuzdmPKGu-STw4fagx-5jYQib4yE"
        />
        {/* Google AdSense Script */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3876936176422477"
          crossOrigin="anonymous"
          dangerouslySetInnerHTML={{ __html: "" }}
        />
      </head>
      <body className="dot-bg-fade flex min-h-full flex-col bg-[#0b0b0b] text-[#e5e5e5] font-mono">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
