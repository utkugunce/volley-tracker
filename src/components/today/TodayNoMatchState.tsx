"use client";

import React from "react";
import { CalendarDays, ArrowRight, SearchX } from "lucide-react";

interface TodayNoMatchStateProps {
  todayMatchesCount: number;
  formattedToday: string;
  city: string;
  onNavigateToFullFixtures: () => void;
  onResetFilter: () => void;
}

/** Bugün maç yoksa bilgilendirme; maç var ama filtreye uyan yoksa filtre sıfırlama kartı. */
export function TodayNoMatchState({
  todayMatchesCount,
  formattedToday,
  city,
  onNavigateToFullFixtures,
  onResetFilter,
}: TodayNoMatchStateProps) {
  if (todayMatchesCount === 0) {
    // Bugün Maç Yok Bilgilendirmesi
    return (
      <div className="glass-panel border border-slate-800/90 rounded-2xl p-6 sm:p-8 text-center shadow-xl relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-900/60 to-amber-950/80 text-amber-400 flex items-center justify-center mx-auto mb-3.5 border border-amber-700/50 shadow-inner">
            <CalendarDays size={26} />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-white mb-1.5">
            Bugün ({formattedToday}) İçin Planlanmış Maç Bulunmuyor
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
            TVF bülteninde {city === "Tüm İller" ? "Türkiye genelinde" : `${city} ilinde`} bugün oynanacak karşılaşma bulunmamaktadır.
          </p>
          <button
            onClick={onNavigateToFullFixtures}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-fg shadow-glow-primary hover:bg-primary/90 text-xs font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95"
          >
            <span>Tüm Sezon Fikstürüne Git</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 text-center shadow-md">
      <SearchX size={26} className="text-slate-500 mx-auto mb-2" />
      <p className="text-xs font-bold text-slate-300 mb-3">
        Seçtiğiniz duruma uygun maç bulunamadı.
      </p>
      <button
        onClick={onResetFilter}
        className="px-3.5 py-1.5 bg-primary text-primary-fg shadow-glow-primary hover:bg-primary/90 text-xs font-bold rounded-xl transition-all"
      >
        Filtreyi Sıfırla
      </button>
    </div>
  );
}
