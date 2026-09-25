"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Flame,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Star,
  Swords,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Kadinlar2LigMatch, Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
import { Match } from "@/types/fixture";
import { slugify } from "@/utils/slugify";
import { DateRibbon } from "@/components/DateRibbon";
import { useFavorites } from "@/utils/useFavorites";
import { triggerHaptic } from "@/utils/haptics";

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

  // 1. Tüm tarihleri ve her tarihteki maç sayılarını topla
  const { uniqueDates, dateCounts, initialSelectedDate } = useMemo(() => {
    const counts: { [dateStr: string]: number } = {};
    allMatches.forEach((m) => {
      if (m.tarih) {
        counts[m.tarih] = (counts[m.tarih] || 0) + 1;
      }
    });

    const dates = Object.keys(counts).sort();

    // Varsayılan tarih seçimi: Eğer bugün maç varsa bugün, yoksa bugünden sonraki ilk maç günü, o da yoksa ilk tarih
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

  // 2. Filtrelenmiş maçlar
  const filteredMatches = useMemo(() => {
    return allMatches.filter((m) => {
      // Tarih filtresi
      if (selectedDate !== "all" && m.tarih !== selectedDate) return false;
      // Grup filtresi
      if (selectedGroupFilter !== "all" && m.grup_no !== selectedGroupFilter) return false;
      // Durum filtresi
      if (statusFilter !== "all" && m.durum !== statusFilter) return false;
      // Favoriler filtresi
      if (showOnlyFavorites) {
        const homeFav = isFavorite(m.takim_a);
        const awayFav = isFavorite(m.takim_b);
        if (!homeFav && !awayFav) return false;
      }
      // Arama filtresi
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTeams = m.takim_a.toLowerCase().includes(q) || m.takim_b.toLowerCase().includes(q);
        const inCity = m.sehir?.toLowerCase().includes(q);
        const inHall = m.salon?.toLowerCase().includes(q);
        if (!inTeams && !inCity && !inHall) return false;
      }
      return true;
    });
  }, [allMatches, selectedDate, selectedGroupFilter, statusFilter, showOnlyFavorites, searchQuery, isFavorite]);

  // Günün maç sayısı
  const todayMatchesTotal = dateCounts[todayStr] || 0;

  return (
    <div className="space-y-4">
      {/* 1. Tarih Şeridi (Date Ribbon) */}
      <div className="bg-[#120d29]/80 border border-purple-900/40 rounded-2xl p-2.5 sm:p-3 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-pink-400" />
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Tarihe Göre Maçlar (16 Grup)
            </h2>
            {todayMatchesTotal > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold animate-pulse">
                Bugün {todayMatchesTotal} Maç
              </span>
            )}
          </div>

          <button
            onClick={() => setSelectedDate(selectedDate === "all" ? initialSelectedDate : "all")}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-semibold ${
              selectedDate === "all"
                ? "bg-purple-600 text-white border-purple-500 shadow-xs"
                : "bg-purple-950/60 text-purple-300 border-purple-800/60 hover:text-white hover:bg-purple-900/60"
            }`}
          >
            {selectedDate === "all" ? "Tüm Günler Açık" : "Tüm Fikstür"}
          </button>
        </div>

        <DateRibbon
          dates={uniqueDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          dateCounts={dateCounts}
          todayStr={todayStr}
          variant="red"
        />
      </div>

      {/* 2. Filtre Barı (Grup, Durum, Favoriler) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#120d29]/70 border border-purple-900/40 rounded-xl p-2.5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
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
                  {g.grup_adi} ({g.takim_sayisi} Takım)
                </option>
              ))}
            </select>
          </div>

          {/* Durum Filtresi */}
          <div className="flex items-center gap-1 bg-[#181136] p-0.5 rounded-lg border border-purple-800/50">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition-colors cursor-pointer ${
                statusFilter === "all" ? "bg-purple-600 text-white" : "text-purple-300 hover:text-white"
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setStatusFilter("OYNANACAK")}
              className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition-colors cursor-pointer ${
                statusFilter === "OYNANACAK" ? "bg-purple-600 text-white" : "text-purple-300 hover:text-white"
              }`}
            >
              Oynanacak
            </button>
            <button
              onClick={() => setStatusFilter("BİTTİ")}
              className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition-colors cursor-pointer ${
                statusFilter === "BİTTİ" ? "bg-purple-600 text-white" : "text-purple-300 hover:text-white"
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
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              showOnlyFavorites
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                : "bg-purple-950/60 text-purple-300 border-purple-800/60 hover:text-white hover:bg-purple-900/60"
            }`}
            title="Sadece takip ettiğim favori kulüplerin maçlarını listele"
          >
            <Star size={13} className={showOnlyFavorites ? "fill-amber-400 text-amber-400" : "text-purple-400"} />
            <span>Favori Takımlarım</span>
          </button>
        )}
      </div>

      {/* 3. Maç Listesi */}
      {filteredMatches.length === 0 ? (
        <div className="bg-[#120d29]/50 border border-purple-900/40 rounded-2xl p-8 text-center space-y-3">
          <Calendar size={36} className="mx-auto text-purple-400/50" />
          <h3 className="text-sm font-bold text-white">Bu filtrede maç bulunamadı</h3>
          <p className="text-xs text-purple-300/70 max-w-md mx-auto">
            {showOnlyFavorites
              ? "Favoriye eklediğiniz kulüplerin bu tarih veya grupta maçı bulunmuyor."
              : "Seçili tarih veya grup filtresine uyan karşılaşma yok. Farklı bir tarih seçebilirsiniz."}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            {selectedDate !== "all" && (
              <button
                onClick={() => setSelectedDate("all")}
                className="text-xs px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-semibold transition-colors cursor-pointer"
              >
                Tüm Tarihleri Göster
              </button>
            )}
            {showOnlyFavorites && onToggleFavoritesOnly && (
              <button
                onClick={onToggleFavoritesOnly}
                className="text-xs px-3 py-1.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700 font-semibold transition-colors cursor-pointer"
              >
                Favori Filtresini Kapat
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredMatches.map((m) => {
            const isFinished = m.durum === "BİTTİ";
            const homeFav = isFavorite(m.takim_a);
            const awayFav = isFavorite(m.takim_b);

            return (
              <div
                key={m.id}
                onClick={() => onSelectMatch(convertToMatch(m))}
                className="bg-[#130d29]/90 hover:bg-[#1a1238] border border-purple-900/40 hover:border-purple-600/60 rounded-2xl p-3.5 transition-all shadow-md hover:shadow-xl cursor-pointer group flex flex-col justify-between gap-2.5 relative overflow-hidden"
              >
                {/* Üst Bilgi: Tarih, Saat, Salon, Grup Rozeti */}
                <div className="flex items-center justify-between gap-2 text-[11px] text-purple-300/80 border-b border-purple-900/30 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800/50 font-mono font-bold text-[10px]">
                      {m.grup_adi}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock size={11} className="text-pink-400" />
                      {m.saat || "--:--"}
                    </span>
                    <span className="text-purple-400/50">•</span>
                    <span>{m.tarih}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isFinished
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-600/50"
                          : "bg-purple-950/80 text-purple-300 border-purple-700/50"
                      }`}
                    >
                      {isFinished ? "BİTTİ" : "OYNANACAK"}
                    </span>
                  </div>
                </div>

                {/* Takımlar ve Skor Alanı */}
                <div className="grid grid-cols-12 items-center gap-2 py-1">
                  {/* Ev Sahibi */}
                  <div className="col-span-5 flex items-center gap-2 min-w-0">
                    <Link
                      href={`/takim/${slugify(m.takim_a)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 hover:opacity-85 transition-opacity"
                      title={`${m.takim_a} Takım Profili`}
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
                          title={homeFav ? "Favorilerden çıkar" : "Favorilere ekle"}
                        >
                          <Star
                            size={11}
                            className={homeFav ? "fill-amber-400 text-amber-400" : "text-purple-400/40 hover:text-amber-300"}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Skor & VS Ortası */}
                  <div className="col-span-2 flex flex-col items-center justify-center text-center">
                    {isFinished && m.skor && m.skor !== "- : -" ? (
                      <span className="text-sm sm:text-base font-black font-mono text-white bg-purple-950/80 px-2.5 py-0.5 rounded-lg border border-purple-700/60 shadow-inner">
                        {m.skor}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-pink-400/80 bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-800/40">
                        VS
                      </span>
                    )}
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
                          title={awayFav ? "Favorilerden çıkar" : "Favorilere ekle"}
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
                      title={`${m.takim_b} Takım Profili`}
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

                {/* Alt Kısım: Salon & Şehir & H2H Karşılaştır Butonu */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-purple-900/30 text-[11px] text-purple-300/70">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin size={11} className="text-pink-400 shrink-0" />
                    <span className="truncate">{m.salon || "Salon Bilgisi Bekleniyor"}</span>
                    {m.sehir && (
                      <span className="text-purple-400/50">({m.sehir})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/karsilastir?takim1=${slugify(m.takim_a)}&takim2=${slugify(m.takim_b)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-800/60 hover:bg-amber-900/60 px-2 py-0.5 rounded-md transition-colors"
                      title="Bu iki takımı karşılaştır"
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
