"use client";

import React from "react";
import type { Match } from "@/types/fixture";
import { getFixtureRowState } from "@/utils/fixtureTable";
import { FixtureFavoriteCell, FixtureDateCell, FixtureTimeCell, FixtureHallCell } from "./FixtureRowCells";
import { FixtureHomeTeamCell, FixtureScoreCell, FixtureAwayTeamCell, FixtureSetScoresCell } from "./FixtureRowTeamCells";
import { FixtureVolleyboxCell, FixtureActionsCell } from "./FixtureRowStatusCells";

interface FixtureTableRowProps {
  match: Match;
  idx: number;
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

/** Liste görünümünde tek bir maç satırı (grup değiştiyse önce grup başlık satırı). */
export function FixtureTableRow({
  match,
  idx,
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
}: FixtureTableRowProps) {
  const {
    isFav,
    isFinished,
    homeWon,
    awayWon,
    formattedDate,
    isCopied,
    disc,
    hasDiff,
    forfeitInfo,
    currentGroup,
    isFirstOfGroup,
    matchesInGroupCount,
  } = getFixtureRowState(match, idx, matches, hasMultipleGroups, favorites, copiedId);

  const cardBorderClass = hasDiff
    ? "border-amber-500/60 bg-amber-950/25 group-hover:bg-amber-950/45 group-hover:border-amber-500/80"
    : isFav
    ? "border-amber-500/40 bg-amber-500/10 group-hover:bg-amber-500/20 group-hover:border-amber-400/60"
    : "border-slate-800/80 bg-slate-900/65 group-hover:bg-slate-850/90 group-hover:border-slate-700/80";

  return (
    <React.Fragment>
      {isFirstOfGroup && (
        <tr className="select-none">
          <td colSpan={10} className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-surface-muted/90 to-amber-500/10 border border-amber-500/30 text-amber-300 font-extrabold text-[11px] uppercase tracking-wider shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-glow-amber"></span>
                <span className="text-amber-300 font-black tracking-wide">{currentGroup}</span>
              </div>
              <span className="text-[10px] font-mono text-amber-200/80 font-bold bg-slate-950/80 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                {matchesInGroupCount} Maç
              </span>
            </div>
          </td>
        </tr>
      )}
      <tr
        onClick={() => onSelectMatch?.(match)}
        className={`group transition-all duration-200 ${
          onSelectMatch ? "cursor-pointer" : ""
        } hover:shadow-card hover:-translate-y-0.5`}
      >
        {/* ⭐ Favori */}
        <FixtureFavoriteCell
          match={match}
          isFav={isFav}
          hasDiff={hasDiff}
          cardBorderClass={cardBorderClass}
          onToggleFavorite={onToggleFavorite}
        />

        {/* 1. Tarih */}
        <FixtureDateCell disc={disc} formattedDate={formattedDate} cardBorderClass={cardBorderClass} />

        {/* 2. Saat */}
        <FixtureTimeCell match={match} disc={disc} cardBorderClass={cardBorderClass} />

        {/* 3. Yer */}
        <FixtureHallCell match={match} disc={disc} effectiveCity={effectiveCity} cardBorderClass={cardBorderClass} />

        {/* 4. A Takımı (Ev Sahibi) */}
        <FixtureHomeTeamCell
          match={match}
          city={city}
          won={homeWon}
          isFinished={isFinished}
          cardBorderClass={cardBorderClass}
        />

        {/* 5. VS / Skor (Merkez Ayracı) */}
        <FixtureScoreCell
          match={match}
          isFinished={isFinished}
          forfeitInfo={forfeitInfo}
          cardBorderClass={cardBorderClass}
        />

        {/* 6. B Takımı (Deplasman) */}
        <FixtureAwayTeamCell
          match={match}
          city={city}
          won={awayWon}
          isFinished={isFinished}
          cardBorderClass={cardBorderClass}
        />

        {/* 7. Set Skorları */}
        <FixtureSetScoresCell
          match={match}
          isFinished={isFinished}
          forfeitInfo={forfeitInfo}
          cardBorderClass={cardBorderClass}
        />

        {/* 8. Volleybox Senkronizasyon ve Skor Durumu Rozeti */}
        <FixtureVolleyboxCell match={match} hasDiff={hasDiff} disc={disc} cardBorderClass={cardBorderClass} />

        {/* 9. İşlemler */}
        <FixtureActionsCell
          match={match}
          isFinished={isFinished}
          isCopied={isCopied}
          onSelectMatch={onSelectMatch}
          handleDownloadIcs={handleDownloadIcs}
          handleCopy={handleCopy}
          cardBorderClass={cardBorderClass}
        />
      </tr>
    </React.Fragment>
  );
}
