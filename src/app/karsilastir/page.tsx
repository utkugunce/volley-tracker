import React, { Suspense } from "react";
import { Metadata } from "next";
import { getAllTeamsList, getHeadToHeadComparison } from "@/utils/teamData";
import { buildCompareStats, slimComparison } from "@/utils/compareStats";
import { CompareClient } from "./CompareClient";
import { ComparePageSkeleton } from "@/components/skeletons/PageSkeletons";

interface ComparePageProps {
  searchParams?: Promise<{
    takim1?: string;
    takim2?: string;
    team1?: string;
    team2?: string;
  }>;
}

export async function generateMetadata({ searchParams }: ComparePageProps): Promise<Metadata> {
  const sParams = searchParams ? await searchParams : undefined;
  const slug1 = sParams?.takim1 || sParams?.team1 || "";
  const slug2 = sParams?.takim2 || sParams?.team2 || "";

  if (slug1 && slug2) {
    const comp = getHeadToHeadComparison(slug1, slug2);
    if (comp) {
      const t1 = comp.team1.teamName;
      const t2 = comp.team2.teamName;
      const url = `https://altyapivoleybol.com.tr/karsilastir?takim1=${encodeURIComponent(slug1)}&takim2=${encodeURIComponent(slug2)}`;
      const description = `${t1} ve ${t2} arasındaki geçmiş maç sonuçları, set skorları, form, set ve sayı ortalamaları ile lig puan durumu istatistikleri.`;
      return {
        title: `${t1} vs ${t2} — Karşılaştırma | Altyapı Voleybol`,
        description,
        alternates: { canonical: url },
        openGraph: { title: `${t1} vs ${t2} — Takım Karşılaştırma`, description, url, type: "website" },
      };
    }
  }

  return {
    title: "İki Takım Karşılaştırma (Head-to-Head) | Altyapı Voleybol",
    description:
      "Altyapı voleybol takımları arasında geçmiş maç sonuçlarını, form, set ve sayı ortalamalarını ve lig puan durumu istatistiklerini yan yana karşılaştırın.",
    alternates: { canonical: "https://altyapivoleybol.com.tr/karsilastir" },
  };
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const sParams = searchParams ? await searchParams : undefined;
  const slug1 = sParams?.takim1 || sParams?.team1 || "";
  const slug2 = sParams?.takim2 || sParams?.team2 || "";

  const teamsList = getAllTeamsList();
  const fullComparison = slug1 && slug2 ? getHeadToHeadComparison(slug1, slug2) : null;
  // İstatistikler sunucuda hesaplanır; istemciye yalnızca hafifletilmiş karşılaştırma verisi gider.
  const statsData = fullComparison ? buildCompareStats(fullComparison) : null;
  const comparison = fullComparison ? slimComparison(fullComparison) : null;

  return (
    <Suspense fallback={<ComparePageSkeleton />}>
      <CompareClient
        teamsList={teamsList}
        initialSlug1={slug1}
        initialSlug2={slug2}
        comparison={comparison}
        statsData={statsData}
      />
    </Suspense>
  );
}
