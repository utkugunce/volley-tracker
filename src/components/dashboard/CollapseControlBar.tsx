"use client";

import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type CollapseBarVariant = "results" | "fixtures";

// Tailwind sınıfları tam metin olarak yazılmalı (dinamik birleştirme JIT tarafından görülmez).
const VARIANT_STYLES: Record<
  CollapseBarVariant,
  {
    dot: string;
    activeButton: string;
    expandIcon: string;
    citiesExpandTitle: string;
    leaguesExpandTitle: string;
  }
> = {
  results: {
    dot: "w-2 h-2 rounded-full bg-emerald-400 animate-pulse",
    activeButton: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs",
    expandIcon: "text-emerald-400",
    citiesExpandTitle: "Tüm illeri aç ve sonuçları göster",
    leaguesExpandTitle: "Tüm ligleri aç ve maçları göster",
  },
  fixtures: {
    dot: "w-2 h-2 rounded-full bg-done",
    activeButton: "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-xs",
    expandIcon: "text-sky-400",
    citiesExpandTitle: "Tüm illeri aç ve fikstür maçlarını göster",
    leaguesExpandTitle: "Tüm ligleri aç ve fikstür maçlarını göster",
  },
};

interface CollapseControlBarProps {
  variant: CollapseBarVariant;
  cityCount: number;
  leagueCount: number;
  areAllCitiesCollapsed: boolean;
  areAllLeaguesCollapsed: boolean;
  onExpandCities: () => void;
  onCollapseCities: () => void;
  onExpandLeagues: () => void;
  onCollapseLeagues: () => void;
}

/** Toplu İl ve Lig Gizleme / Gösterme Kontrol Çubuğu. */
export const CollapseControlBar: React.FC<CollapseControlBarProps> = ({
  variant,
  cityCount,
  leagueCount,
  areAllCitiesCollapsed,
  areAllLeaguesCollapsed,
  onExpandCities,
  onCollapseCities,
  onExpandLeagues,
  onCollapseLeagues,
}) => {
  const styles = VARIANT_STYLES[variant];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-3.5 sm:px-4 py-2 mb-4 shadow-xs">
      <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
        <div className={styles.dot} />
        <span>
          Toplam <strong className="text-white font-mono">{cityCount}</strong> İl, <strong className="text-white font-mono">{leagueCount}</strong> Lig Listeleniyor
        </span>
        {areAllLeaguesCollapsed && (
          <span className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-normal">
            (Ligler Gizli)
          </span>
        )}
        {areAllCitiesCollapsed && (
          <span className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-normal">
            (İller Gizli)
          </span>
        )}
      </div>

      <details className="relative">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-800/70 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700/80">
          Görünüm
          <ChevronDown size={13} aria-hidden="true" />
        </summary>
        <div className="absolute right-0 z-20 mt-2 flex min-w-max flex-wrap items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl">
        {/* İl Kontrolleri (Birden çok il listeleniyorsa) */}
        {cityCount > 1 && (
          <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs shadow-inner">
            <span className="text-[11px] text-slate-400 font-semibold px-2 hidden sm:inline">İller:</span>
            <button
              type="button"
              onClick={onExpandCities}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !areAllCitiesCollapsed
                  ? styles.activeButton
                  : "text-slate-400 hover:text-white"
              }`}
              title={styles.citiesExpandTitle}
            >
              <ChevronDown size={13} className={styles.expandIcon} />
              <span>Tümünü Göster</span>
            </button>
            <div className="w-[1px] h-3 bg-slate-800 mx-0.5" />
            <button
              type="button"
              onClick={onCollapseCities}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                areAllCitiesCollapsed
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Tüm illeri gizle"
            >
              <ChevronUp size={13} className="text-amber-400" />
              <span>Tümünü Gizle</span>
            </button>
          </div>
        )}

        {/* Lig Kontrolleri */}
        {leagueCount > 0 && (
          <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs shadow-inner">
            <span className="text-[11px] text-slate-400 font-semibold px-2 hidden sm:inline">Ligler:</span>
            <button
              type="button"
              onClick={onExpandLeagues}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !areAllLeaguesCollapsed
                  ? styles.activeButton
                  : "text-slate-400 hover:text-white"
              }`}
              title={styles.leaguesExpandTitle}
            >
              <ChevronDown size={13} className={styles.expandIcon} />
              <span>Ligleri Aç</span>
            </button>
            <div className="w-[1px] h-3 bg-slate-800 mx-0.5" />
            <button
              type="button"
              onClick={onCollapseLeagues}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                areAllLeaguesCollapsed
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Tüm ligleri gizle"
            >
              <ChevronUp size={13} className="text-amber-400" />
              <span>Ligleri Gizle</span>
            </button>
          </div>
        )}
        </div>
      </details>
    </div>
  );
};
