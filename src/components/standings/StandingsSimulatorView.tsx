"use client";

import React, { useState, useMemo } from "react";
import type { Match, StandingItem } from "@/types/fixture";
import { TeamBadge } from "@/components/TeamBadge";
import {
  simulateAltyapiStandings,
  type SimulationScore,
  type SimulatedStandingRow,
} from "@/utils/standingsSimulator";
import { Calculator, RotateCcw, ChevronUp, ChevronDown, Check, Sparkles, X } from "lucide-react";

interface StandingsSimulatorViewProps {
  mode?: "altyapi";
  altyapiRows?: StandingItem[];
  altyapiMatches?: Match[];
  cutoff?: number;
  onClose?: () => void;
}

const SCORES: SimulationScore[] = ["3-0", "3-1", "3-2", "2-3", "1-3", "0-3"];

export const StandingsSimulatorView: React.FC<StandingsSimulatorViewProps> = ({
  altyapiRows = [],
  altyapiMatches = [],
  cutoff = 4,
  onClose,
}) => {
  const [simulations, setSimulations] = useState<Record<string, SimulationScore>>({});

  // Kalan oynanmamış maçlar
  const upcomingMatches = useMemo(() => {
    const teamSet = new Set(altyapiRows.map((r) => r.team.trim()));
    return altyapiMatches.filter(
      (m) =>
        m.status !== "finished" &&
        (!m.score || m.score === "- : -" || m.score.toLowerCase() === "vs") &&
        teamSet.has(m.home_team.trim()) &&
        teamSet.has(m.away_team.trim())
    );
  }, [altyapiRows, altyapiMatches]);

  const simulatedRows: SimulatedStandingRow[] = useMemo(() => {
    return simulateAltyapiStandings(altyapiRows, simulations, upcomingMatches);
  }, [altyapiRows, simulations, upcomingMatches]);

  const handleSetScore = (matchId: string, score: SimulationScore) => {
    setSimulations((prev) => {
      if (prev[matchId] === score) {
        const next = { ...prev };
        delete next[matchId];
        return next;
      }
      return { ...prev, [matchId]: score };
    });
  };

  const handleReset = () => {
    setSimulations({});
  };

  const simulatedCount = Object.keys(simulations).length;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-surface-muted to-slate-900 border-2 border-primary/40 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Üst Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/40 shadow-glow-primary">
            <Calculator size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
              <span>İnteraktif Puan & Play-Off Simülatörü</span>
              <span className="text-[10px] bg-primary/20 text-primary border border-primary/40 px-1.5 py-0.5 rounded-full font-bold">
                Canlı Hesap
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Kalan maçlara tahmini set skorları verin; FIVB puanlama kurallarına göre sıralama anında değişsin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {simulatedCount > 0 && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer shadow-xs"
              title="Tüm simülasyonları sıfırla"
            >
              <RotateCcw size={12} />
              <span>Sıfırla ({simulatedCount})</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Simülatörü Kapat"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sol Sütun: Kalan Maçlar (Skor Seçiciler) */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Kalan Maçlar ({upcomingMatches.length})
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">
              {simulatedCount} / {upcomingMatches.length} maç simüle edildi
            </span>
          </div>

          {upcomingMatches.length === 0 ? (
            <div className="p-6 text-center bg-slate-800/40 border border-slate-800 rounded-xl text-xs text-slate-400">
              Bu grupta oynanmamış maç kalmadı. Grup maçları tamamlanmış.
            </div>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {upcomingMatches.map((m) => {
                const matchId = m.id;
                const home = m.home_team;
                const away = m.away_team;
                const currentScore = simulations[matchId];

                return (
                  <div
                    key={matchId}
                    className={`p-2.5 rounded-xl border transition-all text-xs ${
                      currentScore
                        ? "bg-primary/10 border-primary/50 shadow-xs"
                        : "bg-slate-800/50 border-slate-700/60 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <TeamBadge name={home} size="xs" />
                        <span className="font-bold text-white truncate text-[11px] sm:text-xs">{home}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 px-1">vs</span>
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end text-right">
                        <span className="font-bold text-white truncate text-[11px] sm:text-xs">{away}</span>
                        <TeamBadge name={away} size="xs" />
                      </div>
                    </div>

                    {/* Skor Seçim Butonları */}
                    <div className="flex items-center justify-center gap-1">
                      {SCORES.map((sc) => {
                        const isSelected = currentScore === sc;
                        return (
                          <button
                            key={sc}
                            type="button"
                            onClick={() => handleSetScore(matchId, sc)}
                            className={`px-1.5 py-1 rounded-lg font-mono text-[10px] font-black transition-all cursor-pointer ${
                              isSelected
                                ? "bg-primary text-primary-fg shadow-glow-primary scale-105"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/70"
                            }`}
                          >
                            {sc}
                          </button>
                        );
                      })}
                      {currentScore && (
                        <button
                          type="button"
                          onClick={() => handleSetScore(matchId, currentScore)}
                          className="p-1 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800 text-[10px] transition-colors"
                          title="Bu maçı sıfırla"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sağ Sütun: Canlı Simüle Puan Durumu Tablosu */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-primary" />
              <span>Simüle Sıralama</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              İlk <strong className="text-primary font-bold">{cutoff}</strong> sıra üst tura çıkar
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-950/70">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] text-slate-400">
                  <th className="py-2.5 pl-3 pr-1 w-10 text-center font-bold">Sıra</th>
                  <th className="py-2.5 px-2 font-bold">Takım</th>
                  <th className="py-2.5 px-2 text-center font-bold w-10">O</th>
                  <th className="py-2.5 px-2 text-center font-bold w-10">G</th>
                  <th className="py-2.5 px-2 text-center font-bold w-10">M</th>
                  <th className="py-2.5 px-2 text-center font-bold w-12 text-primary">P</th>
                  <th className="py-2.5 px-2 text-center font-bold w-14 hidden sm:table-cell">Set</th>
                  <th className="py-2.5 pr-3 pl-2 text-center font-bold w-12">Değişim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {simulatedRows.map((row) => {
                  const isPlayoff = row.rank <= cutoff;
                  const rankDiff = row.initialRank - row.rank;

                  return (
                    <tr
                      key={row.team}
                      className={`transition-colors ${
                        isPlayoff
                          ? "bg-emerald-950/15 hover:bg-emerald-950/25"
                          : "hover:bg-slate-900/60"
                      }`}
                    >
                      <td className="py-2 pl-3 pr-1 text-center font-mono font-bold text-xs">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-lg ${
                            isPlayoff
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : "text-slate-400"
                          }`}
                        >
                          {row.rank}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <TeamBadge name={row.team} size="xs" />
                          <span className="font-semibold text-white truncate text-xs">{row.team}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-300">{row.played}</td>
                      <td className="py-2 px-2 text-center font-mono text-emerald-400 font-semibold">{row.won}</td>
                      <td className="py-2 px-2 text-center font-mono text-rose-400">{row.lost}</td>
                      <td className="py-2 px-2 text-center font-mono font-black text-sm text-primary">
                        {row.points}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-400 text-[11px] hidden sm:table-cell">
                        {row.setsWon}:{row.setsLost}
                      </td>
                      <td className="py-2 pr-3 pl-2 text-center font-mono font-bold text-xs">
                        {rankDiff > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-emerald-400 bg-emerald-950/50 px-1 py-0.5 rounded text-[10px]">
                            <ChevronUp size={12} />
                            +{rankDiff}
                          </span>
                        ) : rankDiff < 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-rose-400 bg-rose-950/50 px-1 py-0.5 rounded text-[10px]">
                            <ChevronDown size={12} />
                            {rankDiff}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
