"use client";

import React, { useState } from "react";
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
import { LeagueSwitcher } from "@/components/layout/LeagueSwitcher";
import { SultanlarTabType } from "@/utils/sultanlarLigiRoutes";

interface SultanlarLigiHeaderProps {
  metadata: Kadinlar2LigMetadata;
  activeTab: SultanlarTabType;
  onSelectTab: (tab: SultanlarTabType) => void;
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

export const SultanlarLigiHeader: React.FC<SultanlarLigiHeaderProps> = ({
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
      {/* 1. Üst Global Bar: Marka + Segmented League Switcher + Sağ Kontroller */}
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between border-b border-line/50 gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <BrandLogo onClick={() => onSelectTab("home")} />
          <LeagueSwitcher activeLeague="sultanlar" />
        </div>

        {/* Sağ Taraf: Arama, Favoriler, Kaynaklar, Son Çekim, Ayarlar, Yazdır */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-raised text-ink-2 hover:text-white border border-line/60 transition-colors active:scale-[0.98] cursor-pointer"
              title="Vodafone Sultanlar Ligi Takım, Maç ve Salon Arama (Ctrl + K)"
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
                    <p className="font-bold text-ink">Vodafone Sultanlar Ligi</p>
                    <p className="text-[11px] text-ink-3">Resmi TVF ve Volleybox Verileri</p>
                  </div>
                  <div className="py-1">
                    <a
                      href={metadata?.resmi_kaynaklar?.tvf_puan_durumu || "https://tvf.org.tr/lig/sultanlar-ligi"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-surface text-ink hover:text-primary transition-colors"
                    >
                      <span>TVF Resmi Puan Durumu</span>
                      <ExternalLink size={12} />
                    </a>
                    <a
                      href={metadata?.resmi_kaynaklar?.tvf_fikstur || "https://tvf.org.tr/lig/sultanlar-ligi"}
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

      {/* 2. Alt Sekme Çubuğu (Navigation Tabs) */}
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        <nav className="flex items-center gap-1 sm:gap-1.5 shrink-0" aria-label="Sultanlar Ligi Sekmeleri">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onSelectTab("home");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "home"
                ? "bg-primary text-primary-fg shadow-xs"
                : "text-ink-2 hover:text-white hover:bg-surface"
            }`}
          >
            <span>Genel Bakış</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onSelectTab("today");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "today"
                ? "bg-primary text-primary-fg shadow-xs"
                : "text-ink-2 hover:text-white hover:bg-surface"
            }`}
          >
            <span>Günün Maçları</span>
            {todayMatchesCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === "today"
                    ? "bg-black/20 text-white"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {todayMatchesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onSelectTab("results");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "results"
                ? "bg-primary text-primary-fg shadow-xs"
                : "text-ink-2 hover:text-white hover:bg-surface"
            }`}
          >
            <span>Sonuçlar</span>
            {resultsCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === "results"
                    ? "bg-black/20 text-white"
                    : "bg-surface-raised text-ink-3"
                }`}
              >
                {resultsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onSelectTab("fixtures");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "fixtures"
                ? "bg-primary text-primary-fg shadow-xs"
                : "text-ink-2 hover:text-white hover:bg-surface"
            }`}
          >
            <span>Fikstür</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === "fixtures"
                  ? "bg-black/20 text-white"
                  : "bg-surface-raised text-ink-3"
              }`}
            >
              {metadata?.toplam_mac_sayisi || 77}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onSelectTab("standings");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "standings"
                ? "bg-primary text-primary-fg shadow-xs"
                : "text-ink-2 hover:text-white hover:bg-surface"
            }`}
          >
            <span>Puan Durumu</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onSelectTab("teams");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "teams"
                ? "bg-primary text-primary-fg shadow-xs"
                : "text-ink-2 hover:text-white hover:bg-surface"
            }`}
          >
            <span>Kulüpler</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === "teams"
                  ? "bg-black/20 text-white"
                  : "bg-surface-raised text-ink-3"
              }`}
            >
              {metadata?.toplam_takim_sayisi || 14}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onSelectTab("karsilastir");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "karsilastir"
                ? "bg-primary text-primary-fg shadow-xs"
                : "text-ink-2 hover:text-white hover:bg-surface"
            }`}
          >
            <span>Karşılaştır</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onSelectTab("statu");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "statu"
                ? "bg-primary text-primary-fg shadow-xs"
                : "text-ink-2 hover:text-white hover:bg-surface"
            }`}
          >
            <span>Statü</span>
          </button>
        </nav>

        {/* Canlı Takım / Maç Filtre Girişi */}
        <div className="relative shrink-0 w-36 sm:w-52">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Takım / salon ara..."
            className="w-full bg-surface text-ink placeholder-ink-3 text-xs pl-7 pr-3 py-1.5 rounded-lg border border-line/60 focus:outline-hidden focus:border-primary transition-colors"
          />
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
        </div>
      </div>
    </header>
  );
};
