"use client";

import React from "react";
import type { Match } from "@/types/fixture";
import { FixtureTable } from "@/components/FixtureTable";
import type { MatchSection } from "@/utils/todayMatches";

interface TodayTableSectionsProps {
  sections: MatchSection[];
  favorites: string[];
  onToggleFavorite: (matchId: string) => void;
  city: string;
  onSelectMatch?: (match: Match) => void;
}

/** Tablo Görünümü: lig / grup bölümleri başına bir FixtureTable. */
export function TodayTableSections({ sections, favorites, onToggleFavorite, city, onSelectMatch }: TodayTableSectionsProps) {
  return (
    <div className="space-y-4">
      {sections.map((sec, idx) => (
        <FixtureTable
          key={idx}
          title={sec.title}
          subTitle={sec.subTitle}
          matches={sec.matches}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
          city={city}
          onSelectMatch={onSelectMatch}
        />
      ))}
    </div>
  );
}
