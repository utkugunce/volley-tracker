"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { TeamBadge } from "@/components/TeamBadge";
import { ExternalLink, Search, Trophy, ArrowRight, User, Star, Swords } from "lucide-react";
import { Kadinlar2LigTeam } from "@/types/kadinlar2Lig";
import { slugify } from "@/utils/slugify";
import { useFavorites } from "@/utils/useFavorites";
import { triggerHaptic } from "@/utils/haptics";
import { getVolleyboxMapping } from "@/utils/volleybox";
import { getKadinlar2LigTeamName, getKadinlar2LigTeamNameVariants, K2_CATEGORY } from "@/utils/kadinlar2LigConverter";

interface Kadinlar2LigTeamsProps {
  teams: Kadinlar2LigTeam[];
  onSelectGroup?: (groupNo: number) => void;
  searchQuery?: string;
  showOnlyFavorites?: boolean;
}

export const Kadinlar2LigTeams: React.FC<Kadinlar2LigTeamsProps> = ({
  teams,
  onSelectGroup,
  searchQuery = "",
  showOnlyFavorites = false,
}) => {
  const [filterGroup, setFilterGroup] = useState<number | "all">("all");
  const { isFavorite, toggleFavorite } = useFavorites();

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const displayName = getKadinlar2LigTeamName(t.takim_adi, t.volleybox_name);
      if (showOnlyFavorites && !getKadinlar2LigTeamNameVariants(t.takim_adi, t.volleybox_name).some((n) => isFavorite(n))) return false;
      if (filterGroup !== "all" && t.grup_no !== filterGroup) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.takim_adi.toLowerCase().includes(q) && !displayName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [teams, showOnlyFavorites, filterGroup, searchQuery, isFavorite]);

  return (
    <div className="space-y-4">
      {/* 1. Üst Bilgi Kartı */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
            <span>Kadınlar 2. Ligi Kulüpleri</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 font-mono">
              {filteredTeams.length} / {teams.length} Takım
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            16 gruptaki tüm kulüplerin resmi TVF bilgileri ve Volleybox oyuncu/teknik ekip kadroları
          </p>
        </div>

        {/* Grup Filtresi Dropdown */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Filtre:</span>
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/40 cursor-pointer"
          >
            <option value="all">Tüm Gruplar (1-16)</option>
            {Array.from({ length: 16 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>
                Grup {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Takım Kartları Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredTeams.map((team, idx) => {
          const vb = getVolleyboxMapping(team.takim_adi, K2_CATEGORY);
          const displayName = getKadinlar2LigTeamName(team.takim_adi, team.volleybox_name);
          const logoSrc = (team.logo && !team.logo.includes("takimlogoyok")) ? team.logo : (vb?.local_logo || vb?.logo_url);
          const vbUrl = team.volleybox_url || vb?.volleybox_url;
          const isFav = isFavorite(displayName) || isFavorite(team.takim_adi);

          return (
            <div
              key={team.takim_id || idx}
              className="glass-panel border border-slate-800/80 hover:border-slate-700 bg-slate-900/65 hover:bg-slate-850/90 rounded-2xl p-3.5 transition-all shadow-card hover:shadow-card-hover flex flex-col justify-between gap-3 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <Link prefetch={false}
                    href={`/takim/${slugify(displayName)}`}
                    className="shrink-0 hover:opacity-80 transition-opacity"
                    title={`${displayName} Kulüp Profili`}
                  >
                    <TeamBadge name={displayName} size="md" />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Link prefetch={false}
                        href={`/takim/${slugify(displayName)}`}
                        className="font-bold text-xs sm:text-sm text-slate-100 hover:text-ink transition-colors truncate block hover:underline underline-offset-2"
                        title={displayName !== team.takim_adi ? `${displayName} (TVF: ${team.takim_adi})` : `${displayName} Kulüp Profilini Aç`}
                      >
                        {displayName}
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic("selection");
                          toggleFavorite(displayName);
                        }}
                        className="shrink-0 p-1 min-w-[28px] min-h-[28px] flex items-center justify-center text-slate-400 hover:text-amber-400 cursor-pointer"
                        title={isFav ? "Favorilerden çıkar" : "Favorilere ekle"}
                        aria-label={isFav ? "Favorilerden çıkar" : "Favorilere ekle"}
                      >
                        <Star
                          size={13}
                          className={
                            isFav
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-400 hover:text-amber-400"
                          }
                        />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                      <button
                        onClick={() => onSelectGroup?.(team.grup_no)}
                        className="hover:text-ink transition-colors cursor-pointer"
                      >
                        Grup {team.grup_no}
                      </button>
                      <span>•</span>
                      <span className="font-mono text-[10px]">
                        {team.p > 0 ? `${team.p} Puan` : "Henüz maç yok"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Butonlar */}
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/60">
                <Link prefetch={false}
                  href={`/karsilastir?takim1=${slugify(displayName)}`}
                  className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-semibold text-center flex items-center justify-center gap-1 transition-all"
                  title="H2H Karşılaştır"
                >
                  <Swords size={10} />
                  <span>H2H</span>
                </Link>

                <Link prefetch={false}
                  href={`/takim/${slugify(displayName)}`}
                  className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-semibold text-center transition-all"
                  title="Kadro ve Detaylar"
                >
                  <span>Kadro</span>
                </Link>

                {vbUrl ? (
                  <a
                    href={vbUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1 px-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 hover:text-white border border-emerald-700/50 text-[10px] font-semibold text-center flex items-center justify-center gap-1 transition-all"
                    title={`${displayName} Volleybox Profili`}
                  >
                    <span>VB</span>
                    <ExternalLink size={9} />
                  </a>
                ) : (
                  <div className="py-1 px-1.5 rounded-lg bg-slate-900 text-slate-600 text-[10px] text-center border border-slate-800/40">
                    -
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
