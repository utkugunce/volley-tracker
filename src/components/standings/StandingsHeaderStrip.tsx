"use client";

import React, { useState } from "react";
import { Trophy, Download, Share2 } from "lucide-react";
import type { StandingItem } from "@/types/fixture";
import { LeagueVolleyboxLink } from "@/components/LeagueVolleyboxLink";
import { downloadStandingsCsv } from "@/utils/standingsCsv";
import type { ParsedStandingContext } from "@/utils/standingsParsing";
import { Button } from "@/components/arc/button/button";
import { Badge } from "@/components/arc/badge/badge";
import { ShareStandingsCardModal } from "./ShareStandingsCardModal";

interface StandingsHeaderStripProps {
  activeContext: ParsedStandingContext | undefined;
  city?: string;
  items: StandingItem[];
  showSimulator?: boolean;
  onToggleSimulator?: () => void;
}

/** Başlık Şeridi: lig / grup adı, Paylaş / CSV indirme düğmeleri ve takım sayısı. */
export function StandingsHeaderStrip({
  activeContext,
  city,
  items,
  showSimulator,
  onToggleSimulator,
}: StandingsHeaderStripProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <>
      <div className="bg-surface text-ink px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 border-b border-line/70">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <Trophy size={15} className="text-primary shrink-0" />
          <h2 className="text-xs sm:text-sm font-bold tracking-tight truncate">
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
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onToggleSimulator && (
            <Button
              variant={showSimulator ? "primary" : "secondary"}
              size="sm"
              onClick={onToggleSimulator}
              className="cursor-pointer"
              title="Kalan maçlar için puan simülasyonunu aç / kapat"
            >
              <span>{showSimulator ? "Simülatörü Kapat" : "Puan Simülatörü"}</span>
            </Button>
          )}
          {items.length > 0 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowShareModal(true)}
                className="cursor-pointer"
                title="Puan durumu kartını PNG olarak indir veya paylaş"
                aria-label="Puan Durumu Kartı Paylaş"
              >
                <Share2 size={12} className="text-primary mr-1" />
                <span className="hidden sm:inline">Paylaş</span>
              </Button>
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
                <span className="hidden sm:inline">CSV İndir</span>
              </Button>
            </>
          )}
          <Badge tone="neutral" size="sm">
            {`${items.length} Takım`}
          </Badge>
        </div>
      </div>

      <ShareStandingsCardModal
        items={items}
        city={activeContext?.city || city}
        leagueTitle={activeContext?.leagueFullName || "Voleybol Ligi"}
        groupTitle={activeContext?.displayGroup}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  );
}
