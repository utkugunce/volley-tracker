"use client";

import { Trophy, Flame, Shield, MapPin } from "lucide-react";
import { LeagueData } from "@/utils/leagueData";

export interface LeagueStatsTabProps {
  league: LeagueData;
}

export function LeagueStatsTab({ league }: LeagueStatsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lider Takım */}
        <div className="glass-panel p-5 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-slate-900 to-slate-900 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-3">
            <Trophy size={20} />
          </div>
          <span className="text-xs font-bold text-primary block uppercase tracking-wider">
            Lig Sıralaması Lideri
          </span>
          <h3 className="text-lg font-black text-white mt-1">
            {league.stats.leaderTeam?.name || "Belirlenmedi"}
          </h3>
          <div className="flex items-center gap-3 mt-3 text-xs text-slate-300">
            <span>Puan: <strong className="text-white font-mono">{league.stats.leaderTeam?.points || 0}</strong></span>
            <span>•</span>
            <span>Galibiyet: <strong className="text-emerald-400 font-mono">{league.stats.leaderTeam?.won || 0}</strong></span>
          </div>
        </div>

        {/* En Çok Set Kazanan Takım */}
        <div className="glass-panel p-5 rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-950/20 via-slate-900 to-slate-900 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
            <Flame size={20} />
          </div>
          <span className="text-xs font-bold text-sky-400 block uppercase tracking-wider">
            En Çok Set Kazanan
          </span>
          <h3 className="text-lg font-black text-white mt-1">
            {league.stats.mostSetsWonTeam?.name || "Belirlenmedi"}
          </h3>
          <div className="flex items-center gap-3 mt-3 text-xs text-slate-300">
            <span>Kazanılan Set: <strong className="text-white font-mono">{league.stats.mostSetsWonTeam?.setsWon || 0}</strong></span>
          </div>
        </div>

        {/* Namağlup Takımlar */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-900 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
            <Shield size={20} />
          </div>
          <span className="text-xs font-bold text-emerald-400 block uppercase tracking-wider">
            Namağlup Takımlar
          </span>
          <h3 className="text-base font-bold text-white mt-1">
            {league.stats.undefeatedTeams.length > 0
              ? league.stats.undefeatedTeams.join(", ")
              : "Namağlup takım kalmadı"}
          </h3>
          <div className="flex items-center gap-3 mt-3 text-xs text-slate-300">
            <span>Toplam {league.stats.undefeatedTeams.length} Takım Kayıpsız</span>
          </div>
        </div>
      </div>

      {/* Salon Listesi */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <MapPin size={16} className="text-ink-2" />
          <span>Bu Ligin Oynandığı Spor Salonları ({league.halls.length})</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {league.halls.map((h) => (
            <span
              key={h}
              className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-xl"
            >
              {h}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
