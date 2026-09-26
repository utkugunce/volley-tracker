import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import fs from "fs";
import path from "path";
import { getLeagueData } from "@/utils/leagueData";
import { LeagueHubClient, LeagueTabType } from "@/components/league/LeagueHubClient";
import { slugify } from "@/utils/slugify";

export const revalidate = 60; // 1 minute ISR cache

interface PageProps {
  params: Promise<{ slug: string[] }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    return { title: "Lig Sayfası — Altyapı Voleybol" };
  }

  const citySlug = slug[0];
  const leagueSlug = slug.length > 1 ? slug[1] : slug[0];

  if (citySlug === "kadinlar-2-ligi" || leagueSlug === "kadinlar-2-ligi") {
    return {
      title: "TVF Kadınlar 2. Ligi Puan Durumu & Fikstür — Altyapı Voleybol",
      description: "Türkiye Voleybol Federasyonu Uzman Posta Kadınlar 2. Ligi 16 grup canlı puan cetveli, fikstür ve sonuçlar.",
    };
  }

  const league = getLeagueData(citySlug, leagueSlug);
  if (!league) {
    return {
      title: "Lig Bulunamadı — Altyapı Voleybol",
    };
  }

  const title = `${league.leagueName} Puan Durumu, Fikstür & İstatistikler — Altyapı Voleybol`;
  const description = `${league.city} ili ${league.category} güncel puan durumu, fikstür maç programı, kesinleşmiş maç sonuçları ve kulüp istatistikleri.`;
  const canonicalUrl = `https://altyapivoleybol.com.tr/lig/${league.citySlug}/${league.leagueSlug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      locale: "tr_TR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function generateStaticParams() {
  const params: { slug: string[] }[] = [];

  try {
    const citiesDir = path.join(process.cwd(), "data", "cities");
    if (fs.existsSync(citiesDir)) {
      const files = fs.readdirSync(citiesDir).filter((f) => f.endsWith(".json"));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(citiesDir, file), "utf-8");
          const parsed = JSON.parse(content);
          const citySlug = slugify(parsed.city || file.replace(".json", ""));
          const categories: string[] = parsed.filters?.categories || [];

          for (const cat of categories) {
            if (cat !== "Tümü") {
              params.push({ slug: [citySlug, slugify(cat)] });
            }
          }
        } catch {}
      }
    }
  } catch {}

  // 2. Lig için statik parametre
  params.push({ slug: ["kadinlar-2-ligi"] });

  return params;
}

export default async function LeagueSlugPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    notFound();
  }

  const citySlug = slug[0];
  const leagueSlug = slug.length > 1 ? slug[1] : slug[0];

  // Kadınlar 2. Ligi için doğrudan /kadinlar-2-ligi sayfasına yönlendir
  if (citySlug === "kadinlar-2-ligi" || leagueSlug === "kadinlar-2-ligi") {
    redirect("/kadinlar-2-ligi");
  }

  const sParams = searchParams ? await searchParams : {};
  const tabParam = typeof sParams?.tab === "string" ? sParams.tab : undefined;

  let initialTab: LeagueTabType = "standings";
  if (
    tabParam === "standings" ||
    tabParam === "fixtures" ||
    tabParam === "results" ||
    tabParam === "stats" ||
    tabParam === "teams"
  ) {
    initialTab = tabParam;
  }

  const league = getLeagueData(citySlug, leagueSlug);
  if (!league) {
    notFound();
  }

  return <LeagueHubClient league={league} initialTab={initialTab} />;
}
