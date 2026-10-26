"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Match } from "@/types/fixture";
import { TeamBadge } from "./TeamBadge";
import {
  Star,
  ChevronRight,
  X,
} from "lucide-react";
import { slugify } from "@/utils/slugify";
import { getVolleyboxMapping } from "@/utils/volleybox";
import { triggerHaptic } from "@/utils/haptics";
import { trLower, trIncludes } from "@/utils/turkishLocale";

interface PrimaryTeamWidgetProps {
  matches: Match[];
  city?: string;
  onSelectMatch?: (match: Match) => void;
  availableTeams?: string[];
}

export const PrimaryTeamWidget: React.FC<PrimaryTeamWidgetProps> = ({
  matches = [],
  city = "İstanbul",
  onSelectMatch,
  availableTeams = [],
}) => {
  const [primaryTeam, setPrimaryTeam] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tvf_primary_team");
      if (saved) {
        setPrimaryTeam(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSetPrimaryTeam = (teamName: string | null) => {
    triggerHaptic("success");
    setPrimaryTeam(teamName);
    setIsPicking(false);
    try {
      if (teamName) {
        localStorage.setItem("tvf_primary_team", teamName);
      } else {
        localStorage.removeItem("tvf_primary_team");
      }
    } catch {
      // ignore
    }
  };

  const teamMatches = useMemo(() => {
    if (!primaryTeam) return [];
    const lower = trLower(primaryTeam).trim();
    return matches.filter(
      (m) =>
        trLower(m.home_team).trim() === lower ||
        trLower(m.away_team).trim() === lower
    );
  }, [matches, primaryTeam]);

  const seasonRecord = useMemo(() => {
    if (!primaryTeam) return { wins: 0, losses: 0 };
    const lower = trLower(primaryTeam).trim();
    let wins = 0;
    let losses = 0;
    teamMatches.forEach((m) => {
      if (m.status === "finished" || (m.home_score !== null && m.home_score !== undefined && m.away_score !== null && m.away_score !== undefined)) {
        const isHome = trLower(m.home_team).trim() === lower;
        const h = m.home_score ?? 0;
        const a = m.away_score ?? 0;
        if ((isHome && h > a) || (!isHome && a > h)) wins += 1;
        else if (h !== a) losses += 1;
      }
    });
    return { wins, losses };
  }, [teamMatches, primaryTeam]);

  const nextMatch = useMemo(() => {
    return teamMatches.find(
      (m) => m.status !== "finished" && m.date && m.date !== "TBD"
    );
  }, [teamMatches]);

  const candidateTeams = useMemo(() => {
    const list =
      availableTeams.length > 0
        ? availableTeams
        : Array.from(new Set(matches.flatMap((m) => [m.home_team, m.away_team]))).filter(
            Boolean
          );
    list.sort((a, b) => a.localeCompare(b, "tr"));
    if (!searchQuery.trim()) return list.slice(0, 24);
    const q = trLower(searchQuery).trim();
    return list.filter((t) => trIncludes(t, q)).slice(0, 24);
  }, [availableTeams, matches, searchQuery]);

  if (!primaryTeam) {
    if (isDismissed) return null;
    return (
      <div className="bg-surface border border-line/70 rounded-xl px-3.5 py-2 flex items-center justify-between gap-2 text-xs transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <Star size={13} className="text-amber-400 fill-amber-400/20 shrink-0" />
          <span className="font-semibold text-white text-[11px] shrink-0">
            Kulübünüzü Takip Edin
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsPicking(true)}
            className="text-[11px] font-semibold text-primary hover:underline underline-offset-2 cursor-pointer transition-colors"
          >
            Kulüp Seç
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-ink-3 hover:text-ink p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md cursor-pointer"
            title="Kapat"
            aria-label="Davet çubuğunu kapat"
          >
            <X size={13} />
          </button>
        </div>

        {isPicking && (
          <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setIsPicking(false)}
          >
            <div
              className="bg-surface border border-line rounded-2xl p-4 max-w-md w-full shadow-2xl space-y-3 max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-line/70 pb-2">
                <h3 className="text-xs font-semibold text-white flex items-center gap-1.5 uppercase tracking-wide">
                  <Star size={13} className="text-amber-400 fill-amber-400" />
                  <span>Favori Kulübünüzü Seçin</span>
                </h3>
                <button
                  onClick={() => setIsPicking(false)}
                  className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md text-ink-3 hover:text-white cursor-pointer"
                  aria-label="Modalı kapat"
                >
                  <X size={14} />
                </button>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kulüp adı ara (örn: Fenerbahçe, VakıfBank, Zeren)..."
                className="w-full bg-surface-muted border border-line/70 rounded-xl px-3 py-2 text-xs text-white placeholder-ink-3 focus:outline-none focus:border-primary/50"
                autoFocus
              />

              <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-[200px]">
                {candidateTeams.map((team) => {
                  const mapping = getVolleyboxMapping(team, undefined, undefined, city);
                  const logo = mapping?.local_logo || mapping?.logo_url;
                  return (
                    <button
                      key={team}
                      onClick={() => handleSetPrimaryTeam(team)}
                      className="w-full text-left p-2 rounded-xl bg-surface-muted/50 hover:bg-surface-muted border border-line/60 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <TeamBadge name={team} logoUrl={logo} size="xs" />
                      <span className="text-xs font-semibold text-ink truncate flex-1">
                        {team}
                      </span>
                      <ChevronRight size={12} className="text-ink-3" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const mapping = getVolleyboxMapping(primaryTeam, undefined, undefined, city);
  const teamLogo = mapping?.local_logo || mapping?.logo_url;
  const teamSlug = slugify(mapping?.matched_as || primaryTeam);

  const opponent = nextMatch
    ? trLower(nextMatch.home_team) === trLower(primaryTeam)
      ? nextMatch.away_team
      : nextMatch.home_team
    : null;
  const opponentMapping = opponent ? getVolleyboxMapping(opponent, undefined, undefined, city) : null;
  const opponentLogo = opponentMapping?.local_logo || opponentMapping?.logo_url;

  return (
    <div className="bg-surface border border-line/70 rounded-xl px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
      {/* Sol: Kulüp Bilgisi + Sezon Karnesi */}
      <div className="flex items-center gap-2.5 min-w-0">
        <TeamBadge name={primaryTeam} logoUrl={teamLogo} size="xs" />
        <div className="min-w-0 flex items-center gap-2 flex-wrap">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-primary/15 text-primary">
            Kulübüm
          </span>
          <Link
            prefetch={false}
            href={`/takim/${teamSlug}`}
            className="font-semibold text-white hover:text-primary transition-colors truncate"
          >
            {primaryTeam}
          </Link>
          {(seasonRecord.wins > 0 || seasonRecord.losses > 0) && (
            <span className="font-mono tabular-nums text-[10px] text-ink-3">
              ({seasonRecord.wins}G - {seasonRecord.losses}M)
            </span>
          )}
        </div>
      </div>

      {/* Orta / Sağ: Sıradaki Maç Özeti */}
      {nextMatch ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectMatch?.(nextMatch)}
          className="flex items-center gap-2 cursor-pointer hover:bg-surface-muted transition-colors bg-surface-muted/60 border border-line/60 px-2.5 py-1 rounded-lg self-start sm:self-auto"
        >
          <span className="text-[10px] font-semibold text-ink-3 uppercase">Sıradaki:</span>
          {opponent && <TeamBadge name={opponent} logoUrl={opponentLogo} size="xs" />}
          <span className="font-semibold text-white truncate max-w-[140px]">vs {opponent}</span>
          <span className="text-[10px] text-ink-3 font-mono tabular-nums">
            {nextMatch.date} {nextMatch.time}
          </span>
          <ChevronRight size={11} className="text-ink-3" />
        </div>
      ) : (
        <div className="text-[11px] text-ink-3 font-medium">
          Bekleyen maç bulunmuyor
        </div>
      )}

      {/* Sağ: İptal / Değiştir */}
      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button
          onClick={() => handleSetPrimaryTeam(null)}
          className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md text-ink-3 hover:text-ink transition-colors cursor-pointer"
          title="Kulüp seçimini kaldır"
          aria-label="Kulüp seçimini kaldır"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
