export interface Tool {
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
}

export const tools: Tool[] = [
  // Formatters & Validators
  { name: "JSON Formatter", slug: "json-formatter", description: "Format, validate, and beautify JSON data instantly", category: "Formatters", icon: "📋" },
  { name: "Markdown Preview", slug: "markdown-preview", description: "Write Markdown and see a live rendered preview", category: "Formatters", icon: "📝" },

  // Encoders & Decoders
  { name: "Base64 Encode/Decode", slug: "base64", description: "Encode and decode Base64 strings", category: "Encoders", icon: "🔤" },
  { name: "URL Encode/Decode", slug: "url-encoder", description: "Encode and decode URL components", category: "Encoders", icon: "🔗" },
  { name: "HTML Entity Encode/Decode", slug: "html-entities", description: "Convert special characters to and from HTML entities", category: "Encoders", icon: "🏷️" },
  { name: "JWT Decoder", slug: "jwt-decoder", description: "Decode and inspect JSON Web Token payloads", category: "Encoders", icon: "🔑" },

  // Generators
  { name: "UUID Generator", slug: "uuid-generator", description: "Generate unique UUIDs (v4) instantly", category: "Generators", icon: "🆔" },
  { name: "Lorem Ipsum Generator", slug: "lorem-ipsum", description: "Generate placeholder text for your designs", category: "Generators", icon: "📄" },
  { name: "Hash Generator", slug: "hash-generator", description: "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes", category: "Generators", icon: "🔒" },
  { name: "QR Code Generator", slug: "qr-code", description: "Generate QR codes from any text or URL", category: "Generators", icon: "📱" },
  { name: "Password Generator", slug: "password-generator", description: "Generate strong, secure random passwords", category: "Generators", icon: "🔐" },

  // Converters
  { name: "Unix Timestamp Converter", slug: "timestamp-converter", description: "Convert between Unix timestamps and human-readable dates", category: "Converters", icon: "⏰" },
  { name: "Color Converter", slug: "color-converter", description: "Convert colors between HEX, RGB, and HSL formats", category: "Converters", icon: "🎨" },
  { name: "Number Base Converter", slug: "number-base", description: "Convert numbers between binary, octal, decimal, and hex", category: "Converters", icon: "🔢" },

  // Text Tools
  { name: "Word & Character Counter", slug: "word-counter", description: "Count words, characters, sentences, and paragraphs", category: "Text Tools", icon: "🔠" },
  { name: "Regex Tester", slug: "regex-tester", description: "Test regular expressions against text with live matching", category: "Text Tools", icon: "🧪" },
  { name: "Text Diff Checker", slug: "diff-checker", description: "Compare two texts and see the differences highlighted", category: "Text Tools", icon: "📊" },
  { name: "Case Converter", slug: "case-converter", description: "Convert text to UPPER, lower, Title, camelCase, and more", category: "Text Tools", icon: "🔡" },

  // CSS Tools
  { name: "CSS Gradient Generator", slug: "css-gradient", description: "Create beautiful CSS gradients with a visual editor", category: "CSS Tools", icon: "🌈" },
  { name: "CSS Box Shadow Generator", slug: "box-shadow", description: "Design and preview CSS box shadows visually", category: "CSS Tools", icon: "🖼️" },
  { name: "Px to Rem Converter", slug: "px-to-rem", description: "Convert pixels to rem units and vice versa", category: "CSS Tools", icon: "📐" },

  // Data Tools
  { name: "JSON to CSV", slug: "json-to-csv", description: "Convert JSON arrays to downloadable CSV files", category: "Data Tools", icon: "📊" },
  { name: "CSV to JSON", slug: "csv-to-json", description: "Convert CSV data to structured JSON", category: "Data Tools", icon: "📋" },
  { name: "SQL Formatter", slug: "sql-formatter", description: "Format and beautify SQL queries instantly", category: "Data Tools", icon: "🗄️" },
  { name: "XML Formatter", slug: "xml-formatter", description: "Format, validate, and beautify XML data", category: "Data Tools", icon: "📰" },

  // Web Tools
  { name: "Meta Tag Generator", slug: "meta-tag-generator", description: "Generate HTML meta tags for SEO and social sharing", category: "Web Tools", icon: "🏷️" },
  { name: "Slug Generator", slug: "slug-generator", description: "Convert text to clean, URL-friendly slugs", category: "Web Tools", icon: "🔗" },
  { name: "Cron Expression Parser", slug: "cron-parser", description: "Parse and explain cron expressions in plain English", category: "Web Tools", icon: "⏱️" },
  { name: "Image to Base64", slug: "image-to-base64", description: "Convert images to Base64 encoded strings", category: "Web Tools", icon: "🖼️" },
  { name: "Placeholder Image Generator", slug: "placeholder-image", description: "Generate placeholder images with custom size and colors", category: "Web Tools", icon: "🎨" },
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
