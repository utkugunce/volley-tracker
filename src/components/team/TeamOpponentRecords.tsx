"use client";

import React, { useState } from "react";
import { Swords } from "lucide-react";
import { TeamVolleyboxLink } from "@/components/TeamVolleyboxLink";
import type { OpponentRecord } from "@/utils/teamStats";

interface TeamOpponentRecordsProps {
  records: OpponentRecord[];
  category?: string;
  city?: string;
  /** İlk görünümde gösterilecek rakip sayısı. */
  initialCount?: number;
}

/** Rakip bazında geçmiş sonuçlar (head-to-head özeti). Karşılaşma yoksa bölüm gizlenir. */
export const TeamOpponentRecords: React.FC<TeamOpponentRecordsProps> = ({
  records,
  category,
  city,
  initialCount = 8,
}) => {
  const [showAll, setShowAll] = useState(false);
  if (records.length === 0) return null;

  const visible = showAll ? records : records.slice(0, initialCount);

  return (
    <section aria-labelledby="team-h2h-title" className="space-y-3">
      <h2 id="team-h2h-title" className="text-lg font-bold text-white flex items-center gap-2">
        <Swords size={18} className="text-primary" />
        <span>Rakip Bazında Geçmiş Sonuçlar</span>
      </h2>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {visible.map((r) => (
          <li
            key={r.slug}
            className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-sm font-semibold text-white">
                <TeamVolleyboxLink teamName={r.opponent} category={category} city={city} className="text-left" />
              </div>
              <div className="shrink-0 text-xs font-mono text-slate-300" aria-label={`${r.wins} galibiyet, ${r.losses} mağlubiyet`}>
                <span className="text-done font-black">{r.wins}G</span>
                <span className="mx-1 text-slate-500">–</span>
                <span className="text-form-loss font-black">{r.losses}M</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                {r.meetings.slice(-5).map((mt) => (
                  <span
                    key={mt.id}
                    title={`${mt.date} • ${mt.score} • ${mt.isHome ? "İç saha" : "Deplasman"}`}
                    className={`w-5 h-5 rounded-md text-[10px] font-black font-mono flex items-center justify-center border ${
                      mt.result === "W" ? "text-done border-done" : "text-form-loss border-form-loss"
                    }`}
                  >
                    {mt.result === "W" ? "G" : "M"}
                  </span>
                ))}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Set {r.setsFor}-{r.setsAgainst}
                {r.upcoming > 0 ? ` • ${r.upcoming} maç kaldı` : ""}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {records.length > initialCount && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          {showAll ? "Daha az göster" : `Tüm rakipleri göster (${records.length})`}
        </button>
      )}
    </section>
  );
};
