"use client";

import React, { useState, useEffect, useRef } from "react";
import { RefreshCw, Printer, Star, Calendar, Trophy, CheckCircle2, Flame, Check, Search } from "lucide-react";
import { CitySelector } from "@/components/CitySelector";
import { BrandLogo } from "@/components/BrandLogo";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
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
  onOpenSearch?: () => void;
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
  onOpenSearch,
}) => {
  const formattedTime = updatedAt
    ? new Date(updatedAt).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  const [justUpdated, setJustUpdated] = useState(false);
  const prevLoadingRef = useRef(isLoading);

  useEffect(() => {
    if (prevLoadingRef.current && !isLoading) {
      setJustUpdated(true);
      const timer = setTimeout(() => {
        setJustUpdated(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading]);

  return (
    <header className="bg-[#080c14]/90 backdrop-blur-xl text-white sticky top-0 z-30 shadow-2xl border-b border-slate-800/80">
      {/* 1. Üst Flashscore Bar */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between border-b border-slate-800/60 gap-2">
        {/* Logo & Brand & İl Seçici */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <BrandLogo onClick={() => onSelectTab("home")} />

          <div className="h-4 w-px bg-slate-700/80 hidden sm:block" />

          {/* 81 İl Seçici Açılır Menü */}
          {onSelectCity && (
            <CitySelector
              currentCitySlug={currentCitySlug}
              onSelectCity={onSelectCity}
              cities={cities}
            />
          )}

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span className="text-slate-600">•</span>
            <span className="text-amber-400/90 font-medium tracking-wide">Genç & Yıldız Kızlar Süper Lig</span>
          </div>
        </div>

        {/* Sağ Taraf: Arama, Favoriler, Yazdır, Canlı Yenile */}
        <div className="flex items-center gap-2">
          {/* Spotlight Arama Butonu */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-all active:scale-95 cursor-pointer"
              title="Hızlı Arama (Ctrl + K)"
              aria-label="Arama"
            >
              <Search size={13} className="text-slate-400" />
              <span className="hidden md:inline font-medium text-[11px] text-slate-400">Ara</span>
              <kbd className="hidden md:inline-flex items-center text-[9px] font-mono text-slate-400 bg-slate-900 px-1 py-0.2 rounded border border-slate-700">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Favoriler Butonu */}
          {(activeTab === "fixtures" || activeTab === "home" || activeTab === "results") && (
            <button
              onClick={onToggleFavoritesOnly}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all active:scale-95 duration-200 ${
                showOnlyFavorites
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-glow-amber font-bold"
                  : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/60"
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

          {/* PWA Uygulama Yükleme */}
          <PwaInstallPrompt />

          {/* Yazdır Butonu */}
          <button
            onClick={() => window.print()}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all active:scale-95 no-print border border-slate-700/60 hover:border-slate-600"
            title="Yazdır"
          >
            <Printer size={14} />
          </button>

          {/* Yenile Butonu */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-75 border cursor-pointer ${
              isLoading
                ? "bg-amber-950/40 text-amber-300 border-amber-500/60 shadow-xs"
                : justUpdated
                ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/80 shadow-glow-emerald font-bold"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border-slate-700/60 hover:border-slate-600"
            }`}
            title="Fikstür ve canlı sonuçları yenile"
            aria-label="Verileri Yenile"
          >
            {isLoading ? (
              <>
                <RefreshCw size={13} className="animate-spin text-amber-400" />
                <span className="font-bold text-[11px] text-amber-300">Yenileniyor...</span>
              </>
            ) : justUpdated ? (
              <>
                <Check size={13} className="text-emerald-400 stroke-[3] animate-in zoom-in-75 duration-200" />
                <span className="font-bold text-[11px] text-emerald-300">Güncellendi!</span>
              </>
            ) : (
              <>
                <RefreshCw size={13} className="text-slate-400 group-hover:text-white" />
                <span className="hidden sm:inline font-medium text-[11px] text-slate-300">Yenile</span>
                <span className="font-mono text-[11px] text-slate-400">({formattedTime})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canlı Yenileme Başarılı Toast Bildirimi */}
      {justUpdated && (
        <div className="fixed top-14 right-4 z-50 bg-emerald-950/95 border border-emerald-500/80 text-emerald-200 px-3.5 py-2 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 text-xs font-semibold">
          <Check size={15} className="text-emerald-400 stroke-[3]" />
          <span>Fikstür ve sonuçlar güncellendi ({formattedTime})</span>
        </div>
      )}

      {/* 2. ANA SEKMELER: SONUÇLAR, GÜNÜN MAÇLARI, FİKSTÜR, PUAN DURUMU */}
      <div className="max-w-6xl mx-auto px-2 sm:px-4 flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs font-bold overflow-x-auto no-scrollbar">
        {/* Sonuçlar Sekmesi */}
        <button
          onClick={() => onSelectTab("results")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-200 ${
            activeTab === "results"
              ? "border-primary text-white bg-gradient-to-t from-red-950/30 to-slate-800/50 shadow-sm"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
          }`}
        >
          <CheckCircle2 size={13} className={activeTab === "results" ? "text-emerald-400" : "text-slate-400"} />
          <span>SONUÇLAR</span>
          {typeof resultsCount === "number" && (
            <span
              className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold transition-colors ${
                activeTab === "results"
                  ? "bg-emerald-500 text-white shadow-xs shadow-emerald-900/50"
                  : "bg-slate-800 text-slate-300 border border-slate-700/50"
              }`}
            >
              {resultsCount}
            </span>
          )}
        </button>

        {/* Günün Maçları (Anasayfa) Sekmesi */}
        <button
          onClick={() => onSelectTab("home")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-200 ${
            activeTab === "home"
              ? "border-primary text-white bg-gradient-to-t from-red-950/30 to-slate-800/50 shadow-sm"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
          }`}
        >
          <Flame size={13} className={activeTab === "home" ? "text-primary fill-primary/20 animate-pulse" : "text-slate-400"} />
          <span>GÜNÜN MAÇLARI</span>
          {todayMatchesCount > 0 && (
            <span className="text-[9px] sm:text-[10px] bg-gradient-to-r from-red-600 to-rose-600 text-white px-1.5 py-0.2 rounded-full font-mono font-bold shadow-xs shadow-red-900/50">
              {todayMatchesCount}
            </span>
          )}
        </button>

        {/* Fikstür Sekmesi */}
        <button
          onClick={() => onSelectTab("fixtures")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-200 ${
            activeTab === "fixtures"
              ? "border-primary text-white bg-gradient-to-t from-red-950/30 to-slate-800/50 shadow-sm"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
          }`}
        >
          <Calendar size={13} className={activeTab === "fixtures" ? "text-primary" : "text-slate-400"} />
          <span>FİKSTÜR</span>
          <span className="text-[9px] sm:text-[10px] bg-slate-800/80 text-slate-300 px-1.5 py-0.2 rounded-full font-normal border border-slate-700/50">
            {totalMatches}
          </span>
        </button>

        {/* Puan Durumu Sekmesi */}
        <button
          onClick={() => onSelectTab("standings")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-200 ${
            activeTab === "standings"
              ? "border-primary text-white bg-gradient-to-t from-red-950/30 to-slate-800/50 shadow-sm"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
          }`}
        >
          <Trophy size={13} className={activeTab === "standings" ? "text-amber-400 fill-amber-400/20" : "text-slate-400"} />
          <span>PUAN DURUMU</span>
        </button>
      </div>
    </header>
  );
};
