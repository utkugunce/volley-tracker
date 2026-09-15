import { MetadataRoute } from "next";
import { getAllTeamSlugs } from "@/utils/teamData";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tvfscore.com";
  const now = new Date();

  // Ana sayfa
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
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

  return [...staticRoutes, ...teamRoutes];
}
