"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Flame,
  Calendar,
  Clock,
  MapPin,
  Star,
  Swords,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Kadinlar2LigMatch, Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
import { Match } from "@/types/fixture";
import { slugify } from "@/utils/slugify";
import { DateRibbon } from "@/components/DateRibbon";
import { useFavorites } from "@/utils/useFavorites";
import { triggerHaptic } from "@/utils/haptics";
import { getVolleyboxMapping } from "@/utils/volleybox";

interface Kadinlar2LigTodayMatchesProps {
  allMatches: Kadinlar2LigMatch[];
  groups: Kadinlar2LigGroup[];
  onSelectMatch: (match: Match) => void;
  showOnlyFavorites?: boolean;
  onToggleFavoritesOnly?: () => void;
  searchQuery?: string;
}

export const Kadinlar2LigTodayMatches: React.FC<Kadinlar2LigTodayMatchesProps> = ({
  allMatches,
  groups,
  onSelectMatch,
  showOnlyFavorites = false,
  onToggleFavoritesOnly,
  searchQuery = "",
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const { uniqueDates, dateCounts, initialSelectedDate } = useMemo(() => {
    const counts: { [dateStr: string]: number } = {};
    allMatches.forEach((m) => {
      if (m.tarih) {
        counts[m.tarih] = (counts[m.tarih] || 0) + 1;
      }
    });

    const dates = Object.keys(counts).sort();

    let defaultDate = "all";
    if (counts[todayStr]) {
      defaultDate = todayStr;
    } else {
      const upcoming = dates.find((d) => d >= todayStr);
      defaultDate = upcoming || dates[0] || "all";
    }

    return {
      uniqueDates: dates,
      dateCounts: counts,
      initialSelectedDate: defaultDate,
    };
  }, [allMatches, todayStr]);

  const [selectedDate, setSelectedDate] = useState<string>(initialSelectedDate);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "OYNANACAK" | "BİTTİ">("all");

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
      status: m.durum === "BİTTİ" ? "finished" : "upcoming",
      score: m.skor && m.skor !== "- : -" ? m.skor : undefined,
      set_scores: setScores,
      home_score: homeScore,
      away_score: awayScore,
    };
  };

  const filteredMatches = useMemo(() => {
    return allMatches.filter((m) => {
      if (selectedDate !== "all" && m.tarih !== selectedDate) return false;
      if (selectedGroupFilter !== "all" && m.grup_no !== selectedGroupFilter) return false;
      if (statusFilter !== "all" && m.durum !== statusFilter) return false;
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
  }, [allMatches, selectedDate, selectedGroupFilter, statusFilter, showOnlyFavorites, searchQuery, isFavorite]);

  return (
    <div className="space-y-4">
      {/* 1. Tarih Şeridi */}
      {uniqueDates.length > 0 && (
        <DateRibbon
          dates={uniqueDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          dateCounts={dateCounts}
          todayStr={todayStr}
        />
      )}

      {/* 2. Filtre Barı (Grup, Durum, Favoriler) */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Grup Filtresi */}
          <div className="flex items-center gap-1.5">
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

          {/* Durum Filtresi */}
          <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer ${
                statusFilter === "all" ? "bg-red-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setStatusFilter("OYNANACAK")}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer ${
                statusFilter === "OYNANACAK" ? "bg-red-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              Oynanacak
            </button>
            <button
              onClick={() => setStatusFilter("BİTTİ")}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer ${
                statusFilter === "BİTTİ" ? "bg-red-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              Bitenler
            </button>
          </div>
        </div>

        {/* Favoriler Filtresi Butonu */}
        {onToggleFavoritesOnly && (
          <button
            onClick={onToggleFavoritesOnly}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
              showOnlyFavorites
                ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-glow-amber font-bold"
                : "bg-slate-800/80 text-slate-300 hover:text-white border-slate-700/60 hover:bg-slate-700/80"
            }`}
            title="Sadece takip ettiğim kulüplerin maçlarını listele"
          >
            <Star size={12} className={showOnlyFavorites ? "fill-black text-black" : "text-amber-400"} />
            <span>Favori Takımlarım</span>
          </button>
        )}
      </div>

      {/* 3. Maç Listesi */}
      {filteredMatches.length === 0 ? (
        <div className="glass-panel border border-slate-800/80 rounded-2xl p-10 text-center space-y-3 shadow-card">
          <Calendar size={36} className="mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-white">Bu filtrede maç bulunamadı</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {showOnlyFavorites
              ? "Favoriye eklediğiniz kulüplerin bu tarih veya grupta maçı bulunmuyor."
              : "Seçili tarih veya grup filtresine uyan karşılaşma yok. Farklı bir tarih seçebilirsiniz."}
          </p>
          {selectedDate !== "all" && (
            <button
              onClick={() => setSelectedDate("all")}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all font-semibold"
            >
              Tüm Tarihleri Göster
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredMatches.map((m) => {
            const isFinished = m.durum === "BİTTİ";
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
                    {m.saat && (
                      <span className="flex items-center gap-1 text-slate-400 font-mono">
                        <Clock size={11} />
                        {m.saat}
                      </span>
                    )}
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
                  {(() => {
                    const mAny = m as any;
                    const vbA = getVolleyboxMapping(m.takim_a, "Kadınlar 2. Ligi");
                    const nameA = mAny.takim_a_volleybox_name || vbA?.matched_as || m.takim_a;
                    const logoA = (m.takim_a_logo && !m.takim_a_logo.includes("takimlogoyok")) ? m.takim_a_logo : (vbA?.local_logo || vbA?.logo_url);
                    const vbB = getVolleyboxMapping(m.takim_b, "Kadınlar 2. Ligi");
                    const nameB = mAny.takim_b_volleybox_name || vbB?.matched_as || m.takim_b;
                    const logoB = (m.takim_b_logo && !m.takim_b_logo.includes("takimlogoyok")) ? m.takim_b_logo : (vbB?.local_logo || vbB?.logo_url);
                    const isFavA = isFavorite(nameA) || isFavorite(m.takim_a);
                    const isFavB = isFavorite(nameB) || isFavorite(m.takim_b);

                    return (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/takim/${slugify(nameA)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0 hover:opacity-80 transition-opacity"
                              title={`${nameA} Takım Profili`}
                            >
                              {logoA ? (
                                <Image
                                  src={logoA}
                                  alt={nameA}
                                  width={22}
                                  height={22}
                                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded-md shrink-0 bg-white/5 p-0.5"
                                  unoptimized={logoA.startsWith("http")}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-300 font-bold shrink-0">
                                  {nameA.slice(0, 2)}
                                </div>
                              )}
                            </Link>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <Link
                                  href={`/takim/${slugify(nameA)}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-bold text-xs sm:text-[13px] text-slate-100 hover:text-rose-400 transition-colors truncate block hover:underline underline-offset-2"
                                  title={`${nameA} Takım Profili`}
                                >
                                  {nameA}
                                </Link>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    triggerHaptic("selection");
                                    toggleFavorite(nameA);
                                  }}
                                  className="shrink-0 p-0.5 text-slate-500 hover:text-amber-400"
                                  title={isFavA ? "Favorilerden çıkar" : "Favorilere ekle"}
                                >
                                  <Star
                                    size={11}
                                    className={
                                      isFavA
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-slate-600 hover:text-amber-400"
                                    }
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Skor / VS Rozeti */}
                        <div className="shrink-0 text-center px-2">
                          {isFinished ? (
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-black font-mono px-2.5 py-0.5 rounded-lg bg-slate-950 border border-emerald-500/40 text-emerald-400 shadow-xs">
                                {m.skor || "3-0"}
                              </span>
                              {m.set_sonuclari && (
                                <span className="text-[10px] font-mono text-slate-400 mt-1 max-w-[120px] truncate" title={m.set_sonuclari}>
                                  {m.set_sonuclari}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-slate-400 text-xs shadow-inner">
                              VS
                            </div>
                          )}
                        </div>

                        {/* Deplasman */}
                        <div className="flex-1 min-w-0 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    triggerHaptic("selection");
                                    toggleFavorite(nameB);
                                  }}
                                  className="shrink-0 p-0.5 text-slate-500 hover:text-amber-400"
                                  title={isFavB ? "Favorilerden çıkar" : "Favorilere ekle"}
                                >
                                  <Star
                                    size={11}
                                    className={
                                      isFavB
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-slate-600 hover:text-amber-400"
                                    }
                                  />
                                </button>
                                <Link
                                  href={`/takim/${slugify(nameB)}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-bold text-xs sm:text-[13px] text-slate-100 hover:text-rose-400 transition-colors truncate block hover:underline underline-offset-2"
                                  title={`${nameB} Takım Profili`}
                                >
                                  {nameB}
                                </Link>
                              </div>
                            </div>

                            <Link
                              href={`/takim/${slugify(nameB)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0 hover:opacity-80 transition-opacity"
                              title={`${nameB} Takım Profili`}
                            >
                              {logoB ? (
                                <Image
                                  src={logoB}
                                  alt={nameB}
                                  width={22}
                                  height={22}
                                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded-md shrink-0 bg-white/5 p-0.5"
                                  unoptimized={logoB.startsWith("http")}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-300 font-bold shrink-0">
                                  {nameB.slice(0, 2)}
                                </div>
                              )}
                            </Link>
                          </div>
                        </div>
                      </>
                    );
                  })()}
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
