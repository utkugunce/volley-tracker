import { Metadata } from "next";
import { buildStatsMetadata, StatsPageView } from "./stats-page";

// Lig genelinde tek bir sayfa; veri 30 dakikada bir değiştiği için ISR ile CDN'den servis edilir.
export const revalidate = 3600; // 1 hour ISR cache (Vercel kota)

export function generateMetadata(): Metadata {
  return buildStatsMetadata();
}

export default function StatsPage() {
  return <StatsPageView />;
}
