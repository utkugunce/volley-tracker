import { MetadataRoute } from "next";
import { getAllTeamSlugs } from "@/utils/teamData";
import { isCityHidden } from "@/utils/cityHelper";
import { getLeagueAnalytics } from "@/utils/leagueAnalyticsData";
import { slugify } from "@/utils/slugify";
import { parseScanTimestamp, readDataJson } from "@/utils/dataTimestamps";
import { getDistrictSummaries } from "@/utils/districtClubs";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://altyapivoleybol.com.tr";
  // lastModified derleme zamanı değil, verinin gerçek güncellenme zamanıdır. Önceden her deploy'da
  // tüm URL'ler (2400+ takım sayfası) "değişti" görünüyor ve tarayıcılar hepsini yeniden tarıyordu;
  // her tarama yeni deploy'un boş ISR önbelleğinde sayfa üretip ISR Write tüketiyordu.
  const dataUpdatedAt = parseScanTimestamp(readDataJson("data/cities.json")?.updated_at);
  const k2Meta = readDataJson("data/kadinlar_2_lig.json")?.metadata as Record<string, unknown> | undefined;
  const k2UpdatedAt = parseScanTimestamp(k2Meta?.guncellenme_zamani) ?? dataUpdatedAt;

  // Ana statik sayfalar ve sekmeler
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: dataUpdatedAt,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/fikstur`,
      lastModified: dataUpdatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/puan-durumu`,
      lastModified: dataUpdatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/grup-durumu`,
      lastModified: dataUpdatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/takvim`,
      lastModified: dataUpdatedAt,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sonuclar`,
      lastModified: dataUpdatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gunun-maclari`,
      lastModified: dataUpdatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/karsilastir`,
      lastModified: dataUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/istatistikler`,
      lastModified: dataUpdatedAt,
      changeFrequency: "daily",
      priority: 0.8,
    },
    // Voleybol Yaş & Kategori Hesaplayıcı & Kulüpler Dizini
    {
      url: `${baseUrl}/hangi-ligde-oynar`,
      lastModified: dataUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/kulupler`,
      lastModified: dataUpdatedAt,
      changeFrequency: "daily",
      priority: 0.95,
    },
    // Kadınlar 2. Ligi Rotaları
    {
      url: `${baseUrl}/kadinlar-2-ligi`,
      lastModified: k2UpdatedAt,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/kadinlar-2-ligi/puan-durumu`,
      lastModified: k2UpdatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kadinlar-2-ligi/fikstur`,
      lastModified: k2UpdatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kadinlar-2-ligi/sonuclar`,
      lastModified: k2UpdatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kadinlar-2-ligi/gunun-maclari`,
      lastModified: k2UpdatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kadinlar-2-ligi/grup-durumu`,
      lastModified: k2UpdatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kadinlar-2-ligi/takimlar`,
      lastModified: k2UpdatedAt,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/kadinlar-2-ligi/statu`,
      lastModified: k2UpdatedAt,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // Lig istatistik sayfaları (kategori bazlı)
  const statsRoutes: MetadataRoute.Sitemap = getLeagueAnalytics().categories.map((category) => ({
    url: `${baseUrl}/istatistikler/${slugify(category)}`,
    lastModified: dataUpdatedAt,
    changeFrequency: "daily",
    priority: 0.75,
  }));

  // Takım detay sayfaları
  const teamSlugs = getAllTeamSlugs();
  const teamRoutes: MetadataRoute.Sitemap = teamSlugs.map((slug) => ({
    url: `${baseUrl}/takim/${slug}`,
    lastModified: dataUpdatedAt,
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
  ].filter((slug) => !isCityHidden(slug));

  const cityRoutes: MetadataRoute.Sitemap = activeCities.flatMap((slug) => [
    {
      url: `${baseUrl}/puan-durumu/${slug}`,
      lastModified: dataUpdatedAt,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/grup-durumu/${slug}`,
      lastModified: dataUpdatedAt,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/fikstur/${slug}`,
      lastModified: dataUpdatedAt,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/sonuclar/${slug}`,
      lastModified: dataUpdatedAt,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/gunun-maclari/${slug}`,
      lastModified: dataUpdatedAt,
      changeFrequency: "daily",
      priority: 0.85,
    },
  ]);

  // İlçe bazlı kulüp rehberi rotaları (İstanbul, Ankara, İzmir, Bursa)
  const clubCities = ["istanbul", "ankara", "izmir", "bursa"];
  const clubCityRoutes: MetadataRoute.Sitemap = clubCities.flatMap((cSlug) => {
    const districts = getDistrictSummaries(cSlug).filter((d) => d.clubCount > 0);
    return [
      {
        url: `${baseUrl}/kulupler/${cSlug}`,
        lastModified: dataUpdatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      },
      ...districts.map((d) => ({
        url: `${baseUrl}/kulupler/${cSlug}/${d.slug}`,
        lastModified: dataUpdatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.85,
      })),
    ];
  });

  return [...staticRoutes, ...statsRoutes, ...teamRoutes, ...cityRoutes, ...clubCityRoutes];
}
