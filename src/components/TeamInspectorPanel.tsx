"use client";

import React, { useMemo } from "react";
import { Calendar, MapPin, Trophy, X } from "lucide-react";
import { Match, StandingItem } from "@/types/fixture";
import { TeamBadge } from "@/components/TeamBadge";
import { getVolleyboxMapping } from "@/utils/volleybox";
import { formatGroupName } from "@/utils/grouping";
import { trLower, trIncludes } from "@/utils/turkishLocale";
import { StandingsTeamContext } from "./StandingsTable";

interface TeamInspectorPanelProps {
  team: StandingItem | null;
  context: StandingsTeamContext | null;
  matches: Match[];
  onClose?: () => void;
}

export const TeamInspectorPanel: React.FC<TeamInspectorPanelProps> = ({
  team,
  context,
  matches,
  onClose,
}) => {
  const teamMatches = useMemo(() => {
    if (!team) return [];
    const teamName = trLower(team.team.trim());
    return matches.filter((match) => {
      const belongsToTeam = trLower(match.home_team.trim()) === teamName || trLower(match.away_team.trim()) === teamName;
      if (!belongsToTeam) return false;
      if (context?.leagueName && !trIncludes(match.category, context.leagueName) && !trIncludes(context.leagueName, match.category)) {
        return false;
      }
      if (
        context?.groupName &&
        context.groupName !== "Genel" &&
        !trIncludes(formatGroupName(match.group), context.groupName) &&
        !trIncludes(context.groupName, formatGroupName(match.group))
      ) {
        return false;
      }
      return true;
    });
  }, [team, context, matches]);

  if (!team) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <Trophy size={26} className="mb-3 text-amber-400" />
        <h2 className="text-sm font-bold text-white">Takım seçin</h2>
        <p className="mt-1 max-w-[220px] text-xs text-slate-400">
          Seçilen grubun formunu ve kalan maçlarını incelemek için puan tablosundan bir takım seçin.
        </p>
      </div>
    );
  }

  const mapping = getVolleyboxMapping(team.team, context?.leagueName, undefined, context?.city);
  const isHomeTeam = (match: Match) => trLower(match.home_team.trim()) === trLower(team.team.trim());
  const scoredMatches = teamMatches.filter((match) => match.home_score !== null && match.home_score !== undefined && match.away_score !== null && match.away_score !== undefined);
  const homeMatches = scoredMatches.filter(isHomeTeam);
  const awayMatches = scoredMatches.filter((match) => !isHomeTeam(match));
  const homeWins = homeMatches.filter((match) => (match.home_score ?? 0) > (match.away_score ?? 0)).length;
  const awayWins = awayMatches.filter((match) => (match.away_score ?? 0) > (match.home_score ?? 0)).length;
  const upcomingMatches = teamMatches
    .filter((match) => match.status === "upcoming")
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .slice(0, 5);

  return (
    <div className="flex h-full flex-col bg-canvas text-xs">
      <div className="flex shrink-0 items-center justify-between border-b border-line bg-panel/90 px-3.5 py-2.5">
        <span className="truncate font-bold text-white">Takım İnceleme</span>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-surface-muted hover:text-white">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
        <section className="flex items-center gap-3 rounded-xl border border-line bg-surface-muted p-3">
          <TeamBadge name={team.team} logoUrl={mapping?.local_logo || mapping?.logo_url} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold text-white">{team.team}</h2>
            <p className="mt-0.5 truncate text-[10px] text-slate-400">{mapping?.matched_as || context?.city || "TVF altyapı ligi"}</p>
            <p className="mt-1 text-[10px] font-semibold text-emerald-400">{context?.leagueName} · {context?.groupName}</p>
          </div>
          <span className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-mono text-sm font-black text-amber-300">
            #{team.rank}
          </span>
        </section>

        {mapping?.volleybox_url && (
          <a href={mapping.volleybox_url} target="_blank" rel="noopener noreferrer" className="block truncate rounded-lg border border-line bg-surface-muted px-3 py-2 text-[11px] font-semibold text-sky-400 transition-colors hover:text-sky-300">
            {mapping.matched_as} kulüp profili ↗
          </a>
        )}

        <section className="rounded-xl border border-line bg-surface-muted p-3">
          <h3 className="mb-2 font-bold text-white">İç Saha / Deplasman</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-panel p-2">
              <span className="block text-[10px] text-slate-400">İç saha galibiyeti</span>
              <strong className="mt-1 block font-mono text-sm text-emerald-400">{homeWins} / {homeMatches.length}</strong>
            </div>
            <div className="rounded-lg bg-panel p-2">
              <span className="block text-[10px] text-slate-400">Deplasman galibiyeti</span>
              <strong className="mt-1 block font-mono text-sm text-emerald-400">{awayWins} / {awayMatches.length}</strong>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400">
            <span>Son 5 form</span>
            <div className="ml-auto flex items-center gap-1">
              {(team.form || []).slice(-5).map((result, index) => (
                <span key={`${result}-${index}`} className={`flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold bg-transparent border ${result === "W" ? "text-done border-done" : "text-form-loss border-form-loss"}`}>
                  {result === "W" ? "G" : "M"}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-surface-muted p-3">
          <div className="mb-2 flex items-center gap-1.5 font-bold text-white">
            <Calendar size={13} className="text-sky-400" />
            <h3>Kalan Maçlar</h3>
          </div>
          {upcomingMatches.length ? (
            <div className="divide-y divide-line/70">
              {upcomingMatches.map((match) => {
                const isHome = isHomeTeam(match);
                return (
                  <div key={match.id} className="py-2 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <span>{match.date}</span><span>·</span><span>{match.time || "Saat açıklanmadı"}</span>
                    </div>
                    <div className="mt-1 truncate font-semibold text-slate-200">{isHome ? "vs" : "@"} {isHome ? match.away_team : match.home_team}</div>
                    <div className="mt-1 flex items-center gap-1 truncate text-[10px] text-slate-500"><MapPin size={10} />{match.hall || "Salon açıklanmadı"}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-slate-500">Bu grupta açıklanmış gelecek maç bulunmuyor.</p>
          )}
        </section>
      </div>
    </div>
  );
};