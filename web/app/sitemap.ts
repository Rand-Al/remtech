import type { MetadataRoute } from "next";

// Тестовый домен example.com заменяется на реальный перед публичным запуском
const SITE_URL = "https://example.com";

const UA_PATHS = [
  "/",
  "/kotly/",
  "/pralni-mashyny/",
  "/posudomyini-mashyny/",
  "/privacy/",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...UA_PATHS.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...UA_PATHS.map((path) => ({
      url: `${SITE_URL}/ru${path === "/" ? "/" : path}`,
    })),
  ];
}
