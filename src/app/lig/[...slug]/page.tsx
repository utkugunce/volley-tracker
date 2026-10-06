import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getLeagueData } from "@/utils/leagueData";
import { LeagueHubClient } from "@/components/league/LeagueHubClient";

export const revalidate = 86400; // 24 hours ISR cache (Vercel kota)

interface PageProps {
  params: Promise<{ slug: string[] }>;
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
  // ~80+ il×kategori yolu derlemede ön-üretiliyordu; on-demand ISR'a geçildi (Vercel kota).
  return [];
}

export default async function LeagueSlugPage({ params }: PageProps) {
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

  const league = getLeagueData(citySlug, leagueSlug);
  if (!league) {
    notFound();
  }

  return <LeagueHubClient league={league} />;
}
