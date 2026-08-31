import type { MetadataRoute } from "next";
import { tools } from "@/lib/tools";

export const dynamic = "force-static";

// TODO: Replace with your actual domain
const BASE_URL = "https://devtoolbox.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const toolPages = tools.map((tool) => ({
    url: `${BASE_URL}/tools/${tool.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...toolPages,
  ];
}
