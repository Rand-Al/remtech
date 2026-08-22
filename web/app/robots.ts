import type { MetadataRoute } from "next";

// Тестовый домен example.com заменяется на реальный перед публичным запуском
const SITE_URL = "https://example.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
