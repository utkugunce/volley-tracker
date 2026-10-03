"use client";

import React from "react";
import type { Match, StandingItem } from "@/types/fixture";
import type { ParsedStandingContext } from "@/utils/standingsParsing";
import { StandingsRow } from "./StandingsRow";

interface StandingsTableViewProps {
  items: StandingItem[];
  activeContext: ParsedStandingContext | undefined;
  city?: string;
  matches?: Match[];
  expandedTeam: string | null;
  toggleDetail: (row: StandingItem) => void;
}

/** Puan durumu tablosu (başlık satırı + takım satırları). */
export function StandingsTableView({
  items,
  activeContext,
  city,
  matches,
  expandedTeam,
  toggleDetail,
}: StandingsTableViewProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed text-left border-collapse text-xs">
        <caption className="sr-only">
          {activeContext?.city || ""} {activeContext?.leagueFullName || ""} {activeContext?.displayGroup || ""} Puan Durumu
        </caption>
        <thead>
          <tr className="bg-surface text-ink-2 font-bold uppercase text-[10px] sm:text-[11px] tracking-wider border-b border-line">
            <th className="py-2.5 sm:py-3 px-1.5 sm:px-3 text-center w-12 sm:w-14">#</th>
            <th className="py-2.5 sm:py-3 px-2 sm:px-4">Takım</th>
            <th className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center w-8 sm:w-12" title="Oynanan Maç">O</th>
            <th className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center w-8 sm:w-12" title="Galibiyet">G</th>
            <th className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center w-8 sm:w-12" title="Mağlubiyet">M</th>
            <th className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-center hidden sm:table-cell w-16" title="Set (Aldığı-Verdiği)">Set</th>
            <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-center w-12 sm:w-14 font-black text-ink" title="Puan">Puan</th>
            <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-center w-24 sm:w-28" title="Son 5 Maç Formu">Form</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => {
            const teamKey = `${row.rank}-${row.team}`;
            return (
              <StandingsRow
                key={teamKey}
                row={row}
                isExpanded={expandedTeam === teamKey}
                activeContext={activeContext}
                city={city}
                matches={matches}
                toggleDetail={toggleDetail}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
