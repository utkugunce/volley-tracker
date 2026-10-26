import React from "react";
import type { Match } from "@/types/fixture";
import { TeamVolleyboxLink } from "@/components/TeamVolleyboxLink";
import { isHomeSetWin } from "@/utils/fixtureTable";
import type { MatchForfeitInfo } from "@/utils/forfeit";
import type { FixtureCellBaseProps } from "./FixtureRowCells";

interface FixtureTeamCellProps extends FixtureCellBaseProps {
  match: Match;
  city: string;
  won: boolean;
  isFinished: boolean;
}

/** 4. A Takımı (Ev Sahibi) */
export function FixtureHomeTeamCell({ match, city, won: homeWon, isFinished, cardBorderClass }: FixtureTeamCellProps) {
  return (
    <td className={`py-2.5 px-2 whitespace-nowrap text-right border-y ${cardBorderClass}`}>
      <div className="flex items-center justify-end gap-2 text-right">
        <TeamVolleyboxLink
          teamName={match.home_team}
          category={match.category || match.age_group}
          city={match.city || city}
          className={`text-xs ${
            homeWon
              ? "font-bold text-white"
              : isFinished
              ? "font-normal text-slate-400"
              : "font-bold text-slate-100 group-hover:text-white transition-colors"
          }`}
        />
      </div>
    </td>
  );
}

interface FixtureScoreCellProps extends FixtureCellBaseProps {
  match: Match;
  isFinished: boolean;
  forfeitInfo: MatchForfeitInfo;
}

/** 5. VS / Skor (Merkez Ayracı) */
export function FixtureScoreCell({ match, isFinished, forfeitInfo, cardBorderClass }: FixtureScoreCellProps) {
  return (
    <td className={`py-2.5 px-1 text-center whitespace-nowrap w-16 border-y ${cardBorderClass}`}>
      <div className="flex items-center justify-center">
        {isFinished ? (
          <div className="inline-flex flex-col items-center">
            <span className="inline-block px-2 py-0.5 rounded-lg font-mono font-scoreboard tabular-nums font-bold text-xs text-white tracking-wider">
              {match.home_score !== null && match.home_score !== undefined && match.away_score !== null && match.away_score !== undefined
                ? `${match.home_score} - ${match.away_score}`
                : match.score || "- : -"}
            </span>
            {forfeitInfo.isForfeit && (
              <span
                className="text-[9px] font-bold uppercase tracking-wider text-warn mt-0.5"
                title={forfeitInfo.reason || "TVF kuralı gereği hükmen galibiyet"}
              >
                Hükmen
              </span>
            )}
          </div>
        ) : (
          <span
            className="inline-flex items-center justify-center font-mono text-[11px] text-ink-3"
            title="Karşılaşma"
          >
            VS
          </span>
        )}
      </div>
    </td>
  );
}

/** 6. B Takımı (Deplasman) */
export function FixtureAwayTeamCell({ match, city, won: awayWon, isFinished, cardBorderClass }: FixtureTeamCellProps) {
  return (
    <td className={`py-2.5 px-2 whitespace-nowrap text-left border-y ${cardBorderClass}`}>
      <div className="flex items-center justify-start gap-2 text-left">
        <TeamVolleyboxLink
          teamName={match.away_team}
          category={match.category || match.age_group}
          city={match.city || city}
          className={`text-xs ${
            awayWon
              ? "font-bold text-white"
              : isFinished
              ? "font-normal text-slate-400"
              : "font-bold text-slate-100 group-hover:text-white transition-colors"
          }`}
        />
      </div>
    </td>
  );
}

/** 7. Set Skorları */
export function FixtureSetScoresCell({ match, isFinished, forfeitInfo, cardBorderClass }: FixtureScoreCellProps) {
  return (
    <td className={`py-2.5 px-2 text-left whitespace-nowrap border-y ${cardBorderClass}`}>
      {isFinished && match.set_scores && match.set_scores.length > 0 ? (
        <div className="flex items-center gap-1.5 flex-nowrap">
          {match.set_scores.map((set, sIdx) => {
            const isHomeSet = isHomeSetWin(set);
            return (
              <span
                key={sIdx}
                className={`font-mono font-scoreboard tabular-nums text-[11px] px-1 py-0.5 rounded ${
                  isHomeSet
                    ? "text-ink font-semibold"
                    : "text-ink-3 font-normal"
                }`}
              >
                {set}
              </span>
            );
          })}
          {forfeitInfo.isForfeit && (
            <span
              className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-2xs"
              title={forfeitInfo.reason || "TVF kuralı gereği hükmen tescil edilmiştir"}
            >
              <span>(Hükmen)</span>
            </span>
          )}
        </div>
      ) : (
        <span className="text-slate-500 text-[11px] font-mono">-</span>
      )}
    </td>
  );
}
