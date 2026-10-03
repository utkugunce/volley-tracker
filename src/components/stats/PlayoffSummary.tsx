import React from "react";
import Link from "next/link";
import { Medal } from "lucide-react";
import type { LeagueLists } from "@/utils/leagueAnalytics";
import { shortGroupName } from "@/utils/formatStats";
import { PlayoffRuleNote } from "./PlayoffRuleNote";

const MAX_GROUPS = 30;

/**
 * Lig geneli play-off özeti: yalnızca fikstürü tamam olan ve en az bir takımın durumu kesinleşmiş gruplar listelenir.
 * Hiç grup yoksa bunun nedeni açıkça belirtilir (uydurma tahmin yok).
 */
export const PlayoffSummary: React.FC<{ playoff: LeagueLists["playoff"]; showCategory: boolean }> = ({ playoff, showCategory }) => {
  const shown = playoff.groups.slice(0, MAX_GROUPS);
  return (
    <section aria-labelledby="playoff-title" className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
      <div className="flex items-start gap-2.5 border-b border-slate-800/80 pb-3">
        <div className="w-8 h-8 rounded-lg bg-surface-raised border border-line flex items-center justify-center text-primary shrink-0">
          <Medal size={16} />
        </div>
        <div>
          <h2 id="playoff-title" className="text-sm font-bold text-white">
            Play-off Matematiği
          </h2>
          <p className="text-[11px] text-slate-400">
            Kesinleşen durumlar. {playoff.groupsCalculated}/{playoff.groupsTotal} grubun fikstürü tamamlandığı için hesaplanabildi.
          </p>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-xs text-slate-400 leading-relaxed">
          Şu an kesinleşmiş bir play-off durumu yok. Kalan maç sayısı yalnızca fikstürü tamamen açıklanmış gruplarda bilinebildiği için
          sezon ilerledikçe burada garanti ve elenmiş takımlar görünecek.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {shown.map((g) => (
            <li key={g.id} className="bg-slate-800/50 border border-slate-700/70 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-bold text-slate-200">
                {g.city} • {showCategory ? `${g.category} • ` : ""}
                {shortGroupName(g.category, g.groupName)}
                <span className="font-normal text-slate-400"> • ilk {g.cutoff} • kalan {g.remainingMatches} maç</span>
              </p>
              {g.qualified.length > 0 && (
                <p className="text-xs text-slate-300">
                  <b className="text-emerald-300">Garanti:</b>{" "}
                  {g.qualified.map((t, i) => (
                    <React.Fragment key={t.slug}>
                      {i > 0 && ", "}
                      <Link href={t.href} prefetch={false} className="hover:text-primary underline-offset-2 hover:underline">
                        {t.team}
                      </Link>
                    </React.Fragment>
                  ))}
                </p>
              )}
              {g.eliminated.length > 0 && (
                <p className="text-xs text-slate-300">
                  <b className="text-form-loss">Elenmiş:</b>{" "}
                  {g.eliminated.map((t, i) => (
                    <React.Fragment key={t.slug}>
                      {i > 0 && ", "}
                      <Link href={t.href} prefetch={false} className="hover:text-primary underline-offset-2 hover:underline">
                        {t.team}
                      </Link>
                    </React.Fragment>
                  ))}
                </p>
              )}
              {g.openCount > 0 && <p className="text-[11px] text-slate-400">{g.openCount} takımın durumu hâlâ açık.</p>}
            </li>
          ))}
        </ul>
      )}
      {playoff.groups.length > MAX_GROUPS && (
        <p className="text-[11px] text-slate-400">İlk {MAX_GROUPS} grup gösteriliyor ({playoff.groups.length} gruptan).</p>
      )}
      <PlayoffRuleNote />
    </section>
  );
};
