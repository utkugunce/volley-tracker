"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Search,
  Trophy,
  Check,
  Flame,
  CheckCircle2,
  CalendarDays,
  Layers,
  Users,
  Star,
  Printer,
  FileText,
  Home,
  Swords,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Kadinlar2LigMetadata } from "@/types/kadinlar2Lig";
import { triggerHaptic } from "@/utils/haptics";
import { SettingsControls } from "@/components/SettingsControls";

export type Kadinlar2LigTabType =
  | "home"
  | "today"
  | "results"
  | "fixtures"
  | "standings"
  | "leaders"
  | "teams"
  | "karsilastir"
  | "statu";

interface Kadinlar2LigHeaderProps {
  metadata: Kadinlar2LigMetadata;
  activeTab: Kadinlar2LigTabType;
  onSelectTab: (tab: Kadinlar2LigTabType) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isLoading?: boolean;
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
  isLoading = false,
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
    <header className="bg-canvas/90 backdrop-blur-xl text-white sticky top-0 z-30 shadow-2xl border-b border-slate-800/80 pt-[env(safe-area-inset-top,0px)]">
      {/* 1. Üst Flashscore Bar */}
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between border-b border-slate-800/60 gap-2">
        {/* Sol Taraf: Logo & Altyapıya Dönüş Butonu */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <BrandLogo onClick={() => onSelectTab("home")} />

          <div className="h-4 w-px bg-slate-700/80 hidden sm:block" />

          {/* Altyapı Ligleri (81 İl) Butonu */}
          <Link prefetch={false}
            href="/"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition-all active:scale-95 shadow-sm group"
            title="Altyapı Yerel Ligler Takip Sayfasına Dön"
          >
            <ArrowLeft size={13} className="text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">🏐 Altyapı (81 İl)</span>
            <span className="sm:hidden">Altyapı</span>
          </Link>

          {/* Lig Rozeti */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-extrabold text-white tracking-tight">Uzman Posta Kadınlar 2. Ligi</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 border border-primary/40 text-ink-2 font-mono font-bold hidden md:inline-block">
              16 Grup • 167 Kulüp
            </span>
          </div>
        </div>

        {/* Sağ Taraf: Arama, Favoriler, Kaynaklar, Yazdır, Yenile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
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
          {onToggleFavoritesOnly && (
            <button
              onClick={() => {
                triggerHaptic();
                onToggleFavoritesOnly();
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all active:scale-95 duration-200 cursor-pointer ${
                showOnlyFavorites
                  ? "bg-warn text-black shadow-glow-amber font-bold"
                  : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/60"
              }`}
              title="Sadece Favori Kulüplerimi Göster"
            >
              <Star
                size={13}
                className={showOnlyFavorites ? "fill-black text-black" : "text-amber-400"}
              />
              <span className="hidden sm:inline">Favoriler</span>
              {favoritesCount > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    showOnlyFavorites ? "bg-black/20 text-black" : "bg-slate-900 text-amber-300"
                  }`}
                >
                  {favoritesCount}
                </span>
              )}
            </button>
          )}

          {/* Resmi Kaynaklar Açılır Menü */}
          <div className="relative">
            <button
              onClick={() => setShowLinksModal(!showLinksModal)}
              className="p-2 sm:p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all active:scale-95 border border-slate-700/60"
              title="Resmi TVF ve Volleybox Bağlantıları"
              aria-label="Resmi Bağlantılar"
            >
              <ExternalLink size={14} />
            </button>

            {showLinksModal && (
              <div
                className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setShowLinksModal(false)}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                  Resmi Veri Kaynakları
                </div>
                <div className="space-y-1.5">
                  <a
                    href={metadata.resmi_kaynaklar.tvf_puan_durumu}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 text-xs text-slate-200 hover:text-white transition-all"
                  >
                    <span>📊 TVF Resmi Puan Durumu</span>
                    <ExternalLink size={12} className="text-slate-400" />
                  </a>
                  <a
                    href={metadata.resmi_kaynaklar.tvf_fikstur}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 text-xs text-slate-200 hover:text-white transition-all"
                  >
                    <span>📅 TVF Resmi Fikstür</span>
                    <ExternalLink size={12} className="text-slate-400" />
                  </a>
                  <a
                    href="https://tvf.org.tr/_dosyalar/Liglerin_Statu_Arsivi/2026-2027/2026-2027_UzmanPosta2Lig_Kadinlar_Statusu.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/50 text-xs text-primary hover:text-ink transition-all font-semibold"
                  >
                    <span>📜 2026-2027 Lig Statüsü (PDF)</span>
                    <ExternalLink size={12} className="text-ink-2" />
                  </a>
                  <a
                    href={metadata.resmi_kaynaklar.volleybox_turnuva}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 text-xs text-cyan-300 hover:text-cyan-100 transition-all"
                  >
                    <span>🏐 Volleybox Kadroları</span>
                    <ExternalLink size={12} className="text-cyan-400" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Tema + Dil */}
          <SettingsControls />

          {/* Yazdır Butonu */}
          <button
            onClick={() => window.print()}
            className="p-2 sm:p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all active:scale-95 no-print border border-slate-700/60 hover:border-slate-600"
            title="Yazdır"
            aria-label="Yazdır"
          >
            <Printer size={14} />
          </button>
        </div>
      </div>

      {/* 2. ANA SEKMELER (Altyapı ile Birebir Sekme Çubuğu) */}
      <div className="max-w-screen-2xl mx-auto px-2 sm:px-4 flex items-center justify-between gap-1 sm:gap-2">
        <div className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs font-bold overflow-x-auto no-scrollbar py-0.5">
          {/* Anasayfa / Canlı Hub */}
          <button
            onClick={() => onSelectTab("home")}
            className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-200 ${
              activeTab === "home"
                ? "border-primary text-white bg-gradient-to-t from-primary/10 to-slate-800/50 shadow-sm"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Home size={13} className={activeTab === "home" ? "text-primary" : "text-slate-400"} />
            <span>ANASAYFA</span>
          </button>

          {/* Günün Maçları */}
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
              <span className="text-[10px] font-display font-semibold tabular-nums text-ink-2">
                {todayMatchesCount}
              </span>
            )}
          </button>

          {/* Sonuçlar */}
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
            {resultsCount > 0 && (
              <span
                className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold transition-colors ${
                  activeTab === "results"
                    ? "bg-done text-done-fg"
                    : "bg-slate-800 text-slate-300 border border-slate-700/50"
                }`}
              >
                {resultsCount}
              </span>
            )}
          </button>

          {/* Fikstür */}
          <button
            onClick={() => onSelectTab("fixtures")}
            className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-200 ${
              activeTab === "fixtures"
                ? "border-primary text-white bg-gradient-to-t from-primary/10 to-slate-800/50 shadow-sm"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <CalendarDays size={13} className={activeTab === "fixtures" ? "text-primary" : "text-slate-400"} />
            <span>FİKSTÜR</span>
          </button>

          {/* Puan Cetveli */}
          <button
            onClick={() => onSelectTab("standings")}
            className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-200 ${
              activeTab === "standings"
                ? "border-primary text-white bg-gradient-to-t from-primary/10 to-slate-800/50 shadow-sm"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Trophy size={13} className={activeTab === "standings" ? "text-primary" : "text-slate-400"} />
            <span>PUAN CETVELİ</span>
          </button>

          {/* 16 Grup Durumu */}
          <button
            onClick={() => onSelectTab("leaders")}
            className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-200 ${
              activeTab === "leaders"
                ? "border-primary text-white bg-gradient-to-t from-primary/10 to-slate-800/50 shadow-sm"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Layers size={13} className={activeTab === "leaders" ? "text-primary" : "text-slate-400"} />
            <span>GRUP DURUMU</span>
          </button>

          {/* Kulüpler */}
          <button
            onClick={() => onSelectTab("teams")}
            className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-200 ${
              activeTab === "teams"
                ? "border-primary text-white bg-gradient-to-t from-primary/10 to-slate-800/50 shadow-sm"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Users size={13} className={activeTab === "teams" ? "text-primary" : "text-slate-400"} />
            <span>KULÜPLER</span>
          </button>

          {/* Karşılaştır (H2H) */}
          <button
            onClick={() => onSelectTab("karsilastir")}
            className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-200 ${
              activeTab === "karsilastir"
                ? "border-primary text-white bg-gradient-to-t from-primary/10 to-slate-800/50 shadow-sm"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Swords size={13} className={activeTab === "karsilastir" ? "text-ink-2" : "text-slate-400"} />
            <span>KARŞILAŞTIR</span>
          </button>

          {/* Statü & Rehber */}
          <button
            onClick={() => onSelectTab("statu")}
            className={`flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 duration-200 ${
              activeTab === "statu"
                ? "border-primary text-white bg-gradient-to-t from-primary/10 to-slate-800/50 shadow-sm"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <FileText size={13} className={activeTab === "statu" ? "text-primary" : "text-slate-400"} />
            <span>STATÜ & REHBER</span>
          </button>
        </div>

        {/* Canlı Filtreleme Arama Input (Masaüstü) */}
        <div className="relative hidden lg:block w-48 shrink-0 py-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Takım, salon ara..."
            className="w-full bg-slate-900/90 border border-slate-700/60 rounded-lg pl-7 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/40 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] bg-slate-800 text-slate-400 hover:text-white px-1 py-0.2 rounded-full cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
