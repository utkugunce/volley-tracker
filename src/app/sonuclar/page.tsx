import { Metadata } from "next";
import { DashboardClient } from "@/components/DashboardClient";
import { getInitialFixtures } from "@/utils/getInitialFixtures";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = searchParams ? await searchParams : {};
  const city = typeof params?.city === "string" && params.city !== "Tümü" && params.city !== "Tüm İller" ? params.city : undefined;
  const category = typeof params?.category === "string" && params.category !== "Tümü" ? params.category : undefined;

  let title = "Voleybol Maç Sonuçları ve Set Skorları — Altyapı Voleybol";
  let description = "Oynanan tüm voleybol maçlarının kesinleşmiş set skorları, dün oynanan maçlar ve detaylı sonuç dökümü.";

  if (city && category) {
    title = `${city} ${category} Maç Sonuçları — Altyapı Voleybol`;
    description = `${city} ili ${category} ligi biten maçlar, set sonuçları ve skor dökümleri.`;
  } else if (city) {
    title = `${city} Voleybol Maç Sonuçları — Altyapı Voleybol`;
    description = `${city} ili tüm voleybol ligleri tamamlanan maç sonuçları ve skorları.`;
  } else if (category) {
    title = `${category} Maç Sonuçları — Altyapı Voleybol`;
    description = `Türkiye geneli ${category} ligleri güncel maç skorları ve set dökümleri.`;
  }

  const url = `https://altyapivoleybol.com.tr/sonuclar${city ? `?city=${city}` : ""}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
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

export default async function ResultsPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const citySlug = typeof params?.city === "string" ? params.city : undefined;
  const initialData = getInitialFixtures(citySlug);
  return <DashboardClient initialData={initialData} initialTab="results" initialCity={citySlug} />;
}
