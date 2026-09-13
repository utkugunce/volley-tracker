"use client";

import React from "react";
import { TeamLogo } from "./TeamLogo";
import { Shield, Sparkles } from "lucide-react";

interface ClubQuickFilterProps {
  selectedClub: string;
  onSelectClub: (clubName: string) => void;
  clubs: Array<{ name: string; count: number }>;
}

export const ClubQuickFilter: React.FC<ClubQuickFilterProps> = ({
  selectedClub,
  onSelectClub,
  clubs,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-brand-400" />
          <span>Popüler Kadın Voleybol Kulüpleri</span>
        </span>
        {selectedClub && (
          <button
            onClick={() => onSelectClub("")}
            className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 underline"
          >
            Kulüp Filtresini Kaldır
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {/* Tümü Butonu */}
        <button
          onClick={() => onSelectClub("")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
            !selectedClub
              ? "bg-brand-500 text-white border-brand-400 shadow-glow"
              : "bg-court-card text-slate-300 border-court-border hover:border-slate-500"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tüm Kulüpler</span>
        </button>

        {/* Kulüp Kartları */}
        {clubs.map((c) => {
          const isSelected = selectedClub.toLowerCase() === c.name.toLowerCase();
          return (
            <button
              key={c.name}
              onClick={() => onSelectClub(isSelected ? "" : c.name)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all shrink-0 ${
                isSelected
                  ? "bg-brand-500/20 text-white border-brand-400 shadow-glow"
                  : "bg-court-card text-slate-300 border-court-border hover:border-slate-500 hover:bg-court-hover"
              }`}
            >
              <TeamLogo name={c.name} size="sm" />
              <span className="text-xs font-bold truncate max-w-[120px]">{c.name}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  isSelected ? "bg-brand-500 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                {c.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
