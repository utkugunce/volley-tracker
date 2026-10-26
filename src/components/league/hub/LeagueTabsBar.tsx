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
  const tabs: { id: LeagueTabType; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: "standings", label: "Puan Durumu", icon: Trophy },
    { id: "fixtures", label: `Fikstür (${league.stats.upcomingMatches})`, icon: Calendar },
    { id: "results", label: `Sonuçlar (${league.stats.finishedMatches})`, icon: CheckCircle2 },
    { id: "stats", label: "İstatistikler & Liderler", icon: Activity },
    { id: "teams", label: `Takımlar (${league.stats.totalTeams})`, icon: Users },
  ];

  return (
    <div className="bg-canvas border-b border-line sticky top-[49px] z-30 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
        {/* Ana Sekmeler (FotMob Bottom-Indicator Strip) */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none text-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2.5 font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? "border-primary text-ink font-bold"
                    : "border-transparent text-ink-3 hover:text-ink-2"
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Grup Filtresi (Birden fazla grup varsa göster) */}
        {groupNames.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none text-xs py-1.5 shrink-0">
            <span className="text-[11px] text-ink-3 font-semibold mr-1">Grup:</span>
            <button
              onClick={() => setSelectedGroup("all")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer shrink-0 ${
                selectedGroup === "all"
                  ? "bg-primary text-primary-fg font-bold"
                  : "bg-surface text-ink-2 hover:text-ink border border-line"
              }`}
            >
              Tüm Gruplar
            </button>
            {groupNames.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer shrink-0 ${
                  selectedGroup === g
                    ? "bg-primary text-primary-fg font-bold"
                    : "bg-surface text-ink-2 hover:text-ink border border-line"
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
