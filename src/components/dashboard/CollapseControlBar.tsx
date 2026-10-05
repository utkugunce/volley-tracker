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
  onExpandCities?: () => void;
  onCollapseCities?: () => void;
  onExpandLeagues?: () => void;
  onCollapseLeagues?: () => void;
}

/** Toplu İl ve Lig Gizleme / Gösterme Kontrol Çubuğu. */
export const CollapseControlBar: React.FC<CollapseControlBarProps> = ({
  variant,
  cityCount,
  leagueCount,
  areAllCitiesCollapsed,
  areAllLeaguesCollapsed,
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
    </div>
  );
};

