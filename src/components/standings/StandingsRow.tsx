"use client";

import React, { useState } from "react";
import { AlertTriangle, Check, ChevronRight, ClipboardCopy } from "lucide-react";
import type { Match, StandingItem } from "@/types/fixture";
import { TeamVolleyboxLink } from "@/components/TeamVolleyboxLink";
import { summarizeTeam } from "@/utils/standingsForm";
import type { ParsedStandingContext } from "@/utils/standingsParsing";
import { getResolvedVolleyboxTeamName, type StandingsAnomalyTeamDiff } from "@/utils/volleyboxWorkbench";
import { FormDots } from "./FormDots";
import { StandingsDetailRow } from "./StandingsDetailRow";

interface StandingsRowProps {
  row: StandingItem;
  isExpanded: boolean;
  activeContext: ParsedStandingContext | undefined;
  city?: string;
  matches?: Match[];
  teamDiff?: StandingsAnomalyTeamDiff;
  toggleDetail: (row: StandingItem) => void;
}

/** Tek bir takımın puan durumu satırı (+ açıldığında detay satırı). */
export function StandingsRow({ row, isExpanded, activeContext, city, matches, teamDiff, toggleDetail }: StandingsRowProps) {
  const [copiedTeam, setCopiedTeam] = useState(false);
  const isTop4 = row.rank <= 4;
  const isPlayoff = row.rank <= 2;
  const isKlasman = row.rank > 2 && row.rank <= 8;

  const effectiveCity = activeContext?.city || city || "";
  const vbTeamName = getResolvedVolleyboxTeamName(row.team, activeContext?.leagueFullName, effectiveCity);

  const summary = summarizeTeam(
    row,
    activeContext
      ? { city: effectiveCity, leagueName: activeContext.leagueFullName, groupName: activeContext.displayGroup }
      : null,
    matches
  );

  const handleCopyTeam = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!vbTeamName) return;
    try {
      void navigator.clipboard?.writeText(vbTeamName);
      setCopiedTeam(true);
      setTimeout(() => setCopiedTeam(false), 1400);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <React.Fragment>
      <tr
        className={`border-t border-line/70 transition-colors duration-150 cursor-pointer ${
          isExpanded ? "bg-surface-raised" : "hover:bg-surface-raised/70"
        }`}
        onClick={(e) => {
          // Bağlantılara tıklama satırı açmaz
          const target = e.target as HTMLElement;
          if (target.closest("a")) return;
          toggleDetail(row);
        }}
      >
        {/* Sıra & Final Etabı / Klasman Çizgisi */}
        <td className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center font-bold text-xs relative">
          <span
            className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r ${
              isPlayoff
                ? "bg-primary shadow-[0_0_8px_rgb(var(--primary-rgb)/0.5)]"
                : isKlasman
                ? "bg-rank-mid shadow-[0_0_6px_rgb(var(--rank-mid-rgb)/0.4)]"
                : ""
            }`}
          />
          <span
            className={`font-display font-scoreboard tabular-nums ${
              isPlayoff
                ? "text-primary font-black text-xs sm:text-sm"
                : isKlasman
                ? "text-rank-mid font-bold text-xs sm:text-sm"
                : "text-ink-2 font-medium text-xs sm:text-sm"
            }`}
          >
            {row.rank}
          </span>
        </td>

        {/* Takım Adı */}
        <td className="py-2.5 sm:py-3 px-2 sm:px-4 font-bold text-ink text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 min-w-0">
            <TeamVolleyboxLink
              teamName={row.team}
              category={activeContext?.leagueFullName}
              city={effectiveCity}
              className={`transition-colors ${
                isTop4
                  ? "font-bold text-ink"
                  : "font-semibold text-ink-2 hover:text-ink"
              }`}
            />
            {teamDiff && (
              <span
                className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-scoreboard tabular-nums font-bold shrink-0"
                title={`TVF Tablosu: ${teamDiff.tvfPlayed}O / ${teamDiff.tvfWon}G · Fikstürdeki Biten Maç: ${teamDiff.calcPlayed}O / ${teamDiff.calcWon}G`}
              >
                <AlertTriangle size={9} className="text-amber-400" />
                <span>{teamDiff.tvfPlayed}≠{teamDiff.calcPlayed}</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleCopyTeam}
              className="hidden sm:inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-ink-3 hover:bg-surface-raised hover:text-primary transition-colors cursor-pointer"
              title={`Volleybox takım adını kopyala: ${vbTeamName}`}
              aria-label={`${vbTeamName} adını kopyala`}
            >
              {copiedTeam ? <Check size={12} className="text-emerald-400" /> : <ClipboardCopy size={12} />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleDetail(row);
              }}
              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-ink-3 transition-all hover:bg-surface-raised hover:text-ink ${
                isExpanded ? "rotate-90" : ""
              }`}
              aria-expanded={isExpanded}
              aria-label={`${row.team} takımını incele`}
              title="Takımı incele"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </td>

        {/* O */}
        <td className="py-2.5 sm:py-3 px-1 sm:px-2 text-center text-ink-2 font-medium font-display font-scoreboard tabular-nums text-[11px] sm:text-xs">
          {row.played}
        </td>

        {/* G */}
        <td className="py-2.5 sm:py-3 px-1 sm:px-2 text-center text-ink font-bold font-display font-scoreboard tabular-nums text-[11px] sm:text-xs">
          {row.won}
        </td>

        {/* M */}
        <td className="py-2.5 sm:py-3 px-1 sm:px-2 text-center text-ink font-medium font-display font-scoreboard tabular-nums text-[11px] sm:text-xs">
          {row.lost}
        </td>

        {/* Set (combined, sm: only) */}
        <td className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center hidden sm:table-cell font-display font-scoreboard tabular-nums text-ink-2 text-[11px] sm:text-xs">
          {row.sets_won}-{row.sets_lost}
        </td>

        {/* Set Oranı (md: only) */}
        <td className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center hidden md:table-cell font-display font-scoreboard tabular-nums text-ink-2 text-[11px]">
          {row.set_ratio || "-"}
        </td>

        {/* Sayı (lg: only) */}
        <td className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center hidden lg:table-cell font-display font-scoreboard tabular-nums text-ink-3 text-[11px]">
          {row.points_won}-{row.points_lost}
        </td>

        {/* Puan */}
        <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-display font-scoreboard tabular-nums text-sm font-bold text-ink">
          {row.points}
        </td>

        {/* Form */}
        <td className="py-2 sm:py-3 px-1 sm:px-4 text-center hidden sm:table-cell">
          <FormDots form={summary.form} source={summary.formSource} />
        </td>
      </tr>

      {/* Satır içi detay */}
      {isExpanded && <StandingsDetailRow row={row} summary={summary} />}
    </React.Fragment>
  );
}
