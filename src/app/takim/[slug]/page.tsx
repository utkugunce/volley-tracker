import { Metadata } from "next";
import { buildTeamMetadata, TeamPageView } from "../team-page";

// Sayfa artık arama parametresi okumadığı için ISR ile CDN'den servis edilir.
// 2387 takım sayfası derleme sırasında üretilmez; ilk istekte üretilir ve 10 dk önbellekte kalır.
export const revalidate = 1800; // 30 minutes ISR cache

export function generateStaticParams() {
  return [];
}

interface TeamPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const { slug } = await params;
  return buildTeamMetadata(slug);
}

export default async function TeamDetailPage({ params }: TeamPageProps) {
  const { slug } = await params;
  return <TeamPageView slug={slug} />;
}
