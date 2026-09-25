import { MetadataRoute } from "next";
import { getAllTeamSlugs } from "@/utils/teamData";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://altyapivoleybol.com.tr";
  const now = new Date();

  // Ana statik sayfalar ve sekmeler
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/fikstur`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/puan-durumu`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/grup-durumu`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sonuclar`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gunun-maclari`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/karsilastir`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    // Kadınlar 2. Ligi Rotaları
    {
      url: `${baseUrl}/kadinlar-2-ligi`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/kadinlar-2-ligi/puan-durumu`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kadinlar-2-ligi/fikstur`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kadinlar-2-ligi/sonuclar`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kadinlar-2-ligi/gunun-maclari`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kadinlar-2-ligi/grup-durumu`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kadinlar-2-ligi/takimlar`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/kadinlar-2-ligi/statu`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // Takım detay sayfaları
  const teamSlugs = getAllTeamSlugs();
  const teamRoutes: MetadataRoute.Sitemap = teamSlugs.map((slug) => ({
    url: `${baseUrl}/takim/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Şehir sayfaları (Puan Durumu, Fikstür, Sonuçlar, Günün Maçları)
  const activeCities = [
    "istanbul",
    "ankara",
    "izmir",
    "bursa",
    "antalya",
    "canakkale",
    "duzce",
    "eskisehir",
    "balikesir",
    "aydin",
    "mersin",
    "samsun",
    "yalova",
    "nigde",
    "kahramanmaras",
  ];

  const cityRoutes: MetadataRoute.Sitemap = activeCities.flatMap((slug) => [
    {
      url: `${baseUrl}/puan-durumu/${slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/grup-durumu/${slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/fikstur/${slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/sonuclar/${slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/gunun-maclari/${slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
  ]);

  return [...staticRoutes, ...teamRoutes, ...cityRoutes];
}
