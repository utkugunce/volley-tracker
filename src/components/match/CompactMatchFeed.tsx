"use client";

import React, { useState, useMemo, useRef } from "react";
import { Match } from "@/types/fixture";
import { DateNavigationRibbon, StatusFilterType } from "./DateNavigationRibbon";
import { LeagueSection } from "./LeagueSection";
import { MatchRowMode } from "./CompactMatchRow";
import { formatLeagueCategoryTitle } from "@/utils/grouping";
import { isMatchScored } from "@/context/MatchSelectionContext";
import { SearchX } from "lucide-react";

interface CompactMatchFeedProps {
  matches: Match[];
  selectedMatchId?: string | null;
  onSelectMatch?: (match: Match) => void;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  todayStr: string;
  yesterdayStr: string;
  city?: string;
  viewMode?: MatchRowMode;
  initialDate?: string;
  availableDates?: string[];
}

export const CompactMatchFeed: React.FC<CompactMatchFeedProps> = ({
  matches = [],
  selectedMatchId,
  onSelectMatch,
  favorites = [],
  onToggleFavorite,
  todayStr,
  city,
  viewMode = "today",
  initialDate,
  availableDates,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    initialDate ?? (viewMode === "today" ? todayStr || "all" : "all")
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>(() =>
    viewMode === "results" ? "finished" : viewMode === "fixtures" ? "upcoming" : "all"
  );
  const feedRef = useRef<HTMLDivElement>(null);

  const dateMatchCounts = useMemo(() => {
    const map: Record<string, number> = {};
    matches.forEach((m) => {
      if (!m.date) return;
      map[m.date] = (map[m.date] || 0) + 1;
    });
    return map;
  }, [matches]);

  const counts = useMemo(() => {
    let all = 0;
    let live = 0;
    let finished = 0;
    let upcoming = 0;

    matches.forEach((m) => {
      if (selectedDate !== "all" && m.date !== selectedDate) return;

      all += 1;
      if (m.status === "live") live += 1;
      else if (m.status === "finished" || isMatchScored(m)) finished += 1;
      else upcoming += 1;
    });

    return { all, live, finished, upcoming };
  }, [matches, selectedDate]);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (viewMode === "results" && !isMatchScored(m)) return false;
      if (selectedDate !== "all" && m.date !== selectedDate) {
        return false;
      }

      if (statusFilter === "live" && m.status !== "live") return false;
      if (statusFilter === "finished" && m.status !== "finished" && !isMatchScored(m)) return false;
      if (
        statusFilter === "upcoming" &&
        (m.status === "finished" || isMatchScored(m) || m.status === "live")
      )
        return false;

      return true;
    });
  }, [matches, selectedDate, statusFilter, viewMode]);

  const groupedByLeague = useMemo(() => {
    const map = new Map<string, { leagueTitle: string; cityName?: string; matches: Match[] }>();

    filteredMatches.forEach((m) => {
      const matchCity = m.city || city || "";
      const rawCategory = m.category || m.age_group || "Genel Lig";
      const leagueTitle = formatLeagueCategoryTitle(rawCategory, m.age_group, matchCity);
      const key = `${matchCity}::${leagueTitle}`;

      if (!map.has(key)) {
        map.set(key, {
          leagueTitle,
          cityName: matchCity,
          matches: [],
        });
      }
      map.get(key)!.matches.push(m);
    });

    const result = Array.from(map.values()).sort((a, b) => {
      if (a.cityName && b.cityName && a.cityName !== b.cityName) {
        return a.cityName.localeCompare(b.cityName, "tr");
      }
      return a.leagueTitle.localeCompare(b.leagueTitle, "tr");
    });

    result.forEach((g) => {
      g.matches.sort((m1, m2) => (m1.time || "").localeCompare(m2.time || ""));
    });

    return result;
  }, [filteredMatches, city]);

  const handleFeedKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, select, textarea") || !target.closest("[data-match-row]"))
      return;

    const rows = Array.from(feedRef.current?.querySelectorAll<HTMLElement>("[data-match-row]") || []);
    const focusedRow = target.closest<HTMLElement>("[data-match-row]");
    const selectedRowIndex = rows.findIndex((row) => row.dataset.matchId === selectedMatchId);
    const currentIndex =
      selectedRowIndex >= 0 ? selectedRowIndex : rows.findIndex((row) => row === focusedRow);
    const nextIndex = currentIndex + (event.key === "ArrowDown" ? 1 : -1);
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= rows.length) return;

    const nextMatchId = rows[nextIndex].dataset.matchId;
    const nextMatch = groupedByLeague
      .flatMap((league) => league.matches)
      .find((match) => match.id === nextMatchId);
    if (!nextMatch) return;

    event.preventDefault();
    onSelectMatch?.(nextMatch);
    rows[nextIndex].focus();
  };

  return (
    <div ref={feedRef} className="space-y-3" onKeyDown={handleFeedKeyDown}>
      <DateNavigationRibbon
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        todayStr={todayStr}
        statusFilter={statusFilter}
        onSelectStatusFilter={setStatusFilter}
        counts={counts}
        availableDates={availableDates}
        showStatusFilters={viewMode !== "results"}
        dateMatchCounts={dateMatchCounts}
      />

      {groupedByLeague.length > 0 ? (
        <div className="space-y-3 animate-in fade-in-50 duration-150">
          {groupedByLeague.map((g, idx) => (
            <LeagueSection
              key={`${g.cityName}-${g.leagueTitle}-${idx}`}
              leagueTitle={g.leagueTitle}
              cityName={g.cityName}
              matches={g.matches}
              selectedMatchId={selectedMatchId}
              onSelectMatch={onSelectMatch}
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
              mode={viewMode}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-surface border border-line/70 rounded-2xl p-6">
          <div className="w-11 h-11 rounded-xl bg-surface-muted border border-line/70 flex items-center justify-center mx-auto mb-3 text-ink-3">
            <SearchX size={20} />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">
            Seçilen Kriterlere Uygun Maç Bulunamadı
          </h3>
          <p className="text-xs text-ink-3 max-w-sm mx-auto mb-4">
            {selectedDate !== "all"
              ? `${selectedDate} tarihinde seçilen durum filtresine uygun karşılaşma kaydı bulunmuyor.`
              : "Bu kriterlere ait bültende maç bulunmamaktadır."}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedDate("all");
              setStatusFilter("all");
            }}
            className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-fg text-xs font-semibold transition-colors cursor-pointer"
          >
            Filtreleri Sıfırla (Tümünü Göster)
          </button>
        </div>
      )}
    </div>
  );
};
