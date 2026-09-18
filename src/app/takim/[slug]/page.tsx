import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Trophy, ChevronLeft } from "lucide-react";
import { getTeamDetailsBySlug } from "@/utils/teamData";
import { TeamDetailClient } from "@/components/TeamDetailClient";

interface TeamPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ sehir?: string; city?: string }>;
}

export async function generateMetadata({ params, searchParams }: TeamPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sParams = searchParams ? await searchParams : undefined;
  const cityFilter =
    typeof sParams?.sehir === "string"
      ? sParams.sehir
      : typeof sParams?.city === "string"
      ? sParams.city
      : undefined;
  const team = getTeamDetailsBySlug(slug, cityFilter);

  if (!team) {
    return {
      title: "Takım Bulunamadı — Altyapı Voleybol",
      description: "Aranan voleybol takımı için henüz fikstür veya puan durumu kaydı bulunamadı.",
    };
  }

  const citiesStr = team.cities.join(", ");
  const catStr = team.categories.join(", ");

  return {
    title: `${team.teamName} — 2026/27 Sezon Fikstürü & Puan Durumu | Altyapı Voleybol`,
    description: `${team.teamName} (${citiesStr}) voleybol takımı ${catStr} sezon fikstürü, güncel puan durumu, maç sonuçları ve Volleybox profili.`,
    openGraph: {
      title: `${team.teamName} — Sezon Fikstürü ve Puan Durumu`,
      description: `${team.teamName} maç takvimi, skorları ve lig puan durumu.`,
    },
  };
}

export default async function TeamDetailPage({ params, searchParams }: TeamPageProps) {
  const { slug } = await params;
  const sParams = searchParams ? await searchParams : undefined;
  const cityFilter =
    typeof sParams?.sehir === "string"
      ? sParams.sehir
      : typeof sParams?.city === "string"
      ? sParams.city
      : undefined;
  const team = getTeamDetailsBySlug(slug, cityFilter);

  if (!team) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 text-slate-500 shadow-inner">
          <Trophy size={32} />
        </div>
        <h1 className="text-xl sm:text-2xl font-black mb-2">Bu takım için henüz veri bulunmuyor</h1>
        <p className="text-slate-400 max-w-md text-xs sm:text-sm mb-6">
          Aradığınız takım için il temsilciliği bültenlerinde fikstür veya puan durumu bilgisi henüz açıklanmamış olabilir.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-md"
        >
          <ChevronLeft size={16} />
          <span>Ana Sayfaya Dön</span>
        </Link>
      </div>
    );
  }

  return <TeamDetailClient team={team} />;
}
