import { MetadataRoute } from "next";

/**
 * Yalnızca model eğitimi veya SEO veri satışı için tarayan botlar engellenir.
 * Arama motorları ve yapay zekâ arama botları (Googlebot, Bingbot, OAI-SearchBot, PerplexityBot vb.) serbesttir.
 */
const BLOCKED_BOTS = [
  "GPTBot",
  "CCBot",
  "ClaudeBot",
  "anthropic-ai",
  "Bytespider",
  "Amazonbot",
  "meta-externalagent",
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "PetalBot",
  "DataForSeoBot",
  "BLEXBot",
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://altyapivoleybol.com.tr";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/llms.txt"],
        disallow: ["/admin", "/api/", "/panel", "/giris"],
      },
      {
        userAgent: BLOCKED_BOTS,
        disallow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
