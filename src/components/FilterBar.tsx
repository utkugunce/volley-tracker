"use client";

import React from "react";
import { Search, X, MapPin } from "lucide-react";

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
  volleyboxFilter?: "all" | "synced" | "scored" | "unscored" | "unsynced";
  onSelectVolleyboxFilter?: (val: "all" | "synced" | "scored" | "unscored" | "unsynced") => void;
  volleyboxStats?: {
    total: number;
    synced: number;
    scored: number;
    unscored: number;
    unsynced: number;
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
    <div className="bg-white border border-slate-200 rounded-lg p-2.5 sm:p-3 mb-4 shadow-sm max-w-6xl mx-auto space-y-2.5 no-print">
      {/* 1. Flashscore Durum Sekmeleri & Lig Filtreleri */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
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
                    ? "bg-[#0b1325] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1 rounded-full ${
                    isActive ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
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
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
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
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Kulüp veya salon ara..."
              className="w-full bg-slate-50 border border-slate-200 rounded pl-8 pr-7 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded px-2.5 py-1 pr-7 appearance-none focus:outline-none focus:border-primary cursor-pointer font-medium"
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
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Volleybox Durumu Filtresi (Skorlu / Skorsuz / Girilmedi) */}
          {onSelectVolleyboxFilter && (
            <div className="flex items-center bg-slate-100/80 border border-slate-200/80 rounded p-0.5 text-xs">
              <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Volleybox:
              </span>
              <button
                type="button"
                onClick={() => onSelectVolleyboxFilter("all")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  volleyboxFilter === "all"
                    ? "bg-white text-slate-800 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
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
                    : "text-emerald-700 hover:bg-emerald-50"
                }`}
                title="Volleybox'ta skoru girilmiş maçlar"
              >
                <span>Skorlu</span>
                {volleyboxStats && (
                  <span className={`text-[10px] ${volleyboxFilter === "scored" ? "text-emerald-100" : "text-emerald-600 font-bold"}`}>
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
                    : "text-amber-800 hover:bg-amber-50"
                }`}
                title="Volleybox'ta kayıtlı ancak skoru henüz girilmemiş maçlar"
              >
                <span>Skorsuz</span>
                {volleyboxStats && (
                  <span className={`text-[10px] ${volleyboxFilter === "unscored" ? "text-amber-100" : "text-amber-700 font-bold"}`}>
                    ({volleyboxStats.unscored})
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onSelectVolleyboxFilter("unsynced")}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  volleyboxFilter === "unsynced"
                    ? "bg-slate-700 text-white shadow-xs font-bold"
                    : "text-slate-600 hover:bg-slate-200"
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
            </div>
          )}
        </div>

        {/* Filtreleri Sıfırla */}
        {isFiltered && (
          <button
            onClick={onReset}
            className="px-2 py-1 rounded text-xs text-slate-500 hover:text-primary hover:bg-slate-100 font-medium flex items-center gap-1 transition-colors shrink-0"
          >
            <X size={12} />
            <span className="hidden sm:inline">Temizle</span>
          </button>
        )}
      </div>
    </div>
  );
};
