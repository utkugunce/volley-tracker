"use client";

import React from "react";
import { Users, Search, ArrowRight } from "lucide-react";
import { TeamVolleyboxLink } from "@/components/TeamVolleyboxLink";
import Link from "next/link";
import { LeagueData, LeagueTeamSummary } from "@/utils/leagueData";

export interface LeagueTeamsTabProps {
  displayedTeams: LeagueTeamSummary[];
  league: LeagueData;
  setTeamSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  teamSearchQuery: string;
}

export function LeagueTeamsTab({
  displayedTeams,
  league,
  setTeamSearchQuery,
  teamSearchQuery,
}: LeagueTeamsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 bg-surface p-3.5 rounded-xl border border-line">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <h2 className="text-xs sm:text-sm font-bold text-ink">
            Mücadele Eden Kulüpler ({displayedTeams.length})
          </h2>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-ink-3" />
          <input
            type="text"
            placeholder="Kulüp adı ara..."
            value={teamSearchQuery}
            onChange={(e) => setTeamSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-muted border border-line text-xs text-ink placeholder-ink-3 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {displayedTeams.map((team) => (
          <div
            key={team.name}
            className="bg-surface border border-line hover:border-line-strong rounded-xl p-4 transition-colors flex flex-col justify-between gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <TeamVolleyboxLink
                  teamName={team.name}
                  category={league.category}
                  city={league.city}
                  className="font-bold text-ink text-sm hover:text-primary transition-colors block"
                />
                <span className="text-[11px] text-ink-3 mt-0.5 block">
                  {team.group || league.category}
                </span>
              </div>

              {team.rank && (
                <span className="text-xs font-mono font-bold text-ink-2 bg-surface-muted border border-line px-2 py-0.5 rounded-md shrink-0 tabular-nums">
                  #{team.rank}
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs py-2 bg-surface-muted rounded-lg border border-line">
              <div>
                <span className="text-[10px] text-ink-3 block">Maç</span>
                <strong className="text-ink font-mono tabular-nums">{team.played}</strong>
              </div>
              <div>
                <span className="text-[10px] text-ink-3 block">Galibiyet</span>
                <strong className="text-done font-mono tabular-nums">{team.won}</strong>
              </div>
              <div>
                <span className="text-[10px] text-ink-3 block">Mağlubiyet</span>
                <strong className="text-form-loss font-mono tabular-nums">{team.lost}</strong>
              </div>
              <div>
                <span className="text-[10px] text-ink-3 block">Puan</span>
                <strong className="text-ink font-mono tabular-nums">{team.points ?? "-"}</strong>
              </div>
            </div>

            <Link
              prefetch={false}
              href={`/takim/${team.slug}`}
              className="w-full py-2 px-3 rounded-lg bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border border-line text-xs font-bold transition-colors text-center flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Takım Profilini Aç</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
