import React from "react";
import { Trophy, Flame, CheckCircle2, Activity } from "lucide-react";
import { formatDateTurkish } from "@/utils/calendar";
import type { DashboardKpis, MatchDay } from "@/utils/todayMatches";

interface TodayKpiCardsProps {
  city: string;
  dashboardKpis: DashboardKpis;
  nextMatchDay: MatchDay | null;
}

/** 1. DASHBOARD KPI METRİK KARTLARI */
export function TodayKpiCards({ city, dashboardKpis, nextMatchDay }: TodayKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
      {/* KPI 1: Toplam Fikstür */}
      <div className="glass-panel rounded-2xl p-3.5 sm:p-4 flex items-center justify-between border-slate-800/80 hover:border-indigo-500/40 transition-all duration-300 shadow-card hover:shadow-card-hover group relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
        <div className="relative z-10">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
            {city === "Tüm İller" ? "Toplam Fikstür" : `${city} Fikstürü`}
          </span>
          <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block tracking-tight group-hover:text-indigo-200 transition-colors">
            {dashboardKpis.totalMatchesCount}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
            {city === "Tüm İller" ? `${dashboardKpis.activeCities} Aktif İl Bütünü` : "Sezon Maçları"}
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-900/70 to-indigo-950/90 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-700/50 shadow-inner group-hover:scale-110 transition-transform">
          <Trophy size={20} />
        </div>
      </div>

      {/* KPI 2: Günün Programı */}
      <div className="glass-panel rounded-2xl p-3.5 sm:p-4 flex items-center justify-between border-slate-800/80 hover:border-amber-500/40 transition-all duration-300 shadow-card hover:shadow-card-hover group relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
        <div className="relative z-10">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
            Günün Maçları
          </span>
          <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block tracking-tight group-hover:text-amber-200 transition-colors">
            {dashboardKpis.todayTotal}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
            {dashboardKpis.todayTotal > 0
              ? `${dashboardKpis.todayUpcoming} bekliyor • ${dashboardKpis.todayFinished} bitti`
              : nextMatchDay
              ? `Sıradaki: ${formatDateTurkish(nextMatchDay.date).split(" ")[0]} ${formatDateTurkish(nextMatchDay.date).split(" ")[1]}`
              : "Bugün maç yok"}
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-900/70 to-amber-950/90 text-amber-400 flex items-center justify-center shrink-0 border border-amber-700/50 shadow-inner group-hover:scale-110 transition-transform">
          <Flame size={20} />
        </div>
      </div>

      {/* KPI 3: Volleybox Eşleşmesi */}
      <div className="glass-panel rounded-2xl p-3.5 sm:p-4 flex items-center justify-between border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300 shadow-card hover:shadow-card-hover group relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
        <div className="relative z-10">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
            VB Eşleşme
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5 block tracking-tight">
            %{dashboardKpis.syncedPercent}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
            {dashboardKpis.syncedCount} / {dashboardKpis.totalMatchesCount} Maç Eşleşti
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-900/70 to-emerald-950/90 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-700/50 shadow-inner group-hover:scale-110 transition-transform">
          <CheckCircle2 size={20} />
        </div>
      </div>

      {/* KPI 4: Skor Giriş Durumu */}
      <div className="glass-panel rounded-2xl p-3.5 sm:p-4 flex items-center justify-between border-slate-800/80 hover:border-sky-500/40 transition-all duration-300 shadow-card hover:shadow-card-hover group relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-500/20 transition-all" />
        <div className="relative z-10">
          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
            Skor Durumu
          </span>
          <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block tracking-tight group-hover:text-sky-200 transition-colors">
            {dashboardKpis.scoredCount}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
            {dashboardKpis.unscoredPassed > 0 ? (
              <span className="text-warn font-bold">
                {dashboardKpis.unscoredPassed} Maç Skorsuz!
              </span>
            ) : (
              <span className="text-emerald-400 font-medium">Tüm skorlar güncel</span>
            )}
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-900/70 to-sky-950/90 text-sky-400 flex items-center justify-center shrink-0 border border-sky-700/50 shadow-inner group-hover:scale-110 transition-transform">
          <Activity size={20} />
        </div>
      </div>
    </div>
  );
}
