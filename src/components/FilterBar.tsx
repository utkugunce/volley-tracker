"use client";

import React from "react";
import { Search, X, MapPin, AlertTriangle, CheckCircle2, History } from "lucide-react";

interface FilterBarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;

  statusFilter: string; // "all" | "upcoming" | "finished"
  onSelectStatusFilter: (status: string) => void;

  counts: {
    all: number;
    upcoming: number;
    finished: number;
  };

  halls: string[];
  selectedHall: string;
  onSelectHall: (hall: string) => void;

  searchQuery: string;
  onSearchChange: (q: string) => void;

  // Volleybox filtreleri & istatistikleri
  volleyboxFilter?: "all" | "synced" | "scored" | "unscored" | "discrepancy" | "unsynced";
  onSelectVolleyboxFilter?: (filter: "all" | "synced" | "scored" | "unscored" | "discrepancy" | "unsynced") => void;
  volleyboxStats?: {
    total: number;
    synced: number;
    scored: number;
    unscored: number;
    unsynced: number;
    discrepancy?: number;
    percent?: number;
  };

  onReset: () => void;
  isFiltered: boolean;
  isResultsTab?: boolean;
  resultsSubTab?: "all" | "yesterday";
  onSelectResultsSubTab?: (subTab: "all" | "yesterday") => void;
  yesterdayCount?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  statusFilter,
  onSelectStatusFilter,
  counts,
  halls,
  selectedHall,
  onSelectHall,
  searchQuery,
  onSearchChange,
  volleyboxFilter = "all",
  onSelectVolleyboxFilter,
  volleyboxStats,
  onReset,
  isFiltered,
  isResultsTab = false,
  resultsSubTab = "all",
  onSelectResultsSubTab,
  yesterdayCount = 0,
}) => {
  const statusTabs = [
    { id: "all", label: "HEPSİ", count: counts.all },
    { id: "upcoming", label: "OYNANACAK", count: counts.upcoming },
    { id: "finished", label: "BİTENLER", count: counts.finished },
  ];

  return (
    <div className="glass-panel border border-slate-800/80 rounded-2xl p-3 sm:p-3.5 mb-4 shadow-card max-w-6xl mx-auto space-y-3 no-print">
      {/* 1. Flashscore Durum Sekmeleri & Lig Filtreleri */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        {/* HEPSİ / OYNANACAK / BİTENLER VEYA SONUÇLAR ALT SEKME DÜĞMELERİ */}
        {isResultsTab ? (
          <div className="flex items-center gap-1.5 overflow-x-auto" role="tablist" aria-label="Sonuç alt sekmeleri">
            <button
              type="button"
              role="tab"
              aria-selected={resultsSubTab === "all"}
              onClick={() => onSelectResultsSubTab?.("all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                resultsSubTab === "all"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-glow-emerald font-bold"
                  : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/50"
              }`}
            >
              <CheckCircle2 size={13} aria-hidden="true" className={resultsSubTab === "all" ? "text-white" : "text-emerald-400"} />
              <span>SONUÇLAR</span>
              <span
                className={`text-[10px] px-1.5 rounded-full font-mono font-bold ${
                  resultsSubTab === "all" ? "bg-white/20 text-white" : "bg-slate-700 text-slate-300"
                }`}
              >
                {counts.all}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={resultsSubTab === "yesterday"}
              onClick={() => onSelectResultsSubTab?.("yesterday")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                resultsSubTab === "yesterday"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-glow-emerald ring-2 ring-emerald-400/40 font-bold"
                  : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/50"
              }`}
            >
              <History size={13} aria-hidden="true" className={resultsSubTab === "yesterday" ? "text-white" : "text-slate-400"} />
              <span>DÜNÜN SONUÇLARI</span>
              <span
                className={`text-[10px] px-1.5 rounded-full font-mono font-bold ${
                  resultsSubTab === "yesterday" ? "bg-white/20 text-white" : "bg-slate-700 text-slate-300"
                }`}
              >
                {yesterdayCount}
              </span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Maç durum sekmeleri">
            {statusTabs.map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onSelectStatusFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red font-bold ring-2 ring-red-500/30"
                      : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/50"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive ? "bg-black/30 text-white" : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Lig Sekmeleri: Genç Kızlar Süper Lig / Yıldız Kızlar Süper Lig */}
        <div className="flex items-center gap-1 overflow-x-auto" role="tablist" aria-label="Lig filtreleri">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-xs font-bold ring-1 ring-red-500/40"
                    : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Salon, Takım Arama ve Volleybox Filtreleri */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Arama Input */}
          <div className="relative flex-1 sm:w-60 min-w-[170px]">
            <Search
              size={13}
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Kulüp veya salon ara..."
              aria-label="Kulüp veya salon ara"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-8.5 pr-7 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus-visible:ring-2 focus-visible:ring-red-500/30 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Aramayı temizle"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
              >
                <X size={12} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Salon Seçimi */}
          <div className="relative hidden sm:block">
            <select
              value={selectedHall}
              onChange={(e) => onSelectHall(e.target.value)}
              aria-label="Salon filtrele"
              className="bg-slate-900/90 border border-slate-700/80 text-slate-200 text-xs rounded-xl px-3 py-1.5 pr-7 appearance-none focus:outline-none focus:border-red-500 focus-visible:ring-2 focus-visible:ring-red-500/30 transition-all cursor-pointer font-medium"
            >
              <option value="Tümü">Tüm Salonlar</option>
              {halls.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <MapPin
              size={11}
              aria-hidden="true"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Volleybox Durumu Filtresi (Skorlu / Skorsuz / Girilmedi) */}
          {onSelectVolleyboxFilter && (
            <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-xl p-0.5 text-xs" role="group" aria-label="Volleybox veri eşleşme filtresi">
              <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-2xs" aria-hidden="true"></span>
                Volleybox:
              </span>
              <button
                type="button"
                aria-pressed={volleyboxFilter === "all"}
                onClick={() => onSelectVolleyboxFilter("all")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                  volleyboxFilter === "all"
                    ? "bg-slate-800 text-white shadow-xs font-bold border border-slate-700/60"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Tümü
              </button>
              <button
                type="button"
                aria-pressed={volleyboxFilter === "scored"}
                onClick={() => onSelectVolleyboxFilter("scored")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 ${
                  volleyboxFilter === "scored"
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "text-emerald-400 hover:bg-emerald-950/60"
                }`}
                title="Volleybox'ta skoru girilmiş maçlar"
              >
                <span>Skorlu</span>
                {volleyboxStats && (
                  <span className={`text-[10px] font-mono ${volleyboxFilter === "scored" ? "text-emerald-100" : "text-emerald-500 font-bold"}`}>
                    ({volleyboxStats.scored})
                  </span>
                )}
              </button>
              <button
                type="button"
                aria-pressed={volleyboxFilter === "unscored"}
                onClick={() => onSelectVolleyboxFilter("unscored")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 ${
                  volleyboxFilter === "unscored"
                    ? "bg-amber-600 text-white shadow-xs font-bold"
                    : "text-amber-400 hover:bg-amber-950/60"
                }`}
                title="Volleybox'ta kayıtlı ancak skoru henüz girilmemiş maçlar"
              >
                <span>Skorsuz</span>
                {volleyboxStats && (
                  <span className={`text-[10px] font-mono ${volleyboxFilter === "unscored" ? "text-amber-100" : "text-amber-500 font-bold"}`}>
                    ({volleyboxStats.unscored})
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Filtreleri Sıfırla */}
        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            aria-label="Tüm filtreleri sıfırla"
            className="px-2.5 py-1 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 font-medium flex items-center gap-1.5 transition-all shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer active:scale-95"
          >
            <X size={12} aria-hidden="true" />
            <span className="hidden sm:inline">Temizle</span>
          </button>
        )}
      </div>
    </div>
  );
};
