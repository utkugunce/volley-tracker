import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Kadinlar1LigClient } from "@/components/kadinlar-1-lig/Kadinlar1LigClient";
import { getKadinlar1LigData } from "@/utils/kadinlar1LigServer";
import { compactKadinlar2LigData } from "@/utils/kadinlar2LigPayload";
import {
  parseKadinlar1LigRoute,
  getKadinlar1LigRoute,
  isValidKadinlar1LigSlug,
} from "@/utils/kadinlar1LigRoutes";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug || slug.length === 0 || !isValidKadinlar1LigSlug(slug)) {
    return {
      title: "Sayfa Bulunamadı",
      robots: { index: false, follow: true },
    };
  }
  const path = `/kadinlar-1-ligi/${slug.join("/")}`;
  const { tab, groupNo } = parseKadinlar1LigRoute(path);

  const groupLabel =
    groupNo === "all"
      ? " (Tüm Gruplar)"
      : groupNo === 2
      ? " (B Grubu)"
      : " (A Grubu)";

  let title = "TVF KFC Kadınlar 1. Ligi";
  let description =
    "Türkiye Voleybol Federasyonu KFC Kadınlar 1. Ligi A ve B grubu resmi puan cetveli, fikstür, sonuçlar ve Volleybox kadroları.";

  switch (tab) {
    case "standings":
      title = `TVF Kadınlar 1. Ligi Puan Durumu${groupLabel}`;
      description = `KFC Kadınlar 1. Ligi${groupLabel} güncel puan durumu, averajlar, set farkları ve lig sıralaması.`;
      break;
    case "fixtures":
      title = `TVF Kadınlar 1. Ligi Fikstür${groupLabel}`;
      description = `KFC Kadınlar 1. Ligi${groupLabel} haftalık maç programı, salon bilgileri ve başlama saatleri.`;
      break;
    case "results":
      title = "TVF Kadınlar 1. Ligi Maç Sonuçları ve Skorlar";
      description = "KFC Kadınlar 1. Ligi tamamlanan karşılaşmaların resmi set ve maç skorları.";
      break;
    case "today":
      title = "TVF Kadınlar 1. Ligi Günün Maçları";
      description = "Kadınlar 1. Ligi bugün oynanacak tüm karşılaşmalar, canlı takip ve salon bilgileri.";
      break;
    case "leaders":
      title = "TVF Kadınlar 1. Ligi 2 Grup Durumu & Liderler";
      description = "Kadınlar 1. Ligi A ve B grubu lider takımları, play-off yükselme hattı ve grup durumları.";
      break;
    case "teams":
      title = "TVF Kadınlar 1. Ligi Takımları ve Kulüp Profilleri";
      description = "Kadınlar 1. Ligi'nde mücadele eden 28 voleybol kulübü, maçları ve kadro bağlantıları.";
      break;
    case "karsilastir":
      title = "TVF Kadınlar 1. Ligi Takım Karşılaştırması & H2H";
      description = "Kadınlar 1. Ligi takımlarının kafa kafaya maçları, galibiyet oranları ve form durumu kıyaslaması.";
      break;
    case "statu":
      title = "TVF Kadınlar 1. Ligi 2026-2027 Resmi Lig Statüsü";
      description = "2026-2027 sezonu KFC Kadınlar 1. Ligi yarı final, final etabı ve Sultanlar Ligi'ne yükselme statüsü.";
      break;
    case "home":
    default:
      title = "TVF KFC Kadınlar 1. Ligi — Canlı Puan Durumu & Fikstür";
      description = "Kadınlar 1. Ligi 2 grup canlı puan cetveli, haftalık maç fikstürleri ve Volleybox kadroları.";
      break;
  }

  const canonicalUrl = `https://altyapivoleybol.com.tr${getKadinlar1LigRoute(tab, groupNo)}`;

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
    "karsilastir",
    "statu",
    "anasayfa",
  ];

  const params: { slug: string[] }[] = [];

  for (const t of tabs) {
    params.push({ slug: [t] });
  }

  // A ve B Grubu parametreleri
  const groups = ["grup-a", "grup-b", "tum-gruplar"];
  for (const g of groups) {
    params.push({ slug: ["puan-durumu", g] });
    params.push({ slug: ["fikstur", g] });
  }

  return params;
}

export default async function Kadinlar1LigSlugPage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug || slug.length === 0 || !isValidKadinlar1LigSlug(slug)) {
    notFound();
  }

  const path = `/kadinlar-1-ligi/${slug.join("/")}`;
  const { tab, groupNo } = parseKadinlar1LigRoute(path);

  const data = compactKadinlar2LigData(getKadinlar1LigData());

  return (
    <Kadinlar1LigClient
      initialData={data}
      initialTab={tab}
      initialGroup={groupNo}
    />
  );
}
