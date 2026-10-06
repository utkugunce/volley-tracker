import { Metadata } from "next";
import { DashboardClient } from "@/components/DashboardClient";
import { getInitialResults } from "@/utils/getInitialFixtures";

export const revalidate = 86400; // 24 hours ISR cache (Vercel kota)

export function generateMetadata(): Metadata {
  const title = "Voleybol Maç Sonuçları ve Set Skorları";
  const description = "Oynanan tüm voleybol maçlarının kesinleşmiş set skorları, dün oynanan maçlar ve detaylı sonuç dökümü.";

  const url = "https://altyapivoleybol.com.tr/sonuclar";

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

export default function ResultsPage() {
  const initialData = getInitialResults();
  return <DashboardClient initialData={initialData} initialTab="results" initialDataPartial />;
}
