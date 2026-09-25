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
      score: m.skor,
      set_scores: setScores,
      home_score: homeScore,
      away_score: awayScore,
    };
  };

  // Sadece biten ya da skoru olan maçlar
  const finishedMatches = useMemo(() => {
    return allMatches.filter(
      (m) =>
        m.durum === "BİTTİ" ||
        (m.skor && m.skor.includes("-") && m.skor.trim() !== "-")
    );
  }, [allMatches]);

  const filteredResults = useMemo(() => {
    return finishedMatches.filter((m) => {
      if (selectedGroupFilter !== "all" && m.grup_no !== selectedGroupFilter) return false;
      if (showOnlyFavorites) {
        const homeFav = isFavorite(m.takim_a);
        const awayFav = isFavorite(m.takim_b);
        if (!homeFav && !awayFav) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTeams = m.takim_a.toLowerCase().includes(q) || m.takim_b.toLowerCase().includes(q);
        const inCity = m.sehir.toLowerCase().includes(q);
        const inHall = m.salon.toLowerCase().includes(q);
        if (!inTeams && !inCity && !inHall) return false;
      }
      return true;
    });
  }, [finishedMatches, selectedGroupFilter, showOnlyFavorites, searchQuery, isFavorite]);

  return (
    <div className="space-y-4">
      {/* 1. Üst Filtre Barı */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-white tracking-tight">
              Tamamlanan Maç Sonuçları
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">
              Toplam {finishedMatches.length} sonuçlanan karşılaşma
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Grup Seçici */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Grup:</span>
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="all">Tüm Gruplar (1-16)</option>
              {groups.map((g) => (
                <option key={g.grup_no} value={g.grup_no}>
                  {g.grup_adi} ({g.takim_sayisi} Takım)
                </option>
              ))}
            </select>
          </div>

          {/* Favoriler Butonu */}
          {onToggleFavoritesOnly && (
            <button
              onClick={onToggleFavoritesOnly}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                showOnlyFavorites
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-glow-amber font-bold"
                  : "bg-slate-800/80 text-slate-300 hover:text-white border-slate-700/60 hover:bg-slate-700/80"
              }`}
              title="Sadece takip ettiğim kulüplerin sonuçlarını listele"
            >
              <Star size={12} className={showOnlyFavorites ? "fill-black text-black" : "text-amber-400"} />
              <span className="hidden sm:inline">Favoriler</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Sonuç Kartları */}
      {filteredResults.length === 0 ? (
        <div className="glass-panel border border-slate-800/80 rounded-2xl p-10 text-center space-y-2 shadow-card">
          <CheckCircle2 size={36} className="mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-white">Henüz tamamlanan maç sonucu bulunamadı</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {showOnlyFavorites
              ? "Favori kulüplerinize ait sonuçlanmış maç kaydı henüz girilmedi."
              : "Seçili grup veya arama kriterine uygun bitmiş karşılaşma bulunmuyor."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredResults.map((m) => {
            return (
              <div
                key={m.id}
                onClick={() => onSelectMatch(convertToMatch(m))}
                className="glass-panel border border-slate-800/80 hover:border-slate-700 bg-slate-900/65 hover:bg-slate-850/90 rounded-2xl p-3.5 transition-all shadow-card hover:shadow-card-hover cursor-pointer group"
              >
                {/* Üst Bilgi: Tarih, Saat, Grup, Salon */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-2 mb-2.5 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{m.tarih}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-rose-300 font-bold border border-slate-700">
                      {m.grup_adi || `Grup ${m.grup_no}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 truncate max-w-[200px]" title={`${m.sehir} - ${m.salon}`}>
                    <MapPin size={11} className="shrink-0 text-rose-400" />
                    <span className="truncate">{m.sehir} • {m.salon}</span>
                  </div>
                </div>

                {/* Karşılaşma Gövdesi */}
                <div className="flex items-center justify-between gap-3">
                  {/* Ev Sahibi */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/takim/${slugify(m.takim_a)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 hover:opacity-80 transition-opacity"
                        title={`${m.takim_a} Takım Profili`}
                      >
                        {m.takim_a_logo && !m.takim_a_logo.includes("takimlogoyok") ? (
                          <Image
                            src={m.takim_a_logo}
                            alt={m.takim_a}
                            width={22}
                            height={22}
                            className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded-md shrink-0 bg-white/5 p-0.5"
                            unoptimized={m.takim_a_logo.startsWith("http")}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-300 font-bold shrink-0">
                            {m.takim_a.slice(0, 2)}
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0">
                        <Link
                          href={`/takim/${slugify(m.takim_a)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-xs sm:text-[13px] text-slate-100 hover:text-rose-400 transition-colors truncate block hover:underline underline-offset-2"
                          title={`${m.takim_a} Takım Profili`}
                        >
                          {m.takim_a}
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Skor Rozeti */}
                  <div className="shrink-0 text-center px-2">
                    <span className="text-sm font-black font-mono px-2.5 py-0.5 rounded-lg bg-slate-950 border border-emerald-500/40 text-emerald-400 shadow-xs">
                      {m.skor || "3-0"}
                    </span>
                    {m.set_sonuclari && (
                      <span className="text-[10px] font-mono text-slate-400 mt-1 block max-w-[120px] truncate" title={m.set_sonuclari}>
                        {m.set_sonuclari}
                      </span>
                    )}
                  </div>

                  {/* Deplasman */}
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/takim/${slugify(m.takim_b)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-xs sm:text-[13px] text-slate-100 hover:text-rose-400 transition-colors truncate block hover:underline underline-offset-2"
                          title={`${m.takim_b} Takım Profili`}
                        >
                          {m.takim_b}
                        </Link>
                      </div>

                      <Link
                        href={`/takim/${slugify(m.takim_b)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 hover:opacity-80 transition-opacity"
                        title={`${m.takim_b} Takım Profili`}
                      >
                        {m.takim_b_logo && !m.takim_b_logo.includes("takimlogoyok") ? (
                          <Image
                            src={m.takim_b_logo}
                            alt={m.takim_b}
                            width={22}
                            height={22}
                            className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded-md shrink-0 bg-white/5 p-0.5"
                            unoptimized={m.takim_b_logo.startsWith("http")}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-300 font-bold shrink-0">
                            {m.takim_b.slice(0, 2)}
                          </div>
                        )}
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Alt Çubuk */}
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono text-[10px] text-slate-500">
                    Maç #{m.mac_no || m.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/karsilastir?takim1=${slugify(m.takim_a)}&takim2=${slugify(m.takim_b)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-semibold"
                    >
                      <Swords size={10} />
                      <span>H2H</span>
                    </Link>
                    <span className="text-[10px] font-semibold text-rose-400 group-hover:underline flex items-center gap-0.5">
                      <span>Maç Merkezi</span>
                      <ChevronRight size={10} />
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
