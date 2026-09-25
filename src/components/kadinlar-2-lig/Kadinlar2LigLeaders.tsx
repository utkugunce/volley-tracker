"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Trophy, ArrowRight, Shield, Calendar, Star, CheckCircle2, TrendingUp, Layers } from "lucide-react";
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
      {/* Üst Bilgi Kartı */}
      <div className="bg-[#120d24]/90 border border-purple-900/40 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
            <Layers size={19} className="text-pink-400" />
            <span>16 Grup Statüsü, Liderler & Sezon İlerlemesi</span>
          </h2>
          <p className="text-xs text-purple-300/70">
            Her grubun maç tamamlama oranı, lider ve Play-off hattı takımları ve puan cetveli özeti
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-xl bg-purple-950/70 border border-purple-700/50 text-purple-300">
            {filteredGroups.length} / 16 Grup Gösteriliyor
          </span>
        </div>
      </div>

      {/* 16 Grup Kartları Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {filteredGroups.map((group) => {
          const topTeams = group.puan_durumu.slice(0, 3);
          const totalMatches = group.fikstur?.length || group.mac_sayisi || 0;
          const completedMatches = group.fikstur
            ? group.fikstur.filter(
                (m) => m.durum === "BİTTİ" || (m.skor && m.skor.includes("-") && m.skor.trim() !== "-")
              ).length
            : 0;
          const progressPercent = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
          const favCountInGroup = group.puan_durumu.filter((t) => isFavorite(t.takim_adi)).length;

          return (
            <div
              key={group.grup_no}
              className="bg-[#130d29]/90 hover:bg-[#1a1238] border border-purple-900/40 hover:border-purple-600/50 rounded-2xl p-4 transition-all shadow-md hover:shadow-xl backdrop-blur-sm flex flex-col justify-between gap-3.5 group relative overflow-hidden"
            >
              {/* Grup Başlığı & Rozetler */}
              <div>
                <div className="flex items-center justify-between border-b border-purple-900/30 pb-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-white group-hover:text-pink-300 transition-colors">
                      {group.grup_adi}
                    </span>
                    {favCountInGroup > 0 && (
                      <span
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold"
                        title={`${favCountInGroup} favori kulübünüz bu grupta yer alıyor`}
                      >
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        <span>{favCountInGroup}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-purple-300">
                    <span className="bg-purple-950 px-1.5 py-0.5 rounded-md border border-purple-800/40">
                      {group.takim_sayisi} Takım
                    </span>
                  </div>
                </div>

                {/* İlerleme Çubuğu */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between text-[10px] text-purple-300/80 font-mono">
                    <span className="flex items-center gap-1">
                      <TrendingUp size={11} className="text-pink-400" />
                      İlerleme: %{progressPercent}
                    </span>
                    <span>
                      {completedMatches}/{totalMatches} Maç
                    </span>
                  </div>
                  <div className="w-full bg-[#0d091e] rounded-full h-1.5 overflow-hidden border border-purple-900/40">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, progressPercent)}%` }}
                    />
                  </div>
                </div>

                {/* İlk 3 Takım / Liderler Listesi */}
                <div className="space-y-1.5">
                  {topTeams.map((t, idx) => {
                    const isFav = isFavorite(t.takim_adi);
                    return (
                      <Link
                        key={t.takim_id || idx}
                        href={`/takim/${slugify(t.takim_adi)}`}
                        className={`flex items-center justify-between p-1.5 rounded-xl text-xs transition-all hover:scale-102 hover:border-purple-500/50 cursor-pointer block border ${
                          idx === 0
                            ? "bg-amber-950/25 border-amber-500/40 text-amber-200"
                            : idx === 1
                            ? "bg-indigo-950/25 border-indigo-500/30 text-indigo-200"
                            : "bg-purple-950/20 border-transparent hover:bg-purple-900/30 text-slate-200"
                        }`}
                        title={`${t.takim_adi} Kulüp Profili`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              idx === 0
                                ? "bg-amber-500/30 text-amber-300"
                                : idx === 1
                                ? "bg-indigo-500/30 text-indigo-300"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-semibold truncate text-[11px] block hover:text-white">
                            {t.takim_adi}
                          </span>
                          {isFav && (
                            <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 pl-1">
                          <span className="font-mono font-bold text-amber-300 text-xs">
                            {t.p}P
                          </span>
                          {idx === 0 && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                              Lider
                            </span>
                          )}
                          {idx === 1 && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                              Playoff
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Hızlı Aksiyonlar */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={() => onSelectGroup(group.grup_no, "standings")}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 hover:text-white border border-purple-700/40 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer"
                  title="Puan Cetvelini Aç"
                >
                  <Trophy size={11} className="text-amber-400" />
                  <span>Puan Durumu</span>
                </button>

                <button
                  onClick={() => onSelectGroup(group.grup_no, "fixtures")}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-pink-950/40 hover:bg-pink-900/60 text-pink-200 hover:text-white border border-pink-700/40 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer"
                  title="Fikstürü Aç"
                >
                  <Calendar size={11} className="text-pink-400" />
                  <span>Fikstür</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

