import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Kadinlar2LigClient } from "@/components/kadinlar-2-lig/Kadinlar2LigClient";
import { getKadinlar2LigData } from "@/utils/kadinlar2LigServer";
import {
  parseKadinlar2LigRoute,
  getKadinlar2LigRoute,
} from "@/utils/kadinlar2LigRoutes";

export const revalidate = 60; // 1 minute ISR cache

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const path = `/kadinlar-2-ligi/${slug.join("/")}`;
  const { tab, groupNo } = parseKadinlar2LigRoute(path);

  const groupLabel = groupNo > 1 ? ` (${groupNo}. Grup)` : "";
  let title = "TVF Uzman Posta Kadınlar 2. Ligi | Altyapı Voleybol";
  let description =
    "Türkiye Voleybol Federasyonu Uzman Posta Kadınlar 2. Ligi 16 grup resmi puan cetveli, fikstür, sonuçlar ve Volleybox kadroları.";

  switch (tab) {
    case "standings":
      title = `TVF Kadınlar 2. Ligi Puan Durumu${groupLabel} — Altyapı Voleybol`;
      description = `Uzman Posta Kadınlar 2. Ligi${groupLabel} güncel puan durumu, averajlar, set farkları ve lig sıralaması.`;
      break;
    case "fixtures":
      title = `TVF Kadınlar 2. Ligi Fikstür${groupLabel} — Altyapı Voleybol`;
      description = `Uzman Posta Kadınlar 2. Ligi${groupLabel} haftalık maç programı, salon bilgileri ve başlama saatleri.`;
      break;
    case "results":
      title = "TVF Kadınlar 2. Ligi Maç Sonuçları ve Skorlar — Altyapı Voleybol";
      description = "Uzman Posta Kadınlar 2. Ligi tamamlanan karşılaşmaların resmi set ve maç skorları.";
      break;
    case "today":
      title = "TVF Kadınlar 2. Ligi Günün Maçları — Altyapı Voleybol";
      description = "Kadınlar 2. Ligi bugün oynanacak tüm karşılaşmalar, canlı takip ve salon bilgileri.";
      break;
    case "leaders":
      title = "TVF Kadınlar 2. Ligi 16 Grup Liderleri & Yükselme Hattı — Altyapı Voleybol";
      description = "Kadınlar 2. Ligi 16 grubun lider takımları, çeyrek final yükselme hattı ve grup durumları.";
      break;
    case "teams":
      title = "TVF Kadınlar 2. Ligi Takımları ve Kulüp Profilleri — Altyapı Voleybol";
      description = "Kadınlar 2. Ligi'nde mücadele eden 160+ voleybol kulübü, maçları ve kadro bağlantıları.";
      break;
    case "statu":
      title = "TVF Kadınlar 2. Ligi 2026-2027 Resmi Lig Statüsü — Altyapı Voleybol";
      description = "2026-2027 sezonu Uzman Posta Kadınlar 2. Ligi çeyrek final, yarı final, final ve yükselme statüsü.";
      break;
    case "home":
    default:
      title = "TVF Uzman Posta Kadınlar 2. Ligi - Canlı Puan Durumu & Fikstür | Altyapı Voleybol";
      description = "Kadınlar 2. Ligi 16 grup canlı puan cetveli, haftalık maç fikstürleri ve Volleybox kadroları.";
      break;
  }

  const canonicalUrl = `https://altyapivoleybol.com.tr${getKadinlar2LigRoute(tab, groupNo)}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
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

export function generateStaticParams() {
  const tabs = [
    "puan-durumu",
    "fikstur",
    "sonuclar",
    "gunun-maclari",
    "grup-durumu",
    "takimlar",
    "statu",
    "anasayfa",
  ];

  const params: { slug: string[] }[] = [];

  for (const t of tabs) {
    params.push({ slug: [t] });
  }

  // 16 Grup için puan-durumu ve fikstur parametreleri
  for (let g = 1; g <= 16; g++) {
    params.push({ slug: ["puan-durumu", `grup-${g}`] });
    params.push({ slug: ["fikstur", `grup-${g}`] });
  }

  return params;
}

export default async function Kadinlar2LigSlugPage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    notFound();
  }

  const path = `/kadinlar-2-ligi/${slug.join("/")}`;
  const { tab, groupNo } = parseKadinlar2LigRoute(path);

  const data = getKadinlar2LigData();

  return (
    <Kadinlar2LigClient
      initialData={data}
      initialTab={tab}
      initialGroup={groupNo}
    />
  );
}
