import React from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import type { RecordSplit, TeamStatsSummary } from "@/utils/performanceStats";
import type { TeamPlayoffInfo } from "@/utils/teamStatsBundle";
import { fmt } from "@/utils/formatStats";
import { TeamPlayoffCard } from "./TeamPlayoffCard";

interface TeamStatsSectionProps {
  stats: TeamStatsSummary;
  playoff?: TeamPlayoffInfo[];
}

const StatCard: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({ label, value, hint }) => (
  <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 text-center">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className="text-lg font-black text-white mt-1 tabular-nums">{value}</p>
    {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
  </div>
);

const SplitRow: React.FC<{ label: string; split: RecordSplit }> = ({ label, split }) => {
  const pct = Math.round((split.wins / split.played) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold text-slate-300">{label}</span>
        <span className="font-mono text-slate-200">
          {split.wins}G – {split.losses}M <span className="text-slate-400">(%{pct})</span>
        </span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/80" role="img" aria-label={`${label}: %${pct} galibiyet`}>
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const DistRow: React.FC<{ label: string; count: number; total: number; tone: "win" | "loss" }> = ({ label, count, total, tone }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="w-8 font-mono font-bold text-slate-300">{label}</span>
    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/80">
      <div
        className={tone === "win" ? "h-full bg-emerald-400" : "h-full bg-form-loss"}
        style={{ width: `${total > 0 ? Math.round((count / total) * 100) : 0}%` }}
      />
    </div>
    <span className="w-5 text-right font-mono text-slate-200">{count}</span>
  </div>
);

/**
 * Takım sayfası "İstatistikler" bölümü. Hiç biten maç ve play-off bilgisi yoksa hiçbir şey çizmez;
 * veri olmayan alt bölümler (sayı ortalaması, ev/deplasman) tek tek gizlenir.
 */
export const TeamStatsSection: React.FC<TeamStatsSectionProps> = ({ stats, playoff = [] }) => {
  if (stats.played === 0 && playoff.length === 0) return null;

  const winTotal = stats.wins;
  const lossTotal = stats.losses;
  const hasDistribution = stats.played > 0;
  const hasBothSplits = stats.home || stats.away;

  return (
    <section aria-labelledby="team-stats-title" className="space-y-4">
      <h2 id="team-stats-title" className="text-lg font-bold text-white flex items-center gap-2">
        <BarChart3 size={18} className="text-primary" />
        <span>İstatistikler</span>
      </h2>

      {stats.played > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <StatCard label="Galibiyet Oranı" value={`%${Math.round((stats.winRate ?? 0) * 100)}`} hint={`${stats.wins}G / ${stats.played} maç`} />
            <StatCard
              label="Set Ortalaması"
              value={`${fmt(stats.avgSetsForPerMatch, 2)} – ${fmt(stats.avgSetsAgainstPerMatch, 2)}`}
              hint="maç başına alınan – verilen"
            />
            <StatCard
              label="Set Oranı"
              value={stats.setRatio === null ? "MAX" : fmt(stats.setRatio, 3)}
              hint={`${stats.setsFor} – ${stats.setsAgainst} set`}
            />
            {stats.points ? (
              <StatCard
                label="Sayı Ortalaması"
                value={`${fmt(stats.points.avgForPerSet)} – ${fmt(stats.points.avgAgainstPerSet)}`}
                hint={`set başına atılan – yenen (${stats.points.matches} maç)`}
              />
            ) : null}
            <StatCard
              label="Güncel Seri"
              value={stats.streak ? `${stats.streak.length} ${stats.streak.type === "W" ? "G" : "M"}` : "-"}
              hint={stats.streak ? (stats.streak.type === "W" ? "galibiyet serisi" : "mağlubiyet serisi") : undefined}
            />
            <StatCard
              label="En Uzun Seri"
              value={`${stats.longestWinStreak} G`}
              hint={stats.longestLossStreak > 0 ? `en uzun mağlubiyet: ${stats.longestLossStreak}` : "mağlubiyet yok"}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hasBothSplits && (
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ev / Deplasman</p>
                {stats.home && <SplitRow label="Ev sahibi" split={stats.home} />}
                {stats.away && <SplitRow label="Deplasman" split={stats.away} />}
              </div>
            )}
            {hasDistribution && (
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sonuç Dağılımı</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="space-y-2">
                    {(["3-0", "3-1", "3-2"] as const).map((k) => (
                      <DistRow key={k} label={k} count={stats.winBreakdown[k]} total={winTotal} tone="win" />
                    ))}
                  </div>
                  <div className="space-y-2">
                    {(["2-3", "1-3", "0-3"] as const).map((k) => (
                      <DistRow key={k} label={k} count={stats.lossBreakdown[k]} total={lossTotal} tone="loss" />
                    ))}
                  </div>
                </div>
                {(stats.otherResults > 0 || stats.forfeits > 0) && (
                  <p className="text-[10px] text-slate-400">
                    {stats.otherResults > 0 ? `${stats.otherResults} maç farklı formatta oynandı. ` : ""}
                    {stats.forfeits > 0 ? `${stats.forfeits} hükmen sonuç sayı ortalamasına dahil değil.` : ""}
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {playoff.map((p) => (
        <TeamPlayoffCard key={p.groupName} info={p} />
      ))}

      <p className="text-xs text-slate-400">
        <Link href="/istatistikler" prefetch={false} className="font-bold text-primary hover:underline">
          Lig geneli istatistikler →
        </Link>
      </p>
    </section>
  );
};
