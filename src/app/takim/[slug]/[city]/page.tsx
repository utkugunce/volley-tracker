import { Metadata } from "next";
import { buildTeamMetadata, TeamPageView } from "../../team-page";

// Çok şehirli takımların il varyantı: /takim/izmir-vakifbank yerine /takim/vakifbank/izmir.
// Eski `/takim/<slug>?sehir=<il>` (ve `?city=`) adresleri next.config.mjs rewrite'ı ile buraya çözülür.
export const revalidate = 86400; // 24 hours ISR cache (Vercel kota)

export function generateStaticParams() {
  return [];
}

interface TeamCityPageProps {
  params: Promise<{ slug: string; city: string }>;
}

export async function generateMetadata({ params }: TeamCityPageProps): Promise<Metadata> {
  const { slug, city } = await params;
  // Kanonik adres (`/takim/<slug>/<il>`) buildTeamMetadata içinde üretilir.
  return buildTeamMetadata(slug, decodeURIComponent(city));
}

export default async function TeamCityDetailPage({ params }: TeamCityPageProps) {
  const { slug, city } = await params;
  return <TeamPageView slug={slug} cityFilter={decodeURIComponent(city)} />;
}
