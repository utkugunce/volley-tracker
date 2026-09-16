"use client";

import React from "react";
import { Search, X, MapPin, AlertTriangle } from "lucide-react";

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
  volleyboxFilter?: "all" | "synced" | "scored" | "unscored" | "unsynced" | "discrepancy";
  onSelectVolleyboxFilter?: (val: "all" | "synced" | "scored" | "unscored" | "unsynced" | "discrepancy") => void;
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
}) => {
  const statusTabs = [
    { id: "all", label: "HEPSİ", count: counts.all },
    { id: "upcoming", label: "OYNANACAK", count: counts.upcoming },
    { id: "finished", label: "BİTENLER", count: counts.finished },
  ];

  return (
    <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-2.5 sm:p-3 mb-4 shadow-md max-w-6xl mx-auto space-y-2.5 no-print">
      {/* 1. Flashscore Durum Sekmeleri & Lig Filtreleri */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/50 pb-2.5">
        {/* HEPSİ / OYNANACAK / BİTENLER */}
        <div className="flex items-center gap-1">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectStatusFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-600 text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Lig Sekmeleri: Genç Kızlar Süper Lig / Yıldız Kızlar Süper Lig */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-primary text-white"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-600/50"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Salon, Takım Arama ve Volleybox Filtreleri */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Arama Input */}
          <div className="relative flex-1 sm:w-60 min-w-[170px]">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Kulüp veya salon ara..."
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Salon Seçimi */}
          <div className="relative hidden sm:block">
            <select
              value={selectedHall}
              onChange={(e) => onSelectHall(e.target.value)}
              className="bg-slate-900/80 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 pr-7 appearance-none focus:outline-none focus:border-primary cursor-pointer font-medium"
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
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
          </div>

          {/* Volleybox Durumu Filtresi (Skorlu / Skorsuz / Girilmedi) */}
          {onSelectVolleyboxFilter && (
            <div className="flex items-center bg-slate-900/50 border border-slate-700/60 rounded-lg p-0.5 text-xs">
              <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Volleybox:
              </span>
              <button
                type="button"
                onClick={() => onSelectVolleyboxFilter("all")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  volleyboxFilter === "all"
                    ? "bg-slate-700 text-white shadow-xs font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => onSelectVolleyboxFilter("scored")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  volleyboxFilter === "scored"
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "text-emerald-400 hover:bg-emerald-950/60"
                }`}
                title="Volleybox'ta skoru girilmiş maçlar"
              >
                <span>Skorlu</span>
                {volleyboxStats && (
                  <span className={`text-[10px] ${volleyboxFilter === "scored" ? "text-emerald-100" : "text-emerald-500 font-bold"}`}>
                    ({volleyboxStats.scored})
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onSelectVolleyboxFilter("unscored")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  volleyboxFilter === "unscored"
                    ? "bg-amber-600 text-white shadow-xs font-bold"
                    : "text-amber-400 hover:bg-amber-950/60"
                }`}
                title="Volleybox'ta kayıtlı ancak skoru henüz girilmemiş maçlar"
              >
                <span>Skorsuz</span>
                {volleyboxStats && (
                  <span className={`text-[10px] ${volleyboxFilter === "unscored" ? "text-amber-100" : "text-amber-500 font-bold"}`}>
                    ({volleyboxStats.unscored})
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onSelectVolleyboxFilter("unsynced")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  volleyboxFilter === "unsynced"
                    ? "bg-slate-600 text-white shadow-xs font-bold"
                    : "text-slate-400 hover:bg-slate-700/60"
                }`}
                title="Volleybox'a henüz girilmemiş maçlar"
              >
                <span>Girilmedi</span>
                {volleyboxStats && (
                  <span className={`text-[10px] ${volleyboxFilter === "unsynced" ? "text-slate-200" : "text-slate-500"}`}>
                    ({volleyboxStats.unsynced})
                  </span>
                )}
              </button>

              {/* Değişenler: Tarihi, saati veya salonu il bülteninde değişen maçlar */}
              {volleyboxStats && (volleyboxStats.discrepancy ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectVolleyboxFilter("discrepancy")}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                    volleyboxFilter === "discrepancy"
                      ? "bg-amber-600 text-white shadow-xs font-bold"
                      : "text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-700/50 font-bold"
                  }`}
                  title="Volleybox'a girildikten sonra il temsilciliğinde tarihi, saati veya salonu değişen maçlar"
                >
                  <AlertTriangle size={10} className={volleyboxFilter === "discrepancy" ? "text-white" : "text-amber-400"} />
                  <span>Değişenler</span>
                  <span className={`text-[10px] ${volleyboxFilter === "discrepancy" ? "text-amber-100" : "text-amber-400 font-bold"}`}>
                    ({volleyboxStats.discrepancy})
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filtreleri Sıfırla */}
        {isFiltered && (
          <button
            onClick={onReset}
            className="px-2 py-1 rounded text-xs text-slate-400 hover:text-primary hover:bg-slate-700/60 font-medium flex items-center gap-1 transition-colors shrink-0"
          >
            <X size={12} />
            <span className="hidden sm:inline">Temizle</span>
          </button>
        )}
      </div>
    </div>
  );
};
