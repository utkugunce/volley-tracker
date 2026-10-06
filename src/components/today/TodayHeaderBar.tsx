"use client";

import React from "react";
import { Calendar, Flame, ArrowRight, LayoutGrid, Table as TableIcon } from "lucide-react";
import { PrintScheduleButton } from "@/components/PrintScheduleButton";
import type { TodayQuickStatus } from "@/hooks/useTodayMatchesData";
import type { DashboardKpis } from "@/utils/todayMatches";
import { TodayStatusFilter } from "./TodayStatusFilter";

export type TodayDisplayMode = "cards" | "table";

interface TodayHeaderBarProps {
  city: string;
  formattedToday: string;
  displayMode: TodayDisplayMode;
  setDisplayMode: (mode: TodayDisplayMode) => void;
  onNavigateToFullFixtures: () => void;
  todayMatchesCount: number;
  quickStatus: TodayQuickStatus;
  setQuickStatus: (status: TodayQuickStatus) => void;
  dashboardKpis: DashboardKpis;
  todayFavoritesCount: number;
}

/** 3. ANA GÜNÜN MAÇLARI / PROGRAM BAŞLIK ÇUBUĞU */
export function TodayHeaderBar({
  city,
  formattedToday,
  displayMode,
  setDisplayMode,
  onNavigateToFullFixtures,
  todayMatchesCount,
  quickStatus,
  setQuickStatus,
  dashboardKpis,
  todayFavoritesCount,
}: TodayHeaderBarProps) {
  return (
    <div className="glass-panel border border-slate-800/90 rounded-2xl p-4 sm:p-4.5 text-white shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-28 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-raised text-ink-2 border border-line uppercase tracking-wider">
              <Flame size={12} className="text-warn" />
              Günün Programı
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {city === "Tüm İller" ? "Türkiye Geneli" : city}
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
            <Calendar size={18} className="text-amber-400 shrink-0" />
            <span>Günün Maçları Takibi</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">{formattedToday}</p>
        </div>

        {/* Sağ Kontroller: Görünüm Değiştirici (Kart / Tablo) & Tüm Fikstür */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Kart vs Tablo Görünümü */}
          <div className="bg-slate-900/80 p-0.5 rounded-xl border border-slate-800 flex items-center gap-0.5" role="tablist" aria-label="Görünüm biçimi">
            <button
              type="button"
              role="tab"
              aria-selected={displayMode === "cards"}
              aria-label="Kartlar görünümü"
              onClick={() => setDisplayMode("cards")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                displayMode === "cards"
                  ? "bg-selected-strong text-white font-bold shadow-glow-selected"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Dashboard Kart Görünümü"
            >
              <LayoutGrid size={13} aria-hidden="true" />
              <span className="hidden sm:inline">Kartlar</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={displayMode === "table"}
              aria-label="Tablo görünümü"
              onClick={() => setDisplayMode("table")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                displayMode === "table"
                  ? "bg-selected-strong text-white font-bold shadow-glow-selected"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Detaylı Tablo Görünümü"
            >
              <TableIcon size={13} aria-hidden="true" />
              <span className="hidden sm:inline">Tablo</span>
            </button>
          </div>

          <PrintScheduleButton title="Bülten Yazdır" />

          <button
            type="button"
            onClick={onNavigateToFullFixtures}
            aria-label="Tüm sezon fikstürünü ve tarih şeridini görüntüle"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-3 py-1.5 rounded-xl border border-slate-700/80 transition-all hover:border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
            title="Tüm sezon takvimini ve tarih şeridini görüntüle"
          >
            <span>Tüm Fikstür</span>
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        </div>
      </div>


      {/* Hızlı Filtre Butonları */}
      {todayMatchesCount > 0 && (
        <TodayStatusFilter
          quickStatus={quickStatus}
          setQuickStatus={setQuickStatus}
          dashboardKpis={dashboardKpis}
          todayFavoritesCount={todayFavoritesCount}
        />
      )}
    </div>
  );
}
