"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  ChevronRight,
  Swords,
  Download,
  Printer,
  Star,
  Layers,
} from "lucide-react";
import { Kadinlar2LigGroup, Kadinlar2LigMatch } from "@/types/kadinlar2Lig";
import { Match } from "@/types/fixture";
import { slugify } from "@/utils/slugify";
import { downloadIcsFile, generateSeasonIcs } from "@/utils/ics";
import { useFavorites } from "@/utils/useFavorites";
import { triggerHaptic } from "@/utils/haptics";

interface Kadinlar2LigFixturesProps {
  group: Kadinlar2LigGroup;
  searchQuery?: string;
  onSelectMatch?: (match: Match) => void;
  showOnlyFavorites?: boolean;
}

export const Kadinlar2LigFixtures: React.FC<Kadinlar2LigFixturesProps> = ({
  group,
  searchQuery = "",
  onSelectMatch,
  showOnlyFavorites = false,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedWeek, setSelectedWeek] = useState<number | "all">("all");
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

  const matches = useMemo(() => group?.fikstur || [], [group?.fikstur]);

  // Hafta listesi
  const weeks = useMemo(() => {
    const set = new Set<number>();
    matches.forEach((m) => {
      if (m.hafta) set.add(m.hafta);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [matches]);

  // Filtrelenmiş maçlar
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (selectedWeek !== "all" && m.hafta !== selectedWeek) return false;
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
  }, [matches, selectedWeek, statusFilter, showOnlyFavorites, searchQuery, isFavorite]);

  const handleDownloadGroupIcs = () => {
    const icsMatches = filteredMatches.map(convertToMatch);
    if (icsMatches.length === 0) {
      alert("Takvime eklenebilecek geçerli maç bulunamadı.");
      return;
    }
    const ics = generateSeasonIcs(icsMatches, `TVF Kadınlar 2. Ligi - ${group.grup_adi} Fikstürü`);
    downloadIcsFile(`kadinlar-2-lig-${slugify(group.grup_adi)}-fikstur.ics`, ics);
  };

  const handlePrint = () => {
    window.print();
  };

  // Haftalara göre grupla
  const matchesByWeek = useMemo(() => {
    const map = new Map<number, Kadinlar2LigMatch[]>();
    filteredMatches.forEach((m) => {
      const w = m.hafta || 1;
      if (!map.has(w)) map.set(w, []);
      map.get(w)!.push(m);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [filteredMatches]);

  return (
    <div className="space-y-4">
      {/* 1. Filtre ve Hafta Seçici Bar (Altyapı ile Birebir) */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Hafta Butonları */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto py-0.5">
          <button
            onClick={() => setSelectedWeek("all")}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap active:scale-95 cursor-pointer border ${
              selectedWeek === "all"
                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500 shadow-glow-red"
                : "bg-slate-800/70 text-slate-300 hover:text-white hover:bg-slate-700/80 border-slate-700/60"
            }`}
          >
            Tüm Haftalar ({matches.length})
          </button>
          {weeks.map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap active:scale-95 cursor-pointer border ${
                selectedWeek === w
                  ? "bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500 shadow-glow-red"
                  : "bg-slate-800/70 text-slate-300 hover:text-white hover:bg-slate-700/80 border-slate-700/60"
              }`}
            >
              {w}. Hafta
            </button>
          ))}
        </div>

        {/* Sağ Taraf: Durum Filtresi + Takvim (.ics) + Yazdır */}
        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto text-xs">
          {/* Takvim .ics İndir */}
          <button
            onClick={handleDownloadGroupIcs}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-all font-semibold active:scale-95 cursor-pointer shadow-xs text-xs"
            title="Bu grubun fikstürünü takviminize (.ics) aktarın"
          >
            <Download size={12} className="text-emerald-400" />
            <span className="hidden sm:inline">Takvime Ekle</span>
          </button>

          {/* Yazdır Butonu */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-all active:scale-95 cursor-pointer text-xs"
            title="Fikstürü yazdır"
          >
            <Printer size={12} />
            <span className="hidden sm:inline">Yazdır</span>
          </button>

          {/* Durum Filtresi: Hepsi / Oynanacak / Bitenler */}
          <div className="flex items-center gap-0.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === "all" ? "bg-red-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              Hepsi
            </button>
            <button
              onClick={() => setStatusFilter("OYNANACAK")}
              className={`px-2.5 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === "OYNANACAK" ? "bg-red-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              Oynanacak
            </button>
            <button
              onClick={() => setStatusFilter("BİTTİ")}
              className={`px-2.5 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === "BİTTİ" ? "bg-red-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              Bitenler
            </button>
          </div>
        </div>
      </div>

      {/* 2. Maç Listesi */}
      {matchesByWeek.length === 0 ? (
        <div className="glass-panel border border-slate-800/80 rounded-2xl p-8 text-center text-slate-400 text-xs">
          Seçilen kriterlere uygun karşılaşma bulunamadı.
        </div>
      ) : (
        matchesByWeek.map(([weekNum, weekMatches]) => (
          <div key={weekNum} className="space-y-2">
            {/* Hafta Başlığı */}
            <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-rose-400" />
                <span>{group.grup_adi} • {weekNum}. Hafta</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {weekMatches.length} Karşılaşma
              </span>
            </div>

            {/* Maç Kartları Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {weekMatches.map((m) => {
                const isFinished = m.durum === "BİTTİ";
                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectMatch?.(convertToMatch(m))}
                    className="glass-panel border border-slate-800/80 hover:border-slate-700 bg-slate-900/65 hover:bg-slate-850/90 rounded-2xl p-3.5 transition-all shadow-card hover:shadow-card-hover cursor-pointer group"
                  >
                    {/* Üst Bilgi: Tarih, Saat, Salon, Şehir */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-2 mb-2.5 gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">
                          {m.tarih} {m.gun ? `(${m.gun})` : ""}
                        </span>
                        {m.saat && (
                          <span className="flex items-center gap-1 text-slate-400 font-mono">
                            <Clock size={11} />
                            {m.saat}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-400 truncate max-w-[200px]" title={`${m.sehir} - ${m.salon}`}>
                        <MapPin size={11} className="shrink-0 text-rose-400" />
                        <span className="truncate">{m.sehir} • {m.salon}</span>
                      </div>
                    </div>

                    {/* Karşılaşma Gövdesi */}
                    <div className="flex items-center justify-between gap-3">
                      {/* Ev Sahibi Takım */}
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
                            <div className="flex items-center gap-1">
                              <Link
                                href={`/takim/${slugify(m.takim_a)}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-bold text-xs sm:text-[13px] text-slate-100 hover:text-rose-400 transition-colors truncate block hover:underline underline-offset-2"
                                title={`${m.takim_a} Takım Profili`}
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
                                className="shrink-0 p-0.5 text-slate-500 hover:text-amber-400"
                                title={isFavorite(m.takim_a) ? "Favorilerden çıkar" : "Favorilere ekle"}
                              >
                                <Star
                                  size={11}
                                  className={
                                    isFavorite(m.takim_a)
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-600 hover:text-amber-400"
                                  }
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Skor veya VS Rozeti (Ortada) */}
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

                      {/* Deplasman Takım */}
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
                                  toggleFavorite(m.takim_b);
                                }}
                                className="shrink-0 p-0.5 text-slate-500 hover:text-amber-400"
                                title={isFavorite(m.takim_b) ? "Favorilerden çıkar" : "Favorilere ekle"}
                              >
                                <Star
                                  size={11}
                                  className={
                                    isFavorite(m.takim_b)
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-600 hover:text-amber-400"
                                  }
                                />
                              </button>
                              <Link
                                href={`/takim/${slugify(m.takim_b)}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-bold text-xs sm:text-[13px] text-slate-100 hover:text-rose-400 transition-colors truncate block hover:underline underline-offset-2"
                                title={`${m.takim_b} Takım Profili`}
                              >
                                {m.takim_b}
                              </Link>
                            </div>
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

                    {/* Alt Çubuk: H2H, Maç Merkezi */}
                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono text-[10px] text-slate-500">
                        Maç No: #{m.mac_no || m.id}
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
          </div>
        ))
      )}
    </div>
  );
};
