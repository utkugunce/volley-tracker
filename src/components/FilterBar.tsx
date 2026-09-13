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

      {/* 2. Salon ve Takım Arama */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-2 flex-1">
          {/* Arama Input */}
          <div className="relative flex-1 sm:w-64">
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
        </div>

        {/* Filtreleri Sıfırla */}
        {isFiltered && (
          <button
            onClick={onReset}
            className="px-2 py-1 rounded text-xs text-slate-500 hover:text-primary hover:bg-slate-100 font-medium flex items-center gap-1 transition-colors"
          >
            <X size={12} />
            <span className="hidden sm:inline">Temizle</span>
          </button>
        )}
      </div>
    </div>
  );
};
