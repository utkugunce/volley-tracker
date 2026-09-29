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
      <div className={`bg-[#181A20] rounded-xl border border-[#2A2E3D] p-3 text-center ${className}`}>
        <div className="text-[11px] font-semibold text-[#94A3B8]">Set Skor Matrisi</div>
        <p className="text-[10px] text-[#64748B] mt-1">
          {match.status === "finished"
            ? "Detaylı set sayıları sisteme girilmedi."
            : "Karşılaşma başladığında set dökümü burada canlı listelenecektir."}
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-[#181A20] rounded-xl border border-[#2A2E3D] overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-[#1E222D] text-[#94A3B8] border-b border-[#2A2E3D] text-[10px] uppercase font-bold tracking-wider">
              <th className="py-2 px-3 text-left">Takım</th>
              {parsedSets.map((s) => (
                <th key={s.setNum} className="py-2 px-2 text-center font-mono w-10">
                  S{s.setNum}
                </th>
              ))}
              <th className="py-2 px-3 text-center font-mono text-white w-14">
                Toplam
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2E3D]/50 font-medium">
            {/* Ev Sahibi */}
            <tr className="hover:bg-[#1E222D]/40 transition-colors">
              <td className="py-2 px-3">
                <div className="flex items-center gap-2 min-w-0">
                  <TeamBadge name={match.home_team} size="xs" />
                  <span
                    className={`truncate text-[11px] ${
                      match.home_score !== null &&
                      match.away_score !== null &&
                      (match.home_score ?? 0) > (match.away_score ?? 0)
                        ? "text-white font-bold"
                        : "text-[#CBD5E1]"
                    }`}
                    title={match.home_team}
                  >
                    {match.home_team}
                  </span>
                </div>
              </td>
              {parsedSets.map((s) => (
                <td key={s.setNum} className="py-2 px-2 text-center font-mono text-[11px]">
                  {isLive && s.setNum === parsedSets.length ? (
                    <span className="inline-block min-w-[22px] px-1.5 py-0.5 rounded font-semibold text-blue-300 bg-blue-500/10" title="Canlı set skoru">
                      {s.home}
                    </span>
                  ) : s.homeWon ? (
                    <span className="inline-block min-w-[22px] px-1.5 py-0.5 rounded font-bold text-emerald-400 bg-emerald-500/10">
                      {s.home}
                    </span>
                  ) : (
                    <span className="font-normal text-slate-500">{s.home}</span>
                  )}
                </td>
              ))}
              <td className="py-2 px-3 text-center font-mono font-black text-white text-[12px] bg-[#1E222D]/30">
                {totalHomePoints}
              </td>
            </tr>

            {/* Deplasman */}
            <tr className="hover:bg-[#1E222D]/40 transition-colors">
              <td className="py-2 px-3">
                <div className="flex items-center gap-2 min-w-0">
                  <TeamBadge name={match.away_team} size="xs" />
                  <span
                    className={`truncate text-[11px] ${
                      match.home_score !== null &&
                      match.away_score !== null &&
                      (match.away_score ?? 0) > (match.home_score ?? 0)
                        ? "text-white font-bold"
                        : "text-[#CBD5E1]"
                    }`}
                    title={match.away_team}
                  >
                    {match.away_team}
                  </span>
                </div>
              </td>
              {parsedSets.map((s) => (
                <td key={s.setNum} className="py-2 px-2 text-center font-mono text-[11px]">
                  {isLive && s.setNum === parsedSets.length ? (
                    <span className="inline-block min-w-[22px] px-1.5 py-0.5 rounded font-semibold text-blue-300 bg-blue-500/10" title="Canlı set skoru">
                      {s.away}
                    </span>
                  ) : s.awayWon ? (
                    <span className="inline-block min-w-[22px] px-1.5 py-0.5 rounded font-bold text-emerald-400 bg-emerald-500/10">
                      {s.away}
                    </span>
                  ) : (
                    <span className="font-normal text-slate-500">{s.away}</span>
                  )}
                </td>
              ))}
              <td className="py-2 px-3 text-center font-mono font-black text-white text-[12px] bg-[#1E222D]/30">
                {totalAwayPoints}
              </td>
            </tr>

            {/* Set Süreleri (Varsa) */}
            {hasDurations && (
              <tr className="bg-[#12141A] text-[#94A3B8] text-[10px]">
                <td className="py-1.5 px-3 flex items-center gap-1.5">
                  <Clock size={11} className="text-amber-400 shrink-0" />
                  <span>Süre</span>
                </td>
                {parsedSets.map((s, idx) => (
                  <td key={s.setNum} className="py-1.5 px-2 text-center font-mono text-[10px]">
                    {durations?.[idx] || "-"}
                  </td>
                ))}
                <td className="py-1.5 px-3 text-center font-mono font-semibold text-amber-300 text-[10px] bg-[#1E222D]/40">
                  {totalDurationStr || "-"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
