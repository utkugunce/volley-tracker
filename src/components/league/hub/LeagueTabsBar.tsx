"use client";

import React from "react";
import type { LeagueTabType } from "./types";
import { Trophy, Calendar, CheckCircle2, Activity, Users } from "lucide-react";
import { LeagueData } from "@/utils/leagueData";

export interface LeagueTabsBarProps {
  activeTab: LeagueTabType;
  groupNames: string[];
  league: LeagueData;
  selectedGroup: string;
  setActiveTab: React.Dispatch<React.SetStateAction<LeagueTabType>>;
  setSelectedGroup: React.Dispatch<React.SetStateAction<string>>;
}

export function LeagueTabsBar({ activeTab, groupNames, league, selectedGroup, setActiveTab, setSelectedGroup }: LeagueTabsBarProps) {
  return (
    <div className="bg-surface-muted/95 border-b border-slate-800/80 sticky top-[57px] z-30 px-4 py-2.5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Ana Sekmeler */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab("standings")}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === "standings"
                ? "bg-selected-strong text-white font-bold shadow-glow-selected"
                : "text-slate-400 hover:text-white hover:bg-slate-800/70"
            }`}
          >
            <Trophy size={14} />
            <span>Puan Durumu</span>
          </button>

          <button
            onClick={() => setActiveTab("fixtures")}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === "fixtures"
                ? "bg-selected-strong text-white font-bold shadow-glow-selected"
                : "text-slate-400 hover:text-white hover:bg-slate-800/70"
            }`}
          >
            <Calendar size={14} />
            <span>Fikstür ({league.stats.upcomingMatches})</span>
          </button>

          <button
            onClick={() => setActiveTab("results")}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === "results"
                ? "bg-selected-strong text-white font-bold shadow-glow-selected"
                : "text-slate-400 hover:text-white hover:bg-slate-800/70"
            }`}
          >
            <CheckCircle2 size={14} />
            <span>Sonuçlar ({league.stats.finishedMatches})</span>
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === "stats"
                ? "bg-selected-strong text-white font-bold shadow-glow-selected"
                : "text-slate-400 hover:text-white hover:bg-slate-800/70"
            }`}
          >
            <Activity size={14} />
            <span>İstatistikler & Liderler</span>
          </button>

          <button
            onClick={() => setActiveTab("teams")}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === "teams"
                ? "bg-selected-strong text-white font-bold shadow-glow-selected"
                : "text-slate-400 hover:text-white hover:bg-slate-800/70"
            }`}
          >
            <Users size={14} />
            <span>Takımlar ({league.stats.totalTeams})</span>
          </button>
        </div>

        {/* Grup Filtresi (Birden fazla grup varsa göster) */}
        {groupNames.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs shrink-0">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Grup:</span>
            <button
              onClick={() => setSelectedGroup("all")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
                selectedGroup === "all"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                  : "bg-slate-800/80 text-slate-400 hover:text-white"
              }`}
            >
              Tüm Gruplar
            </button>
            {groupNames.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
                  selectedGroup === g
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                    : "bg-slate-800/80 text-slate-400 hover:text-white"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
