"use client";

import React from "react";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { slugify } from "@/utils/slugify";

interface CityGroupBannerProps {
  cityName: string;
  totalMatches: number;
  isCollapsed: boolean;
  onToggle: () => void;
  /** Başlık ipucu metninde kullanılan ifade: "maçlarını" (Sonuçlar) veya "fikstürünü" (Fikstür). */
  noun: "maçlarını" | "fikstürünü";
  isAllCities: boolean;
  onSelectCity: (slug: string) => void;
}

/** Şehir Başlık Banner'ı: Tıklandığında o ilin maçlarını gizler/açar. */
export const CityGroupBanner: React.FC<CityGroupBannerProps> = ({
  cityName,
  totalMatches,
  isCollapsed: isCityCollapsed,
  onToggle,
  noun,
  isAllCities,
  onSelectCity,
}) => (
  <div
    role="button"
    tabIndex={0}
    aria-expanded={!isCityCollapsed}
    onClick={onToggle}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onToggle();
      }
    }}
    className="flex items-center justify-between bg-gradient-to-r from-slate-900/95 via-surface-muted to-slate-900/95 border border-sky-500/30 hover:border-sky-400/60 rounded-2xl px-3.5 sm:px-4 py-2.5 shadow-md transition-all cursor-pointer select-none group/city active:scale-[0.99]"
    title={isCityCollapsed ? `${cityName} ${noun} göster` : `${cityName} ${noun} gizle`}
  >
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-sky-500/20 group-hover/city:bg-sky-500/30 border border-sky-400/40 flex items-center justify-center text-sky-400 font-black shadow-xs transition-colors">
        <MapPin size={15} className="text-sky-300" />
      </div>
      <div className="flex items-center gap-2">
        <h2 className="text-xs sm:text-sm md:text-base font-black text-white tracking-wide uppercase flex items-center gap-1.5 group-hover/city:text-sky-200 transition-colors">
          <span>{cityName}</span>
          <span className="text-slate-400 font-normal text-xs">• TVF İl Temsilciliği</span>
        </h2>
        <span className="text-[10px] sm:text-[11px] font-bold text-sky-400 bg-sky-950/80 border border-sky-700/60 px-2 py-0.5 rounded-full font-mono">
          {totalMatches} Maç
        </span>
      </div>
    </div>

    <div className="flex items-center gap-2">
      {isCityCollapsed ? (
        <span className="text-[11px] text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
          <span>Gizlendi (Göster)</span>
          <ChevronDown size={13} className="text-amber-400" />
        </span>
      ) : (
        <span className="text-[11px] text-slate-400 font-medium group-hover/city:text-slate-200 flex items-center gap-1">
          <span className="hidden sm:inline">Gizle</span>
          <ChevronUp size={13} className="text-slate-400 group-hover/city:text-white transition-colors" />
        </span>
      )}

      {isAllCities && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectCity(slugify(cityName));
          }}
          className="text-[11px] text-sky-400 hover:text-sky-200 font-semibold underline underline-offset-2 transition-colors cursor-pointer hidden sm:inline-flex ml-2"
          title={`${cityName} sayfasına git`}
        >
          {cityName} Sayfası →
        </button>
      )}
    </div>
  </div>
);
