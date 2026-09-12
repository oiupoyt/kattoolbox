export interface Tool {
  name: string;
  slug: string;
  description: string;
  category: string;
  featured?: boolean;
}

export const tools: Tool[] = [
  // Files & Media
  {
    name: "File Shrinker",
    slug: "discord-image-shrinker",
    description: "Compress images to target sizes for Discord, email, or web",
    category: "Files & Media",
    featured: true,
  },
  {
    name: "EXIF & GPS Scrubber",
    slug: "exif-scrubber",
    description: "Inspect camera metadata and strip GPS location tags from photos",
    category: "Files & Media",
    featured: true,
  },
  {
    name: "PDF Toolkit",
    slug: "pdf-tools",
    description: "Merge, split, extract pages, rotate, and convert images to PDF",
    category: "Files & Media",
    featured: true,
  },
  {
    name: "Image Redactor",
    slug: "image-redactor",
    description: "Black out or pixelate sensitive regions in images",
    category: "Files & Media",
    featured: true,
  },
  {
    name: "Discord Emoji Resizer",
    slug: "discord-emoji-resizer",
    description: "Resize, square-crop, and compress emojis and stickers to Discord limits",
    category: "Files & Media",
    featured: true,
  },
  {
    name: "SVG to High-Res",
    slug: "svg-to-png",
    description: "Rasterize SVG vectors to high-resolution PNG or WebP images up to 8K",
    category: "Files & Media",
    featured: true,
  },

  // Formatters & Validators
  { name: "JSON Formatter", slug: "json-formatter", description: "Format, validate, and beautify JSON data", category: "Formatters" },
  { name: "Markdown Preview", slug: "markdown-preview", description: "Write Markdown with live preview rendering", category: "Formatters" },

  // Encoders & Decoders
  { name: "Base64 Encode/Decode", slug: "base64", description: "Encode and decode Base64 strings with UTF-8 support", category: "Encoders" },
  { name: "URL Encode/Decode", slug: "url-encoder", description: "Encode and decode URL component strings", category: "Encoders" },
  { name: "HTML Entities", slug: "html-entities", description: "Convert characters to and from HTML entities", category: "Encoders" },
  { name: "JWT Decoder", slug: "jwt-decoder", description: "Decode and inspect JSON Web Token payloads", category: "Encoders" },

  // Generators
  { name: "UUID Generator", slug: "uuid-generator", description: "Generate random UUID v4 identifiers", category: "Generators" },
  { name: "Lorem Ipsum", slug: "lorem-ipsum", description: "Generate placeholder text by words or paragraphs", category: "Generators" },
  { name: "Hash Generator", slug: "hash-generator", description: "Compute MD5, SHA-1, SHA-256, and SHA-512 hashes", category: "Generators" },
  { name: "QR Code Generator", slug: "qr-code", description: "Create QR codes from URLs or plain text", category: "Generators" },
  { name: "Password Generator", slug: "password-generator", description: "Generate randomized secure passwords", category: "Generators" },
  { name: "Secret Link", slug: "secret-share", description: "Client-side AES-256 encrypted password and credential sharing via URL hash", category: "Generators", featured: true },

  // Converters
  { name: "Unix Timestamp", slug: "timestamp-converter", description: "Convert between Unix epoch and standard date formats", category: "Converters" },
  { name: "Color Converter", slug: "color-converter", description: "Convert colors between HEX, RGB, and HSL formats", category: "Converters" },
  { name: "Palette Extractor", slug: "color-palette-extractor", description: "Extract dominant color palettes and hex codes from any image", category: "Converters", featured: true },
  { name: "Number Base", slug: "number-base", description: "Convert numbers across binary, octal, decimal, and hex", category: "Converters" },

  // Text Tools
  { name: "Word Counter", slug: "word-counter", description: "Count words, characters, sentences, and reading time", category: "Text Tools" },
  { name: "Regex Tester", slug: "regex-tester", description: "Test regular expressions with real-time match highlighting", category: "Text Tools" },
  { name: "Diff Checker", slug: "diff-checker", description: "Compare two text blocks and highlight line differences", category: "Text Tools" },
  { name: "Case Converter", slug: "case-converter", description: "Transform text casing (camelCase, snake_case, uppercase)", category: "Text Tools" },

  // CSS Tools
  { name: "CSS Gradient", slug: "css-gradient", description: "Visual linear and radial CSS gradient builder", category: "CSS Tools" },
  { name: "Box Shadow", slug: "box-shadow", description: "Visual CSS box-shadow generator with code export", category: "CSS Tools" },
  { name: "Px to Rem", slug: "px-to-rem", description: "Convert pixel values to rem units using a configurable base", category: "CSS Tools" },

  // Data Tools
  { name: "JSON to CSV", slug: "json-to-csv", description: "Convert JSON array data to CSV tables", category: "Data Tools" },
  { name: "CSV to JSON", slug: "csv-to-json", description: "Parse CSV tables into JSON structures", category: "Data Tools" },
  { name: "SQL Formatter", slug: "sql-formatter", description: "Format and indent standard SQL queries", category: "Data Tools" },
  { name: "XML Formatter", slug: "xml-formatter", description: "Format, indent, and validate XML documents", category: "Data Tools" },

  // Web Tools
  { name: "Favicon Generator", slug: "favicon-generator", description: "Convert images into multi-size favicon.ico, Apple touch icons, and PWA manifests", category: "Web Tools", featured: true },
  { name: "Meta Tag Generator", slug: "meta-tag-generator", description: "Generate OpenGraph, Twitter, and SEO HTML tags", category: "Web Tools" },
  { name: "Slug Generator", slug: "slug-generator", description: "Create URL-safe slugs from plain text strings", category: "Web Tools" },
  { name: "Cron Parser", slug: "cron-parser", description: "Parse and explain 5-field cron schedules in plain text", category: "Web Tools" },
  { name: "Image to Base64", slug: "image-to-base64", description: "Encode image files into data URIs", category: "Web Tools" },
  { name: "Placeholder Image", slug: "placeholder-image", description: "Generate SVG placeholder images with custom dimensions", category: "Web Tools" },
];

export const categories = [...new Set(tools.map((t) => t.category))];

export function getToolsByCategory(): Record<string, Tool[]> {
  return tools.reduce(
    (acc, tool) => {
      if (!acc[tool.category]) acc[tool.category] = [];
      acc[tool.category].push(tool);
      return acc;
    },
    {} as Record<string, Tool[]>
  );
}
