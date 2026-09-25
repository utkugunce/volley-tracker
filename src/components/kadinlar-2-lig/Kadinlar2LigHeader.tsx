"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Search,
  Trophy,
  Check,
  Sparkles,
  Flame,
  CheckCircle2,
  CalendarDays,
  Layers,
  Users,
  Star,
  Command,
} from "lucide-react";
import { Kadinlar2LigMetadata } from "@/types/kadinlar2Lig";
import { triggerHaptic } from "@/utils/haptics";

export type Kadinlar2LigTabType = "standings" | "fixtures" | "today" | "results" | "leaders" | "teams";

interface Kadinlar2LigHeaderProps {
  metadata: Kadinlar2LigMetadata;
  activeTab: Kadinlar2LigTabType;
  onSelectTab: (tab: Kadinlar2LigTabType) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  justUpdated: boolean;
  todayMatchesCount?: number;
  resultsCount?: number;
  favoritesCount?: number;
  showOnlyFavorites?: boolean;
  onToggleFavoritesOnly?: () => void;
  onOpenSearch?: () => void;
}

export const Kadinlar2LigHeader: React.FC<Kadinlar2LigHeaderProps> = ({
  metadata,
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  onRefresh,
  isLoading,
  justUpdated,
  todayMatchesCount = 0,
  resultsCount = 0,
  favoritesCount = 0,
  showOnlyFavorites = false,
  onToggleFavoritesOnly,
  onOpenSearch,
}) => {
  const [showLinksModal, setShowLinksModal] = useState(false);

  const formattedTime = metadata?.guncellenme_zamani
    ? new Date(metadata.guncellenme_zamani).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  return (
    <header className="bg-[#0b0816]/95 backdrop-blur-xl text-white sticky top-0 z-30 shadow-2xl border-b border-purple-900/40">
      {/* 1. Üst Bar: Dönüş Butonu, Logo & Başlık, Arama, Yenile */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between border-b border-purple-900/30 gap-2">
        {/* Sol Taraf: Altyapıya Dön Butonu & Marka */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 flex-wrap">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-800 hover:border-slate-700 transition-all active:scale-95 shadow-sm group"
            title="Altyapı Yerel Ligler Takip Sayfasına Dön"
          >
            <ArrowLeft size={14} className="text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">🏐 Altyapı Ligleri (81 İl)</span>
            <span className="sm:hidden">Altyapı</span>
          </Link>

          <div className="h-5 w-px bg-purple-900/50 hidden sm:block" />

          {/* Lig Başlığı & Rozeti */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/30 text-white font-black text-sm border border-purple-400/30">
              2L
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight bg-gradient-to-r from-purple-200 via-pink-200 to-amber-200 bg-clip-text text-transparent">
                  Kadınlar 2. Ligi
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-purple-300 font-mono font-bold hidden md:inline-flex items-center gap-1">
                  <Sparkles size={10} className="text-pink-400" />
                  16 Grup • 167 Kulüp
                </span>
              </div>
              <p className="text-[11px] text-purple-300/70 font-medium hidden sm:block">
                TVF Resmi Uzman Posta Kadınlar Voleybol 2. Ligi (2026/27)
              </p>
            </div>
          </div>
        </div>

        {/* Sağ Taraf: Spotlight Arama, Sadece Favorilerim, Resmi Kaynaklar Linki & Yenile */}
        <div className="flex items-center gap-2">
          {/* Spotlight Arama Butonu (Masaüstü & Tablet) */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 text-purple-300 hover:text-white border border-purple-800/50 transition-all active:scale-95 cursor-pointer shadow-xs"
              title="Spotlight Hızlı Arama (Ctrl+K)"
            >
              <Search size={13} className="text-pink-400" />
              <span className="font-medium text-[11px]">Ara</span>
              <kbd className="text-[9px] bg-purple-900/90 text-purple-300 px-1 py-0.5 rounded border border-purple-700/50 font-mono">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Sadece Favorilerim Filtresi */}
          {onToggleFavoritesOnly && (
            <button
              onClick={() => {
                triggerHaptic();
                onToggleFavoritesOnly();
              }}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer border ${
                showOnlyFavorites
                  ? "bg-amber-500/25 border-amber-500/60 text-amber-300 shadow-md shadow-amber-500/20 font-bold"
                  : "bg-purple-950/60 hover:bg-purple-900/60 border-purple-700/40 text-purple-200 hover:text-white"
              }`}
              title="Sadece Favori Kulüplerimi Filtrele"
            >
              <Star
                size={13}
                className={showOnlyFavorites ? "fill-amber-400 text-amber-400" : "text-amber-400"}
              />
              <span className="hidden sm:inline font-medium text-[11px]">Favoriler</span>
              {favoritesCount > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    showOnlyFavorites ? "bg-amber-400 text-slate-950 font-black" : "bg-purple-900 text-purple-200"
                  }`}
                >
                  {favoritesCount}
                </span>
              )}
            </button>
          )}

          {/* Resmi Kaynaklar Açılır Menü Butonu */}
          <div className="relative">
            <button
              onClick={() => setShowLinksModal(!showLinksModal)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 hover:text-white border border-purple-700/40 transition-all active:scale-95 cursor-pointer"
              title="Resmi TVF ve Volleybox Kaynakları"
            >
              <ExternalLink size={13} className="text-pink-400" />
              <span className="hidden md:inline font-medium">Resmi Bağlantılar</span>
              <span className="md:hidden">Kaynaklar</span>
            </button>

            {/* Dropdown popup */}
            {showLinksModal && (
              <div
                className="absolute right-0 mt-2 w-72 bg-[#120d24] border border-purple-700/50 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setShowLinksModal(false)}
              >
                <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-2 px-1">
                  Resmi Veri Kaynakları
                </div>
                <div className="space-y-1.5">
                  <a
                    href={metadata.resmi_kaynaklar.tvf_puan_durumu}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 text-xs text-purple-200 hover:text-white transition-all"
                  >
                    <span>📊 TVF Resmi Puan Durumu</span>
                    <ExternalLink size={12} className="text-purple-400" />
                  </a>
                  <a
                    href={metadata.resmi_kaynaklar.tvf_fikstur}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 text-xs text-purple-200 hover:text-white transition-all"
                  >
                    <span>📅 TVF Resmi Fikstür</span>
                    <ExternalLink size={12} className="text-purple-400" />
                  </a>
                  <a
                    href={metadata.resmi_kaynaklar.tvf_fsw_portal}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 text-xs text-purple-200 hover:text-white transition-all"
                  >
                    <span>🌐 TVF Fikstür Portalı (FSW)</span>
                    <ExternalLink size={12} className="text-purple-400" />
                  </a>
                  <a
                    href={metadata.resmi_kaynaklar.volleybox_turnuva}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/40 text-xs text-cyan-200 hover:text-white transition-all"
                  >
                    <span>🏐 Volleybox 2. Lig Kadroları</span>
                    <ExternalLink size={12} className="text-cyan-400" />
                  </a>
                  <a
                    href={metadata.resmi_kaynaklar.volleybox_maclar}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/40 text-xs text-cyan-200 hover:text-white transition-all"
                  >
                    <span>⚡ Volleybox Maçlar & Skorlar</span>
                    <ExternalLink size={12} className="text-cyan-400" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Yenile Butonu */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl transition-all active:scale-95 disabled:opacity-75 border cursor-pointer ${
              isLoading
                ? "bg-purple-950/80 text-purple-300 border-purple-500/60 shadow-xs"
                : justUpdated
                ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/80 shadow-md shadow-emerald-900/40 font-bold"
                : "bg-gradient-to-r from-purple-900/40 to-pink-900/40 hover:from-purple-800/60 hover:to-pink-800/60 text-purple-200 hover:text-white border-purple-700/50"
            }`}
            title="TVF ve Volleybox verilerini yenile"
          >
            {isLoading ? (
              <>
                <RefreshCw size={13} className="animate-spin text-pink-400" />
                <span className="font-bold text-[11px] text-pink-300">Yenileniyor...</span>
              </>
            ) : justUpdated ? (
              <>
                <Check size={13} className="text-emerald-400 stroke-[3]" />
                <span className="font-bold text-[11px] text-emerald-300">Güncellendi!</span>
              </>
            ) : (
              <>
                <RefreshCw size={13} className="text-purple-400 group-hover:text-white" />
                <span className="hidden sm:inline font-medium text-[11px]">Yenile</span>
                <span className="font-mono text-[11px] text-purple-400">({formattedTime})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Canlı Arama Çubuğu & Ana Sekmeler */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Sekmeler: GÜNÜN MAÇLARI, SONUÇLAR, PUAN DURUMU, FİKSTÜR, 16 GRUP STATÜSÜ, KULÜPLER */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold w-full md:w-auto overflow-x-auto no-scrollbar">
          {/* Günün Maçları */}
          <button
            onClick={() => onSelectTab("today")}
            className={`flex items-center gap-1.5 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-150 ${
              activeTab === "today"
                ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30 border border-pink-400/40"
                : "text-purple-300/80 hover:text-white hover:bg-purple-950/40"
            }`}
          >
            <Flame size={14} className={activeTab === "today" ? "text-amber-200 fill-amber-300" : "text-pink-400"} />
            <span>GÜNÜN MAÇLARI</span>
            {todayMatchesCount > 0 && (
              <span className="text-[10px] bg-pink-900/90 text-pink-200 px-1.5 py-0.2 rounded-full font-mono">
                {todayMatchesCount}
              </span>
            )}
          </button>

          {/* Sonuçlar */}
          <button
            onClick={() => onSelectTab("results")}
            className={`flex items-center gap-1.5 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-150 ${
              activeTab === "results"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-400/40"
                : "text-purple-300/80 hover:text-white hover:bg-purple-950/40"
            }`}
          >
            <CheckCircle2 size={14} className={activeTab === "results" ? "text-emerald-200" : "text-emerald-400"} />
            <span>SONUÇLAR</span>
            {resultsCount > 0 && (
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/50 px-1.5 py-0.2 rounded-full font-mono">
                {resultsCount}
              </span>
            )}
          </button>

          {/* Puan Cetveli */}
          <button
            onClick={() => onSelectTab("standings")}
            className={`flex items-center gap-1.5 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-150 ${
              activeTab === "standings"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 border border-purple-400/40"
                : "text-purple-300/80 hover:text-white hover:bg-purple-950/40"
            }`}
          >
            <Trophy size={14} className={activeTab === "standings" ? "text-amber-300" : "text-purple-400"} />
            <span>PUAN CETVELİ</span>
          </button>

          {/* Fikstür */}
          <button
            onClick={() => onSelectTab("fixtures")}
            className={`flex items-center gap-1.5 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-150 ${
              activeTab === "fixtures"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 border border-purple-400/40"
                : "text-purple-300/80 hover:text-white hover:bg-purple-950/40"
            }`}
          >
            <CalendarDays size={14} className={activeTab === "fixtures" ? "text-indigo-200" : "text-purple-400"} />
            <span>FİKSTÜR</span>
            <span className="text-[10px] bg-purple-900/80 px-1.5 py-0.2 rounded-full text-purple-200 font-mono">
              {metadata?.toplam_mac_sayisi || 289}
            </span>
          </button>

          {/* 16 Grup Statüsü */}
          <button
            onClick={() => onSelectTab("leaders")}
            className={`flex items-center gap-1.5 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-150 ${
              activeTab === "leaders"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 border border-purple-400/40"
                : "text-purple-300/80 hover:text-white hover:bg-purple-950/40"
            }`}
          >
            <Layers size={14} className={activeTab === "leaders" ? "text-pink-300" : "text-purple-400"} />
            <span>16 GRUP STATÜSÜ</span>
          </button>

          {/* Kulüpler */}
          <button
            onClick={() => onSelectTab("teams")}
            className={`flex items-center gap-1.5 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-150 ${
              activeTab === "teams"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 border border-purple-400/40"
                : "text-purple-300/80 hover:text-white hover:bg-purple-950/40"
            }`}
          >
            <Users size={14} className={activeTab === "teams" ? "text-cyan-200" : "text-purple-400"} />
            <span>KULÜPLER ({metadata?.toplam_takim_sayisi || 167})</span>
          </button>
        </div>

        {/* Canlı Filtreleme Arama Input */}
        <div className="relative w-full md:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Takım, salon veya şehir..."
            className="w-full bg-[#160f2e] border border-purple-800/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-purple-900 text-purple-300 hover:text-white px-1.5 py-0.5 rounded-full cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

