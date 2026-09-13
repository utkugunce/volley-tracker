"use client";

import React from "react";
import { TeamLogo } from "./TeamLogo";
import { Trophy, Star, Shield, Layers, Filter, Check } from "lucide-react";

interface SportsLeftSidebarProps {
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedTier: string;
  onTierChange: (tier: string) => void;
  selectedClub: string;
  onClubChange: (club: string) => void;
  onlyFavorites: boolean;
  onFavoritesToggle: () => void;
  activeCity: string;
  onCityChange: (city: string) => void;
  favoritesCount: number;
  categoryCounts: Record<string, number>;
  popularClubs: Array<{ name: string; count: number }>;
}

export const SportsLeftSidebar: React.FC<SportsLeftSidebarProps> = ({
  selectedCategory,
  onCategoryChange,
  selectedTier,
  onTierChange,
  selectedClub,
  onClubChange,
  onlyFavorites,
  onFavoritesToggle,
  activeCity,
  onCityChange,
  favoritesCount,
  categoryCounts,
  popularClubs,
}) => {
  const competitions = [
    { id: "all", label: "Tüm Ligler & Şampiyonalar", count: Object.values(categoryCounts).reduce((a, b) => a + b, 0) },
    { id: "Genç", label: "Genç Kız Süper Lig (U18)", category: "Genç", count: categoryCounts["Genç"] || 0 },
    { id: "Yıldız", label: "Yıldız Kız Süper Lig (U16)", category: "Yıldız", count: categoryCounts["Yıldız"] || 0 },
  ];

  return (
    <aside className="w-full lg:w-64 space-y-4 shrink-0">
      
      {/* Şehir Seçici (İstanbul / Ankara) */}
      <div className="rounded-2xl p-3.5 bg-[#0f172a] border border-slate-800 shadow-sm space-y-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
          Bölge / İl Temsilciliği
        </span>
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
          {[
            { id: "all", label: "Tümü" },
            { id: "İstanbul", label: "İstanbul" },
            { id: "Ankara", label: "Ankara" },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => onCityChange(c.id)}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                activeCity.toLowerCase() === c.id.toLowerCase()
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ligler & Turnuvalar Menüsü */}
      <div className="rounded-2xl p-3.5 bg-[#0f172a] border border-slate-800 shadow-sm space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Ligler & Kategoriler</span>
          </span>
        </div>

        <div className="space-y-1">
          {competitions.map((comp) => {
            const isSelected = selectedCategory === comp.id;
            return (
              <button
                key={comp.id}
                onClick={() => onCategoryChange(comp.id)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all text-left ${
                  isSelected
                    ? "bg-brand-500 text-white shadow-glow"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <span className="truncate">{comp.label}</span>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    isSelected ? "bg-black/30 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {comp.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Lig Düzeyi (Süper Lig / 1. Lig) */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1">
          {[
            { id: "all", label: "Tümü" },
            { id: "Süper Lig", label: "Süper Lig" },
            { id: "1. Lig", label: "1. Lig" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => onTierChange(t.id)}
              className={`flex-1 py-1 rounded-lg text-[11px] font-bold border transition-all text-center ${
                selectedTier === t.id
                  ? "bg-accent-cyan text-black border-accent-cyan font-black"
                  : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Favoriler Filtresi */}
      <div className="rounded-2xl p-3 bg-[#0f172a] border border-slate-800">
        <button
          type="button"
          onClick={onFavoritesToggle}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all border ${
            onlyFavorites
              ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-glow"
              : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Star className={`w-4 h-4 ${onlyFavorites ? "fill-amber-400 text-amber-400" : "text-slate-500"}`} />
            <span>Yalnızca Favorilerim</span>
          </div>
          {favoritesCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-black">
              {favoritesCount}
            </span>
          )}
        </button>
      </div>

      {/* Popüler Kulüpler Listesi */}
      <div className="rounded-2xl p-3.5 bg-[#0f172a] border border-slate-800 shadow-sm space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-brand-400" />
            <span>Kulüpler ({popularClubs.length})</span>
          </span>
          {selectedClub && (
            <button
              onClick={() => onClubChange("")}
              className="text-[10px] font-bold text-brand-400 hover:underline"
            >
              Temizle
            </button>
          )}
        </div>

        <div className="space-y-1 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
          {popularClubs.map((club) => {
            const isSelected = selectedClub.toLowerCase() === club.name.toLowerCase();
            return (
              <button
                key={club.name}
                onClick={() => onClubChange(isSelected ? "" : club.name)}
                className={`w-full flex items-center justify-between p-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-brand-500/20 text-brand-300 border border-brand-500/40"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <TeamLogo name={club.name} size="xs" />
                  <span className="truncate">{club.name}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono font-bold shrink-0">
                  {club.count} maç
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </aside>
  );
};
