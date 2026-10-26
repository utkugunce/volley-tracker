import React from "react";
import { BarChart3 } from "lucide-react";
import type { CompareStatsData, CompareTeamStats } from "@/utils/compareStats";
import { PLAYOFF_STATUS_LABEL } from "@/utils/playoffRace";
import type { RecordSplit } from "@/utils/performanceStats";
import { fmt } from "@/utils/formatStats";
import { FormChips } from "./LeaderboardCard";

interface CompareStatsTableProps {
  data: CompareStatsData;
  name1: string;
  name2: string;
}

type Better = "high" | "low" | null;

interface Row {
  key: string;
  label: string;
  a: React.ReactNode;
  b: React.ReactNode;
  aVal?: number | null;
  bVal?: number | null;
  better?: Better;
}

const rec = (s: RecordSplit | null) => (s ? `${s.wins}G – ${s.losses}M` : null);

function winner(row: Row): "a" | "b" | null {
  if (!row.better || row.aVal == null || row.bVal == null || row.aVal === row.bVal) return null;
  const aWins = row.better === "high" ? row.aVal > row.bVal : row.aVal < row.bVal;
  return aWins ? "a" : "b";
}

function getTugPct(row: Row): number | null {
  if (row.better !== "high" || row.aVal == null || row.bVal == null) return null;
  if (!Number.isFinite(row.aVal) || !Number.isFinite(row.bVal)) return null;
  if (row.aVal < 0 || row.bVal < 0) return null;
  const sum = row.aVal + row.bVal;
  if (sum <= 0) return null;
  return Math.round((row.aVal / sum) * 100);
}

function buildRows(a: CompareTeamStats, b: CompareTeamStats, sameGroup: boolean): Row[] {
  const rows: Row[] = [];
  const sa = a.stats;
  const sb = b.stats;
  const has = (x: unknown, y: unknown) => x != null || y != null;
  const dash = (v: React.ReactNode) => (v == null || v === "" ? "-" : v);

  if (a.standing || b.standing) {
    const st = (s: CompareTeamStats["standing"]) =>
      s ? (
        <>
          <span className="font-bold">{s.rank}. sıra</span>
          <span className="block text-[10px] text-ink-3 font-normal">
            {s.points} P • {s.won}G {s.lost}M
            {!sameGroup ? ` • ${s.groupName}` : ""}
          </span>
        </>
      ) : (
        "-"
      );
    rows.push({
      key: "standing",
      label: "Puan Durumu",
      a: st(a.standing),
      b: st(b.standing),
      aVal: sameGroup ? a.standing?.rank ?? null : null,
      bVal: sameGroup ? b.standing?.rank ?? null : null,
      better: sameGroup ? "low" : null,
    });
  }
  if (sa.played > 0 || sb.played > 0) {
    rows.push({
      key: "winrate",
      label: "Galibiyet Oranı",
      a: sa.winRate === null ? "-" : `%${Math.round(sa.winRate * 100)} (${sa.wins}/${sa.played})`,
      b: sb.winRate === null ? "-" : `%${Math.round(sb.winRate * 100)} (${sb.wins}/${sb.played})`,
      aVal: sa.winRate,
      bVal: sb.winRate,
      better: "high",
    });
    rows.push({
      key: "avgpoints",
      label: "Maç Başı Lig Puanı",
      a: fmt(sa.avgLeaguePoints, 2),
      b: fmt(sb.avgLeaguePoints, 2),
      aVal: sa.avgLeaguePoints,
      bVal: sb.avgLeaguePoints,
      better: "high",
    });
  }
  if (a.form.matches > 0 || b.form.matches > 0) {
    rows.push({
      key: "form",
      label: "Son 5 Maç",
      a:
        a.form.matches > 0 ? (
          <span className="inline-flex flex-col items-end sm:items-start gap-0.5">
            <FormChips results={a.form.results} />
            <span className="text-[10px] text-ink-3 font-normal">
              {a.form.points}/{a.form.maxPoints} puan
            </span>
          </span>
        ) : (
          "-"
        ),
      b:
        b.form.matches > 0 ? (
          <span className="inline-flex flex-col items-end sm:items-start gap-0.5">
            <FormChips results={b.form.results} />
            <span className="text-[10px] text-ink-3 font-normal">
              {b.form.points}/{b.form.maxPoints} puan
            </span>
          </span>
        ) : (
          "-"
        ),
      aVal: a.form.matches ? a.form.points / a.form.maxPoints : null,
      bVal: b.form.matches ? b.form.points / b.form.maxPoints : null,
      better: "high",
    });
  }
  if (sa.played > 0 || sb.played > 0) {
    rows.push({
      key: "sets",
      label: "Set Ortalaması (alınan – verilen)",
      a: sa.played ? `${fmt(sa.avgSetsForPerMatch, 2)} – ${fmt(sa.avgSetsAgainstPerMatch, 2)}` : "-",
      b: sb.played ? `${fmt(sb.avgSetsForPerMatch, 2)} – ${fmt(sb.avgSetsAgainstPerMatch, 2)}` : "-",
      aVal: sa.played ? (sa.avgSetsForPerMatch ?? 0) - (sa.avgSetsAgainstPerMatch ?? 0) : null,
      bVal: sb.played ? (sb.avgSetsForPerMatch ?? 0) - (sb.avgSetsAgainstPerMatch ?? 0) : null,
      better: "high",
    });
    rows.push({
      key: "setratio",
      label: "Set Oranı",
      a: sa.played ? (sa.setRatio === null ? "MAX" : fmt(sa.setRatio, 3)) : "-",
      b: sb.played ? (sb.setRatio === null ? "MAX" : fmt(sb.setRatio, 3)) : "-",
      aVal: sa.played ? sa.setRatio ?? Infinity : null,
      bVal: sb.played ? sb.setRatio ?? Infinity : null,
      better: "high",
    });
  }
  if (has(sa.points, sb.points)) {
    rows.push({
      key: "points",
      label: "Sayı Ortalaması (set başı atılan – yenen)",
      a: sa.points ? `${fmt(sa.points.avgForPerSet)} – ${fmt(sa.points.avgAgainstPerSet)}` : "-",
      b: sb.points ? `${fmt(sb.points.avgForPerSet)} – ${fmt(sb.points.avgAgainstPerSet)}` : "-",
      aVal: sa.points ? sa.points.avgForPerSet - sa.points.avgAgainstPerSet : null,
      bVal: sb.points ? sb.points.avgForPerSet - sb.points.avgAgainstPerSet : null,
      better: "high",
    });
  }
  if (sa.streak || sb.streak) {
    const fs = (s: CompareTeamStats["stats"]) =>
      s.streak ? `${s.streak.length} ${s.streak.type === "W" ? "galibiyet" : "mağlubiyet"}` : "-";
    rows.push({
      key: "streak",
      label: "Güncel Seri",
      a: fs(sa),
      b: fs(sb),
      aVal: sa.streak ? (sa.streak.type === "W" ? sa.streak.length : -sa.streak.length) : null,
      bVal: sb.streak ? (sb.streak.type === "W" ? sb.streak.length : -sb.streak.length) : null,
      better: "high",
    });
    rows.push({
      key: "longest",
      label: "En Uzun Galibiyet Serisi",
      a: sa.played ? sa.longestWinStreak : "-",
      b: sb.played ? sa.longestWinStreak && sb.longestWinStreak !== undefined ? sb.longestWinStreak : sb.longestWinStreak : "-",
      aVal: sa.played ? sa.longestWinStreak : null,
      bVal: sb.played ? sb.longestWinStreak : null,
      better: "high",
    });
  }
  if (sa.home || sa.away || sb.home || sb.away) {
    rows.push({ key: "home", label: "Ev Sahibi (G – M)", a: dash(rec(sa.home)), b: dash(rec(sb.home)) });
    rows.push({ key: "away", label: "Deplasman (G – M)", a: dash(rec(sa.away)), b: dash(rec(sb.away)) });
  }
  if (sa.wins > 0 || sb.wins > 0) {
    const dist = (s: CompareTeamStats["stats"]) =>
      s.wins > 0 ? `${s.winBreakdown["3-0"]} / ${s.winBreakdown["3-1"]} / ${s.winBreakdown["3-2"]}` : "-";
    rows.push({ key: "dist", label: "Galibiyetler 3-0 / 3-1 / 3-2", a: dist(sa), b: dist(sb) });
  }
  if (a.playoff || b.playoff) {
    const po = (p: CompareTeamStats["playoff"]) => (p ? `${PLAYOFF_STATUS_LABEL[p.status]} (ilk ${p.cutoff})` : "-");
    rows.push({ key: "playoff", label: "Play-off Durumu", a: po(a.playoff), b: po(b.playoff) });
  }
  return rows;
}

/** İki takımın istatistiklerini yan yana gösterir. Her iki takımda da verisi olmayan satırlar çizilmez. */
export const CompareStatsTable: React.FC<CompareStatsTableProps> = ({ data, name1, name2 }) => {
  const rows = buildRows(data.team1, data.team2, data.sameGroup);
  if (rows.length === 0) return null;

  return (
    <section
      aria-labelledby="compare-stats-title"
      className="bg-surface border border-line/70 rounded-2xl p-4 sm:p-6 space-y-3"
    >
      <div className="flex items-center gap-2 border-b border-line/60 pb-3">
        <div className="w-7 h-7 rounded-lg bg-surface-muted border border-line/70 flex items-center justify-center text-primary">
          <BarChart3 size={16} />
        </div>
        <div>
          <h2 id="compare-stats-title" className="text-sm font-semibold text-white uppercase tracking-wider">
            Sezon İstatistikleri Karşılaştırması
          </h2>
          <p className="text-[11px] text-ink-3">Puan durumu, form ve ortalamalar yan yana. Üstün taraf vurgulanır.</p>
        </div>
      </div>
      <div className="grid grid-cols-[1fr,1fr,1fr] gap-x-2 text-[11px] font-semibold px-1">
        <span className="text-primary truncate">{name1}</span>
        <span />
        <span className="text-selected-text truncate text-right">{name2}</span>
      </div>
      <dl className="divide-y divide-line/40" data-testid="compare-stats-rows">
        {rows.map((row) => {
          const w = winner(row);
          const pct = getTugPct(row);
          return (
            <div key={row.key} className="py-2.5 space-y-1.5">
              <div className="grid grid-cols-[1fr,1.2fr,1fr] items-center gap-x-2 text-xs">
                <dd className={`font-mono tabular-nums ${w === "a" ? "text-primary font-bold" : "text-ink"}`}>{row.a}</dd>
                <dt className="text-center text-[11px] text-ink-3 font-medium leading-tight">{row.label}</dt>
                <dd className={`font-mono tabular-nums text-right ${w === "b" ? "text-selected-text font-bold" : "text-ink"}`}>
                  {row.b}
                </dd>
              </div>
              {pct !== null && (
                <div className="h-1 w-full rounded-full bg-surface-muted overflow-hidden flex gap-0.5">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
                  <div className="h-full bg-selected transition-all duration-300" style={{ width: `${100 - pct}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </dl>
    </section>
  );
};
