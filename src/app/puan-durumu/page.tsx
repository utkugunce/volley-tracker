import { Metadata } from "next";
import { DashboardClient } from "@/components/DashboardClient";
import { getInitialFixturesResolved as getInitialFixtures } from "@/utils/loadFixtures";

export const revalidate = 900;

export function generateMetadata(): Metadata {
  const title = "TVF Canlı Puan Durumu ve Lig Sıralaması";
  const description = "Genç & Yıldız Kızlar Süper Lig ve tüm altyapı ligleri güncel puan cetveli, set averajları, galibiyet sayıları ve sıralama tabloları.";

  const url = "https://altyapivoleybol.com.tr/puan-durumu";

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

export default async function StandingsPage() {
  const initialData = await getInitialFixtures();
  return <DashboardClient initialData={initialData} initialTab="standings" />;
}
