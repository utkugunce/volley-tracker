import React from "react";
import type { StandingItem } from "@/types/fixture";
import type { TeamMatchSummary } from "@/utils/standingsForm";
import { MatchMiniCard } from "./MatchMiniCard";

interface StandingsDetailRowProps {
  row: StandingItem;
  summary: TeamMatchSummary;
}

/** Satır içi detay (set / sayı oranları, son ve sıradaki maç). */
export function StandingsDetailRow({ row, summary }: StandingsDetailRowProps) {
  return (
    <tr data-detail-for={row.team}>
      <td colSpan={8} className="p-0">
        <div className="bg-surface-raised border-t border-line relative">
          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />
          <div className="pl-6 pr-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="space-y-1">
              <div>
                <span className="font-semibold text-ink-2">Set Oranı:</span>{" "}
                <span className="font-scoreboard tabular-nums text-ink">{row.set_ratio}</span>
              </div>
              <div>
                <span className="font-semibold text-ink-2">Sayı Oranı:</span>{" "}
                <span className="font-scoreboard tabular-nums text-ink">{row.point_ratio}</span>
              </div>
              <div>
                <span className="font-semibold text-ink-2">Set:</span>{" "}
                <span className="font-scoreboard tabular-nums text-done">{row.sets_won}</span>
                <span className="text-ink-3"> - </span>
                <span className="font-scoreboard tabular-nums text-form-loss">{row.sets_lost}</span>
              </div>
              <div>
                <span className="font-semibold text-ink-2">Sayı:</span>{" "}
                <span className="font-scoreboard tabular-nums text-ink">{row.points_won}</span>
                <span className="text-ink-3"> - </span>
                <span className="font-scoreboard tabular-nums text-ink">{row.points_lost}</span>
              </div>
            </div>
            <div className="space-y-1">
              <MatchMiniCard match={summary.last} label="Son Maç" />
              <MatchMiniCard match={summary.next} label="Sıradaki Maç" />
              {summary.formSource === "none" && (
                <p className="text-ink-3 text-[10px] italic">
                  Form verisi mevcut değil — henüz oynanan maç bulunmuyor.
                </p>
              )}
              {summary.formSource === "standings" && (
                <p className="text-ink-3 text-[10px] italic">
                  Form: TVF puan tablosundan (yalnız oynanan maçlar).
                </p>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}
