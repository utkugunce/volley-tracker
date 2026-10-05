import { Metadata } from "next";
import { DashboardClient } from "@/components/DashboardClient";
import { getInitialFixtures } from "@/utils/getInitialFixtures";

export const revalidate = 3600; // 1 hour ISR cache (Vercel kota)

export function generateMetadata(): Metadata {
  const title = "TVF Sezon Fikstürü ve Haftalık Maç Programı";
  const description = "Türkiye Voleybol Federasyonu 81 il voleybol il temsilcilikleri güncel haftalık maç programı, salon bilgileri ve lig fikstürleri.";

  const url = "https://altyapivoleybol.com.tr/fikstur";

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

export default function FixturesPage() {
  const initialData = getInitialFixtures();
  return <DashboardClient initialData={initialData} initialTab="fixtures" />;
}
