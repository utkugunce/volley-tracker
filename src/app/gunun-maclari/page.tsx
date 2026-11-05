import { Metadata } from "next";
import { DashboardClient } from "@/components/DashboardClient";
import { getInitialFixturesResolved as getInitialFixtures } from "@/utils/loadFixtures";

export const revalidate = 900;

export function generateMetadata(): Metadata {
  const title = "Günün Voleybol Maçları ve Canlı Program";
  const description = "Bugün oynanacak tüm voleybol maçları, başlama saatleri, salonlar ve canlı karşılaşmalar.";

  const url = "https://altyapivoleybol.com.tr/gunun-maclari";

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

export default async function TodayMatchesPage() {
  const initialData = await getInitialFixtures();
  return <DashboardClient initialData={initialData} initialTab="today" />;
}
