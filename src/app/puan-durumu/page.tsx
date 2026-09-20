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

  let title = "TVF Canlı Puan Durumu ve Lig Sıralaması — Altyapı Voleybol";
  let description = "Genç & Yıldız Kızlar Süper Lig ve tüm altyapı ligleri güncel puan cetveli, set averajları, galibiyet sayıları ve sıralama tabloları.";

  if (city && category) {
    title = `${city} ${category} Puan Durumu — Altyapı Voleybol`;
    description = `${city} ili ${category} ligi güncel puan tablosu, averajlar ve lig sıralaması.`;
  } else if (city) {
    title = `${city} Voleybol Puan Durumu — Altyapı Voleybol`;
    description = `${city} ili tüm voleybol kategorileri resmi puan durumları ve grup sıralamaları.`;
  } else if (category) {
    title = `${category} Puan Durumu — Altyapı Voleybol`;
    description = `Türkiye geneli ${category} ligleri puan durumu ve canlı sıralama tabloları.`;
  }

  const url = `https://altyapivoleybol.com.tr/puan-durumu${city ? `?city=${city}` : ""}`;

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

export default async function StandingsPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const citySlug = typeof params?.city === "string" ? params.city : undefined;
  const initialData = getInitialFixtures(citySlug);
  return <DashboardClient initialData={initialData} initialTab="standings" initialCity={citySlug} />;
}
