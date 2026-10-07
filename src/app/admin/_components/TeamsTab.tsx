"use client";

import React from "react";
import { Users, Search } from "lucide-react";
import { LIG_TEAMS } from "./teamLists";

export interface TeamsTabProps {
  filteredTeams: string[];
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setTeamCategoryFilter: React.Dispatch<React.SetStateAction<"all" | "altyapı" | "2lig">>;
  teamCategoryFilter: "all" | "altyapı" | "2lig";
  teamsByCategory: { altyapı: string[]; lig: string[]; };
}

export function TeamsTab({ filteredTeams, searchQuery, setSearchQuery, setTeamCategoryFilter, teamCategoryFilter, teamsByCategory }: TeamsTabProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Users size={18} className="text-ink-2" />
          Takım Listesi
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={teamCategoryFilter}
            onChange={(e) => setTeamCategoryFilter(e.target.value as "all" | "altyapı" | "2lig")}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-primary"
          >
            <option value="all">Tümü ({teamsByCategory.altyapı.length + teamsByCategory.lig.length})</option>
            <option value="altyapı">Altyapı ({teamsByCategory.altyapı.length})</option>
            <option value="2lig">2. Lig ({teamsByCategory.lig.length})</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
        <div className="relative">
          <Search size={16} aria-hidden="true" className="absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Takım ara..."
            aria-label="Takım ara"
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {filteredTeams.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          {searchQuery ? "Arama kriterine uygun takım bulunamadı." : "Takım listesi boş."}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTeams.map((team, index) => (
            <div
              key={`${team}-${index}`}
              className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                  {team.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{team}</div>
                  <div className="text-[10px] text-slate-400">
                    {LIG_TEAMS.includes(team) ? "2. Lig" : "Altyapı"}
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {team.length} karakter
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-800 text-center">
        <div className="text-xs text-slate-400">
          Toplam {filteredTeams.length} takım gösteriliyor
        </div>
      </div>
    </div>
  );
}
