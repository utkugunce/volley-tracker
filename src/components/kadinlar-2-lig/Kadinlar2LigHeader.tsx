"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Search,
  Star,
  Printer,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Kadinlar2LigMetadata } from "@/types/kadinlar2Lig";
import { triggerHaptic } from "@/utils/haptics";
import { SettingsControls } from "@/components/SettingsControls";
import { formatSyncDateTime } from "@/utils/formatSyncDate";

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
  todayMatchesCount = 0,
  resultsCount = 0,
  favoritesCount = 0,
  showOnlyFavorites = false,
  onToggleFavoritesOnly,
  onOpenSearch,
}) => {
  const [showLinksModal, setShowLinksModal] = useState(false);
  const syncDateTime = metadata?.guncellenme_zamani ? formatSyncDateTime(metadata.guncellenme_zamani) : null;

  return (
    <header className="bg-canvas text-white sticky top-0 z-30 border-b border-line/70 pt-[env(safe-area-inset-top,0px)]">
      {/* 1. Üst Global Bar: Marka + Bütünleşik Lig Seçici (Altyapı / 2. Lig) */}
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between border-b border-line/50 gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <BrandLogo onClick={() => onSelectTab("home")} />

          {/* Apple Sports / FotMob Tarzı Bütünleşik Lig Seçici (Segmented League Switcher) */}
          <div
            className="inline-flex items-center p-0.5 rounded-lg bg-surface-muted border border-line/60 text-xs"
            role="group"
            aria-label="Lig Seçici"
          >
            <Link
              href="/"
              prefetch={false}
              className="px-2.5 py-1 rounded-md text-ink-2 hover:text-white font-medium transition-colors whitespace-nowrap"
              title="Altyapı Yerel Ligler Takip Sayfasına Dön"
            >
              Altyapı (81 İl)
            </Link>
            <span className="px-2.5 py-1 rounded-md bg-surface-raised text-white font-semibold tracking-tight flex items-center gap-1 whitespace-nowrap">
              <span>Kadınlar 2. Ligi</span>
              <span className="text-[10px] text-ink-3 font-mono hidden md:inline">
                ({metadata?.toplam_grup_sayisi || 16} Grup)
              </span>
            </span>
          </div>
        </div>

        {/* Sağ Taraf: Arama, Favoriler, Kaynaklar, Son Çekim, Ayarlar, Yazdır */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-raised text-ink-2 hover:text-white border border-line/60 transition-colors active:scale-[0.98] cursor-pointer"
              title="Hızlı Arama (Ctrl + K)"
            >
              <Search size={13} className="text-ink-3" />
              <span className="hidden md:inline font-medium text-[11px]">Ara</span>
              <kbd className="hidden md:inline-flex items-center text-[9px] font-mono text-ink-3 px-1">
                ⌘K
              </kbd>
            </button>
          )}

          {onToggleFavoritesOnly && (
            <button
              onClick={() => {
                triggerHaptic();
                onToggleFavoritesOnly();
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors active:scale-[0.98] cursor-pointer ${
                showOnlyFavorites
                  ? "bg-warn text-black font-bold"
                  : "bg-surface text-ink-2 hover:text-white hover:bg-surface-raised border border-line/60"
              }`}
              title="Sadece Favori Kulüplerimi Göster"
            >
              <Star
                size={13}
                className={showOnlyFavorites ? "fill-black text-black" : "text-warn"}
              />
              <span className="hidden sm:inline">Favoriler</span>
              {favoritesCount > 0 && (
                <span className="text-[10px] font-mono tabular-nums opacity-85">
                  {favoritesCount}
                </span>
              )}
            </button>
          )}

          {/* Resmi Kaynaklar Açılır Menü */}
          <div className="relative">
            <button
              onClick={() => setShowLinksModal(!showLinksModal)}
              className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg bg-surface text-ink-2 hover:text-white hover:bg-surface-raised transition-colors active:scale-[0.98] border border-line/60"
              title="Resmi TVF ve Volleybox Bağlantıları"
              aria-label="Resmi Bağlantılar"
            >
              <ExternalLink size={14} />
            </button>

            {showLinksModal && (
              <div
                className="absolute right-0 mt-2 w-72 bg-surface border border-line/80 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setShowLinksModal(false)}
              >
                <div className="text-[10px] font-bold text-ink-3 uppercase tracking-wider mb-2 px-1">
                  Resmi Veri Kaynakları
                </div>
                <div className="space-y-1.5">
                  <a
                    href={metadata.resmi_kaynaklar.tvf_puan_durumu}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-surface-muted hover:bg-surface-raised border border-line/50 text-xs text-ink hover:text-white transition-colors"
                  >
                    <span>TVF Resmi Puan Durumu</span>
                    <ExternalLink size={12} className="text-ink-3" />
                  </a>
                  <a
                    href={metadata.resmi_kaynaklar.tvf_fikstur}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-surface-muted hover:bg-surface-raised border border-line/50 text-xs text-ink hover:text-white transition-colors"
                  >
                    <span>TVF Resmi Fikstür</span>
                    <ExternalLink size={12} className="text-ink-3" />
                  </a>
                  <a
                    href="https://tvf.org.tr/_dosyalar/Liglerin_Statu_Arsivi/2026-2027/2026-2027_UzmanPosta2Lig_Kadinlar_Statusu.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/40 text-xs text-primary hover:text-white transition-colors font-semibold"
                  >
                    <span>2026-2027 Lig Statüsü (PDF)</span>
                    <ExternalLink size={12} className="text-ink-2" />
                  </a>
                  <a
                    href={metadata.resmi_kaynaklar.volleybox_turnuva}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-surface-muted hover:bg-surface-raised border border-line/50 text-xs text-ink hover:text-white transition-colors"
                  >
                    <span>Volleybox Kadroları</span>
                    <ExternalLink size={12} className="text-ink-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {syncDateTime && (
            <span
              className="hidden sm:inline-flex items-center gap-1 text-[10px] text-ink-3 whitespace-nowrap px-1.5 py-1"
              title={`Son çekim: ${syncDateTime.full}`}
              aria-label={`Son çekim: ${syncDateTime.full}`}
            >
              <span className="sm:hidden">{syncDateTime.full}</span>
              <span className="hidden sm:inline">
                Son çekim: <strong className="text-ink-2 font-mono font-medium">{syncDateTime.full}</strong>
              </span>
            </span>
          )}

          <SettingsControls />

          <button
            onClick={() => window.print()}
            className="hidden sm:flex p-1.5 min-w-[32px] min-h-[32px] items-center justify-center rounded-lg bg-surface text-ink-2 hover:text-white hover:bg-surface-raised transition-colors active:scale-[0.98] no-print border border-line/60"
            title="Yazdır"
            aria-label="Yazdır"
          >
            <Printer size={14} />
          </button>
        </div>
      </div>

      {/* 2. ANA SEKMELER: ÇERÇEVESİZ, DÜŞÜK GÜRÜLTÜLÜ FOTMOB / APPLE SPORTS TAB ŞERİDİ */}
      <div className="max-w-screen-2xl mx-auto px-2 sm:px-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            onClick={() => onSelectTab("home")}
            className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              activeTab === "home"
                ? "border-primary text-white"
                : "border-transparent text-ink-2 hover:text-white"
            }`}
          >
            <span>ANASAYFA</span>
          </button>

          <button
            onClick={() => onSelectTab("today")}
            className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              activeTab === "today"
                ? "border-primary text-white"
                : "border-transparent text-ink-2 hover:text-white"
            }`}
          >
            <span>GÜNÜN MAÇLARI</span>
            {todayMatchesCount > 0 && (
              <span className="text-[10px] font-display font-medium tabular-nums text-ink-3">
                {todayMatchesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab("results")}
            className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              activeTab === "results"
                ? "border-primary text-white"
                : "border-transparent text-ink-2 hover:text-white"
            }`}
          >
            <span>SONUÇLAR</span>
            {resultsCount > 0 && (
              <span className="text-[10px] font-display font-medium tabular-nums text-ink-3">
                {resultsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab("fixtures")}
            className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              activeTab === "fixtures"
                ? "border-primary text-white"
                : "border-transparent text-ink-2 hover:text-white"
            }`}
          >
            <span>FİKSTÜR</span>
          </button>

          <button
            onClick={() => onSelectTab("standings")}
            className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              activeTab === "standings"
                ? "border-primary text-white"
                : "border-transparent text-ink-2 hover:text-white"
            }`}
          >
            <span>PUAN CETVELİ</span>
          </button>

          <button
            onClick={() => onSelectTab("leaders")}
            className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              activeTab === "leaders"
                ? "border-primary text-white"
                : "border-transparent text-ink-2 hover:text-white"
            }`}
          >
            <span>GRUP DURUMU</span>
          </button>

          <button
            onClick={() => onSelectTab("teams")}
            className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              activeTab === "teams"
                ? "border-primary text-white"
                : "border-transparent text-ink-2 hover:text-white"
            }`}
          >
            <span>KULÜPLER</span>
          </button>

          <button
            onClick={() => onSelectTab("karsilastir")}
            className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              activeTab === "karsilastir"
                ? "border-primary text-white"
                : "border-transparent text-ink-2 hover:text-white"
            }`}
          >
            <span>KARŞILAŞTIR</span>
          </button>

          <button
            onClick={() => onSelectTab("statu")}
            className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              activeTab === "statu"
                ? "border-primary text-white"
                : "border-transparent text-ink-2 hover:text-white"
            }`}
          >
            <span>STATÜ & REHBER</span>
          </button>
        </div>

        {/* Canlı Filtreleme Arama Input (Masaüstü) */}
        <div className="relative hidden lg:block w-48 shrink-0 py-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Takım, salon ara..."
            className="w-full bg-surface border border-line/60 rounded-lg pl-7 pr-2.5 py-1 text-xs text-ink placeholder-ink-3 focus:outline-none focus:border-primary/40 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-ink-3 hover:text-white px-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
