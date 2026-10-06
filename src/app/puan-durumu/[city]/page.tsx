import { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardClient } from "@/components/DashboardClient";
import { getInitialFixtures } from "@/utils/getInitialFixtures";
import { getCityNameFromSlug, isValidCitySlug } from "@/utils/cityHelper";
import { slugify } from "@/utils/slugify";

export const revalidate = 86400; // 24 hours ISR cache (Vercel kota)

export function generateStaticParams() {
  // Yüksek kardinalite (il × sekme): derlemede ön-üretim ISR yazmalarını şişiriyor.
  // On-demand ISR: ilk ziyarette üretilir, sonra revalidate süresince önbellekte kalır.
  return [];
}

interface PageProps {
  params: Promise<{ city: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const citySlug = slugify(city);
  const cityName = getCityNameFromSlug(citySlug);

  const title = `${cityName} Voleybol Puan Durumu ve Lig Sıralaması — Altyapı Voleybol`;
  const description = `${cityName} ili TVF Genç ve Yıldız Kızlar Süper Lig güncel puan durumu, averajlar, galibiyet sayıları ve resmi sıralama tablosu.`;
  const url = `https://altyapivoleybol.com.tr/puan-durumu/${citySlug}`;

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

export default async function CityStandingsPage({ params }: PageProps) {
  const { city } = await params;
  const citySlug = slugify(city);

  if (!isValidCitySlug(citySlug)) {
    notFound();
  }

  const initialData = getInitialFixtures(citySlug);
  return <DashboardClient initialData={initialData} initialTab="standings" initialCity={citySlug} />;
}
