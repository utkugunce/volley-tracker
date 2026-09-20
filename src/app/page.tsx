import { DashboardClient } from "@/components/DashboardClient";
import { getInitialFixtures } from "@/utils/getInitialFixtures";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<import("next").Metadata> {
  const params = searchParams ? await searchParams : {};
  const city = typeof params?.city === "string" && params.city !== "Tümü" && params.city !== "Tüm İller" ? params.city : undefined;
  const category = typeof params?.category === "string" && params.category !== "Tümü" ? params.category : undefined;

  let title = "Altyapı Voleybol — TVF Fikstür ve Puan Durumu";
  let description = "Türkiye Voleybol Federasyonu 81 İl Temsilciliği Genç ve Yıldız Kızlar Süper Lig haftalık maç bülteni, puan durumu ve fikstür.";

  if (city && category) {
    title = `Altyapı Voleybol — ${city} ${category}`;
    description = `${city} ili ${category} ligi güncel haftalık maç bülteni, canlı puan durumu, maç sonuçları ve takvimi.`;
  } else if (city) {
    title = `Altyapı Voleybol — ${city} Fikstür ve Sonuçlar`;
    description = `${city} ili voleybol ligleri güncel maç bülteni, puan durumu ve fikstürü.`;
  } else if (category) {
    title = `Altyapı Voleybol — ${category}`;
    description = `Türkiye geneli ${category} ligleri maç programı, canlı puan durumu ve sonuçları.`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
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

export default async function Page({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const citySlug = typeof params?.city === "string" ? params.city : undefined;
  const initialData = getInitialFixtures(citySlug);
  return <DashboardClient initialData={initialData} initialTab="home" initialCity={citySlug} />;
}
