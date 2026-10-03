import React from "react";
import { Match } from "@/types/fixture";

export function MatchMiniCard({ match, label }: { match: Match | null; label: string }) {
  if (!match) {
    return (
      <div className="text-ink-3 text-[11px]">
        <span className="font-semibold text-ink-2">{label}:</span> Veri yok
      </div>
    );
  }
  return (
    <div className="text-[11px]">
      <span className="font-semibold text-ink-2">{label}:</span>{" "}
      <span className="text-ink">
        {match.home_team} vs {match.away_team}
      </span>{" "}
      <span className="text-ink-3">
        ({match.date}{match.time ? ` ${match.time}` : ""})
      </span>
      {match.score && <span className="ml-1 font-scoreboard tabular-nums text-ink font-bold">{match.score}</span>}
    </div>
  );
}
