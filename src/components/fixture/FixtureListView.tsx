"use client";

import React from "react";
import type { Match } from "@/types/fixture";
import { FixtureTableRow } from "./FixtureTableRow";

interface FixtureListViewProps {
  visibleMatches: Match[];
  matches: Match[];
  hasMultipleGroups: boolean;
  favorites: string[];
  copiedId: string | null;
  effectiveCity: string | undefined;
  city: string;
  onToggleFavorite?: (id: string) => void;
  onSelectMatch?: (match: Match) => void;
  handleCopy: (e: React.MouseEvent, match: Match) => void;
  handleDownloadIcs: (e: React.MouseEvent, match: Match) => void;
}

/** Resmi TVF / Fikstür Tablosu: Tarih - Yer - Saat - A Takımı - B Takımı - Skor - Set Skorları - Volleybox - İşlem */
export function FixtureListView({
  visibleMatches,
  matches,
  hasMultipleGroups,
  favorites,
  copiedId,
  effectiveCity,
  city,
  onToggleFavorite,
  onSelectMatch,
  handleCopy,
  handleDownloadIcs,
}: FixtureListViewProps) {
  return (
    <div className="overflow-x-auto p-2 sm:p-3 bg-slate-950/40" tabIndex={0} role="region" aria-label="Fikstür tablosu">
      <table className="w-full text-left border-separate border-spacing-y-2 text-xs">
        <thead>
          <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
            <th className="pb-1 px-2 text-center w-8" title="Favorilere Ekle">⭐</th>
            <th className="pb-1 px-2 w-[85px] whitespace-nowrap">Tarih</th>
            <th className="pb-1 px-2 text-center w-14 whitespace-nowrap">Saat</th>
            <th className="pb-1 px-2 min-w-[80px] max-w-[125px] lg:max-w-[150px]">Yer</th>
            <th className="pb-1 px-2 min-w-[140px] max-w-[220px] lg:max-w-[270px] text-right">A Takımı (Ev Sahibi)</th>
            <th className="pb-1 px-1 text-center w-16 whitespace-nowrap">VS / Skor</th>
            <th className="pb-1 px-2 min-w-[140px] max-w-[220px] lg:max-w-[270px] text-left">B Takımı (Deplasman)</th>
            <th className="pb-1 px-2 min-w-[110px] max-w-[145px]">Set Skorları</th>
            <th className="pb-1 px-2 text-center min-w-[80px]" title="Volleybox maç kaydı durumu">Volleybox</th>
            <th className="pb-1 px-2 text-center w-14 no-print">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {visibleMatches.map((match, idx) => (
            <FixtureTableRow
              key={match.id}
              match={match}
              idx={idx}
              matches={matches}
              hasMultipleGroups={hasMultipleGroups}
              favorites={favorites}
              copiedId={copiedId}
              effectiveCity={effectiveCity}
              city={city}
              onToggleFavorite={onToggleFavorite}
              onSelectMatch={onSelectMatch}
              handleCopy={handleCopy}
              handleDownloadIcs={handleDownloadIcs}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
