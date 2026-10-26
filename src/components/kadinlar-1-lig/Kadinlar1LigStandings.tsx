"use client";

import React, { useState, useMemo } from "react";
import { TeamBadge } from "@/components/TeamBadge";
import Link from "next/link";
import { ExternalLink, Trophy, ChevronRight, Download, Star, Swords, Calculator } from "lucide-react";
import { Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
import { slugify } from "@/utils/slugify";
import { useFavorites } from "@/utils/useFavorites";
import { triggerHaptic } from "@/utils/haptics";
import { getVolleyboxMapping } from "@/utils/volleybox";
import { getKadinlar2LigTeamName, getKadinlar2LigTeamNameVariants, K2_CATEGORY } from "@/utils/kadinlar2LigConverter";
import { trIncludes } from "@/utils/turkishLocale";
import { StandingsSimulatorView } from "@/components/standings/StandingsSimulatorView";

interface Kadinlar1LigStandingsProps {
  group: Kadinlar2LigGroup;
  searchQuery?: string;
  showOnlyFavorites?: boolean;
  onCompareTeam?: (teamSlug: string) => void;
}

export const Kadinlar1LigStandings: React.FC<Kadinlar1LigStandingsProps> = ({
  group,
  searchQuery = "",
  showOnlyFavorites = false,
  onCompareTeam,
}) => {
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  const teams = useMemo(() => group?.puan_durumu || [], [group?.puan_durumu]);
  const groupLabel = group?.grup_adi || (group?.grup_no === 1 ? "A Grubu" : "B Grubu");

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const displayName = getKadinlar2LigTeamName(t.takim_adi, t.volleybox_name);
      if (
        showOnlyFavorites &&
        !getKadinlar2LigTeamNameVariants(t.takim_adi, t.volleybox_name).some((n) => isFavorite(n))
      ) {
        return false;
      }
      if (searchQuery) {
        if (!trIncludes(t.takim_adi, searchQuery) && !trIncludes(displayName, searchQuery)) {
          return false;
        }
      }
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
      const escapedTeam =
        row.takim_adi.includes(";") || row.takim_adi.includes('"')
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
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(BOM + [header, ...rows].join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `KFC_Kadinlar_1_Ligi_${groupLabel.replace(/\s+/g, "_")}_Puan_Durumu.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* 1. Üst Başlık & Kontroller */}
      <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-xs">
        <div className="p-3 sm:p-4 bg-surface-raised/40 border-b border-line flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
              <Trophy size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-ink">
                  KFC Kadınlar 1. Ligi
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  {groupLabel}
                </span>
              </div>
              <p className="text-[11px] text-ink-3">
                14 Takım • İlk 4 Play-off Yarı Final, Son 2 Düşme
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Olasılık Simülatörü Butonu */}
            <button
              onClick={() => {
                triggerHaptic();
                setShowSimulator(!showSimulator);
              }}
              className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border transition-all cursor-pointer ${
                showSimulator
                  ? "bg-primary text-primary-fg border-primary shadow-xs"
                  : "bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border-line"
              }`}
              title="Kalan maçların skorlarını simüle ederek puan tablosunu hesapla"
            >
              <Calculator size={13} />
              <span className="hidden sm:inline">Puan Simülatörü</span>
              <span className="sm:hidden">{showSimulator ? "Kapat" : "Simülatör"}</span>
            </button>

            {/* Detaylı Skorlar Butonu */}
            <button
              onClick={() => setShowDetailedStats(!showDetailedStats)}
              className="hidden sm:inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-xl bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border border-line transition-all cursor-pointer"
            >
              <span>{showDetailedStats ? "Detayları Gizle" : "Detaylı Skorlar"}</span>
              <ChevronRight
                size={12}
                className={`transform transition-transform ${showDetailedStats ? "rotate-90" : ""}`}
              />
            </button>

            {/* CSV İndir */}
            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border border-line transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Puan tablosunu Excel uyumlu CSV olarak indir"
            >
              <Download size={12} className="text-emerald-400" />
              <span className="hidden sm:inline">CSV İndir</span>
            </button>

            <span className="text-[10px] sm:text-xs text-ink-3 font-mono font-bold bg-surface-muted px-2 py-0.5 rounded-lg border border-line">
              {teams.length} Takım
            </span>
          </div>
        </div>

        {/* Simülatör Açıksa */}
        {showSimulator && (
          <div className="p-3 sm:p-4 border-b border-line bg-surface-raised/20">
            <StandingsSimulatorView
              mode="k2"
              k2Rows={teams}
              k2Matches={group.fikstur || []}
              cutoff={4}
              onClose={() => setShowSimulator(false)}
            />
          </div>
        )}

        {/* 2. Puan Durumu Tablosu */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-muted text-ink-3 font-bold border-b border-line uppercase text-[10px] sm:text-[11px] tracking-wider">
                <th className="py-2.5 sm:py-3 px-2 text-center w-10 sm:w-12">#</th>
                <th className="py-2.5 sm:py-3 px-3 min-w-[220px]">Takım</th>
                <th className="py-2.5 sm:py-3 px-2 text-center w-9 sm:w-11" title="Oynanan Maç">O</th>
                <th className="py-2.5 sm:py-3 px-2 text-center w-9 sm:w-11" title="Galibiyet">G</th>
                <th className="py-2.5 sm:py-3 px-2 text-center w-9 sm:w-11" title="Mağlubiyet">M</th>
                <th className="py-2.5 sm:py-3 px-2.5 text-center w-14 sm:w-20 hidden md:table-cell" title="Alınan Set - Verilen Set (Oran)">Setler</th>
                <th className="py-2.5 sm:py-3 px-2.5 text-center w-16 sm:w-24 hidden lg:table-cell" title="Alınan Sayı - Verilen Sayı (Oran)">Sayılar</th>
                {showDetailedStats && (
                  <>
                    <th className="py-2.5 px-2 text-center text-emerald-400 bg-surface-raised hidden xl:table-cell" title="3-0 Galibiyet">3-0</th>
                    <th className="py-2.5 px-2 text-center text-emerald-400 bg-surface-raised hidden xl:table-cell" title="3-1 Galibiyet">3-1</th>
                    <th className="py-2.5 px-2 text-center text-emerald-400 bg-surface-raised hidden xl:table-cell" title="3-2 Galibiyet">3-2</th>
                    <th className="py-2.5 px-2 text-center text-rose-400 bg-surface-raised hidden xl:table-cell" title="2-3 Mağlubiyet">2-3</th>
                    <th className="py-2.5 px-2 text-center text-rose-400 bg-surface-raised hidden xl:table-cell" title="1-3 Mağlubiyet">1-3</th>
                    <th className="py-2.5 px-2 text-center text-rose-400 bg-surface-raised hidden xl:table-cell" title="0-3 Mağlubiyet">0-3</th>
                  </>
                )}
                <th className="py-2.5 sm:py-3 px-2 text-center w-12 sm:w-16 bg-surface-raised font-bold text-ink" title="Puan">P</th>
                <th className="py-2.5 sm:py-3 px-3 text-right w-28 sm:w-36">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-10 text-center text-ink-3 text-xs">
                    Aranan kriterlere uygun takım bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team, idx) => {
                  const isPlayoff = team.sira <= 4;
                  const isRelegation = team.sira >= 13;

                  const displayName = getKadinlar2LigTeamName(team.takim_adi, team.volleybox_name);
                  const isFav = getKadinlar2LigTeamNameVariants(team.takim_adi, team.volleybox_name).some((n) => isFavorite(n));
                  const teamSlug = slugify(team.takim_adi);

                  const vb = getVolleyboxMapping(team.takim_adi, team.volleybox_url);
                  const vbUrl = team.volleybox_url || vb?.url;

                  return (
                    <tr
                      key={team.takim_id || idx}
                      className={`hover:bg-surface-raised/40 transition-colors ${
                        isPlayoff
                          ? "border-l-4 border-l-amber-400 bg-amber-400/5"
                          : isRelegation
                          ? "border-l-4 border-l-rose-500 bg-rose-500/5"
                          : "border-l-4 border-l-transparent"
                      }`}
                    >
                      {/* Sıra Numarası */}
                      <td className="py-2 sm:py-2.5 px-2 text-center">
                        <span
                          className={`font-bold font-mono tabular-nums text-xs ${
                            isPlayoff
                              ? "text-amber-400"
                              : isRelegation
                              ? "text-rose-400"
                              : "text-ink-3"
                          }`}
                        >
                          {team.sira}
                        </span>
                      </td>

                      {/* Takım Adı & Rozet */}
                      <td className="py-2 sm:py-2.5 px-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic();
                              toggleFavorite(displayName, K2_CATEGORY);
                            }}
                            className="text-ink-4 hover:text-warn transition-colors shrink-0 p-0.5"
                            title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                          >
                            <Star
                              size={13}
                              className={isFav ? "fill-warn text-warn" : ""}
                            />
                          </button>

                          <TeamBadge
                            teamName={team.takim_adi}
                            category="Kadınlar 1. Ligi"
                            size="sm"
                            className="shrink-0"
                          />

                          <div className="min-w-0 flex flex-col">
                            <span className="font-semibold text-ink truncate text-xs sm:text-[13px] leading-tight">
                              {displayName}
                            </span>
                            {team.volleybox_name && team.volleybox_name !== team.takim_adi && (
                              <span className="text-[10px] text-ink-3 truncate leading-none mt-0.5">
                                {team.takim_adi}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Oynanan */}
                      <td className="py-2 sm:py-2.5 px-2 text-center font-mono tabular-nums text-ink font-medium">
                        {team.o}
                      </td>

                      {/* Galibiyet */}
                      <td className="py-2 sm:py-2.5 px-2 text-center font-mono tabular-nums text-emerald-400 font-bold">
                        {team.g}
                      </td>

                      {/* Mağlubiyet */}
                      <td className="py-2 sm:py-2.5 px-2 text-center font-mono tabular-nums text-rose-400">
                        {team.m}
                      </td>

                      {/* Setler */}
                      <td className="py-2 sm:py-2.5 px-2.5 text-center font-mono tabular-nums text-ink-2 text-[11px] hidden md:table-cell">
                        <span>{team.as} - {team.vs}</span>
                        <span className="text-[10px] text-ink-3 ml-1">({team.sav})</span>
                      </td>

                      {/* Sayılar */}
                      <td className="py-2 sm:py-2.5 px-2.5 text-center font-mono tabular-nums text-ink-3 text-[11px] hidden lg:table-cell">
                        <span>{team.asp} - {team.vsp}</span>
                        <span className="text-[10px] text-ink-3 ml-1">({team.spav})</span>
                      </td>

                      {/* Detaylı Skorlar */}
                      {showDetailedStats && (
                        <>
                          <td className="py-2 px-2 text-center font-mono tabular-nums text-ink-2 bg-surface-raised/40 hidden xl:table-cell">{team.g_3_0}</td>
                          <td className="py-2 px-2 text-center font-mono tabular-nums text-ink-2 bg-surface-raised/40 hidden xl:table-cell">{team.g_3_1}</td>
                          <td className="py-2 px-2 text-center font-mono tabular-nums text-ink-2 bg-surface-raised/40 hidden xl:table-cell">{team.g_3_2}</td>
                          <td className="py-2 px-2 text-center font-mono tabular-nums text-ink-3 bg-surface-raised/40 hidden xl:table-cell">{team.m_2_3}</td>
                          <td className="py-2 px-2 text-center font-mono tabular-nums text-ink-3 bg-surface-raised/40 hidden xl:table-cell">{team.m_1_3}</td>
                          <td className="py-2 px-2 text-center font-mono tabular-nums text-ink-3 bg-surface-raised/40 hidden xl:table-cell">{team.m_0_3}</td>
                        </>
                      )}

                      {/* Puan */}
                      <td className="py-2 sm:py-2.5 px-2 text-center font-mono tabular-nums font-bold text-sm text-ink bg-surface-raised/60">
                        {team.p}
                      </td>

                      {/* İşlem */}
                      <td className="py-2 sm:py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            prefetch={false}
                            href={`/kadinlar-1-ligi/karsilastir?takim1=${teamSlug}`}
                            onClick={(e) => {
                              if (onCompareTeam) {
                                e.preventDefault();
                                onCompareTeam(teamSlug);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border border-line transition-colors"
                            title="H2H Karşılaştır"
                          >
                            <Swords size={11} />
                            <span className="hidden sm:inline">H2H</span>
                          </Link>

                          {vbUrl && (
                            <a
                              href={vbUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
                              title="Volleybox Kulüp Sayfası & Kadro"
                            >
                              <span>Kadro</span>
                              <ExternalLink size={10} />
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

        {/* 3. Alt Açıklama / Gösterge Lejandı */}
        <div className="p-3 bg-surface-raised/40 border-t border-line flex flex-wrap items-center justify-between gap-3 text-[11px] text-ink-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-400 border border-amber-300" />
              <span className="text-ink font-medium">1-4: Yarı Final Play-off (Sultanlar Ligi&apos;ne Yükselme)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500 border border-rose-400" />
              <span className="text-ink font-medium">13-14: 2. Lig&apos;e Düşme Hattı</span>
            </div>
          </div>

          <div className="font-mono text-[10px] text-ink-3">
            Puan eşitliğinde: Galibiyet Sayısı &gt; Set Oranı &gt; Sayı Oranı
          </div>
        </div>
      </div>
    </div>
  );
};
