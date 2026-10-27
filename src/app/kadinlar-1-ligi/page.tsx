import { Metadata } from "next";
import { Kadinlar1LigClient } from "@/components/kadinlar-1-lig/Kadinlar1LigClient";
import { getKadinlar1LigData } from "@/utils/kadinlar1LigServer";
import { compactKadinlar2LigData } from "@/utils/kadinlar2LigPayload";

export const metadata: Metadata = {
  title: "TVF KFC Kadınlar 1. Ligi — Canlı Puan Durumu & Fikstür",
  description:
    "Türkiye Voleybol Federasyonu KFC Kadınlar 1. Ligi A ve B grubu resmi puan cetveli, haftalık maç fikstürleri, salon bilgileri ve Volleybox kadroları.",
  alternates: {
    canonical: "https://altyapivoleybol.com.tr/kadinlar-1-ligi",
  },
  openGraph: {
    title: "TVF KFC Kadınlar 1. Ligi — Canlı Puan Durumu & Fikstür",
    description:
      "TVF Kadınlar 1. Ligi 2 grup puan durumu, fikstür, sonuçlar ve Volleybox eşleşmeleri.",
    type: "website",
    url: "https://altyapivoleybol.com.tr/kadinlar-1-ligi",
    images: [{ url: "/icon.svg", width: 512, height: 512, alt: "TVF Kadınlar 1. Ligi" }],
  },
};

export const revalidate = 300;

export default function Kadinlar1LigPage() {
  const data = compactKadinlar2LigData(getKadinlar1LigData());

  return <Kadinlar1LigClient initialData={data} initialTab="home" />;
}
