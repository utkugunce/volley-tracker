"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, Trophy } from "lucide-react";
import { Match } from "@/types/fixture";
import { CompactMatchRow, MatchRowMode } from "./CompactMatchRow";
import { LeagueVolleyboxLink } from "@/components/LeagueVolleyboxLink";
import { slugify } from "@/utils/slugify";

interface LeagueSectionProps {
  leagueTitle: string;
  sectionLabel?: string;
  cityName?: string;
  standingsHref?: string;
  matches: Match[];
  selectedMatchId?: string | null;
  onSelectMatch?: (match: Match) => void;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  defaultCollapsed?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  mode?: MatchRowMode;
}

export const LeagueSection: React.FC<LeagueSectionProps> = ({
  leagueTitle,
  sectionLabel,
  cityName,
  standingsHref,
  matches,
  selectedMatchId,
  onSelectMatch,
  favorites = [],
  onToggleFavorite,
  defaultCollapsed = false,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  mode = "today",
}) => {
  const [localCollapsed, setLocalCollapsed] = useState(defaultCollapsed);
  const isCollapsed = controlledCollapsed ?? localCollapsed;
  const toggleCollapsed = () => {
    if (onToggleCollapse) onToggleCollapse();
    else setLocalCollapsed((collapsed) => !collapsed);
  };

  const citySlug = cityName ? slugify(cityName) : "istanbul";
  const standingsUrl = standingsHref || `/puan-durumu/${citySlug}`;

  return (
    <div
      className="rounded-xl border border-line bg-surface-muted overflow-hidden shadow-sm"
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 320px" }}
    >
      {/* Lig Akordiyon Başlığı */}
      <div
        role="button"
        tabIndex={0}
        onClick={toggleCollapsed}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleCollapsed();
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
          <h3 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5 min-w-0 flex-1">
            {cityName && <span className="shrink-0">{cityName.toUpperCase()} -</span>}
            <LeagueVolleyboxLink
              league={leagueTitle}
              city={cityName}
              className="text-xs font-bold text-white hover:text-amber-400"
            >
              {leagueTitle}
            </LeagueVolleyboxLink>
            {sectionLabel && <span className="text-ink-2 font-semibold shrink-0"> · {sectionLabel}</span>}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[10px] font-semibold text-blue-400 bg-canvas px-2 py-0.5 rounded border border-line">
            {matches.length} Maç
          </span>

          <Link
            href={standingsUrl}
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded text-ink-2 hover:text-amber-400 hover:bg-canvas transition-colors"
            title="Puan Durumunu Gör"
          >
            <Trophy size={13} />
          </Link>
        </div>
      </div>

      {/* Maç Satırları */}
      {!isCollapsed && (
        <div className="divide-y divide-line/40">
          {matches.map((m) => (
            <CompactMatchRow
              key={m.id}
              match={m}
              isSelected={selectedMatchId === m.id || selectedMatchId === m.match_no}
              onSelect={onSelectMatch}
              isFavorite={favorites.includes(m.id)}
              onToggleFavorite={onToggleFavorite}
              mode={mode}
            />
          ))}
        </div>
      )}
    </div>
  );
};
