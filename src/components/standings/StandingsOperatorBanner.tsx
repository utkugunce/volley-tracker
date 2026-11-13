"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, ClipboardCopy, ExternalLink } from "lucide-react";
import type { Match, StandingItem } from "@/types/fixture";
import { isMatchScored } from "@/utils/matchScoring";
import { getVolleyboxLeagueMapping } from "@/utils/volleybox";
import type { ParsedStandingContext } from "@/utils/standingsParsing";
import {
  getResolvedVolleyboxTeamName,
  getVolleyboxTournamentMatchesUrl,
  type StandingsAnomalyTeamDiff,
} from "@/utils/volleyboxWorkbench";

interface StandingsOperatorBannerProps {
  activeContext: ParsedStandingContext | undefined;
  city?: string;
  items: StandingItem[];
  finishedMatches: Match[];
  upcomingMatches: Match[];
  forfeitCount: number;
  discrepancyTeams: StandingsAnomalyTeamDiff[];
}

/** Puan durumu sayfasının üst operatör özet şeridi: grup ilerlemesi, VB senkron oranı ve tek-tık kısayollar. */
export function StandingsOperatorBanner({
  activeContext,
  city,
  items,
  finishedMatches,
  upcomingMatches,
  forfeitCount,
  discrepancyTeams,
}: StandingsOperatorBannerProps) {
  const [copiedTable, setCopiedTable] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!activeContext || items.length === 0) return null;

  const effectiveCity = activeContext.city || city || "";
  const allGroupMatches = [...finishedMatches, ...upcomingMatches];
  const totalMatches = allGroupMatches.length;
  const completionPct = totalMatches > 0 ? Math.round((finishedMatches.length / totalMatches) * 100) : 0;

  const datedMatches = allGroupMatches.filter((m) => m.date && /^\d{4}-\d{2}-\d{2}$/.test(m.date));
  const syncedCount = datedMatches.filter((m) => m.volleybox?.synced).length;
  const missingVbScoreCount = finishedMatches.filter(
    (m) => isMatchScored(m) && m.volleybox?.synced && !m.volleybox?.has_score
  ).length;
  const unsyncedCount = datedMatches.filter((m) => !m.volleybox?.synced).length;
  const syncPct = datedMatches.length > 0 ? Math.round((syncedCount / datedMatches.length) * 100) : 0;

  const leagueMapping = getVolleyboxLeagueMapping(activeContext.leagueFullName, effectiveCity);
  const vbStandingsUrl = leagueMapping?.volleybox_url || null;
  const vbMatchesUrl = getVolleyboxTournamentMatchesUrl(activeContext.leagueFullName, effectiveCity);

  const handleCopyTable = () => {
    const lines = items.map((row) => {
      const vbTeam = getResolvedVolleyboxTeamName(row.team, activeContext.leagueFullName, effectiveCity);
      return `${row.rank}. ${vbTeam} | O:${row.played} G:${row.won} M:${row.lost} | Set:${row.sets_won}-${row.sets_lost} | P:${row.points}`;
    });
    const header = `${effectiveCity ? `${effectiveCity} · ` : ""}${activeContext.leagueFullName}${
      activeContext.displayGroup && activeContext.displayGroup !== "Genel" ? ` (${activeContext.displayGroup})` : ""
    }`;
    const payload = [header, ...lines].join("\n");
    try {
      void navigator.clipboard?.writeText(payload);
      setCopiedTable(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopiedTable(false), 1800);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-3 sm:p-4 space-y-3 shadow-card">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* İlerleme & Sayaçlar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
          <div className="rounded-xl bg-surface-raised/60 border border-line/60 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-3">Grup İlerlemesi</div>
            <div className="mt-0.5 flex items-baseline justify-between gap-1 font-scoreboard tabular-nums">
              <span className="text-sm font-black text-white">%{completionPct}</span>
              <span className="text-[11px] text-ink-2">
                {finishedMatches.length}/{totalMatches} maç
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-canvas overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl bg-surface-raised/60 border border-line/60 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-3">VB Senkron</div>
            <div className="mt-0.5 flex items-baseline justify-between gap-1 font-scoreboard tabular-nums">
              <span className="text-sm font-black text-emerald-400">%{syncPct}</span>
              <span className="text-[11px] text-ink-2">
                {syncedCount}/{datedMatches.length}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-ink-3 font-scoreboard tabular-nums">
              Girilmeyen: {unsyncedCount}
            </div>
          </div>

          <div className="rounded-xl bg-surface-raised/60 border border-line/60 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-3">Skor Kuyruğu</div>
            <div className="mt-0.5 flex items-baseline justify-between gap-1 font-scoreboard tabular-nums">
              <span className={`text-sm font-black ${missingVbScoreCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {missingVbScoreCount}
              </span>
              <span className="text-[11px] text-ink-2">VB skorsuz</span>
            </div>
            <div className="mt-1 text-[10px] text-ink-3 font-scoreboard tabular-nums">
              Kalan maç: {upcomingMatches.length}
            </div>
          </div>

          <div className="rounded-xl bg-surface-raised/60 border border-line/60 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-3">Kontrol</div>
            <div className="mt-0.5 flex items-baseline justify-between gap-1 font-scoreboard tabular-nums">
              <span
                className={`text-sm font-black ${
                  forfeitCount + discrepancyTeams.length > 0 ? "text-amber-300" : "text-ink"
                }`}
              >
                {discrepancyTeams.length}
              </span>
              <span className="text-[11px] text-ink-2">TVF/Maç farkı</span>
            </div>
            <div className="mt-1 text-[10px] text-ink-3 font-scoreboard tabular-nums">
              Hükmen: {forfeitCount}
            </div>
          </div>
        </div>

        {/* Operatör Kısayolları */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyTable}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              copiedTable
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-surface-raised hover:bg-surface-muted text-ink border-line hover:border-primary/40"
            }`}
            title="Puan durumunu Volleybox takım adlarıyla panoya kopyala"
          >
            {copiedTable ? <Check size={13} className="text-emerald-400" /> : <ClipboardCopy size={13} />}
            <span>{copiedTable ? "Tablo Kopyalandı ✓" : "Tabloyu Kopyala"}</span>
          </button>

          {vbMatchesUrl && (
            <a
              href={vbMatchesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-fg hover:bg-primary-hover text-xs font-bold transition-colors"
              title="Volleybox turnuvasının Maçlar sekmesinde düzenle"
            >
              <span>VB Maçlar Sekmesi</span>
              <ExternalLink size={12} />
            </a>
          )}

          {vbStandingsUrl && (
            <a
              href={vbStandingsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-raised hover:bg-surface-muted text-ink border border-line text-xs font-semibold transition-colors"
              title="Volleybox turnuva sayfasını aç"
            >
              <span>VB Turnuva</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* Takım Fark Uyarısı */}
      {(discrepancyTeams.length > 0 || forfeitCount > 0) && (
        <div className="rounded-xl bg-amber-950/25 border border-amber-500/40 px-3 py-2 flex flex-wrap items-center gap-2 text-[11px] text-amber-200">
          <AlertTriangle size={13} className="text-amber-400 shrink-0" />
          <span className="font-semibold">
            {forfeitCount > 0 ? `Bu grupta ${forfeitCount} hükmen (25-0) maç var. ` : ""}
            {discrepancyTeams.length > 0
              ? `TVF resmi puan tablosu ile fikstür maçları arasında fark olan takımlar: ${discrepancyTeams
                  .map((d) => `${d.team} (TVF ${d.tvfPlayed}O/${d.tvfWon}G · Maç ${d.calcPlayed}O/${d.calcWon}G)`)
                  .join(", ")}`
              : ""}
          </span>
        </div>
      )}
    </div>
  );
}
