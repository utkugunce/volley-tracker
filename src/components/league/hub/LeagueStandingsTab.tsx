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
  finishedSections: { title: string; subTitle: string; matches: Match[] }[];
  league: LeagueData;
  setActiveTab: React.Dispatch<React.SetStateAction<LeagueTabType>>;
  setSelectedMatch: React.Dispatch<React.SetStateAction<Match | null>>;
  toggleFavorite: (teamName: string) => void;
  upcomingSections: { title: string; subTitle: string; matches: Match[] }[];
}

export function LeagueStandingsTab({
  displayedFinishedMatches,
  displayedGroups,
  displayedUpcomingMatches,
  favorites,
  finishedSections,
  league,
  setActiveTab,
  setSelectedMatch,
  toggleFavorite,
  upcomingSections,
}: LeagueStandingsTabProps) {
  return (
    <div className="space-y-6">
      {displayedGroups.length === 0 ? (
        <div className="bg-surface border border-line rounded-xl p-8 text-center text-ink-3 text-sm">
          Bu gruba ait puan durumu tablosu bulunmuyor.
        </div>
      ) : (
        displayedGroups.map((grp) => (
          <div
            key={grp.groupName}
            className="bg-surface border border-line rounded-xl overflow-hidden"
          >
            <div className="bg-surface-muted px-4 py-3 flex items-center justify-between border-b border-line">
              <div className="flex items-center gap-2">
                <Trophy size={14} className="text-primary" />
                <h2 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-wide">
                  {grp.groupName} — PUAN DURUMU
                </h2>
              </div>
              <span className="text-xs text-ink-3 font-mono tabular-nums">
                {grp.table.length} Takım
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-line text-ink-3 text-[11px] bg-surface">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Takım</th>
                    <th className="py-2.5 px-2.5 text-center font-semibold">O</th>
                    <th className="py-2.5 px-2.5 text-center font-semibold text-done">G</th>
                    <th className="py-2.5 px-2.5 text-center font-semibold text-form-loss">M</th>
                    <th className="py-2.5 px-2.5 text-center font-semibold">AS</th>
                    <th className="py-2.5 px-2.5 text-center font-semibold">VS</th>
                    <th className="py-2.5 px-2.5 text-center font-semibold">SAV</th>
                    <th className="py-2.5 px-2.5 text-center font-bold text-ink bg-surface-muted">
                      Puan
                    </th>
                    <th className="py-2.5 px-3 text-center">Son 5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {grp.table.map((row, idx) => {
                    const rankNum = row.rank || idx + 1;
                    return (
                      <tr
                        key={row.team}
                        className="transition-colors hover:bg-surface-raised"
                      >
                        <td className="py-2.5 px-3 text-center font-mono tabular-nums">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold ${
                              rankNum === 1
                                ? "bg-primary/15 text-primary font-black"
                                : rankNum <= 3
                                ? "text-ink font-bold"
                                : "text-ink-3"
                            }`}
                          >
                            {rankNum}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <TeamVolleyboxLink
                              teamName={row.team}
                              category={league.category}
                              city={league.city}
                              className="font-semibold text-ink hover:text-primary transition-colors text-xs"
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono tabular-nums text-ink-2">
                          {row.played}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono tabular-nums text-done font-bold">
                          {row.won}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono tabular-nums text-form-loss font-bold">
                          {row.lost}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono tabular-nums text-ink-2">
                          {row.sets_won}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono tabular-nums text-ink-2">
                          {row.sets_lost}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono tabular-nums text-ink-3">
                          {row.set_ratio || "0"}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono tabular-nums font-black text-ink bg-surface-muted text-sm">
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
        <div className="space-y-4 pt-6 border-t border-line">
          <div className="flex items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-line">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-done" />
              <h2 className="text-xs sm:text-sm font-bold text-ink">
                Oynanan Maç Sonuçları ({displayedFinishedMatches.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("results")}
              className="text-xs text-ink-2 hover:text-ink font-semibold flex items-center gap-1 transition-colors cursor-pointer"
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
        <div className="space-y-4 pt-6 border-t border-line">
          <div className="flex items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-line">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-ink-2" />
              <h2 className="text-xs sm:text-sm font-bold text-ink">
                Fikstür & Gelecek Maç Programı ({displayedUpcomingMatches.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("fixtures")}
              className="text-xs text-ink-2 hover:text-ink font-semibold flex items-center gap-1 transition-colors cursor-pointer"
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
