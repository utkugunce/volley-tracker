"use client";

import React from "react";
import { Match } from "../types";
import { TeamLogo } from "./TeamLogo";
import { ChevronRight, Flame } from "lucide-react";

interface MatchTickerProps {
  matches: Match[];
  onSelectMatch?: (match: Match) => void;
}

export const MatchTicker: React.FC<MatchTickerProps> = ({ matches, onSelectMatch }) => {
  if (!matches || matches.length === 0) return null;

  // İlk 10 yaklaşan maçı ticker'a al
  const tickerMatches = matches.slice(0, 10);

  return (
    <div className="border-b border-court-border/70 bg-black/40 backdrop-blur-md overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3">
        
        {/* Ticker Başlığı */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-500/20 text-brand-400 border border-brand-500/30 text-[11px] font-black uppercase tracking-wider shrink-0 select-none">
          <Flame className="w-3 h-3 text-brand-400 animate-pulse" />
          <span>Fikstür Bantı</span>
        </div>

        {/* Yatay Kayan Maçlar */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
          {tickerMatches.map((m) => (
            <div
              key={m.id}
              onClick={() => onSelectMatch?.(m)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-court-panel/90 border border-court-border hover:border-brand-500/50 hover:bg-court-hover transition-all cursor-pointer shrink-0 shadow-sm group"
            >
              {/* Tarih / Saat */}
              <div className="text-right border-r border-court-border/70 pr-2">
                <span className="text-[10px] font-bold text-brand-400 block leading-none">
                  {m.time || "TBD"}
                </span>
                <span className="text-[9px] text-slate-400 block leading-tight font-medium">
                  {m.date ? `${m.date.slice(8, 10)} Eyl` : ""}
                </span>
              </div>

              {/* Takımlar ve Armalar */}
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <div className="flex items-center gap-1.5">
                  <TeamLogo name={m.home_team} size="sm" />
                  <span className="truncate max-w-[90px] text-slate-200 group-hover:text-white">
                    {m.home_team}
                  </span>
                </div>

                <span className="text-[10px] font-bold text-slate-500">v</span>

                <div className="flex items-center gap-1.5">
                  <TeamLogo name={m.away_team} size="sm" />
                  <span className="truncate max-w-[90px] text-slate-200 group-hover:text-white">
                    {m.away_team}
                  </span>
                </div>
              </div>

              {/* Lig Rozeti */}
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 ml-1 shrink-0">
                {m.league_code}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
