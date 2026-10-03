"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import type { Match, StandingItem } from "@/types/fixture";
import { TeamVolleyboxLink } from "@/components/TeamVolleyboxLink";
import { summarizeTeam } from "@/utils/standingsForm";
import type { ParsedStandingContext } from "@/utils/standingsParsing";
import { FormDots } from "./FormDots";
import { StandingsDetailRow } from "./StandingsDetailRow";

interface StandingsRowProps {
  row: StandingItem;
  isExpanded: boolean;
  activeContext: ParsedStandingContext | undefined;
  city?: string;
  matches?: Match[];
  toggleDetail: (row: StandingItem) => void;
}

/** Tek bir takımın puan durumu satırı (+ açıldığında detay satırı). */
export function StandingsRow({ row, isExpanded, activeContext, city, matches, toggleDetail }: StandingsRowProps) {
  const isTop4 = row.rank <= 4;
  const isPlayoff = row.rank <= 2;
  const isKlasman = row.rank > 2 && row.rank <= 8;

  const summary = summarizeTeam(
    row,
    activeContext
      ? { city: activeContext.city || city || "", leagueName: activeContext.leagueFullName, groupName: activeContext.displayGroup }
      : null,
    matches
  );

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
        <td className="py-2.5 sm:py-3 px-2 sm:px-4 font-bold text-ink whitespace-nowrap text-xs sm:text-sm">
          <div className="flex items-center gap-1.5">
            <TeamVolleyboxLink
              teamName={row.team}
              category={activeContext?.leagueFullName}
              city={activeContext?.city || city}
              className={`transition-colors ${
                isTop4
                  ? "font-bold text-ink"
                  : "font-semibold text-ink-2 hover:text-ink"
              }`}
            />
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

        {/* Puan */}
        <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-display font-scoreboard tabular-nums text-sm font-bold text-ink">
          {row.points}
        </td>

        {/* Form */}
        <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-center">
          <FormDots form={summary.form} source={summary.formSource} />
        </td>
      </tr>

      {/* Satır içi detay */}
      {isExpanded && <StandingsDetailRow row={row} summary={summary} />}
    </React.Fragment>
  );
}
