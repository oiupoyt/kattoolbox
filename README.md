# kattoolbox

> **100% Private, Fast, In-Browser Utilities & File Tools.**  
> Zero server uploads. Zero sign-up. Zero data collection. All operations run client-side in your browser.

---

## 🌟 High-Impact Privacy & Media Tools

- **🗜️ Discord & Email File Shrinker (`/tools/discord-image-shrinker`)**  
  Compress images client-side to fit Discord's 10MB/8MB upload limit or Gmail's 25MB attachment limit. Auto-calculates optimal quality & resolution.
- **🛡️ Photo GPS & EXIF Scrubber (`/tools/exif-scrubber`)**  
  Inspect hidden GPS coordinates, camera serial numbers, and device tags in photos. One-click sanitization wipes all metadata headers.
- **📑 Private In-Browser PDF Toolkit (`/tools/pdf-tools`)**  
  Merge multiple PDFs, extract custom page ranges, convert images to PDF, or rotate scans offline using `pdf-lib`.
- **🔒 Document & Image Redactor (`/tools/image-redactor`)**  
  Draw permanent blackout or pixelate blur boxes over confidential info (SSNs, credit card numbers, IDs, faces) before sharing.

---

## 🛠️ Developer & Everyday Utilities (30+)

- **Formatters & Validators:** JSON Formatter, Markdown Preview, SQL Formatter, XML Formatter
- **Encoders & Decoders:** Base64, URL Encoder, HTML Entities, JWT Decoder
- **Generators:** UUID (v4), Lorem Ipsum, Hash (MD5, SHA-1, SHA-256, SHA-512), QR Code, Password
- **Converters:** Unix Timestamp, Color (HEX/RGB/HSL), Number Base, JSON ↔ CSV
- **Text Tools:** Word & Character Counter, Regex Tester, Diff Checker, Case Converter
- **CSS Tools:** Gradient Generator, Box Shadow, Px ↔ Rem Converter
- **Web Tools:** Meta Tag Generator, Slug Generator, Cron Expression Parser, Image to Base64, Placeholder Image

---

## ⚡ Architecture & Design

- **Next.js 16 (Turbopack)** + **React 19** + **TypeScript** + **Tailwind CSS v4**
- **Static Site Generation (SSG):** Pre-rendered static pages for instant load times and optimal SEO.
- **Non-Intrusive Side Ads:** Zero annoying popups or modal overlays. Side ad rails automatically adapt on desktop/laptop viewports and remain unobtrusive.
- **100% Client-Side:** No backend server or database to maintain ($0 hosting forever on Cloudflare Pages, Vercel, or GitHub Pages).

---

## 🚀 Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📦 Build Static Output

```bash
npm run build
```

---

## License
MIT
