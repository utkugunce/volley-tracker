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
        className={`w-4 h-4 rounded text-[9px] font-bold font-mono flex items-center justify-center ${
          r === "W" ? "bg-done/15 text-done" : "bg-form-loss/15 text-form-loss"
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
    <section aria-labelledby={id} className="bg-surface border border-line/70 rounded-2xl p-4 sm:p-5">
      <div className="flex items-start gap-2.5 border-b border-line/60 pb-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-surface-muted border border-line/70 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 id={id} className="text-sm font-semibold text-white">
            {title}
          </h2>
          <p className="text-[11px] text-ink-3">{subtitle}</p>
        </div>
      </div>
      <ol className="divide-y divide-line/40">
        {entries.map((e, i) => (
          <li key={`${e.href}-${e.groupName}`} className="flex items-center gap-3 py-2">
            <span
              className={`w-5 text-center text-xs font-mono tabular-nums font-bold ${
                i === 0 ? "text-primary" : "text-ink-3"
              }`}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <Link href={e.href} prefetch={false} className="block text-sm font-semibold text-white hover:text-primary truncate transition-colors">
                {e.team}
              </Link>
              <p className="text-[11px] text-ink-3 truncate">
                {e.city === "TVF Kadınlar 2. Ligi" ? "Türkiye" : e.city} • {showCategory ? `${e.category} • ` : ""}
                {shortGroupName(e.category, e.groupName)}
              </p>
              {renderMeta && <div className="text-[11px] text-ink-3 mt-0.5">{renderMeta(e)}</div>}
            </div>
            <div className="text-right shrink-0 text-sm font-bold font-mono text-white tabular-nums">{renderValue(e)}</div>
          </li>
        ))}
      </ol>
    </section>
  );
};
