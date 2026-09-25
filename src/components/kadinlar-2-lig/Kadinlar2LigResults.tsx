"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Star,
  Swords,
  ChevronRight,
  Filter,
  Trophy,
} from "lucide-react";
import { Kadinlar2LigMatch, Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
import { Match } from "@/types/fixture";
import { slugify } from "@/utils/slugify";
import { useFavorites } from "@/utils/useFavorites";
import { triggerHaptic } from "@/utils/haptics";

interface Kadinlar2LigResultsProps {
  allMatches: Kadinlar2LigMatch[];
  groups: Kadinlar2LigGroup[];
  onSelectMatch: (match: Match) => void;
  showOnlyFavorites?: boolean;
  onToggleFavoritesOnly?: () => void;
  searchQuery?: string;
}

export const Kadinlar2LigResults: React.FC<Kadinlar2LigResultsProps> = ({
  allMatches,
  groups,
  onSelectMatch,
  showOnlyFavorites = false,
  onToggleFavoritesOnly,
  searchQuery = "",
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<number | "all">("all");

  const convertToMatch = (m: Kadinlar2LigMatch): Match => {
    const setScores = m.set_sonuclari
      ? m.set_sonuclari.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    let homeScore: number | null = null;
    let awayScore: number | null = null;
    if (m.skor && m.skor.includes("-") && m.skor !== "- : -") {
      const parts = m.skor.split("-").map((s) => parseInt(s.trim(), 10));
      if (!isNaN(parts[0]) && !isNaN(parts[1])) {
        homeScore = parts[0];
        awayScore = parts[1];
      }
    }
    return {
      id: m.id,
      match_no: m.mac_no || "",
      date: m.tarih || "",
      time: m.saat || "",
      hall: m.salon || "",
      home_team: m.takim_a,
      away_team: m.takim_b,
      category: "Kadınlar 2. Ligi",
      age_group: "Genç",
      gender: "Kız",
      group: m.grup_adi || `Grup ${m.grup_no}`,
      city: m.sehir || "Türkiye",
      status: "finished",
      score: m.skor && m.skor !== "- : -" ? m.skor : undefined,
      set_scores: setScores,
      home_score: homeScore,
      away_score: awayScore,
    };
  };

  // Sadece biten veya skoru olan maçlar, en son oynanandan eskiye doğru
  const finishedMatches = useMemo(() => {
    return allMatches
      .filter((m) => {
        const isFinished = m.durum === "BİTTİ" || (m.skor && m.skor !== "- : -");
        if (!isFinished) return false;

        if (selectedGroupFilter !== "all" && m.grup_no !== selectedGroupFilter) return false;

        if (showOnlyFavorites) {
          const homeFav = isFavorite(m.takim_a);
          const awayFav = isFavorite(m.takim_b);
          if (!homeFav && !awayFav) return false;
        }

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const inTeams = m.takim_a.toLowerCase().includes(q) || m.takim_b.toLowerCase().includes(q);
          const inCity = m.sehir?.toLowerCase().includes(q);
          const inHall = m.salon?.toLowerCase().includes(q);
          if (!inTeams && !inCity && !inHall) return false;
        }

        return true;
      })
      .sort((a, b) => (b.tarih || "").localeCompare(a.tarih || ""));
  }, [allMatches, selectedGroupFilter, showOnlyFavorites, searchQuery, isFavorite]);

  return (
    <div className="space-y-4">
      {/* 1. Üst Filtre Barı */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#120d29]/80 border border-purple-900/40 rounded-2xl p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide">
            Tamamlanan Maç Sonuçları ({finishedMatches.length})
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Grup Filtresi */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-purple-400 font-semibold">Grup:</span>
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="bg-[#181136] text-white border border-purple-800/60 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="all">Tüm Gruplar (1-16)</option>
              {groups.map((g) => (
                <option key={g.grup_no} value={g.grup_no}>
                  {g.grup_adi}
                </option>
              ))}
            </select>
          </div>

          {/* Favoriler Filtresi Butonu */}
          {onToggleFavoritesOnly && (
            <button
              onClick={onToggleFavoritesOnly}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                showOnlyFavorites
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                  : "bg-purple-950/60 text-purple-300 border-purple-800/60 hover:text-white hover:bg-purple-900/60"
              }`}
              title="Sadece favori takımlarımın sonuçlarını listele"
            >
              <Star size={13} className={showOnlyFavorites ? "fill-amber-400 text-amber-400" : "text-purple-400"} />
              <span className="hidden sm:inline">Favoriler</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Sonuçlar Listesi */}
      {finishedMatches.length === 0 ? (
        <div className="bg-[#120d29]/50 border border-purple-900/40 rounded-2xl p-8 text-center space-y-3">
          <CheckCircle2 size={36} className="mx-auto text-purple-400/50" />
          <h3 className="text-sm font-bold text-white">Henüz tamamlanan maç sonucu bulunamadı</h3>
          <p className="text-xs text-purple-300/70 max-w-md mx-auto">
            {showOnlyFavorites
              ? "Favori takımlarınızın henüz tamamlanmış maçı bulunmuyor."
              : "Seçili grupta biten karşılaşma yok veya henüz maçlar başlamadı."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {finishedMatches.map((m) => {
            const homeFav = isFavorite(m.takim_a);
            const awayFav = isFavorite(m.takim_b);

            return (
              <div
                key={m.id}
                onClick={() => onSelectMatch(convertToMatch(m))}
                className="bg-[#130d29]/90 hover:bg-[#1a1238] border border-purple-900/40 hover:border-emerald-600/50 rounded-2xl p-3.5 transition-all shadow-md hover:shadow-xl cursor-pointer group flex flex-col justify-between gap-2.5"
              >
                {/* Üst Bilgi: Grup, Tarih, Saat */}
                <div className="flex items-center justify-between text-[11px] text-purple-300/80 border-b border-purple-900/30 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800/50 font-mono font-bold text-[10px]">
                      {m.grup_adi}
                    </span>
                    <span>{m.tarih}</span>
                    <span className="text-purple-400/50">•</span>
                    <span>{m.saat}</span>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 flex items-center gap-1">
                    <CheckCircle2 size={10} />
                    BİTTİ
                  </span>
                </div>

                {/* Takımlar ve Skor Alanı */}
                <div className="grid grid-cols-12 items-center gap-2 py-1">
                  {/* Ev Sahibi */}
                  <div className="col-span-5 flex items-center gap-2 min-w-0">
                    <Link
                      href={`/takim/${slugify(m.takim_a)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 hover:opacity-85 transition-opacity"
                    >
                      {m.takim_a_logo && !m.takim_a_logo.includes("takimlogoyok") ? (
                        <Image
                          src={m.takim_a_logo}
                          alt={m.takim_a}
                          width={26}
                          height={26}
                          className="w-6 h-6 sm:w-7 sm:h-7 object-contain rounded-md bg-white/5 p-0.5"
                          unoptimized={m.takim_a_logo.startsWith("http")}
                        />
                      ) : (
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-purple-950 border border-purple-800 flex items-center justify-center text-[10px] text-purple-300 font-bold">
                          {m.takim_a.slice(0, 2)}
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/takim/${slugify(m.takim_a)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-xs sm:text-[13px] text-white hover:text-pink-300 transition-colors truncate block hover:underline"
                        >
                          {m.takim_a}
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            triggerHaptic("selection");
                            toggleFavorite(m.takim_a);
                          }}
                          className="shrink-0 p-0.5"
                        >
                          <Star
                            size={11}
                            className={homeFav ? "fill-amber-400 text-amber-400" : "text-purple-400/40 hover:text-amber-300"}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Skor */}
                  <div className="col-span-2 flex flex-col items-center justify-center text-center">
                    <span className="text-sm sm:text-base font-black font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-700/60 shadow-inner">
                      {m.skor || "3-0"}
                    </span>
                  </div>

                  {/* Deplasman */}
                  <div className="col-span-5 flex items-center justify-end gap-2 min-w-0 text-right">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            triggerHaptic("selection");
                            toggleFavorite(m.takim_b);
                          }}
                          className="shrink-0 p-0.5"
                        >
                          <Star
                            size={11}
                            className={awayFav ? "fill-amber-400 text-amber-400" : "text-purple-400/40 hover:text-amber-300"}
                          />
                        </button>
                        <Link
                          href={`/takim/${slugify(m.takim_b)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-xs sm:text-[13px] text-white hover:text-pink-300 transition-colors truncate block hover:underline"
                        >
                          {m.takim_b}
                        </Link>
                      </div>
                    </div>

                    <Link
                      href={`/takim/${slugify(m.takim_b)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 hover:opacity-85 transition-opacity"
                    >
                      {m.takim_b_logo && !m.takim_b_logo.includes("takimlogoyok") ? (
                        <Image
                          src={m.takim_b_logo}
                          alt={m.takim_b}
                          width={26}
                          height={26}
                          className="w-6 h-6 sm:w-7 sm:h-7 object-contain rounded-md bg-white/5 p-0.5"
                          unoptimized={m.takim_b_logo.startsWith("http")}
                        />
                      ) : (
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-purple-950 border border-purple-800 flex items-center justify-center text-[10px] text-purple-300 font-bold">
                          {m.takim_b.slice(0, 2)}
                        </div>
                      )}
                    </Link>
                  </div>
                </div>

                {/* Set Dökümü */}
                {m.set_sonuclari && m.set_sonuclari.trim().length > 0 && (
                  <div className="bg-[#191136]/60 rounded-xl px-2.5 py-1.5 border border-purple-900/30 flex items-center justify-center gap-1.5 text-[11px] font-mono text-purple-200">
                    <span className="text-purple-400/70 text-[10px] uppercase font-bold">Setler:</span>
                    <span>{m.set_sonuclari}</span>
                  </div>
                )}

                {/* Alt Bar: Salon & H2H */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-purple-900/30 text-[11px] text-purple-300/70">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin size={11} className="text-pink-400 shrink-0" />
                    <span className="truncate">{m.salon || "Salon"}</span>
                    {m.sehir && <span className="text-purple-400/50">({m.sehir})</span>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/karsilastir?takim1=${slugify(m.takim_a)}&takim2=${slugify(m.takim_b)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-800/60 hover:bg-amber-900/60 px-2 py-0.5 rounded-md transition-colors"
                    >
                      <Swords size={10} />
                      <span className="hidden sm:inline">Karşılaştır</span>
                    </Link>

                    <span className="text-[10px] text-purple-400 font-semibold group-hover:text-pink-300 flex items-center">
                      Detay <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
