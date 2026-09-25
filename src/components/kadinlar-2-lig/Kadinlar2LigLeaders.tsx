"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Trophy, ArrowRight, Layers, CheckCircle2 } from "lucide-react";
import { Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
import { slugify } from "@/utils/slugify";
import { useFavorites } from "@/utils/useFavorites";

interface Kadinlar2LigLeadersProps {
  groups: Kadinlar2LigGroup[];
  onSelectGroup: (groupNo: number, tab?: "standings" | "fixtures") => void;
  searchQuery?: string;
  showOnlyFavorites?: boolean;
}

export const Kadinlar2LigLeaders: React.FC<Kadinlar2LigLeadersProps> = ({
  groups,
  onSelectGroup,
  searchQuery = "",
  showOnlyFavorites = false,
}) => {
  const { isFavorite } = useFavorites();

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      if (showOnlyFavorites) {
        const hasFavTeam = group.puan_durumu.some((t) => isFavorite(t.takim_adi));
        if (!hasFavTeam) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = group.grup_adi.toLowerCase().includes(q);
        const matchesTeam = group.puan_durumu.some((t) => t.takim_adi.toLowerCase().includes(q));
        if (!matchesName && !matchesTeam) return false;
      }
      return true;
    });
  }, [groups, showOnlyFavorites, searchQuery, isFavorite]);

  return (
    <div className="space-y-4">
      {/* 1. Üst Bilgi Kartı */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <Layers size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
              16 Grup İlerlemesi, Liderler ve Çeyrek Final Hattı
            </h2>
            <p className="text-xs text-slate-400">
              Her gruptan ilk 2 sırayı alan takımlar (toplam 32 kulüp) TVF Çeyrek Final etabına yükselir
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
          {filteredGroups.length} / 16 Grup
        </span>
      </div>

      {/* 2. 16 Grup Kartları Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredGroups.map((group) => {
          const topTeams = group.puan_durumu.slice(0, 3);
          const totalMatches = group.fikstur?.length || group.mac_sayisi || 0;
          const completedMatches = group.fikstur
            ? group.fikstur.filter(
                (m) => m.durum === "BİTTİ" || (m.skor && m.skor.includes("-") && m.skor.trim() !== "-")
              ).length
            : 0;
          const progressPercent = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

          return (
            <div
              key={group.grup_no}
              className="glass-panel border border-slate-800/80 hover:border-slate-700 bg-slate-900/65 hover:bg-slate-850/90 rounded-2xl p-4 transition-all shadow-card hover:shadow-card-hover flex flex-col justify-between gap-3.5 group"
            >
              {/* Grup Başlığı */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <h3 className="font-extrabold text-xs sm:text-sm text-white uppercase tracking-tight">
                      {group.grup_adi}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {group.takim_sayisi} Takım
                  </span>
                </div>

                {/* Sezon İlerleme Çubuğu */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Oynanan: {completedMatches}/{totalMatches}</span>
                    <span className="font-bold text-slate-300">%{progressPercent}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-red-600 to-rose-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* İlk 3 Takım (Liderler & Play-off) */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Grup Sıralaması:
                  </div>
                  {topTeams.length === 0 ? (
                    <div className="text-[11px] text-slate-500 italic py-2">
                      Henüz maç oynanmadı
                    </div>
                  ) : (
                    topTeams.map((team) => (
                      <div
                        key={team.takim_id}
                        className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className={`w-4 text-center font-mono font-bold text-[11px] ${
                              team.sira <= 2 ? "text-emerald-400" : "text-slate-400"
                            }`}
                          >
                            {team.sira}.
                          </span>
                          <Link
                            href={`/takim/${slugify(team.takim_adi)}`}
                            className="text-slate-200 hover:text-rose-400 truncate text-[11px] font-semibold"
                            title={`${team.takim_adi} Kulüp Sayfası`}
                          >
                            {team.takim_adi}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                          <span className="text-slate-400">{team.g}G</span>
                          <span className="font-black text-white bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                            {team.p}P
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Alt Butonlar: Puan Durumu & Fikstür */}
              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => onSelectGroup(group.grup_no, "standings")}
                  className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold transition-all text-center cursor-pointer active:scale-95"
                >
                  Puan Cetveli
                </button>
                <button
                  onClick={() => onSelectGroup(group.grup_no, "fixtures")}
                  className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold transition-all text-center cursor-pointer active:scale-95"
                >
                  Fikstür
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
