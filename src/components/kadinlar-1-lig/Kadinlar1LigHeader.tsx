"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Search,
  Star,
  Printer,
  Layers,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Kadinlar2LigMetadata } from "@/types/kadinlar2Lig";
import { triggerHaptic } from "@/utils/haptics";
import { SettingsControls } from "@/components/SettingsControls";
import { formatSyncDateTime } from "@/utils/formatSyncDate";
import { LeagueSwitcher } from "@/components/layout/LeagueSwitcher";
import { Kadinlar1LigTabType } from "@/utils/kadinlar1LigRoutes";

interface Kadinlar1LigHeaderProps {
  metadata: Kadinlar2LigMetadata;
  activeTab: Kadinlar1LigTabType;
  selectedGroup: number | "all";
  onSelectGroup: (group: number | "all") => void;
  onSelectTab: (tab: Kadinlar1LigTabType) => void;
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

export const Kadinlar1LigHeader: React.FC<Kadinlar1LigHeaderProps> = ({
  metadata,
  activeTab,
  selectedGroup,
  onSelectGroup,
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
      {/* 1. Üst Global Bar: Marka + Segmented League Switcher + Grup Seçici + Sağ Kontroller */}
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap min-[1200px]:flex-nowrap items-center justify-between border-b border-line/50 gap-x-2.5 gap-y-1.5">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap min-[1200px]:flex-nowrap min-[1200px]:min-w-0 min-[1200px]:[&>*:not(.hdr-tagline)]:shrink-0">
          <BrandLogo onClick={() => onSelectTab("home")} />
          <LeagueSwitcher activeLeague="1-lig" />

          {/* Grup Seçici Açılır Menü (CitySelector Standardında) */}
          <div className="relative">
            <select
              value={selectedGroup}
              onChange={(e) => {
                const v = e.target.value === "all" ? "all" : Number(e.target.value);
                onSelectGroup(v as number | "all");
              }}
              aria-label="1. Lig Grup Seçici"
              className="bg-surface hover:bg-surface-raised text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-line/70 transition-colors cursor-pointer focus:outline-none focus:border-primary shadow-xs"
            >
              <option value="all">Tüm Gruplar (28 Takım)</option>
              <option value={1}>A Grubu (14 Takım)</option>
              <option value={2}>B Grubu (14 Takım)</option>
            </select>
          </div>
        </div>

        {/* Sağ Taraf: Arama, Favoriler, Kaynaklar, Son Çekim, Ayarlar, Yazdır */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto min-w-0">
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-raised text-ink-2 hover:text-white border border-line/60 transition-colors active:scale-[0.98] cursor-pointer"
              title="KFC Kadınlar 1. Ligi Takım, Maç ve Salon Arama (Ctrl + K)"
            >
              <Search size={13} className="text-ink-3" />
              <span className="hidden md:inline font-medium text-[11px]">Hızlı Arama</span>
              <kbd className="hidden md:inline-flex items-center text-[9px] font-mono text-ink-3 px-1">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Favori Filtrele Butonu */}
          {onToggleFavoritesOnly && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onToggleFavoritesOnly();
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors active:scale-[0.98] cursor-pointer ${
                showOnlyFavorites
                  ? "bg-warn text-black font-bold"
                  : "bg-surface text-ink-2 hover:text-white hover:bg-surface-raised border border-line/60"
              }`}
              title={showOnlyFavorites ? "Tüm takımları göster" : "Sadece favori takımları göster"}
            >
              <Star
                size={13}
                className={showOnlyFavorites ? "fill-black text-black" : "text-warn"}
              />
              <span className="hidden md:inline">Favoriler</span>
              {favoritesCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    showOnlyFavorites ? "bg-black/20 text-black" : "bg-warn/20 text-warn"
                  }`}
                >
                  {favoritesCount}
                </span>
              )}
            </button>
          )}

          {/* Resmi Kaynaklar Dropdown / Buton */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLinksModal(!showLinksModal)}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-raised text-ink-2 hover:text-white border border-line/60 transition-colors cursor-pointer"
              title="Resmi TVF ve Volleybox Sayfaları"
            >
              <ExternalLink size={12} className="text-primary" />
              <span className="hidden lg:inline text-[11px] font-medium">Kaynaklar</span>
            </button>

            {showLinksModal && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLinksModal(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-surface-raised border border-line rounded-xl shadow-xl p-2 z-50 text-xs">
                  <div className="p-2 border-b border-line">
                    <p className="font-bold text-ink">KFC Kadınlar 1. Ligi</p>
                    <p className="text-[11px] text-ink-3">Resmi TVF ve Volleybox Verileri</p>
                  </div>
                  <div className="py-1">
                    <a
                      href={metadata?.resmi_kaynaklar?.tvf_puan_durumu || "https://tvf.org.tr/lig/kadinlar-1-ligi"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-surface text-ink hover:text-primary transition-colors"
                    >
                      <span>TVF Resmi Puan Durumu</span>
                      <ExternalLink size={12} />
                    </a>
                    <a
                      href={metadata?.resmi_kaynaklar?.tvf_fikstur || "https://tvf.org.tr/lig/kadinlar-1-ligi"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-surface text-ink hover:text-primary transition-colors"
                    >
                      <span>TVF Resmi Fikstür</span>
                      <ExternalLink size={12} />
                    </a>
                    <a
                      href="https://women.volleybox.net/tr/tournaments/turkey"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-surface text-ink hover:text-primary transition-colors"
                    >
                      <span>Volleybox Türkiye Turnuvaları</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Son Güncelleme Rozeti */}
          {syncDateTime && (
            <div
              className="hidden min-[1100px]:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface text-[11px] font-mono text-ink-3 border border-line/60"
              title={`Son otomatik TVF senkronizasyonu: ${syncDateTime.full}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>TVF Canlı: {syncDateTime.full}</span>
            </div>
          )}

          {/* Ayarlar & Yazdır */}
          <div className="flex items-center gap-1">
            <SettingsControls />
            <button
              type="button"
              onClick={() => window.print()}
              aria-label="Yazdır"
              className="p-1.5 rounded-lg bg-surface hover:bg-surface-raised text-ink-2 hover:text-white border border-line/60 transition-colors cursor-pointer hidden sm:flex"
              title="Sayfayı Yazdır (Ctrl + P)"
            >
              <Printer size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. ANA SEKMELER: ÇERÇEVESİZ, DÜŞÜK GÜRÜLTÜLÜ FOTMOB / APPLE SPORTS TAB ŞERİDİ */}
      <div className="max-w-screen-2xl mx-auto px-2 sm:px-4 flex items-center justify-between gap-2">
        <nav
          aria-label="1. Lig Sekmeleri"
          className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs font-semibold overflow-x-auto no-scrollbar"
        >
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onSelectTab("home");
            }}
            className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              activeTab === "home"
                ? "border-primary text-white"
                : "border-transparent text-ink-2 hover:text-white"
            }`}
          >
            <span>ANASAYFA</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onSelectTab("results");
            }}
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
            type="button"
            onClick={() => {
              triggerHaptic();
              onSelectTab("today");
            }}
            className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              activeTab === "today"
                ? "border-primary text-white"
                : "border-transparent text-ink-2 hover:text-white"
            }`}
          >
            <span>GÜNÜN MAÇLARI</span>
            {todayMatchesCount > 0 && (
              <span className="text-[10px] text-ink-3 font-display font-medium tabular-nums">
                {todayMatchesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onSelectTab("fixtures");
            }}
            className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              activeTab === "fixtures"
                ? "border-primary text-white"
                : "border-transparent text-ink-2 hover:text-white"
            }`}
          >
            <span>FİKSTÜR</span>
            <span className="text-[10px] text-ink-3 font-display font-medium tabular-nums">
              {metadata?.toplam_mac_sayisi || 130}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onSelectTab("standings");
            }}
            className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              activeTab === "standings"
                ? "border-primary text-white"
                : "border-transparent text-ink-2 hover:text-white"
            }`}
          >
            <span>PUAN DURUMU</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onSelectTab("statu");
            }}
            className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              activeTab === "statu"
                ? "border-primary text-white"
                : "border-transparent text-ink-2 hover:text-white"
            }`}
          >
            <span>STATÜ</span>
          </button>

          <Link
            href="/takvim"
            prefetch={false}
            className="flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 border-transparent text-ink-2 hover:text-white transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            <span>TAKVİM</span>
          </Link>
        </nav>

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
