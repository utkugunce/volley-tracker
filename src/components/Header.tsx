"use client";

import React from "react";
import { RefreshCw, Printer, Star, Calendar, Trophy, CheckCircle2, Flame } from "lucide-react";
import { CitySelector } from "@/components/CitySelector";
import { BrandLogo } from "@/components/BrandLogo";
import { CityInfo } from "@/types/fixture";

interface HeaderProps {
  city?: string;
  currentCitySlug?: string;
  onSelectCity?: (slug: string) => void;
  cities?: CityInfo[];
  title?: string;
  updatedAt?: string;
  totalMatches: number;
  todayMatchesCount?: number;
  resultsCount?: number;
  favoritesCount: number;
  showOnlyFavorites: boolean;
  onToggleFavoritesOnly: () => void;
  activeTab: "results" | "home" | "fixtures" | "standings";
  onSelectTab: (tab: "results" | "home" | "fixtures" | "standings") => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  city = "İstanbul",
  currentCitySlug = "istanbul",
  onSelectCity,
  cities = [],
  updatedAt,
  totalMatches,
  todayMatchesCount = 0,
  resultsCount = 0,
  favoritesCount,
  showOnlyFavorites,
  onToggleFavoritesOnly,
  activeTab,
  onSelectTab,
  onRefresh,
  isLoading,
}) => {
  const formattedTime = updatedAt
    ? new Date(updatedAt).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  return (
    <header className="bg-[#0b1325] text-white sticky top-0 z-30 shadow-lg border-b border-slate-800">
      {/* 1. Üst Flashscore Bar */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between border-b border-slate-800/80 gap-2">
        {/* Logo & Brand & İl Seçici */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <BrandLogo onClick={() => onSelectTab("home")} />

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          {/* 81 İl Seçici Açılır Menü */}
          {onSelectCity && (
            <CitySelector
              currentCitySlug={currentCitySlug}
              onSelectCity={onSelectCity}
              cities={cities}
            />
          )}

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span>•</span>
            <span className="text-amber-400 font-medium">Genç & Yıldız Kızlar Süper Lig</span>
          </div>
        </div>

        {/* Sağ Taraf: Favoriler, Yazdır, Canlı Yenile */}
        <div className="flex items-center gap-2">

          {/* Favoriler Butonu */}
          {(activeTab === "fixtures" || activeTab === "home" || activeTab === "results") && (
            <button
              onClick={onToggleFavoritesOnly}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded transition-all ${
                showOnlyFavorites
                  ? "bg-amber-400 text-black shadow-sm font-bold"
                  : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
              }`}
              title="Sadece Favori Maçları Göster"
            >
              <Star
                size={13}
                className={showOnlyFavorites ? "fill-black text-black" : "text-amber-400"}
              />
              <span className="hidden sm:inline">Favoriler</span>
              {favoritesCount > 0 && (
                <span
                  className={`text-[10px] px-1 rounded-full ${
                    showOnlyFavorites ? "bg-black text-white" : "bg-slate-700 text-white"
                  }`}
                >
                  {favoritesCount}
                </span>
              )}
            </button>
          )}

          {/* Yazdır Butonu */}
          <button
            onClick={() => window.print()}
            className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors no-print border border-slate-700"
            title="Yazdır"
          >
            <Printer size={14} />
          </button>

          {/* Yenile Butonu */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-1.5 rounded transition-colors disabled:opacity-50 border border-slate-700"
            title="Verileri Yenile"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin text-primary" : ""} />
            <span className="hidden sm:inline font-mono">{formattedTime}</span>
          </button>
        </div>
      </div>

      {/* 2. ANA SEKMELER: SONUÇLAR, GÜNÜN MAÇLARI, FİKSTÜR, PUAN DURUMU */}
      <div className="max-w-6xl mx-auto px-2 sm:px-4 flex items-center gap-1 sm:gap-2 text-xs font-bold overflow-x-auto no-scrollbar">
        {/* Sonuçlar Sekmesi */}
        <button
          onClick={() => onSelectTab("results")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2.5 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "results"
              ? "border-primary text-white bg-slate-800/40"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <CheckCircle2 size={14} className={activeTab === "results" ? "text-emerald-400" : "text-slate-400"} />
          <span>SONUÇLAR</span>
          {typeof resultsCount === "number" && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === "results"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              {resultsCount}
            </span>
          )}
        </button>

        {/* Günün Maçları (Anasayfa) Sekmesi */}
        <button
          onClick={() => onSelectTab("home")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2.5 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "home"
              ? "border-primary text-white bg-slate-800/40"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Flame size={14} className={activeTab === "home" ? "text-primary fill-primary/20" : "text-slate-400"} />
          <span>GÜNÜN MAÇLARI</span>
          {todayMatchesCount > 0 && (
            <span className="text-[10px] bg-primary text-white px-1.5 py-0.2 rounded-full font-mono font-bold">
              {todayMatchesCount}
            </span>
          )}
        </button>

        {/* Fikstür Sekmesi */}
        <button
          onClick={() => onSelectTab("fixtures")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2.5 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "fixtures"
              ? "border-primary text-white bg-slate-800/40"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Calendar size={14} className={activeTab === "fixtures" ? "text-primary" : ""} />
          <span>FİKSTÜR</span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full font-normal">
            {totalMatches}
          </span>
        </button>

        {/* Puan Durumu Sekmesi */}
        <button
          onClick={() => onSelectTab("standings")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2.5 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "standings"
              ? "border-primary text-white bg-slate-800/40"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Trophy size={14} className={activeTab === "standings" ? "text-amber-400" : ""} />
          <span>PUAN DURUMU</span>
        </button>
      </div>
    </header>
  );
};
