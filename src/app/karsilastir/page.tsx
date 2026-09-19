import React, { Suspense } from "react";
import { Metadata } from "next";
import { getAllTeamsList, getHeadToHeadComparison } from "@/utils/teamData";
import { CompareClient } from "./CompareClient";

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
      return {
        title: `${t1} vs ${t2} — Karşılaştırma | Altyapı Voleybol`,
        description: `${t1} ve ${t2} arasındaki geçmiş maç sonuçları, set skorları ve lig puan durumu istatistikleri.`,
      };
    }
  }

  return {
    title: "İki Takım Karşılaştırma (Head-to-Head) | Altyapı Voleybol",
    description:
      "Altyapı voleybol takımları arasında geçmiş maç sonuçlarını, set sayılarını ve lig puan durumu istatistiklerini karşılaştırın.",
  };
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const sParams = searchParams ? await searchParams : undefined;
  const slug1 = sParams?.takim1 || sParams?.team1 || "";
  const slug2 = sParams?.takim2 || sParams?.team2 || "";

  const teamsList = getAllTeamsList();
  const comparison = slug1 && slug2 ? getHeadToHeadComparison(slug1, slug2) : null;

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white p-6">Yükleniyor...</div>}>
      <CompareClient
        teamsList={teamsList}
        initialSlug1={slug1}
        initialSlug2={slug2}
        comparison={comparison}
      />
    </Suspense>
  );
}
