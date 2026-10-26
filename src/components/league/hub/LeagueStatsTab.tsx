"use client";

import { Trophy, Flame, Shield, MapPin } from "lucide-react";
import { LeagueData } from "@/utils/leagueData";

export interface LeagueStatsTabProps {
  league: LeagueData;
}

export function LeagueStatsTab({ league }: LeagueStatsTabProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lider Takım */}
        <div className="bg-surface p-5 rounded-xl border border-line">
          <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-3">
            <Trophy size={18} />
          </div>
          <span className="text-[11px] font-bold text-primary block uppercase tracking-wider">
            Lig Sıralaması Lideri
          </span>
          <h3 className="text-lg font-black text-ink mt-1">
            {league.stats.leaderTeam?.name || "Belirlenmedi"}
          </h3>
          <div className="flex items-center gap-3 mt-3 text-xs text-ink-2">
            <span>
              Puan:{" "}
              <strong className="text-ink font-mono tabular-nums">
                {league.stats.leaderTeam?.points || 0}
              </strong>
            </span>
            <span>•</span>
            <span>
              Galibiyet:{" "}
              <strong className="text-done font-mono tabular-nums">
                {league.stats.leaderTeam?.won || 0}
              </strong>
            </span>
          </div>
        </div>

        {/* En Çok Set Kazanan Takım */}
        <div className="bg-surface p-5 rounded-xl border border-line">
          <div className="w-9 h-9 rounded-lg bg-surface-muted text-ink flex items-center justify-center mb-3">
            <Flame size={18} />
          </div>
          <span className="text-[11px] font-bold text-ink-2 block uppercase tracking-wider">
            En Çok Set Kazanan
          </span>
          <h3 className="text-lg font-black text-ink mt-1">
            {league.stats.mostSetsWonTeam?.name || "Belirlenmedi"}
          </h3>
          <div className="flex items-center gap-3 mt-3 text-xs text-ink-2">
            <span>
              Kazanılan Set:{" "}
              <strong className="text-ink font-mono tabular-nums">
                {league.stats.mostSetsWonTeam?.setsWon || 0}
              </strong>
            </span>
          </div>
        </div>

        {/* Namağlup Takımlar */}
        <div className="bg-surface p-5 rounded-xl border border-line">
          <div className="w-9 h-9 rounded-lg bg-done/15 text-done flex items-center justify-center mb-3">
            <Shield size={18} />
          </div>
          <span className="text-[11px] font-bold text-done block uppercase tracking-wider">
            Namağlup Takımlar
          </span>
          <h3 className="text-base font-bold text-ink mt-1">
            {league.stats.undefeatedTeams.length > 0
              ? league.stats.undefeatedTeams.join(", ")
              : "Namağlup takım kalmadı"}
          </h3>
          <div className="flex items-center gap-3 mt-3 text-xs text-ink-2">
            <span>Toplam {league.stats.undefeatedTeams.length} Takım Kayıpsız</span>
          </div>
        </div>
      </div>

      {/* Salon Listesi */}
      <div className="bg-surface p-5 rounded-xl border border-line">
        <h3 className="text-xs sm:text-sm font-bold text-ink flex items-center gap-2 mb-3">
          <MapPin size={15} className="text-primary" />
          <span>Bu Ligin Oynandığı Spor Salonları ({league.halls.length})</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {league.halls.map((h) => (
            <span
              key={h}
              className="text-xs bg-surface-muted text-ink-2 border border-line px-3 py-1 rounded-lg"
            >
              {h}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
