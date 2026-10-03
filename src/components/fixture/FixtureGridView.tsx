"use client";

import React from "react";
import type { Match } from "@/types/fixture";
import { FixtureGridCard } from "./FixtureGridCard";

interface FixtureGridViewProps {
  visibleMatches: Match[];
  matches: Match[];
  hasMultipleGroups: boolean;
  favorites: string[];
  copiedId: string | null;
  effectiveCity: string | undefined;
  onToggleFavorite?: (id: string) => void;
  onSelectMatch?: (match: Match) => void;
  handleCopy: (e: React.MouseEvent, match: Match) => void;
  handleDownloadIcs: (e: React.MouseEvent, match: Match) => void;
}

/** Yayın Tarzı Grid Kart Görünümü (Broadcast Cards) */
export function FixtureGridView({
  visibleMatches,
  matches,
  hasMultipleGroups,
  favorites,
  copiedId,
  effectiveCity,
  onToggleFavorite,
  onSelectMatch,
  handleCopy,
  handleDownloadIcs,
}: FixtureGridViewProps) {
  return (
    <div className="p-3.5 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-950/40">
      {visibleMatches.map((match, idx) => (
        <FixtureGridCard
          key={match.id}
          match={match}
          idx={idx}
          matches={matches}
          hasMultipleGroups={hasMultipleGroups}
          favorites={favorites}
          copiedId={copiedId}
          effectiveCity={effectiveCity}
          onToggleFavorite={onToggleFavorite}
          onSelectMatch={onSelectMatch}
          handleCopy={handleCopy}
          handleDownloadIcs={handleDownloadIcs}
        />
      ))}
    </div>
  );
}
