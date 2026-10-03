"use client";

import React from "react";
import { Trophy, CalendarPlus, LayoutGrid, List, ChevronDown, ChevronUp } from "lucide-react";
import type { Match } from "@/types/fixture";
import { LeagueVolleyboxLink } from "@/components/LeagueVolleyboxLink";
import { PrintScheduleButton } from "@/components/PrintScheduleButton";

export type FixtureViewMode = "table" | "grid";

interface FixtureTableHeaderProps {
  title: string;
  subTitle?: string;
  showCityBadge: boolean;
  effectiveCity: string | undefined;
  isCollapsible: boolean;
  isCollapsed: boolean;
  handleToggleCollapse: () => void;
  viewMode: FixtureViewMode;
  setViewMode: (mode: FixtureViewMode) => void;
  matches: Match[];
  favorites: string[];
  handleDownloadFavoritesIcs: (e: React.MouseEvent) => void;
}

/** 1. Grup Başlığı (lig adı, görünüm seçici, favori .ics, maç sayısı, daralt/göster düğmesi) */
export function FixtureTableHeader({
  title,
  subTitle,
  showCityBadge,
  effectiveCity,
  isCollapsible,
  isCollapsed,
  handleToggleCollapse,
  viewMode,
  setViewMode,
  matches,
  favorites,
  handleDownloadFavoritesIcs,
}: FixtureTableHeaderProps) {
  return (
    <div
      onClick={(e) => {
        if (!isCollapsible) return;
        const target = e.target as HTMLElement;
        if (target.closest("a") || target.closest("button")) return;
        handleToggleCollapse();
      }}
      className={`bg-gradient-to-r from-slate-900/90 via-surface-muted/90 to-slate-900/90 text-white px-4 py-2.5 flex items-center justify-between select-none transition-colors ${
        isCollapsed ? "rounded-2xl" : "border-b border-slate-800/80"
      } ${isCollapsible ? "cursor-pointer hover:bg-slate-850/60" : ""}`}
      title={
        isCollapsible
          ? isCollapsed
            ? `${title} ligini aç ve maçları göster`
            : `${title} ligini gizle`
          : undefined
      }
    >
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-xs">
          <Trophy size={12} className="text-primary" />
        </div>
        <h3 className="font-extrabold text-xs tracking-tight text-white uppercase flex items-center gap-1.5">
          {/* Şehir Başlığı: Tüm İller seçildiğinde görseldeki yere hangi il olduğu yazılır */}
          {showCityBadge && effectiveCity && !title.toLowerCase().startsWith(effectiveCity.toLowerCase()) && (
            <span className="text-sky-400 font-black tracking-wide">
              {effectiveCity.toUpperCase()} •
            </span>
          )}
          <LeagueVolleyboxLink league={title} city={effectiveCity}>
            {title}
          </LeagueVolleyboxLink>
          {subTitle && subTitle.toLowerCase() !== title.toLowerCase() && subTitle !== "Tek Grup" ? ` • ${subTitle}` : ""}
        </h3>
      </div>
      <div className="flex items-center gap-2">
        {!isCollapsed && (
          <>
            {/* Görünüm Seçici (Liste vs Yayın Kartı) */}
            <div className="flex items-center rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-primary text-primary-fg shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Liste Görünümü"
                aria-label="Liste Görünümü"
              >
                <List size={13} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-primary text-primary-fg shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Yayın Kartı (Grid) Görünümü"
                aria-label="Yayın Kartı Görünümü"
              >
                <LayoutGrid size={13} />
              </button>
            </div>

            {matches.some((m) => favorites.includes(m.id) && m.date && m.date !== "TBD") && (
              <button
                type="button"
                onClick={handleDownloadFavoritesIcs}
                className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
                title="Bu tablodaki favori maçlarınızı .ics olarak takvime ekleyin"
              >
                <CalendarPlus size={11} />
                <span className="hidden sm:inline">Favorileri Takvime Ekle</span>
              </button>
            )}
            <PrintScheduleButton />
          </>
        )}
        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded-lg border border-slate-800">
          {matches.length} Maç
        </span>

        {isCollapsible && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleCollapse();
            }}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? `${title} ligini göster` : `${title} ligini gizle`}
            title={isCollapsed ? `${title} ligini aç ve maçları göster` : `${title} ligini gizle`}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
              isCollapsed
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                : "bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60 hover:bg-slate-700/80"
            }`}
          >
            <span>{isCollapsed ? "Göster" : "Gizle"}</span>
            {isCollapsed ? (
              <ChevronDown size={13} className="text-amber-400" />
            ) : (
              <ChevronUp size={13} className="text-slate-400" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
