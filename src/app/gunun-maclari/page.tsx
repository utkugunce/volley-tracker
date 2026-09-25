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

  let title = "Günün Voleybol Maçları ve Canlı Program — Altyapı Voleybol";
  let description = "Bugün oynanacak tüm voleybol maçları, başlama saatleri, salonlar ve canlı karşılaşmalar.";

  if (city && category) {
    title = `Bugün: ${city} ${category} Maçları — Altyapı Voleybol`;
    description = `${city} ili ${category} ligi bugün oynanacak karşılaşmalar, maç saatleri ve salon bilgileri.`;
  } else if (city) {
    title = `Bugün: ${city} Voleybol Maçları — Altyapı Voleybol`;
    description = `${city} ilinde bugün oynanacak tüm voleybol maçları ve program.`;
  } else if (category) {
    title = `Bugün: ${category} Maç Programı — Altyapı Voleybol`;
    description = `Türkiye genelinde bugün oynanacak ${category} karşılaşmaları.`;
  }

  const url = `https://altyapivoleybol.com.tr/gunun-maclari${city ? `?city=${city}` : ""}`;

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

export default async function TodayMatchesPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const citySlug = typeof params?.city === "string" ? params.city : undefined;
  const initialData = getInitialFixtures(citySlug);
  return <DashboardClient initialData={initialData} initialTab="today" initialCity={citySlug} />;
}
