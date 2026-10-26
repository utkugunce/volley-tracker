"use client";

import React, { useMemo } from "react";
import { Match } from "@/types/fixture";
import { TeamBadge } from "@/components/TeamBadge";
import { Clock } from "lucide-react";

export interface SetScoreMatrixProps {
  match: Match;
  className?: string;
}

const EMPTY_SET_SCORES: string[] = [];

export const SetScoreMatrix: React.FC<SetScoreMatrixProps> = ({ match, className = "" }) => {
  const setScores = match.set_scores ?? EMPTY_SET_SCORES;
  const isLive = match.status === "live";

  const parsedSets = useMemo(
    () =>
      setScores.map((setStr, idx) => {
        const parts = setStr.replace(":", "-").split("-").map((p) => parseInt(p.trim(), 10));
        const home = isNaN(parts[0]) ? 0 : parts[0];
        const away = isNaN(parts[1]) ? 0 : parts[1];
        return {
          setNum: idx + 1,
          home,
          away,
          homeWon: home > away,
          awayWon: away > home,
          raw: setStr,
        };
      }),
    [setScores]
  );

  const hasScoreData = parsedSets.length > 0;
  const totalHomePoints = parsedSets.reduce((acc, curr) => acc + curr.home, 0);
  const totalAwayPoints = parsedSets.reduce((acc, curr) => acc + curr.away, 0);
  const grandTotalPoints = totalHomePoints + totalAwayPoints;
  const homePointShare = grandTotalPoints > 0 ? Math.round((totalHomePoints / grandTotalPoints) * 100) : 50;

  // Set süreleri (Varsa)
  const durations = match.set_durations;
  const hasDurations = Boolean(durations && durations.length > 0);

  // Sürelerin toplamını hesaplama yardımcısı
  const calculateTotalDuration = () => {
    if (!durations || durations.length === 0) return null;
    let totalMinutes = 0;
    let validCount = 0;
    for (const d of durations) {
      const matchNum = d.match(/(\d+)/);
      if (matchNum) {
        totalMinutes += parseInt(matchNum[1], 10);
        validCount++;
      }
    }
    return validCount > 0 ? `${totalMinutes} dk` : null;
  };

  const totalDurationStr = calculateTotalDuration();

  if (!hasScoreData) {
    return (
      <div className={`bg-surface rounded-xl border border-line/70 p-3.5 text-center ${className}`}>
        <div className="text-[11px] font-semibold text-ink-2">Set Skor Matrisi</div>
        <p className="text-[10px] text-ink-3 mt-1">
          {match.status === "finished"
            ? "Detaylı set sayıları sisteme girilmedi."
            : "Karşılaşma başladığında set dökümü burada canlı listelenecektir."}
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-surface rounded-xl border border-line/70 overflow-hidden ${className}`}>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Set skorları tablosu">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-surface-muted/70 text-ink-3 border-b border-line/60 text-[10px] uppercase font-semibold tracking-wider">
              <th className="py-2 px-3 text-left">Takım</th>
              {parsedSets.map((s) => (
                <th key={s.setNum} className="py-2 px-2 text-center font-mono font-scoreboard tabular-nums w-10">
                  S{s.setNum}
                </th>
              ))}
              <th className="py-2 px-3 text-center font-mono font-scoreboard tabular-nums text-white w-14">
                Toplam
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40 font-medium">
            {/* Ev Sahibi */}
            <tr className="hover:bg-surface-muted/30 transition-colors">
              <td className="py-2 px-3">
                <div className="flex items-center gap-2 min-w-0">
                  <TeamBadge name={match.home_team} size="xs" />
                  <span
                    className={`truncate text-[11px] ${
                      match.home_score !== null &&
                      match.away_score !== null &&
                      (match.home_score ?? 0) > (match.away_score ?? 0)
                        ? "text-white font-semibold"
                        : "text-ink-2"
                    }`}
                    title={match.home_team}
                  >
                    {match.home_team}
                  </span>
                </div>
              </td>
              {parsedSets.map((s) => (
                <td key={s.setNum} className="py-2 px-2 text-center font-mono font-scoreboard tabular-nums text-[11px]">
                  {isLive && s.setNum === parsedSets.length ? (
                    <span className="inline-block min-w-[20px] font-semibold text-blue-300" title="Canlı set skoru">
                      {s.home}
                    </span>
                  ) : s.homeWon ? (
                    <span className="inline-block min-w-[20px] font-bold text-emerald-400">
                      {s.home}
                    </span>
                  ) : (
                    <span className="font-normal text-slate-500">{s.home}</span>
                  )}
                </td>
              ))}
              <td className="py-2 px-3 text-center font-mono font-scoreboard tabular-nums font-bold text-white text-[12px] bg-surface-muted/40">
                {totalHomePoints}
              </td>
            </tr>

            {/* Deplasman */}
            <tr className="hover:bg-surface-muted/30 transition-colors">
              <td className="py-2 px-3">
                <div className="flex items-center gap-2 min-w-0">
                  <TeamBadge name={match.away_team} size="xs" />
                  <span
                    className={`truncate text-[11px] ${
                      match.home_score !== null &&
                      match.away_score !== null &&
                      (match.away_score ?? 0) > (match.home_score ?? 0)
                        ? "text-white font-semibold"
                        : "text-ink-2"
                    }`}
                    title={match.away_team}
                  >
                    {match.away_team}
                  </span>
                </div>
              </td>
              {parsedSets.map((s) => (
                <td key={s.setNum} className="py-2 px-2 text-center font-mono font-scoreboard tabular-nums text-[11px]">
                  {isLive && s.setNum === parsedSets.length ? (
                    <span className="inline-block min-w-[20px] font-semibold text-blue-300" title="Canlı set skoru">
                      {s.away}
                    </span>
                  ) : s.awayWon ? (
                    <span className="inline-block min-w-[20px] font-bold text-emerald-400">
                      {s.away}
                    </span>
                  ) : (
                    <span className="font-normal text-slate-500">{s.away}</span>
                  )}
                </td>
              ))}
              <td className="py-2 px-3 text-center font-mono font-scoreboard tabular-nums font-bold text-white text-[12px] bg-surface-muted/40">
                {totalAwayPoints}
              </td>
            </tr>

            {/* Set Süreleri (Varsa) */}
            {hasDurations && (
              <tr className="bg-surface-muted/30 text-ink-3 text-[10px]">
                <td className="py-1.5 px-3 flex items-center gap-1.5">
                  <Clock size={11} className="text-primary shrink-0" />
                  <span>Süre</span>
                </td>
                {parsedSets.map((s, idx) => (
                  <td key={s.setNum} className="py-1.5 px-2 text-center font-mono font-scoreboard tabular-nums text-[10px]">
                    {durations?.[idx] || "-"}
                  </td>
                ))}
                <td className="py-1.5 px-3 text-center font-mono font-scoreboard tabular-nums font-semibold text-primary text-[10px] bg-surface-muted/40">
                  {totalDurationStr || "-"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VNL Stili Toplam Sayı Üstünlüğü (Momentum) Çubuğu */}
      {grandTotalPoints > 0 && (
        <div className="px-3 py-2 border-t border-line/50 bg-surface-muted/20 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-ink-3">
            <span>%{homePointShare} Sayı Payı</span>
            <span className="text-[9px] uppercase tracking-wider font-sans font-semibold text-ink-3">
              Sayı Üstünlüğü
            </span>
            <span>%{100 - homePointShare} Sayı Payı</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-surface-muted overflow-hidden flex gap-0.5">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${homePointShare}%` }}
            />
            <div
              className="h-full bg-selected transition-all duration-300"
              style={{ width: `${100 - homePointShare}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
