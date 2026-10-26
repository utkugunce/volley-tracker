"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { TeamBadge } from "@/components/TeamBadge";
import { Layers } from "lucide-react";
import { Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
import { slugify } from "@/utils/slugify";
import { useFavorites } from "@/utils/useFavorites";
import { getKadinlar2LigTeamName, getKadinlar2LigTeamNameVariants } from "@/utils/kadinlar2LigConverter";
import { trIncludes } from "@/utils/turkishLocale";

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
        const hasFavTeam = group.puan_durumu.some((t) =>
          getKadinlar2LigTeamNameVariants(t.takim_adi, t.volleybox_name).some((n) => isFavorite(n))
        );
        if (!hasFavTeam) return false;
      }
      if (searchQuery) {
        const matchesName =
          trIncludes(group.grup_adi, searchQuery) || trIncludes(`Grup ${group.grup_no}`, searchQuery);
        const matchesTeam = group.puan_durumu.some((t) =>
          getKadinlar2LigTeamNameVariants(t.takim_adi, t.volleybox_name).some((n) => trIncludes(n, searchQuery))
        );
        if (!matchesName && !matchesTeam) return false;
      }
      return true;
    });
  }, [groups, showOnlyFavorites, searchQuery, isFavorite]);

  return (
    <div className="space-y-4">
      {/* 1. Üst Bilgi Kartı */}
      <div className="bg-surface border border-line rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
            <Layers size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-ink tracking-tight">
              16 Grup İlerlemesi, Liderler ve Çeyrek Final Hattı
            </h2>
            <p className="text-xs text-ink-3 mt-0.5">
              Her gruptan ilk 2 sırayı alan takımlar (toplam 32 kulüp) TVF Çeyrek Final etabına yükselir
            </p>
          </div>
        </div>

        <span className="text-xs font-mono tabular-nums font-bold px-2.5 py-1 rounded-md bg-surface-muted border border-line text-ink-2">
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
              className="bg-surface hover:bg-surface-raised border border-line hover:border-line-strong rounded-xl p-4 transition-colors flex flex-col justify-between gap-3.5 group"
            >
              <div>
                <div className="flex items-center justify-between border-b border-line pb-2.5 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <h3 className="font-bold text-xs sm:text-sm text-ink uppercase tracking-tight">
                      {group.grup_adi}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono tabular-nums text-ink-3 bg-surface-muted px-2 py-0.5 rounded border border-line">
                    {group.takim_sayisi} Takım
                  </span>
                </div>

                {/* Sezon İlerleme Çubuğu */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between text-[10px] text-ink-3 font-mono tabular-nums">
                    <span>Oynanan: {completedMatches}/{totalMatches}</span>
                    <span className="font-bold text-ink-2">%{progressPercent}</span>
                  </div>
                  <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden border border-line">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* İlk 3 Takım (Liderler & Play-off) */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-ink-3 uppercase tracking-wider">
                    Grup Sıralaması:
                  </div>
                  {topTeams.length === 0 ? (
                    <div className="text-[11px] text-ink-3 italic py-2">
                      Henüz maç oynanmadı
                    </div>
                  ) : (
                    topTeams.map((team) => {
                      const displayName = getKadinlar2LigTeamName(team.takim_adi, team.volleybox_name);

                      return (
                        <div
                          key={team.takim_id}
                          className="flex items-center justify-between text-xs py-1 px-1.5 rounded-md hover:bg-surface-muted transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span
                              className={`w-4 text-center font-mono tabular-nums font-bold text-[11px] ${
                                team.sira <= 2 ? "text-done" : "text-ink-3"
                              }`}
                            >
                              {team.sira}.
                            </span>

                            <TeamBadge name={displayName} size="xs" />

                            <Link
                              prefetch={false}
                              href={`/takim/${slugify(displayName)}`}
                              className="text-ink hover:text-primary truncate text-[11px] font-semibold"
                              title={
                                displayName !== team.takim_adi
                                  ? `${displayName} (TVF: ${team.takim_adi})`
                                  : `${displayName} Kulüp Sayfası`
                              }
                            >
                              {displayName}
                            </Link>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums text-[11px]">
                            <span className="text-ink-3">{team.g}G</span>
                            <span className="font-bold text-ink bg-surface-muted px-1.5 py-0.2 rounded border border-line">
                              {team.p}P
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Alt Butonlar: Puan Durumu & Fikstür */}
              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-line">
                <button
                  onClick={() => onSelectGroup(group.grup_no, "standings")}
                  className="py-1.5 px-2 rounded-md bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border border-line text-[11px] font-semibold transition-colors text-center cursor-pointer"
                >
                  Puan Cetveli
                </button>
                <button
                  onClick={() => onSelectGroup(group.grup_no, "fixtures")}
                  className="py-1.5 px-2 rounded-md bg-surface-muted hover:bg-surface-raised text-ink-2 hover:text-ink border border-line text-[11px] font-semibold transition-colors text-center cursor-pointer"
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
