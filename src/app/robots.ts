import { MetadataRoute } from "next";

/**
 * Yalnızca model eğitimi veya SEO veri satışı için tarayan botlar engellenir. Her deploy ISR önbelleğini
 * sıfırladığı için bu botların 2400+ takım sayfasını yeniden taraması Vercel Fast Origin Transfer
 * kotasını tüketiyordu. Arama motorları ve yapay zekâ arama botları (Googlebot, Bingbot,
 * OAI-SearchBot, PerplexityBot vb.) etkilenmez.
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
        // /_next/image ve /_vercel/image: eski (7 Ekim öncesi) dizinlenmiş görsel URL'leri Image Optimization kotası tüketmesin.
        disallow: ["/admin", "/api/", "/panel", "/giris", "/_next/image", "/_vercel/image"],
      },
      {
        userAgent: BLOCKED_BOTS,
        disallow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
