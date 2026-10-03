"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Printer, Star, Calendar, Trophy, CheckCircle2, Flame, Check, Search, Layers, Home, ArrowRight, RefreshCw } from "lucide-react";
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
  activeTab: "home" | "results" | "today" | "fixtures" | "standings" | "group-status";
  onSelectTab: (tab: "home" | "results" | "today" | "fixtures" | "standings" | "group-status") => void;
  onRefresh?: () => void;
  isLoading?: boolean;
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
  isLoading = false,
  onOpenSearch,
}) => {
  const formattedTime = updatedAt
    ? new Date(updatedAt).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Istanbul",
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
    <header className="bg-canvas/90 backdrop-blur-xl text-white sticky top-0 z-30 shadow-2xl border-b border-slate-800/80 pt-[env(safe-area-inset-top,0px)]">
      {/* 1. Üst Flashscore Bar */}
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap min-[1200px]:flex-nowrap items-center justify-between border-b border-slate-800/60 gap-x-2 gap-y-1.5">
        {/* Logo & Brand & İl Seçici */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap min-[1200px]:flex-nowrap min-[1200px]:min-w-0 min-[1200px]:[&>*:not(.hdr-tagline)]:shrink-0">
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

          <div className="hdr-tagline hidden md:flex items-center gap-2 text-xs text-slate-400 min-w-0">
            <span className="text-slate-600">•</span>
            <span className="text-primary font-medium tracking-wide truncate">Genç & Yıldız Kızlar Süper Lig</span>
          </div>

          {/* Kadınlar 2. Ligi Sayfasına Geçiş Butonu */}
          <Link
            href="/kadinlar-2-ligi"
            prefetch={false}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs transition-colors border border-slate-700/70 ml-0.5 sm:ml-1 shrink-0 whitespace-nowrap"
            title="TVF Kadınlar 2. Ligi Sayfasına Geç (16 Grup, 167 Kulüp)"
          >
            <span className="tracking-wide">Kadınlar 2. Ligi</span>
            <span className="text-[10px] text-slate-400 px-1 py-0.2 rounded font-mono hidden sm:inline">16 Grup</span>
            <ArrowRight size={12} className="text-slate-400" />
          </Link>
        </div>

        {/* Sağ Taraf: Arama, Favoriler, Yazdır, Canlı Yenile */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
          {/* Spotlight Arama Butonu */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-all active:scale-95 cursor-pointer"
              title="Hızlı Arama (Ctrl + K)"
            >
              <Search size={13} className="text-slate-400" />
              <span className="hidden md:inline font-medium text-[11px] text-slate-400">Ara</span>
              <kbd className="hidden md:inline-flex items-center text-[9px] font-mono text-slate-400 bg-slate-900 px-1 py-0.2 rounded border border-slate-700">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Favoriler Butonu */}
          {(activeTab === "fixtures" || activeTab === "home" || activeTab === "today" || activeTab === "results") && (
            <button
              onClick={onToggleFavoritesOnly}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all active:scale-95 duration-200 ${
                showOnlyFavorites
                  ? "bg-warn text-black shadow-glow-amber font-bold"
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

          {updatedAt && (
            <span className="hidden sm:inline-flex text-[10px] text-slate-400 whitespace-nowrap" title={`Son güncelleme ${formattedTime}`} aria-label={`Son güncelleme ${formattedTime}`}>
              <span className="sm:hidden">{formattedTime}</span>
              <span className="hidden sm:inline">Son güncelleme {formattedTime}</span>
            </span>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 disabled:opacity-60 transition-colors no-print border border-slate-700/60"
              title={isLoading ? "Veriler güncelleniyor" : "Verileri yenile"}
              aria-label={isLoading ? "Veriler güncelleniyor" : "Verileri yenile"}
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
          )}

          {/* Yazdır Butonu */}
          <button
            onClick={() => window.print()}
            className="hidden sm:flex p-2 sm:p-1.5 min-w-[32px] min-h-[32px] items-center justify-center rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all active:scale-95 no-print border border-slate-700/60 hover:border-slate-600"
            title="Yazdır"
            aria-label="Yazdır"
          >
            <Printer size={14} />
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

      {/* 2. ANA SEKMELER: ANASAYFA, SONUÇLAR, GÜNÜN MAÇLARI, FİKSTÜR, PUAN DURUMU, GRUP DURUMU */}
      <div className="max-w-screen-2xl mx-auto px-2 sm:px-4 flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs font-bold overflow-x-auto no-scrollbar">
        {/* Anasayfa Portalı & Günün Maçları Sekmesi */}
        <button
          onClick={() => onSelectTab("home")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-200 ${
            activeTab === "home"
              ? "border-primary text-white bg-gradient-to-t from-primary/10 to-slate-800/50 shadow-sm"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
          }`}
        >
          <Home size={13} className={activeTab === "home" ? "text-primary fill-primary/20" : "text-slate-400"} />
          <span>ANASAYFA</span>
          {todayMatchesCount > 0 && (
            <span className="text-[9px] sm:text-[10px] text-ink-2 font-display font-semibold tabular-nums">
              {todayMatchesCount} Bugün
            </span>
          )}
        </button>

        {/* Sonuçlar Sekmesi */}
        <button
          onClick={() => onSelectTab("results")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-200 ${
            activeTab === "results"
              ? "border-primary text-white bg-gradient-to-t from-primary/10 to-slate-800/50 shadow-sm"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
          }`}
        >
          <CheckCircle2 size={13} className={activeTab === "results" ? "text-emerald-400" : "text-slate-400"} />
          <span>SONUÇLAR</span>
          {typeof resultsCount === "number" && (
            <span
              className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-display font-semibold tabular-nums transition-colors ${
                activeTab === "results"
                  ? "bg-done text-done-fg shadow-xs"
                  : "bg-slate-800 text-slate-300 border border-slate-700/50"
              }`}
            >
              {resultsCount}
            </span>
          )}
        </button>

        {/* Günün Maçları Sekmesi */}
        <button
          onClick={() => onSelectTab("today")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-200 ${
            activeTab === "today"
              ? "border-primary text-white bg-gradient-to-t from-primary/10 to-slate-800/50 shadow-sm"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
          }`}
        >
          <Flame size={13} className={activeTab === "today" ? "text-primary fill-primary/20" : "text-slate-400"} />
          <span>GÜNÜN MAÇLARI</span>
          {todayMatchesCount > 0 && (
            <span className="text-[9px] sm:text-[10px] text-ink-2 font-display font-semibold tabular-nums">
              {todayMatchesCount}
            </span>
          )}
        </button>

        {/* Fikstür Sekmesi */}
        <button
          onClick={() => onSelectTab("fixtures")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-200 ${
            activeTab === "fixtures"
              ? "border-primary text-white bg-gradient-to-t from-primary/10 to-slate-800/50 shadow-sm"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
          }`}
        >
          <Calendar size={13} className={activeTab === "fixtures" ? "text-primary" : "text-slate-400"} />
          <span>FİKSTÜR</span>
          <span className="text-[9px] sm:text-[10px] text-ink-2 font-display font-semibold tabular-nums">
            {totalMatches}
          </span>
        </button>

        {/* Puan Durumu Sekmesi */}
        <button
          onClick={() => onSelectTab("standings")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-200 ${
            activeTab === "standings"
              ? "border-primary text-white bg-gradient-to-t from-primary/10 to-slate-800/50 shadow-sm"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
          }`}
        >
          <Trophy size={13} className={activeTab === "standings" ? "text-primary" : "text-slate-400"} />
          <span>PUAN DURUMU</span>
        </button>

        {/* Grup Durumu Sekmesi (Volleybox İlerleme & Renk Kodları) */}
        <button
          onClick={() => onSelectTab("group-status")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-200 ${
            activeTab === "group-status"
              ? "border-primary text-white bg-gradient-to-t from-primary/10 to-slate-800/50 shadow-sm"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
          }`}
        >
          <Layers size={13} className={activeTab === "group-status" ? "text-primary" : "text-slate-400"} />
          <span>GRUP DURUMU</span>
        </button>

      </div>
    </header>
  );
};
