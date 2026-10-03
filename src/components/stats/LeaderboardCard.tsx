import React from "react";
import Link from "next/link";
import type { MetricEntry } from "@/utils/leagueAnalytics";
import { shortGroupName } from "@/utils/formatStats";

interface LeaderboardCardProps {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  entries: MetricEntry[];
  /** Kategoriye göre filtrelenmemiş ("Tümü") görünümde kategori adı da gösterilir. */
  showCategory: boolean;
  renderValue: (e: MetricEntry) => React.ReactNode;
  renderMeta?: (e: MetricEntry) => React.ReactNode;
}

export const FormChips: React.FC<{ results: Array<"W" | "L"> }> = ({ results }) => (
  <span className="inline-flex gap-1" aria-label={`Son maçlar: ${results.map((r) => (r === "W" ? "G" : "M")).join(" ")}`}>
    {results.map((r, i) => (
      <span
        key={i}
        className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center ${
          r === "W" ? "bg-emerald-500/20 text-emerald-300" : "bg-form-loss/20 text-form-loss"
        }`}
      >
        {r === "W" ? "G" : "M"}
      </span>
    ))}
  </span>
);

/** Lig geneli sıralama kartı. Liste boşsa (yeterli veri yok) hiçbir şey çizmez. */
export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  id,
  title,
  subtitle,
  icon,
  entries,
  showCategory,
  renderValue,
  renderMeta,
}) => {
  if (entries.length === 0) return null;
  return (
    <section aria-labelledby={id} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl">
      <div className="flex items-start gap-2.5 border-b border-slate-800/80 pb-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-surface-raised border border-line flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 id={id} className="text-sm font-bold text-white">
            {title}
          </h2>
          <p className="text-[11px] text-slate-400">{subtitle}</p>
        </div>
      </div>
      <ol className="divide-y divide-slate-800/70">
        {entries.map((e, i) => (
          <li key={`${e.href}-${e.groupName}`} className="flex items-center gap-3 py-2">
            <span className="w-5 text-center text-xs font-mono font-black text-slate-500">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <Link href={e.href} prefetch={false} className="block text-sm font-bold text-slate-100 hover:text-primary truncate">
                {e.team}
              </Link>
              <p className="text-[11px] text-slate-400 truncate">
                {e.city === "TVF Kadınlar 2. Ligi" ? "Türkiye" : e.city} • {showCategory ? `${e.category} • ` : ""}
                {shortGroupName(e.category, e.groupName)}
              </p>
              {renderMeta && <div className="text-[11px] text-slate-400 mt-0.5">{renderMeta(e)}</div>}
            </div>
            <div className="text-right shrink-0 text-sm font-black text-white tabular-nums">{renderValue(e)}</div>
          </li>
        ))}
      </ol>
    </section>
  );
};
