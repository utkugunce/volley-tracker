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

export function LeagueTeamsTab({ displayedTeams, league, setTeamSearchQuery, teamSearchQuery }: LeagueTeamsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-sky-400" />
          <h2 className="text-sm font-bold text-white">
            Mücadele Eden Kulüpler ({displayedTeams.length})
          </h2>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Kulüp adı ara..."
            value={teamSearchQuery}
            onChange={(e) => setTeamSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {displayedTeams.map((team) => (
          <div
            key={team.name}
            className="glass-panel border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between gap-3 group"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <TeamVolleyboxLink
                  teamName={team.name}
                  category={league.category}
                  city={league.city}
                  className="font-black text-white text-sm hover:text-ink transition-colors block"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {team.group || league.category}
                </span>
              </div>

              {team.rank && (
                <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg shrink-0">
                  #{team.rank}
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs py-2 bg-slate-900/60 rounded-xl border border-slate-800/60">
              <div>
                <span className="text-[10px] text-slate-500 block">Maç</span>
                <strong className="text-white font-mono">{team.played}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Galibiyet</span>
                <strong className="text-emerald-400 font-mono">{team.won}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Mağlubiyet</span>
                <strong className="text-form-loss font-mono">{team.lost}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Puan</span>
                <strong className="text-amber-300 font-mono">{team.points ?? "-"}</strong>
              </div>
            </div>

            <Link prefetch={false}
              href={`/takim/${team.slug}`}
              className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
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
