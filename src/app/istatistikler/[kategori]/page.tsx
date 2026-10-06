import { Metadata } from "next";
import { buildStatsMetadata, getStatsStaticParams, StatsPageView } from "../stats-page";

// Kategori sayfaları (Genç Kızlar Süper Lig vb.) derleme sırasında üretilir, 1 saatte bir yenilenir.
export const revalidate = 86400; // 24 hours ISR cache (Vercel kota)

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
