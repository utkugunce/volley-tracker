"use client";

import React from "react";
import Link from "next/link";
import { Printer, Star, Search } from "lucide-react";
import { CitySelector } from "@/components/CitySelector";
import { BrandLogo } from "@/components/BrandLogo";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { SettingsControls } from "@/components/SettingsControls";
import { formatSyncDateTime } from "@/utils/formatSyncDate";
import { useLanguage } from "@/i18n/useLanguage";
import { CityInfo } from "@/types/fixture";

interface HeaderProps {
  city?: string;
  currentCitySlug?: string;
  onSelectCity?: (slug: string) => void;
  cities?: CityInfo[];
  title?: string;
  updatedAt?: string;
  /** Verilmezse FİKSTÜR sekmesinde sayı rozeti gösterilmez (ör. /takvim sayfası). */
  totalMatches?: number;
  todayMatchesCount?: number;
  resultsCount?: number;
  favoritesCount: number;
  showOnlyFavorites: boolean;
  onToggleFavoritesOnly: () => void;
  /** "calendar": /takvim sayfası (ayrı rota; sekme düğmesi yerine bağlantıdır). */
  activeTab: "home" | "results" | "today" | "fixtures" | "standings" | "group-status" | "calendar";
  onSelectTab: (tab: "home" | "results" | "today" | "fixtures" | "standings" | "group-status") => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCitySlug = "istanbul",
  onSelectCity,
  cities = [],
  updatedAt,
  totalMatches,
  todayMatchesCount = 0,
  resultsCount,
  favoritesCount,
  showOnlyFavorites,
  onToggleFavoritesOnly,
  activeTab,
  onSelectTab,
  onOpenSearch,
}) => {
  const { t } = useLanguage();
  const syncDateTime = updatedAt ? formatSyncDateTime(updatedAt) : null;

  return (
    <header className="bg-canvas text-white border-b border-line/70 pt-[env(safe-area-inset-top,0px)]">
      {/* 1. Üst Global Bar: Marka + Bütünleşik Lig Seçici (Altyapı / 2. Lig) + İl Seçici */}
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap min-[1200px]:flex-nowrap items-center justify-between border-b border-line/50 gap-x-2.5 gap-y-1.5">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap min-[1200px]:flex-nowrap min-[1200px]:min-w-0 min-[1200px]:[&>*:not(.hdr-tagline)]:shrink-0">
          <BrandLogo onClick={() => onSelectTab("home")} />

          {/* Apple Sports / FotMob Tarzı Bütünleşik Lig Seçici (Segmented League Switcher) */}
          <div
            className="hidden sm:inline-flex items-center p-0.5 rounded-lg bg-surface-muted border border-line/60 text-xs"
            role="group"
            aria-label="Lig Seçici"
          >
            <span className="px-2.5 py-1 rounded-md bg-surface-raised text-white font-semibold tracking-tight">
              Altyapı (81 İl)
            </span>
            <Link
              href="/kadinlar-2-ligi"
              prefetch={false}
              className="px-2.5 py-1 rounded-md text-ink-2 hover:text-white font-medium transition-colors flex items-center gap-1 whitespace-nowrap"
              title="TVF Kadınlar 2. Ligi Sayfasına Geç (16 Grup, 167 Kulüp)"
            >
              <span>{t("header.k2")}</span>
              <span className="text-[10px] text-ink-3 font-mono hidden lg:inline">
                ({t("header.groups16")})
              </span>
            </Link>
          </div>

          {/* 81 İl Seçici Açılır Menü */}
          {onSelectCity && (
            <CitySelector
              currentCitySlug={currentCitySlug}
              onSelectCity={onSelectCity}
              cities={cities}
            />
          )}
        </div>

        {/* Sağ Taraf: Arama, Favoriler, Son Çekim, Ayarlar, Yazdır */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto min-w-0">
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label={t("header.search")}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-raised text-ink-2 hover:text-white border border-line/60 transition-colors active:scale-[0.98] cursor-pointer"
              title="Hızlı Arama (Ctrl + K)"
            >
              <Search size={13} className="text-ink-3" aria-hidden="true" />
              <span className="hidden md:inline font-medium text-[11px]">{t("header.search")}</span>
              <kbd className="hidden md:inline-flex items-center text-[9px] font-mono text-ink-3 px-1" aria-hidden="true">
                ⌘K
              </kbd>
            </button>
          )}

          {(activeTab === "fixtures" || activeTab === "home" || activeTab === "today" || activeTab === "results") && (
            <button
              type="button"
              onClick={onToggleFavoritesOnly}
              aria-label={t("header.favorites")}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors active:scale-[0.98] cursor-pointer ${
                showOnlyFavorites
                  ? "bg-warn text-black font-bold"
                  : "bg-surface text-ink-2 hover:text-white hover:bg-surface-raised border border-line/60"
              }`}
              title="Sadece Favori Maçları Göster"
            >
              <Star
                size={13}
                className={showOnlyFavorites ? "fill-black text-black" : "text-warn"}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">{t("header.favorites")}</span>
              {favoritesCount > 0 && (
                <span className="text-[10px] font-mono tabular-nums opacity-85">
                  {favoritesCount}
                </span>
              )}
            </button>
          )}

          <div className="hidden sm:contents"><PwaInstallPrompt /></div>

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
      <nav
        aria-label="Sayfa ana sekmeleri"
        className="max-w-screen-2xl mx-auto px-2 sm:px-4 flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs font-semibold overflow-x-auto no-scrollbar"
      >
        <button
          type="button"
          onClick={() => onSelectTab("home")}
          className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            activeTab === "home"
              ? "border-primary text-white"
              : "border-transparent text-ink-2 hover:text-white"
          }`}
        >
          <span>{t("nav.home")}</span>
          {todayMatchesCount > 0 && (
            <span className="text-[10px] text-ink-3 font-display font-medium tabular-nums">
              {todayMatchesCount} {t("nav.todayBadge")}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("results")}
          className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            activeTab === "results"
              ? "border-primary text-white"
              : "border-transparent text-ink-2 hover:text-white"
          }`}
        >
          <span>{t("nav.results")}</span>
          {typeof resultsCount === "number" && (
            <span className="text-[10px] font-display font-medium tabular-nums text-ink-3">
              {resultsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("today")}
          className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            activeTab === "today"
              ? "border-primary text-white"
              : "border-transparent text-ink-2 hover:text-white"
          }`}
        >
          <span>{t("nav.today")}</span>
          {todayMatchesCount > 0 && (
            <span className="text-[10px] text-ink-3 font-display font-medium tabular-nums">
              {todayMatchesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("fixtures")}
          className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            activeTab === "fixtures"
              ? "border-primary text-white"
              : "border-transparent text-ink-2 hover:text-white"
          }`}
        >
          <span>{t("nav.fixtures")}</span>
          {typeof totalMatches === "number" && (
            <span className="text-[10px] text-ink-3 font-display font-medium tabular-nums">
              {totalMatches}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("standings")}
          className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            activeTab === "standings"
              ? "border-primary text-white"
              : "border-transparent text-ink-2 hover:text-white"
          }`}
        >
          <span>{t("nav.standings")}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab("group-status")}
          className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            activeTab === "group-status"
              ? "border-primary text-white"
              : "border-transparent text-ink-2 hover:text-white"
          }`}
        >
          <span>{t("nav.groupStatus")}</span>
        </button>

        <Link
          href="/takvim"
          prefetch={false}
          aria-current={activeTab === "calendar" ? "page" : undefined}
          className={`flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            activeTab === "calendar"
              ? "border-primary text-white"
              : "border-transparent text-ink-2 hover:text-white"
          }`}
        >
          <span>{t("nav.calendar")}</span>
        </Link>

        <Link
          href="/kulupler"
          prefetch={false}
          className="flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 border-transparent text-ink-2 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          title="İl ve İlçe Bazlı Voleybol Kulüpleri Rehberi"
        >
          <span>{t("nav.clubs")}</span>
        </Link>

        <Link
          href="/hangi-ligde-oynar"
          prefetch={false}
          className="flex items-center gap-1.5 py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b-2 border-transparent text-ink-2 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          title="TVF 2026-2027 Yaş Kategorisi ve File Yüksekliği Hesaplama Aracı"
        >
          <span>{t("nav.whichLeague")}</span>
        </Link>
      </nav>
    </header>
  );
};
