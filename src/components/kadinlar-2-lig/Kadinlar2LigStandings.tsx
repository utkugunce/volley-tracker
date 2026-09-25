"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Trophy, ChevronRight, Download, Star, Swords, CheckCircle2, ShieldAlert } from "lucide-react";
import { Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
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
      {/* Puan Durumu Tablosu Kartı */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl shadow-card overflow-hidden">
        {/* 1. Başlık Şeridi (Altyapı ile Birebir) */}
        <div className="bg-gradient-to-r from-slate-900/90 via-[#0d1424]/90 to-slate-900/90 text-white px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
              <Trophy size={13} className="text-amber-400" />
            </div>
            <h2 className="text-xs sm:text-sm font-extrabold tracking-tight truncate uppercase">
              KADINLAR 2. LİGİ • {group.grup_adi} - PUAN DURUMU
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Detaylı Skorlar Butonu */}
            <button
              onClick={() => setShowDetailedStats(!showDetailedStats)}
              className="hidden sm:inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
            >
              <span>{showDetailedStats ? "Detayları Gizle" : "Detaylı Skorlar"}</span>
              <ChevronRight size={12} className={`transform transition-transform ${showDetailedStats ? "rotate-90" : ""}`} />
            </button>

            {/* CSV İndir */}
            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Puan tablosunu Excel uyumlu CSV olarak indir"
            >
              <Download size={12} className="text-emerald-400" />
              <span className="hidden sm:inline">CSV İndir</span>
            </button>

            <span className="text-[10px] sm:text-xs text-slate-400 font-mono font-bold bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-800">
              {teams.length} Takım
            </span>
          </div>
        </div>

        {/* 2. Puan Durumu Tablosu */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px] sm:text-[11px] tracking-wider select-none">
                <th className="py-2.5 sm:py-3 px-2 text-center w-10 sm:w-12">#</th>
                <th className="py-2.5 sm:py-3 px-3 min-w-[200px]">Takım</th>
                <th className="py-2.5 sm:py-3 px-2 text-center w-9 sm:w-11" title="Oynanan Maç">O</th>
                <th className="py-2.5 sm:py-3 px-2 text-center w-9 sm:w-11" title="Galibiyet">G</th>
                <th className="py-2.5 sm:py-3 px-2 text-center w-9 sm:w-11" title="Mağlubiyet">M</th>
                <th className="py-2.5 sm:py-3 px-2.5 text-center w-14 sm:w-20 hidden md:table-cell" title="Alınan Set - Verilen Set (Oran)">Setler</th>
                <th className="py-2.5 sm:py-3 px-2.5 text-center w-16 sm:w-24 hidden lg:table-cell" title="Alınan Sayı - Verilen Sayı (Oran)">Sayılar</th>
                {showDetailedStats && (
                  <>
                    <th className="py-2.5 px-2 text-center text-emerald-400 bg-slate-900/40 hidden xl:table-cell" title="3-0 Galibiyet">3-0</th>
                    <th className="py-2.5 px-2 text-center text-emerald-400 bg-slate-900/40 hidden xl:table-cell" title="3-1 Galibiyet">3-1</th>
                    <th className="py-2.5 px-2 text-center text-emerald-400 bg-slate-900/40 hidden xl:table-cell" title="3-2 Galibiyet">3-2</th>
                    <th className="py-2.5 px-2 text-center text-rose-400 bg-slate-900/40 hidden xl:table-cell" title="2-3 Mağlubiyet">2-3</th>
                    <th className="py-2.5 px-2 text-center text-rose-400 bg-slate-900/40 hidden xl:table-cell" title="1-3 Mağlubiyet">1-3</th>
                    <th className="py-2.5 px-2 text-center text-rose-400 bg-slate-900/40 hidden xl:table-cell" title="0-3 Mağlubiyet">0-3</th>
                  </>
                )}
                <th className="py-2.5 sm:py-3 px-2 text-center w-12 sm:w-16 bg-slate-900/80 font-black text-white" title="Puan">P</th>
                <th className="py-2.5 sm:py-3 px-3 text-right w-28 sm:w-36">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-10 text-center text-slate-400 text-xs">
                    Aranan kriterlere uygun takım bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team, idx) => {
                  const isPlayoff = team.sira <= 2;
                  const isRelegation = team.sira > teams.length - 2 && teams.length > 4;

                  return (
                    <tr
                      key={team.takim_id || idx}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isPlayoff
                          ? "border-l-4 border-l-emerald-500 bg-emerald-950/15"
                          : isRelegation
                          ? "border-l-4 border-l-rose-500 bg-rose-950/15"
                          : "border-l-4 border-l-transparent"
                      }`}
                    >
                      {/* Sıra Numarası */}
                      <td className="py-2 sm:py-2.5 px-2 text-center">
                        <span
                          className={`font-black font-mono text-xs ${
                            isPlayoff
                              ? "text-emerald-400"
                              : isRelegation
                              ? "text-rose-400"
                              : "text-slate-400"
                          }`}
                        >
                          {team.sira}
                        </span>
                      </td>

                      {/* Takım Logo & İsim */}
                      <td className="py-2 sm:py-2.5 px-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Link
                            href={`/takim/${slugify(team.takim_adi)}`}
                            className="shrink-0 hover:opacity-80 transition-opacity"
                            title={`${team.takim_adi} Kulüp Profili`}
                          >
                            {team.logo && !team.logo.includes("takimlogoyok") ? (
                              <Image
                                src={team.logo}
                                alt={team.takim_adi}
                                width={22}
                                height={22}
                                className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded-md shrink-0 bg-white/5 p-0.5"
                                unoptimized={team.logo.startsWith("http")}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-300 font-bold shrink-0">
                                {team.takim_adi.slice(0, 2)}
                              </div>
                            )}
                          </Link>

                          <div className="min-w-0 flex-1 flex items-center gap-1.5">
                            <Link
                              href={`/takim/${slugify(team.takim_adi)}`}
                              className="font-semibold text-slate-100 hover:text-rose-400 transition-colors truncate block text-xs sm:text-[13px] hover:underline underline-offset-2"
                              title={`${team.takim_adi} Kulüp Profilini Aç`}
                            >
                              {team.takim_adi}
                            </Link>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                triggerHaptic("selection");
                                toggleFavorite(team.takim_adi);
                              }}
                              className="shrink-0 p-0.5 text-slate-500 hover:text-amber-400 transition-colors"
                              title={isFavorite(team.takim_adi) ? "Favorilerden çıkar" : "Favorilere ekle"}
                            >
                              <Star
                                size={12}
                                className={
                                  isFavorite(team.takim_adi)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-600 hover:text-amber-400"
                                }
                              />
                            </button>

                            {isPlayoff && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hidden sm:inline-block">
                                Çeyrek Final
                              </span>
                            )}
                            {isRelegation && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-500/40 hidden sm:inline-block">
                                Düşme
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* O, G, M */}
                      <td className="py-2 sm:py-2.5 px-2 text-center font-mono text-slate-300">{team.o}</td>
                      <td className="py-2 sm:py-2.5 px-2 text-center font-mono font-bold text-emerald-400">{team.g}</td>
                      <td className="py-2 sm:py-2.5 px-2 text-center font-mono text-rose-400">{team.m}</td>

                      {/* Setler */}
                      <td className="py-2 sm:py-2.5 px-2.5 text-center font-mono text-slate-300 hidden md:table-cell">
                        <span>{team.as}:{team.vs}</span>
                        <span className="text-[10px] text-slate-500 ml-1">({team.sav})</span>
                      </td>

                      {/* Sayılar */}
                      <td className="py-2 sm:py-2.5 px-2.5 text-center font-mono text-slate-300 hidden lg:table-cell">
                        <span>{team.asp}:{team.vsp}</span>
                        <span className="text-[10px] text-slate-500 ml-1">({team.spav})</span>
                      </td>

                      {/* Detaylı Skorlar */}
                      {showDetailedStats && (
                        <>
                          <td className="py-2 px-2 text-center font-mono text-slate-300 hidden xl:table-cell">{team.a3_0}</td>
                          <td className="py-2 px-2 text-center font-mono text-slate-300 hidden xl:table-cell">{team.a3_1}</td>
                          <td className="py-2 px-2 text-center font-mono text-slate-300 hidden xl:table-cell">{team.a3_2}</td>
                          <td className="py-2 px-2 text-center font-mono text-slate-400 hidden xl:table-cell">{team.v2_3}</td>
                          <td className="py-2 px-2 text-center font-mono text-slate-400 hidden xl:table-cell">{team.v1_3}</td>
                          <td className="py-2 px-2 text-center font-mono text-slate-400 hidden xl:table-cell">{team.v0_3}</td>
                        </>
                      )}

                      {/* Puan (Vurgulu) */}
                      <td className="py-2 sm:py-2.5 px-2 text-center font-mono font-black text-white bg-slate-900/80 text-xs sm:text-sm">
                        {team.p}
                      </td>

                      {/* İşlemler: H2H, Profil, Volleybox */}
                      <td className="py-2 sm:py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/karsilastir?takim1=${slugify(team.takim_adi)}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold transition-all shadow-xs"
                            title="Bu takımı karşılaştır"
                          >
                            <Swords size={10} />
                            <span className="hidden sm:inline">H2H</span>
                          </Link>

                          <Link
                            href={`/takim/${slugify(team.takim_adi)}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold transition-all shadow-xs"
                            title={`${team.takim_adi} Kadrosu`}
                          >
                            <span>Kadro</span>
                          </Link>

                          {team.volleybox_url && (
                            <a
                              href={team.volleybox_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/70 text-cyan-300 hover:text-white border border-cyan-800/40 text-[11px] font-medium transition-all shadow-xs"
                              title={`${team.takim_adi} Volleybox Profili`}
                            >
                              <span>VB</span>
                              <ExternalLink size={9} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 3. Statüye Uygun Lejant Alt Çubuğu */}
        <div className="bg-slate-950/70 border-t border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
              <span>1. & 2. Sıra: Çeyrek Final (Yükselme Etabı - 32 Takım)</span>
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
              <span>Son 2 Sıra: Düşme Hattı (Bir Alt Lige Düşer)</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px]">
            <span>3-0/3-1: 3P • 3-2: 2P/1P • 0-3/1-3: 0P</span>
          </div>
        </div>
      </div>
    </div>
  );
};
