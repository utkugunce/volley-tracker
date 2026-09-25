"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Trophy, HelpCircle, ChevronRight, Shield, User, Download, Star, Swords } from "lucide-react";
import { Kadinlar2LigGroup, Kadinlar2LigTeam } from "@/types/kadinlar2Lig";
import { slugify } from "@/utils/slugify";
import { useFavorites } from "@/utils/useFavorites";
import { triggerHaptic } from "@/utils/haptics";

interface Kadinlar2LigStandingsProps {
  group: Kadinlar2LigGroup;
  searchQuery?: string;
  showOnlyFavorites?: boolean;
}

export const Kadinlar2LigStandings: React.FC<Kadinlar2LigStandingsProps> = ({
  group,
  searchQuery = "",
  showOnlyFavorites = false,
}) => {
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  const teams = group?.puan_durumu || [];
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (showOnlyFavorites && !isFavorite(t.takim_adi)) return false;
      if (searchQuery && !t.takim_adi.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [teams, showOnlyFavorites, searchQuery, isFavorite]);

  const handleDownloadCsv = () => {
    const BOM = "\uFEFF";
    const header = [
      "Sıra",
      "Takım",
      "Oynadığı",
      "Galibiyet",
      "Mağlubiyet",
      "Puan",
      "Aldığı Set",
      "Verdiği Set",
      "Set Oranı",
      "Aldığı Sayı",
      "Verdiği Sayı",
      "Sayı Oranı",
    ].join(";");
    const rows = teams.map((row) => {
      const escapedTeam = row.takim_adi.includes(";") || row.takim_adi.includes('"')
        ? `"${row.takim_adi.replace(/"/g, '""')}"`
        : row.takim_adi;
      return [
        row.sira,
        escapedTeam,
        row.o,
        row.g,
        row.m,
        row.p,
        row.as,
        row.vs,
        row.sav,
        row.asp,
        row.vsp,
        row.spav,
      ].join(";");
    });
    const csvContent = BOM + [header, ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `kadinlar-2-ligi-${slugify(group.grup_adi)}-puan-durumu.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Grup Başlık Kartı */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-purple-950/60 via-[#181130] to-purple-950/40 p-4 rounded-2xl border border-purple-800/40 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold shadow-md shadow-purple-900/30">
            <Trophy size={20} className="text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                {group.grup_adi} Puan Durumu
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-700/50 text-purple-300 font-mono">
                {teams.length} Kulüp
              </span>
            </div>
            <p className="text-xs text-purple-300/70">
              Resmi TVF Puan Cetveli • İlk 2 takım Final/Play-Off Etabına yükselir
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* CSV İndir Butonu */}
          <button
            onClick={handleDownloadCsv}
            className="text-xs px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 hover:text-white border border-purple-700/50 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 font-semibold"
            title="Puan tablosunu Excel uyumlu CSV olarak indir"
          >
            <Download size={13} className="text-emerald-400" />
            <span>CSV İndir</span>
          </button>

          {/* Detaylı Skorlar Toggle */}
          <button
            onClick={() => setShowDetailedStats(!showDetailedStats)}
            className="text-xs px-3 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/50 text-purple-200 hover:text-white border border-purple-700/40 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>{showDetailedStats ? "Detayları Gizle" : "Detaylı Skorlar"}</span>
            <ChevronRight size={13} className={`transform transition-transform ${showDetailedStats ? "rotate-90" : ""}`} />
          </button>
        </div>
      </div>

      {/* Puan Durumu Tablosu */}
      <div className="bg-[#120d24]/90 border border-purple-900/40 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200 border-collapse">
            <thead>
              <tr className="bg-[#1a1236] border-b border-purple-800/50 text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12">#</th>
                <th className="py-3 px-3 min-w-[200px]">Takım</th>
                <th className="py-3 px-2 text-center w-10" title="Oynanan Maç">O</th>
                <th className="py-3 px-2 text-center w-10" title="Galibiyet">G</th>
                <th className="py-3 px-2 text-center w-10" title="Mağlubiyet">M</th>
                <th className="py-3 px-2 text-center w-12 font-extrabold text-amber-300 bg-amber-950/20" title="Puan">P</th>
                <th className="py-3 px-2 text-center hidden md:table-cell" title="Alınan Set - Verilen Set (Oran)">Set (AS-VS)</th>
                <th className="py-3 px-2 text-center hidden lg:table-cell" title="Alınan Sayı - Verilen Sayı (Oran)">Sayı (ASP-VSP)</th>
                {showDetailedStats && (
                  <>
                    <th className="py-3 px-2 text-center text-emerald-400 bg-purple-950/40 hidden xl:table-cell" title="3-0 Galibiyet">3-0</th>
                    <th className="py-3 px-2 text-center text-emerald-400 bg-purple-950/40 hidden xl:table-cell" title="3-1 Galibiyet">3-1</th>
                    <th className="py-3 px-2 text-center text-emerald-400 bg-purple-950/40 hidden xl:table-cell" title="3-2 Galibiyet">3-2</th>
                    <th className="py-3 px-2 text-center text-rose-400 bg-purple-950/40 hidden xl:table-cell" title="2-3 Mağlubiyet">2-3</th>
                    <th className="py-3 px-2 text-center text-rose-400 bg-purple-950/40 hidden xl:table-cell" title="1-3 Mağlubiyet">1-3</th>
                    <th className="py-3 px-2 text-center text-rose-400 bg-purple-950/40 hidden xl:table-cell" title="0-3 Mağlubiyet">0-3</th>
                  </>
                )}
                <th className="py-3 px-3 text-right">Kadro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/30">
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-400 text-xs">
                    Aranan kriterlere uygun takım bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team, idx) => {
                  const isPlayoff = team.sira <= 2;
                  const isRelegation = team.sira > filteredTeams.length - 2 && filteredTeams.length > 6;

                  return (
                    <tr
                      key={team.takim_id || idx}
                      className={`hover:bg-purple-900/20 transition-colors ${
                        isPlayoff
                          ? "bg-purple-950/15"
                          : ""
                      }`}
                    >
                      {/* Sıra & Gösterge */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                              team.sira === 1
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs"
                                : team.sira === 2
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                : "text-slate-400"
                            }`}
                          >
                            {team.sira}
                          </span>
                        </div>
                      </td>

                      {/* Takım Logo & İsim */}
                      <td className="py-2.5 px-3">
                        <Link
                          href={`/takim/${slugify(team.takim_adi)}`}
                          className="flex items-center gap-2.5 group/team cursor-pointer"
                          title={`${team.takim_adi} Detaylı Kulüp Profili`}
                        >
                          {team.logo && !team.logo.includes("takimlogoyok") ? (
                            <Image
                              src={team.logo}
                              alt={team.takim_adi}
                              width={24}
                              height={24}
                              className="w-6 h-6 object-contain rounded-md shrink-0 bg-white/5 p-0.5 group-hover/team:scale-110 transition-transform"
                              unoptimized={team.logo.startsWith("http")}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-md bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-[10px] text-purple-300 font-bold shrink-0 group-hover/team:border-pink-500 transition-colors">
                              {team.takim_adi.slice(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-100 group-hover/team:text-pink-300 transition-colors truncate block text-xs sm:text-[13px] group-hover/team:underline underline-offset-2">
                                {team.takim_adi}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  triggerHaptic("selection");
                                  toggleFavorite(team.takim_adi);
                                }}
                                className="shrink-0 p-0.5"
                                title={isFavorite(team.takim_adi) ? "Favorilerden çıkar" : "Favorilere ekle"}
                              >
                                <Star
                                  size={11}
                                  className={
                                    isFavorite(team.takim_adi)
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-purple-400/40 hover:text-amber-300"
                                  }
                                />
                              </button>
                            </div>
                            {isPlayoff && (
                              <span className="text-[10px] text-amber-400/90 font-medium">
                                ★ Play-Off Hattı
                              </span>
                            )}
                          </div>
                        </Link>
                      </td>

                      {/* O, G, M */}
                      <td className="py-2.5 px-2 text-center font-mono text-slate-300">{team.o}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-400">{team.g}</td>
                      <td className="py-2.5 px-2 text-center font-mono text-rose-400">{team.m}</td>

                      {/* Puan (Vurgulu) */}
                      <td className="py-2.5 px-2 text-center font-mono font-black text-amber-300 bg-amber-950/20 text-sm">
                        {team.p}
                      </td>

                      {/* Setler */}
                      <td className="py-2.5 px-2 text-center font-mono text-slate-300 hidden md:table-cell">
                        <span>{team.as}:{team.vs}</span>
                        <span className="text-[10px] text-slate-500 ml-1">({team.sav})</span>
                      </td>

                      {/* Sayılar */}
                      <td className="py-2.5 px-2 text-center font-mono text-slate-300 hidden lg:table-cell">
                        <span>{team.asp}:{team.vsp}</span>
                        <span className="text-[10px] text-slate-500 ml-1">({team.spav})</span>
                      </td>

                      {/* Detaylı Skorlar */}
                      {showDetailedStats && (
                        <>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-300 hidden xl:table-cell">{team.a3_0}</td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-300 hidden xl:table-cell">{team.a3_1}</td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-300 hidden xl:table-cell">{team.a3_2}</td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-400 hidden xl:table-cell">{team.v2_3}</td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-400 hidden xl:table-cell">{team.v1_3}</td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-400 hidden xl:table-cell">{team.v0_3}</td>
                        </>
                      )}

                      {/* Profil, Karşılaştır & Volleybox Butonları */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/karsilastir?takim1=${slugify(team.takim_adi)}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 hover:text-white border border-amber-800/50 text-[11px] font-semibold transition-all shadow-xs"
                            title="Bu takımı başka bir takımla karşılaştır"
                          >
                            <Swords size={10} />
                            <span className="hidden sm:inline">H2H</span>
                          </Link>

                          <Link
                            href={`/takim/${slugify(team.takim_adi)}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-900/50 hover:bg-purple-800 text-purple-200 hover:text-white border border-purple-700/40 text-[11px] font-semibold transition-all shadow-xs"
                            title={`${team.takim_adi} Kulüp Profilini Aç`}
                          >
                            <span>Profil</span>
                          </Link>
                          {team.volleybox_url ? (
                            <a
                              href={team.volleybox_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 hover:text-white border border-cyan-700/40 text-[11px] font-medium transition-all shadow-xs"
                              title={`${team.takim_adi} Volleybox Kadro ve İstatistikleri`}
                            >
                              <span>Volleybox</span>
                              <ExternalLink size={9} />
                            </a>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Tablo Alt Açıklama Lejantı */}
        <div className="bg-[#160f2e] border-t border-purple-900/40 px-4 py-2.5 flex flex-wrap items-center justify-between text-[11px] text-purple-300/70 gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs"></span>
              <span>1. & 2. Sıra: Yarı Final / Play-Off Etabı</span>
            </span>
            <span className="text-purple-600">•</span>
            <span>P: Puan • O: Oynanan • G: Galibiyet • M: Mağlubiyet</span>
          </div>
          <span className="font-mono text-purple-400">TVF Resmi Puanlama Sistemi (3-0/3-1: 3P, 3-2: 2P, 2-3: 1P)</span>
        </div>
      </div>
    </div>
  );
};
