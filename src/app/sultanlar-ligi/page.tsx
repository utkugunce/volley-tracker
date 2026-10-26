import { Metadata } from "next";
import { SultanlarLigiClient } from "@/components/sultanlar-ligi/SultanlarLigiClient";
import { getSultanlarLigiData } from "@/utils/sultanlarLigiServer";
import { compactKadinlar2LigData } from "@/utils/kadinlar2LigPayload";

export const metadata: Metadata = {
  title: "Vodafone Sultanlar Ligi — Canlı Puan Durumu & Fikstür",
  description:
    "Türkiye Voleybol Federasyonu Vodafone Sultanlar Ligi resmi puan cetveli, haftalık maç fikstürleri, salon bilgileri ve Volleybox kadroları.",
  alternates: {
    canonical: "https://altyapivoleybol.com.tr/sultanlar-ligi",
  },
  openGraph: {
    title: "Vodafone Sultanlar Ligi — Canlı Puan Durumu & Fikstür",
    description:
      "TVF Vodafone Sultanlar Ligi puan durumu, fikstür, sonuçlar ve Volleybox eşleşmeleri.",
    type: "website",
    url: "https://altyapivoleybol.com.tr/sultanlar-ligi",
    images: [{ url: "/icon.svg", width: 512, height: 512, alt: "Vodafone Sultanlar Ligi" }],
  },
};

export const revalidate = 86400; // 24 hours ISR cache

export default function SultanlarLigiPage() {
  const data = compactKadinlar2LigData(getSultanlarLigiData());

  return <SultanlarLigiClient initialData={data} initialTab="home" />;
}
