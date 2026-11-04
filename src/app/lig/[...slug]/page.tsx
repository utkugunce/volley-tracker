import { Metadata } from "next";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import { getLeagueData } from "@/utils/leagueData";
import { LeagueHubClient } from "@/components/league/LeagueHubClient";
import { slugify } from "@/utils/slugify";
import { isCityHidden } from "@/utils/cityHelper";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    return { title: "Lig Sayfası" };
  }

  const citySlug = slug[0];
  const leagueSlug = slug.length > 1 ? slug[1] : slug[0];

  const league = getLeagueData(citySlug, leagueSlug);
  if (!league) {
    return {
      title: "Lig Bulunamadı",
    };
  }

  const title = `${league.leagueName} Puan Durumu, Fikstür & İstatistikler`;
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
        const fileSlug = file.replace(".json", "");
        if (isCityHidden(fileSlug)) continue;
        try {
          const content = fs.readFileSync(path.join(citiesDir, file), "utf-8");
          const parsed = JSON.parse(content);
          const citySlug = slugify(parsed.city || fileSlug);
          if (isCityHidden(citySlug)) continue;
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

  return params;
}

export default async function LeagueSlugPage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    notFound();
  }

  const citySlug = slug[0];
  const leagueSlug = slug.length > 1 ? slug[1] : slug[0];

  const league = getLeagueData(citySlug, leagueSlug);
  if (!league) {
    notFound();
  }

  return <LeagueHubClient league={league} />;
}
