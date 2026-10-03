"use client";

import React from "react";
import { Trophy, Download } from "lucide-react";
import type { StandingItem } from "@/types/fixture";
import { LeagueVolleyboxLink } from "@/components/LeagueVolleyboxLink";
import { downloadStandingsCsv } from "@/utils/standingsCsv";
import type { ParsedStandingContext } from "@/utils/standingsParsing";

interface StandingsHeaderStripProps {
  activeContext: ParsedStandingContext | undefined;
  city?: string;
  items: StandingItem[];
}

/** Başlık Şeridi: lig / grup adı, CSV indirme düğmesi ve takım sayısı. */
export function StandingsHeaderStrip({ activeContext, city, items }: StandingsHeaderStripProps) {
  return (
    <div className="bg-surface text-ink px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 border-b border-line">
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <Trophy size={15} className="text-warn shrink-0" />
        <h2 className="text-xs sm:text-sm font-extrabold tracking-tight truncate">
          <LeagueVolleyboxLink
            league={activeContext?.leagueFullName || ""}
            city={activeContext?.city || city}
          >
            {activeContext?.city ? `${activeContext.city.toLocaleUpperCase("tr-TR")} • ` : ""}
            {(activeContext?.leagueFullName || "").toLocaleUpperCase("tr-TR")}
          </LeagueVolleyboxLink>
          {activeContext?.displayGroup && activeContext.displayGroup !== "Genel"
            ? ` • ${activeContext.displayGroup.toLocaleUpperCase("tr-TR")}`
            : ""}
        </h2>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {items.length > 0 && (
          <button
            onClick={() =>
              downloadStandingsCsv(
                items,
                `${activeContext?.city || city || ""}-${activeContext?.leagueFullName || ""}-${activeContext?.displayGroup || activeContext?.rawGroup || ""}`
              )
            }
            className="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-line bg-surface-raised text-ink-2 hover:text-ink transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Puan durumunu Türkçe Excel uyumlu (.csv) olarak indir"
            aria-label="CSV İndir: puan durumunu CSV olarak indir"
          >
            <Download size={12} className="text-done" />
            <span>CSV İndir</span>
          </button>
        )}
        <span className="text-[10px] sm:text-xs text-ink-2 font-mono font-bold bg-canvas px-1.5 sm:px-2 py-0.5 rounded-lg border border-line">
          {items.length} Takım
        </span>
      </div>
    </div>
  );
}
