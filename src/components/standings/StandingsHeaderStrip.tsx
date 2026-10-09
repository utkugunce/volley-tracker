"use client";

import React from "react";
import { Trophy, Download } from "lucide-react";
import type { StandingItem } from "@/types/fixture";
import { LeagueVolleyboxLink } from "@/components/LeagueVolleyboxLink";
import { downloadStandingsCsv } from "@/utils/standingsCsv";
import type { ParsedStandingContext } from "@/utils/standingsParsing";
import { Button } from "@/components/arc/button/button";
import { Badge } from "@/components/arc/badge/badge";

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
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              downloadStandingsCsv(
                items,
                `${activeContext?.city || city || ""}-${activeContext?.leagueFullName || ""}-${activeContext?.displayGroup || activeContext?.rawGroup || ""}`
              )
            }
            className="cursor-pointer"
            title="Puan durumunu Türkçe Excel uyumlu (.csv) olarak indir"
            aria-label="CSV İndir: puan durumunu CSV olarak indir"
          >
            <Download size={12} className="text-done mr-1" />
            <span>CSV İndir</span>
          </Button>
        )}
        <Badge tone="neutral" size="sm">
          {`${items.length} Takım`}
        </Badge>
      </div>
    </div>
  );
}

