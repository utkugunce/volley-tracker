import { Metadata } from "next";
import { buildStatsMetadata, getStatsStaticParams, StatsPageView } from "../stats-page";

// Kategori sayfaları (Genç Kızlar Süper Lig vb.) derleme sırasında üretilir, 10 dk'da bir yenilenir.
export const revalidate = 1800; // 30 minutes ISR cache

export function generateStaticParams() {
  return getStatsStaticParams();
}

interface StatsCategoryPageProps {
  params: Promise<{ kategori: string }>;
}

export async function generateMetadata({ params }: StatsCategoryPageProps): Promise<Metadata> {
  const { kategori } = await params;
  return buildStatsMetadata(kategori);
}

export default async function StatsCategoryPage({ params }: StatsCategoryPageProps) {
  const { kategori } = await params;
  return <StatsPageView slug={kategori} />;
}
