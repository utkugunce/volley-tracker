import { Metadata } from "next";
import { DashboardClient } from "@/components/DashboardClient";
import { getInitialFixtures } from "@/utils/getInitialFixtures";

export const revalidate = 180; // 3 minutes ISR cache

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

export default function StandingsPage() {
  const initialData = getInitialFixtures();
  return <DashboardClient initialData={initialData} initialTab="standings" />;
}
