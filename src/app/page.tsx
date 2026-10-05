import { DashboardClient } from "@/components/DashboardClient";
import { getInitialHomeFixtures } from "@/utils/getInitialFixtures";

export const revalidate = 3600; // 1 hour ISR cache (Vercel kota)

export function generateMetadata(): import("next").Metadata {
  const title = "Altyapı Voleybol — TVF Fikstür ve Puan Durumu";
  const description = "Türkiye Voleybol Federasyonu 81 İl Temsilciliği Genç ve Yıldız Kızlar Süper Lig haftalık maç bülteni, puan durumu ve fikstür.";

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: "https://altyapivoleybol.com.tr",
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "tr_TR",
      images: [{ url: "/icon.svg", width: 512, height: 512, alt: "Altyapı Voleybol" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/icon.svg"],
    },
  };
}

export default function Page() {
  const initialData = getInitialHomeFixtures();
  return <DashboardClient initialData={initialData} initialTab="home" initialCity="all" initialDataPartial={true} />;
}
