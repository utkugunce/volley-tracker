import { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardClient } from "@/components/DashboardClient";
import { getInitialFixtures } from "@/utils/getInitialFixtures";
import { getCityNameFromSlug, isValidCitySlug } from "@/utils/cityHelper";
import { slugify } from "@/utils/slugify";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ city: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const citySlug = slugify(city);
  const cityName = getCityNameFromSlug(citySlug);

  const title = `${cityName} Voleybol Maç Sonuçları ve Skorlar — Altyapı Voleybol`;
  const description = `${cityName} ili tüm voleybol kategorileri tamamlanan maç sonuçları, kesinleşen set skorları ve maç dökümleri.`;
  const url = `https://altyapivoleybol.com.tr/sonuclar/${citySlug}`;

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

export default async function CityResultsPage({ params }: PageProps) {
  const { city } = await params;
  const citySlug = slugify(city);

  if (!isValidCitySlug(citySlug)) {
    notFound();
  }

  const initialData = getInitialFixtures(citySlug);
  return <DashboardClient initialData={initialData} initialTab="results" initialCity={citySlug} />;
}
