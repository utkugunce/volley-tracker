import { Metadata } from "next";
import { buildStatsMetadata, StatsPageView } from "./stats-page";

// Lig genelinde tek bir sayfa; veri 30 dakikada bir değiştiği için ISR ile CDN'den servis edilir.
export const revalidate = 86400; // 24 hours ISR cache (Vercel kota)

export function generateMetadata(): Metadata {
  return buildStatsMetadata();
}

export default function StatsPage() {
  return <StatsPageView />;
}
