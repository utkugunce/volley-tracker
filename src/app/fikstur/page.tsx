import { Metadata } from "next";
import { DashboardClient } from "@/components/DashboardClient";
import { getInitialFixtures } from "@/utils/getInitialFixtures";

export const revalidate = 180; // 3 minutes ISR cache

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = searchParams ? await searchParams : {};
  const city = typeof params?.city === "string" && params.city !== "Tümü" && params.city !== "Tüm İller" ? params.city : undefined;
  const category = typeof params?.category === "string" && params.category !== "Tümü" ? params.category : undefined;

  let title = "TVF Sezon Fikstürü ve Haftalık Maç Programı — Altyapı Voleybol";
  let description = "Türkiye Voleybol Federasyonu 81 il voleybol il temsilcilikleri güncel haftalık maç programı, salon bilgileri ve lig fikstürleri.";

  if (city && category) {
    title = `${city} ${category} Fikstürü — Altyapı Voleybol`;
    description = `${city} ili ${category} ligi güncel haftalık maç programı, salonlar, maç saatleri ve fikstür detayları.`;
  } else if (city) {
    title = `${city} Voleybol Fikstürü ve Maç Takvimi — Altyapı Voleybol`;
    description = `${city} ili tüm voleybol altyapı ligleri güncel maç programı, salon ve fikstür bülteni.`;
  } else if (category) {
    title = `${category} Fikstür ve Maç Programı — Altyapı Voleybol`;
    description = `Türkiye geneli ${category} ligi güncel haftalık maç takvimi ve fikstürü.`;
  }

  const url = `https://altyapivoleybol.com.tr/fikstur${city ? `?city=${city}` : ""}`;

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

export default async function FixturesPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const citySlug = typeof params?.city === "string" ? params.city : undefined;
  const initialData = getInitialFixtures(citySlug);
  return <DashboardClient initialData={initialData} initialTab="fixtures" initialCity={citySlug} />;
}
