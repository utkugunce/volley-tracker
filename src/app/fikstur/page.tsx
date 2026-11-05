import { Metadata } from "next";
import { DashboardClient } from "@/components/DashboardClient";
import { getInitialFixturesResolved as getInitialFixtures } from "@/utils/loadFixtures";

export const revalidate = 900;

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

export default async function FixturesPage() {
  const initialData = await getInitialFixtures();
  return <DashboardClient initialData={initialData} initialTab="fixtures" />;
}
