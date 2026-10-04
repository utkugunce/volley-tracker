import { Metadata } from "next";
import { Kadinlar2LigClient } from "@/components/kadinlar-2-lig/Kadinlar2LigClient";
import { getKadinlar2LigData } from "@/utils/kadinlar2LigServer";

export const metadata: Metadata = {
  title: "TVF Kadınlar 2. Ligi — Canlı Puan Durumu & Fikstür",
  description:
    "Türkiye Voleybol Federasyonu Uzman Posta Kadınlar 2. Ligi 16 grup resmi puan cetveli, haftalık maç fikstürleri, salon bilgileri ve Volleybox kadroları.",
  alternates: {
    canonical: "https://altyapivoleybol.com.tr/kadinlar-2-ligi",
  },
  openGraph: {
    title: "TVF Kadınlar 2. Ligi — Canlı Puan Durumu & Fikstür",
    description:
      "TVF Kadınlar 2. Ligi 16 grup puan durumu, fikstür, sonuçlar ve Volleybox eşleşmeleri.",
    type: "website",
    url: "https://altyapivoleybol.com.tr/kadinlar-2-ligi",
    images: [{ url: "/icon.svg", width: 512, height: 512, alt: "TVF Kadınlar 2. Ligi" }],
  },
};

export const revalidate = 300; // 5 minutes ISR cache

export default function Kadinlar2LigPage() {
  const data = getKadinlar2LigData();

  return <Kadinlar2LigClient initialData={data} initialTab="home" />;
}
