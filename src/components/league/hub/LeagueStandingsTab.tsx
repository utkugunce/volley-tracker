"use client";

import React from "react";
import type { LeagueTabType } from "./types";
import { Trophy, CheckCircle2, ArrowRight, Calendar } from "lucide-react";
import { TeamVolleyboxLink } from "@/components/TeamVolleyboxLink";
import { FixtureTable } from "@/components/FixtureTable";
import { Match } from "@/types/fixture";
import { LeagueData, LeagueGroupStanding } from "@/utils/leagueData";

export interface LeagueStandingsTabProps {
  displayedFinishedMatches: Match[];
  displayedGroups: LeagueGroupStanding[];
  displayedUpcomingMatches: Match[];
  favorites: string[];
  finishedSections: { title: string; subTitle: string; matches: Match[]; }[];
  league: LeagueData;
  setActiveTab: React.Dispatch<React.SetStateAction<LeagueTabType>>;
  setSelectedMatch: React.Dispatch<React.SetStateAction<Match | null>>;
  toggleFavorite: (teamName: string) => void;
  upcomingSections: { title: string; subTitle: string; matches: Match[]; }[];
}

export function LeagueStandingsTab({ displayedFinishedMatches, displayedGroups, displayedUpcomingMatches, favorites, finishedSections, league, setActiveTab, setSelectedMatch, toggleFavorite, upcomingSections }: LeagueStandingsTabProps) {
  return (
    <div className="space-y-6">
      {displayedGroups.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-400 text-sm">
          Bu gruba ait puan durumu tablosu bulunmuyor.
        </div>
      ) : (
        displayedGroups.map((grp) => (
          <div
            key={grp.groupName}
            className="glass-panel border border-slate-800/80 rounded-2xl overflow-hidden shadow-card"
          >
            <div className="bg-gradient-to-r from-slate-900/90 via-surface-muted/90 to-slate-900/90 px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                  <Trophy size={14} />
                </div>
                <h2 className="text-sm font-extrabold text-white tracking-wide">
                  {grp.groupName} - PUAN DURUMU
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {grp.table.length} Takım
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-700/80 text-slate-400 text-[11px] bg-slate-900/40">
                    <th className="py-2.5 px-3 w-10 text-center">Sıra</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Takım</th>
                    <th className="py-2.5 px-2.5 text-center font-semibold">O</th>
                    <th className="py-2.5 px-2.5 text-center font-semibold text-emerald-400">G</th>
                    <th className="py-2.5 px-2.5 text-center font-semibold text-form-loss">M</th>
                    <th className="py-2.5 px-2.5 text-center font-semibold">AS</th>
                    <th className="py-2.5 px-2.5 text-center font-semibold">VS</th>
                    <th className="py-2.5 px-2.5 text-center font-semibold">SAV</th>
                    <th className="py-2.5 px-2.5 text-center font-bold text-white bg-slate-800/60">
                      Puan
                    </th>
                    <th className="py-2.5 px-3 text-center">Son 5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {grp.table.map((row, idx) => {
                    const isTop = row.rank === 1;
                    return (
                      <tr
                        key={row.team}
                        className={`transition-colors hover:bg-slate-800/50 ${
                          isTop ? "bg-amber-500/5" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-bold ${
                              row.rank === 1
                                ? "bg-amber-500 text-black font-black"
                                : row.rank === 2
                                ? "bg-slate-300 text-black font-black"
                                : row.rank === 3
                                ? "bg-amber-700 text-white font-bold"
                                : "text-slate-400"
                            }`}
                          >
                            {row.rank || idx + 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <TeamVolleyboxLink
                              teamName={row.team}
                              category={league.category}
                              city={league.city}
                              className="font-bold text-white hover:text-ink transition-colors text-xs"
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono text-slate-300">{row.played}</td>
                        <td className="py-2.5 px-2.5 text-center font-mono text-emerald-400 font-bold">
                          {row.won}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono text-form-loss font-bold">
                          {row.lost}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono text-slate-300">{row.sets_won}</td>
                        <td className="py-2.5 px-2.5 text-center font-mono text-slate-300">{row.sets_lost}</td>
                        <td className="py-2.5 px-2.5 text-center font-mono text-slate-400">
                          {row.set_ratio || "0"}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono font-black text-white bg-slate-800/50 text-sm">
                          {row.points}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {(row.form || []).slice(-5).map((f, fIdx) => (
                              <span
                                key={fIdx}
                                className={`w-4 h-4 rounded text-[9px] font-black inline-flex items-center justify-center ${
                                  f === "W"
                                    ? "bg-transparent text-done border border-done"
                                    : "bg-transparent text-form-loss border border-form-loss"
                                }`}
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
      {/* PUAN DURUMU ALTINDA: OYNANAN MAÇ SONUÇLARI */}
      {finishedSections.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <h2 className="text-sm font-bold text-white">
                Oynanan Maç Sonuçları ({displayedFinishedMatches.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("results")}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Tüm Sonuçlar</span>
              <ArrowRight size={13} />
            </button>
          </div>
          <div className="space-y-4">
            {finishedSections.map((sec, idx) => (
              <FixtureTable
                key={`standings-res-${sec.title}-${sec.subTitle}-${idx}`}
                title={sec.title}
                subTitle={sec.subTitle}
                matches={sec.matches}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                city={league.city}
                showCityBadge={false}
                onSelectMatch={setSelectedMatch}
              />
            ))}
          </div>
        </div>
      )}

      {/* PUAN DURUMU ALTINDA: FİKSTÜR & GELECEK MAÇ PROGRAMI */}
      {upcomingSections.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-ink-2" />
              <h2 className="text-sm font-bold text-white">
                Fikstür & Gelecek Maç Programı ({displayedUpcomingMatches.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("fixtures")}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Tüm Fikstür</span>
              <ArrowRight size={13} />
            </button>
          </div>
          <div className="space-y-4">
            {upcomingSections.map((sec, idx) => (
              <FixtureTable
                key={`standings-fixt-${sec.title}-${sec.subTitle}-${idx}`}
                title={sec.title}
                subTitle={sec.subTitle}
                matches={sec.matches}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                city={league.city}
                showCityBadge={false}
                onSelectMatch={setSelectedMatch}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
