import { Metadata } from "next";
import { DashboardClient } from "@/components/DashboardClient";
import { getInitialFixtures } from "@/utils/getInitialFixtures";

export const revalidate = 180; // 3 minutes ISR cache

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = searchParams ? await searchParams : {};
  const city = typeof params?.city === "string" && params.city !== "Tümü" && params.city !== "Tüm İller" ? params.city : undefined;

  let title = "81 İl Voleybol Grup ve Fikstür Giriş Durumu — Altyapı Voleybol";
  let description = "81 il voleybol altyapı liglerinde hangi kategorilerin ve grupların Volleybox'a girildiğini, kısmi ve tamamlanmış fikstür durumlarını gösteren canlı renk kodlu takip tablosu.";

  if (city) {
    title = `${city} Voleybol Grup ve Fikstür Giriş Durumu — Altyapı Voleybol`;
    description = `${city} ili altyapı voleybol ligleri ve gruplarının Volleybox veri giriş durumu ve renk kodları.`;
  }

  const url = `https://altyapivoleybol.com.tr/grup-durumu${city ? `?city=${city}` : ""}`;

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

export default async function GroupStatusPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const citySlug = typeof params?.city === "string" ? params.city : undefined;
  const initialData = getInitialFixtures(citySlug);
  return <DashboardClient initialData={initialData} initialTab="group-status" initialCity={citySlug} />;
}
