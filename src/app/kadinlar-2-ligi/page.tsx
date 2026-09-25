import fs from "fs";
import path from "path";
import { Metadata } from "next";
import { Kadinlar2LigData } from "@/types/kadinlar2Lig";
import { Kadinlar2LigClient } from "@/components/kadinlar-2-lig/Kadinlar2LigClient";

export const metadata: Metadata = {
  title: "TVF Uzman Posta Kadınlar 2. Ligi - Canlı Puan Durumu & Fikstür | Voleybol Takip",
  description:
    "Türkiye Voleybol Federasyonu Uzman Posta Kadınlar 2. Ligi 16 grup resmi puan cetveli, haftalık maç fikstürleri, salon bilgileri ve Volleybox kadroları.",
  openGraph: {
    title: "TVF Uzman Posta Kadınlar 2. Ligi - Canlı Puan Durumu & Fikstür",
    description:
      "TVF Kadınlar 2. Ligi 16 grup puan durumu, fikstür, sonuçlar ve Volleybox eşleşmeleri.",
    type: "website",
  },
};

export const revalidate = 60; // 1 minute ISR cache

function getKadinlar2LigData(): Kadinlar2LigData {
  const filePath = path.join(process.cwd(), "data", "kadinlar_2_lig.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("data/kadinlar_2_lig.json dosyası bulunamadı. Lütfen önce scraper'ı çalıştırın.");
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

export default function Kadinlar2LigPage() {
  const data = getKadinlar2LigData();

  return <Kadinlar2LigClient initialData={data} />;
}
