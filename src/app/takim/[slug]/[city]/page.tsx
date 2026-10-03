import { Metadata } from "next";
import { buildTeamMetadata, TeamPageView } from "../../team-page";

// Çok şehirli takımların il varyantı: /takim/izmir-vakifbank yerine /takim/vakifbank/izmir.
// Eski `/takim/<slug>?sehir=<il>` (ve `?city=`) adresleri next.config.mjs rewrite'ı ile buraya çözülür.
export const revalidate = 600;

export function generateStaticParams() {
  return [];
}

interface TeamCityPageProps {
  params: Promise<{ slug: string; city: string }>;
}

export async function generateMetadata({ params }: TeamCityPageProps): Promise<Metadata> {
  const { slug, city } = await params;
  const base = await buildTeamMetadata(slug, decodeURIComponent(city));
  return {
    ...base,
    alternates: { canonical: `https://altyapivoleybol.com.tr/takim/${slug}/${city}` },
  };
}

export default async function TeamCityDetailPage({ params }: TeamCityPageProps) {
  const { slug, city } = await params;
  return <TeamPageView slug={slug} cityFilter={decodeURIComponent(city)} />;
}
