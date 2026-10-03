"use client";

import React from "react";
import { Clock } from "lucide-react";
import type { Match } from "@/types/fixture";
import { formatDateTurkish } from "@/utils/calendar";
import type { MatchDay, MatchSection } from "@/utils/todayMatches";
import type { TodayDisplayMode } from "./TodayHeaderBar";
import { TodayTableSections } from "./TodayTableSections";

interface NextMatchDaySectionProps {
  nextMatchDay: MatchDay;
  displayMode: TodayDisplayMode;
  renderMatchCard: (m: Match) => React.ReactNode;
  nextGroupedSections: MatchSection[];
  favorites: string[];
  onToggleFavorite: (matchId: string) => void;
  city: string;
  onSelectMatch?: (match: Match) => void;
}

/** Akıllı Yedek Görünüm 1: Sıradaki En Yakın Maç Günü */
export function NextMatchDaySection({
  nextMatchDay,
  displayMode,
  renderMatchCard,
  nextGroupedSections,
  favorites,
  onToggleFavorite,
  city,
  onSelectMatch,
}: NextMatchDaySectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={14} className="text-sky-400" />
            <span>Sıradaki Maç Günü:</span>
            <span className="text-primary font-black">
              {formatDateTurkish(nextMatchDay.date)}
            </span>
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {nextMatchDay.matches.length} Karşılaşma
        </span>
      </div>


      {displayMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {nextMatchDay.matches.map((m) => renderMatchCard(m))}
        </div>
      ) : (
        <TodayTableSections
          sections={nextGroupedSections}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
          city={city}
          onSelectMatch={onSelectMatch}
        />
      )}
    </div>
  );
}
