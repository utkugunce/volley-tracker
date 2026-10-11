"use client";

import React, { useMemo, useState } from "react";
import { Clock, ChevronDown } from "lucide-react";
import { Kadinlar2LigMatch } from "@/types/kadinlar2Lig";
import { Match } from "@/types/fixture";
import { CompactMatchRow } from "@/components/match/CompactMatchRow";
import {
  convertK2MatchToMatch,
  isKadinlar2LigMatchFavorite,
  normalizeK2Date,
} from "@/utils/kadinlar2LigConverter";
import { compareMatchTimes, formatDateTurkish } from "@/utils/calendar";

interface Kadinlar2LigTimeViewProps {
  matches: Kadinlar2LigMatch[];
  onSelectMatch: (match: Match) => void;
  selectedMatchId?: string | null;
  isFavorite: (teamName: string) => boolean;
  onToggleFavorite: (matchId: string) => void;
  selectedDate: string;
}

/**
 * Bir güne ait maçları saatine göre yukarıdan aşağıya (erken saatten geç saate) sıralar.
 * Aynı saatteki maçlar için grup numarası ve maç numarası ikincil kriterdir.
 */
export function sortMatchesByTime(matches: Kadinlar2LigMatch[]): Kadinlar2LigMatch[] {
  return [...matches].sort((a, b) => {
    const timeDiff = compareMatchTimes(a.saat, b.saat);
    if (timeDiff !== 0) return timeDiff;

    const g1 = a.grup_no ?? 999;
    const g2 = b.grup_no ?? 999;
    if (g1 !== g2) return g1 - g2;

    return (a.mac_no || "").localeCompare(b.mac_no || "");
  });
}

export const Kadinlar2LigTimeView: React.FC<Kadinlar2LigTimeViewProps> = ({
  matches,
  onSelectMatch,
  selectedMatchId,
  isFavorite,
  onToggleFavorite,
  selectedDate,
}) => {
  // Akordiyon durumları (gün bazında kapatıp açabilme)
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});

  const toggleDateCollapse = (dateKey: string) => {
    setCollapsedDates((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }));
  };

  // Günlere göre gruplama ve her günün maçlarını saatine göre yukarıdan aşağıya sıralama
  const groupedByDate = useMemo(() => {
    const map = new Map<string, Kadinlar2LigMatch[]>();

    matches.forEach((m) => {
      const dateKey = normalizeK2Date(m.tarih) || "TBD";
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(m);
    });

    // Günleri sırala: En yeni günden en eskiye
    const sortedEntries = Array.from(map.entries()).sort((a, b) => {
      if (a[0] === "TBD") return 1;
      if (b[0] === "TBD") return -1;
      return b[0].localeCompare(a[0]);
    });

    // Her günün kendi içindeki maçlarını saatine göre yukarıdan aşağıya sırala
    return sortedEntries.map(([dateKey, dayMatches]) => {
      return {
        dateKey,
        matches: sortMatchesByTime(dayMatches),
      };
    });
  }, [matches]);

  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {groupedByDate.map(({ dateKey, matches: dayMatches }) => {
        const isCollapsed = Boolean(collapsedDates[dateKey]);
        const formattedTitle = formatDateTurkish(dateKey) || dateKey;

        return (
          <div
            key={dateKey}
            className="rounded-xl border border-line bg-surface-muted overflow-hidden shadow-sm"
            style={{ contentVisibility: "auto", containIntrinsicSize: "auto 320px" }}
          >
            {/* Gün ve Saat Başlığı (Grup görünümü / LeagueSection ile birebir aynı tasarım) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggleDateCollapse(dateKey)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleDateCollapse(dateKey);
                }
              }}
              className="flex items-center justify-between px-3 py-2 bg-panel hover:bg-panel transition-colors cursor-pointer select-none border-b border-line/80"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                <ChevronDown
                  size={14}
                  className={`text-ink-2 shrink-0 transform transition-transform duration-200 ${
                    isCollapsed ? "-rotate-90" : "rotate-0"
                  }`}
                />
                <Clock size={13} className="text-emerald-400 shrink-0" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="shrink-0 text-emerald-400">Kadınlar 2. Ligi</span>
                  <span className="text-ink-2 font-semibold truncate">
                    · {formattedTitle} · Saate Göre Sıralı
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[10px] font-semibold text-blue-400 bg-canvas px-2 py-0.5 rounded border border-line">
                  {dayMatches.length} Maç
                </span>
              </div>
            </div>

            {/* Maç Satırları (Grup görünümü ile aynı CompactMatchRow satırları) */}
            {!isCollapsed && (
              <div className="divide-y divide-line/40">
                {dayMatches.map((m) => {
                  const match = convertK2MatchToMatch(m);
                  return (
                    <CompactMatchRow
                      key={m.id}
                      match={match}
                      isSelected={selectedMatchId === m.id || selectedMatchId === m.mac_no}
                      onSelect={onSelectMatch}
                      isFavorite={isKadinlar2LigMatchFavorite(m, isFavorite)}
                      onToggleFavorite={() => onToggleFavorite(m.id)}
                      mode="results"
                      showGroupBadge={true}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
