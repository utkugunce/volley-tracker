import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SultanlarLigiClient } from "@/components/sultanlar-ligi/SultanlarLigiClient";
import { getSultanlarLigiData } from "@/utils/sultanlarLigiServer";
import { compactKadinlar2LigData } from "@/utils/kadinlar2LigPayload";
import {
  parseSultanlarLigiRoute,
  getSultanlarLigiRoute,
  isValidSultanlarLigiSlug,
} from "@/utils/sultanlarLigiRoutes";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug || slug.length === 0 || !isValidSultanlarLigiSlug(slug)) {
    return {
      title: "Sayfa Bulunamadı",
      robots: { index: false, follow: true },
    };
  }
  const path = `/sultanlar-ligi/${slug.join("/")}`;
  const { tab } = parseSultanlarLigiRoute(path);

  let title = "TVF Vodafone Sultanlar Ligi";
  let description =
    "Türkiye Voleybol Federasyonu Vodafone Sultanlar Ligi resmi puan cetveli, fikstür, sonuçlar ve Volleybox kadroları.";

  switch (tab) {
    case "standings":
      title = "Vodafone Sultanlar Ligi Puan Durumu";
      description = "Vodafone Sultanlar Ligi güncel puan durumu, averajlar, set farkları ve lig sıralaması.";
      break;
    case "fixtures":
      title = "Vodafone Sultanlar Ligi Fikstür";
      description = "Vodafone Sultanlar Ligi haftalık maç programı, salon bilgileri ve başlama saatleri.";
      break;
    case "results":
      title = "Vodafone Sultanlar Ligi Maç Sonuçları ve Skorlar";
      description = "Vodafone Sultanlar Ligi tamamlanan karşılaşmaların resmi set ve maç skorları.";
      break;
    case "today":
      title = "Vodafone Sultanlar Ligi Günün Maçları";
      description = "Vodafone Sultanlar Ligi bugün oynanacak tüm karşılaşmalar, canlı takip ve salon bilgileri.";
      break;
    case "teams":
      title = "Vodafone Sultanlar Ligi Takımları ve Kulüp Profilleri";
      description = "Vodafone Sultanlar Ligi'nde mücadele eden 14 voleybol kulübü, maçları ve kadro bağlantıları.";
      break;
    case "karsilastir":
      title = "Vodafone Sultanlar Ligi Takım Karşılaştırması & H2H";
      description = "Vodafone Sultanlar Ligi takımlarının kafa kafaya maçları, galibiyet oranları ve form durumu kıyaslaması.";
      break;
    case "statu":
      title = "Vodafone Sultanlar Ligi 2026-2027 Resmi Lig Statüsü";
      description = "2026-2027 sezonu Vodafone Sultanlar Ligi şampiyonluk, klasman play-off ve düşme statüsü.";
      break;
    case "home":
    default:
      title = "Vodafone Sultanlar Ligi — Canlı Puan Durumu & Fikstür";
      description = "Vodafone Sultanlar Ligi canlı puan cetveli, haftalık maç fikstürleri ve Volleybox kadroları.";
      break;
  }

  const canonicalUrl = `https://altyapivoleybol.com.tr${getSultanlarLigiRoute(tab)}`;

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
    "takimlar",
    "karsilastir",
    "statu",
    "anasayfa",
  ];

  return tabs.map((t) => ({ slug: [t] }));
}

export default async function SultanlarLigiSlugPage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug || slug.length === 0 || !isValidSultanlarLigiSlug(slug)) {
    notFound();
  }

  const path = `/sultanlar-ligi/${slug.join("/")}`;
  const { tab } = parseSultanlarLigiRoute(path);

  const data = compactKadinlar2LigData(getSultanlarLigiData());

  return (
    <SultanlarLigiClient
      initialData={data}
      initialTab={tab}
    />
  );
}
