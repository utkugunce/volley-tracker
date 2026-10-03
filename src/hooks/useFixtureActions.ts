import React, { useState } from "react";
import type { Match } from "@/types/fixture";
import { generateMatchIcs, generateSeasonIcs, downloadIcsFile } from "@/utils/ics";
import { buildMatchCopyText } from "@/utils/fixtureTable";

/**
 * Satır işlemleri: maç detayını panoya kopyalama (2 sn "kopyalandı" durumu),
 * tek maçı .ics olarak indirme ve favori maçları .ics olarak indirme.
 */
export function useFixtureActions(
  matches: Match[],
  favorites: string[],
  effectiveCity: string | undefined,
  city: string
) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, match: Match) => {
    e.stopPropagation();
    const text = buildMatchCopyText(match, effectiveCity || city);
    navigator.clipboard.writeText(text);
    setCopiedId(match.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadIcs = (e: React.MouseEvent, match: Match) => {
    e.stopPropagation();
    if (!match.date || match.date === "TBD") {
      alert("Bu maçın tarihi henüz TVF tarafından açıklanmadığı için takvime eklenemez.");
      return;
    }
    const ics = generateMatchIcs(match);
    if (ics) {
      downloadIcsFile(`mac-${match.home_team}-${match.away_team}-${match.date}.ics`, ics);
    }
  };

  const handleDownloadFavoritesIcs = (e: React.MouseEvent) => {
    e.stopPropagation();
    const favMatches = matches.filter((m) => favorites.includes(m.id) && m.date && m.date !== "TBD");
    if (favMatches.length === 0) {
      alert("Takvime eklenebilecek favori maç bulunamadı.");
      return;
    }
    const ics = generateSeasonIcs(favMatches, "Favori Maçlarım Takvimi");
    downloadIcsFile("favori-maclarim.ics", ics);
  };

  return { copiedId, handleCopy, handleDownloadIcs, handleDownloadFavoritesIcs };
}
