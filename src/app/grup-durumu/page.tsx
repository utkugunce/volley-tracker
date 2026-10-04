import { Metadata } from "next";
import { DashboardClient } from "@/components/DashboardClient";
import { getInitialFixtures } from "@/utils/getInitialFixtures";

export const revalidate = 900; // 15 minutes ISR cache

export function generateMetadata(): Metadata {
  const title = "81 İl Voleybol Grup ve Fikstür Giriş Durumu — Altyapı Voleybol";
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

export default function GroupStatusPage() {
  const initialData = getInitialFixtures();
  return <DashboardClient initialData={initialData} initialTab="group-status" />;
}
