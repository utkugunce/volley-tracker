"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, Trophy, ExternalLink } from "lucide-react";
import { Match } from "@/types/fixture";
import { CompactMatchRow } from "./CompactMatchRow";
import { slugify } from "@/utils/slugify";

interface LeagueSectionProps {
  leagueTitle: string;
  cityName?: string;
  matches: Match[];
  selectedMatchId?: string | null;
  onSelectMatch?: (match: Match) => void;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  defaultCollapsed?: boolean;
}

export const LeagueSection: React.FC<LeagueSectionProps> = ({
  leagueTitle,
  cityName,
  matches,
  selectedMatchId,
  onSelectMatch,
  favorites = [],
  onToggleFavorite,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const citySlug = cityName ? slugify(cityName) : "istanbul";
  const standingsUrl = `/puan-durumu/${citySlug}`;

  return (
    <div className="rounded-xl border border-[#2A2E3D] bg-[#181A20] overflow-hidden shadow-sm">
      {/* Lig Akordiyon Başlığı */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsCollapsed(!isCollapsed)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsCollapsed(!isCollapsed);
          }
        }}
        className="flex items-center justify-between px-3 py-2 bg-[#1E222D] hover:bg-[#242936] transition-colors cursor-pointer select-none border-b border-[#2A2E3D]/80"
      >
        <div className="flex items-center gap-2 truncate pr-2">
          <ChevronDown
            size={14}
            className={`text-[#94A3B8] shrink-0 transform transition-transform duration-200 ${
              isCollapsed ? "-rotate-90" : "rotate-0"
            }`}
          />
          <h3 className="text-xs font-bold text-white uppercase tracking-wide truncate">
            {cityName ? `${cityName.toUpperCase()} - ` : ""}
            {leagueTitle}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[10px] font-semibold text-blue-400 bg-[#121212] px-2 py-0.5 rounded border border-[#2A2E3D]">
            {matches.length} Maç
          </span>

          <Link
            href={standingsUrl}
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded text-[#94A3B8] hover:text-amber-400 hover:bg-[#121212] transition-colors"
            title="Puan Durumunu Gör"
          >
            <Trophy size={13} />
          </Link>
        </div>
      </div>

      {/* Maç Satırları */}
      {!isCollapsed && (
        <div className="divide-y divide-[#2A2E3D]/40">
          {matches.map((m) => (
            <CompactMatchRow
              key={m.id}
              match={m}
              isSelected={selectedMatchId === m.id || selectedMatchId === m.match_no}
              onSelect={onSelectMatch}
              isFavorite={favorites.includes(m.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};
