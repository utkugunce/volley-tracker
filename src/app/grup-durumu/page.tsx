import { Metadata } from "next";
import { DashboardClient } from "@/components/DashboardClient";
import { getInitialFixturesResolved as getInitialFixtures } from "@/utils/loadFixtures";

export const revalidate = 900;

export function generateMetadata(): Metadata {
  const title = "81 İl Voleybol Grup ve Fikstür Giriş Durumu";
  const description = "81 il voleybol altyapı liglerinde hangi kategorilerin ve grupların Volleybox'a girildiğini, kısmi ve tamamlanmış fikstür durumlarını gösteren canlı renk kodlu takip tablosu.";

  const url = "https://altyapivoleybol.com.tr/grup-durumu";

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

export default async function GroupStatusPage() {
  const initialData = await getInitialFixtures();
  return <DashboardClient initialData={initialData} initialTab="group-status" />;
}
