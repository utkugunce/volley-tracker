"use client";

import React from "react";
import { Star } from "lucide-react";
import type { TodayQuickStatus } from "@/hooks/useTodayMatchesData";
import type { DashboardKpis } from "@/utils/todayMatches";

interface TodayStatusFilterProps {
  quickStatus: TodayQuickStatus;
  setQuickStatus: (status: TodayQuickStatus) => void;
  dashboardKpis: DashboardKpis;
  todayFavoritesCount: number;
}

/** Hızlı Filtre Butonları (Tümü / Oynanacak / Bitenler / Favorilerim). */
export function TodayStatusFilter({ quickStatus, setQuickStatus, dashboardKpis, todayFavoritesCount }: TodayStatusFilterProps) {
  return (
    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap" role="tablist" aria-label="Maç durum filtresi">
      <span className="text-[11px] text-slate-400 font-medium mr-1">Durum:</span>
      <button
        type="button"
        role="tab"
        aria-selected={quickStatus === "all"}
        onClick={() => setQuickStatus("all")}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          quickStatus === "all"
            ? "bg-selected-strong text-white shadow-glow-selected font-bold"
            : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 hover:text-white border border-slate-700/50"
        }`}
      >
        Tümü ({dashboardKpis.todayTotal})
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={quickStatus === "upcoming"}
        onClick={() => setQuickStatus("upcoming")}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
          quickStatus === "upcoming"
            ? "bg-sky-600 text-white shadow-xs font-bold"
            : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 hover:text-white border border-slate-700/50"
        }`}
      >
        Oynanacak ({dashboardKpis.todayUpcoming})
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={quickStatus === "finished"}
        onClick={() => setQuickStatus("finished")}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
          quickStatus === "finished"
            ? "bg-emerald-600 text-white shadow-xs font-bold"
            : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 hover:text-white border border-slate-700/50"
        }`}
      >
        Bitenler ({dashboardKpis.todayFinished})
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={quickStatus === "favorites"}
        onClick={() => setQuickStatus("favorites")}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
          quickStatus === "favorites"
            ? "bg-amber-500/25 text-amber-300 border border-amber-500/60 shadow-glow-amber font-bold"
            : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 hover:text-white border border-slate-700/50"
        }`}
        title="Favori takımlarınızın ve maçlarınızın programı"
      >
        <Star size={11} className={quickStatus === "favorites" ? "fill-amber-400 text-amber-400" : "text-amber-400/80"} />
        <span>Favorilerim</span>
        <span className="bg-black/40 text-amber-300 text-[10px] px-1 rounded-full font-mono font-bold">
          {todayFavoritesCount}
        </span>
      </button>
    </div>
  );
}
