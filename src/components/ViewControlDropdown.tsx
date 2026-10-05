"use client";

import React, { useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";

export interface ViewControlDropdownProps {
  hasCities: boolean;
  hasLeagues: boolean;
  areCitiesCollapsed: boolean;
  areLeaguesCollapsed: boolean;
  onExpandCities: () => void;
  onCollapseCities: () => void;
  onExpandLeagues: () => void;
  onCollapseLeagues: () => void;
  themeColor?: "emerald" | "sky";
}

export const ViewControlDropdown: React.FC<ViewControlDropdownProps> = ({
  hasCities,
  hasLeagues,
  areCitiesCollapsed,
  areLeaguesCollapsed,
  onExpandCities,
  onCollapseCities,
  onExpandLeagues,
  onCollapseLeagues,
  themeColor = "sky",
}) => {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (detailsRef.current && detailsRef.current.open && !detailsRef.current.contains(e.target as Node)) {
        detailsRef.current.open = false;
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && detailsRef.current?.open) {
        detailsRef.current.open = false;
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!hasCities && !hasLeagues) return null;

  const isCollapsed = areCitiesCollapsed || areLeaguesCollapsed;
  const isEmerald = themeColor === "emerald";
  const activeBg = isEmerald
    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    : "bg-sky-500/20 text-sky-300 border-sky-500/30";
  const iconColor = isEmerald ? "text-emerald-400" : "text-sky-400";

  return (
    <details ref={detailsRef} className="relative">
      <summary
        className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary select-none"
        aria-label="Görünüm seçenekleri"
      >
        <Layers size={14} aria-hidden="true" className="text-slate-400" />
        <span>Görünüm</span>
        {isCollapsed && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Bazı bölümler gizli" />
        )}
        <ChevronDown size={13} aria-hidden="true" />
      </summary>
      <div className="absolute left-0 sm:left-auto sm:right-0 z-30 mt-2 flex min-w-max max-w-[calc(100vw-2rem)] flex-wrap items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-md p-2 shadow-2xl">
        {/* İl Kontrolleri (Birden çok il listeleniyorsa) */}
        {hasCities && (
          <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs shadow-inner">
            <span className="text-[11px] text-slate-400 font-semibold px-2 hidden sm:inline">İller:</span>
            <button
              type="button"
              onClick={onExpandCities}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !areCitiesCollapsed
                  ? `${activeBg} border shadow-xs`
                  : "text-slate-400 hover:text-white"
              }`}
              title="Tüm illeri aç ve maçları göster"
            >
              <ChevronDown size={13} className={iconColor} />
              <span>Tümünü Göster</span>
            </button>
            <div className="w-[1px] h-3 bg-slate-800 mx-0.5" />
            <button
              type="button"
              onClick={onCollapseCities}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                areCitiesCollapsed
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
        {hasLeagues && (
          <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs shadow-inner">
            <span className="text-[11px] text-slate-400 font-semibold px-2 hidden sm:inline">Ligler:</span>
            <button
              type="button"
              onClick={onExpandLeagues}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !areLeaguesCollapsed
                  ? `${activeBg} border shadow-xs`
                  : "text-slate-400 hover:text-white"
              }`}
              title="Tüm ligleri aç ve maçları göster"
            >
              <ChevronDown size={13} className={iconColor} />
              <span>Ligleri Aç</span>
            </button>
            <div className="w-[1px] h-3 bg-slate-800 mx-0.5" />
            <button
              type="button"
              onClick={onCollapseLeagues}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                areLeaguesCollapsed
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
  );
};
