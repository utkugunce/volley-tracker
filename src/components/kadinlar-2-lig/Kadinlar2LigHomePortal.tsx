"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Trophy,
  Flame,
  Calendar,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Star,
  Activity,
  ChevronRight,
  Clock,
  Sparkles,
  Layers,
  FileText,
  Swords,
  Users,
} from "lucide-react";
import { Kadinlar2LigData, Kadinlar2LigMatch, Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
import { Match } from "@/types/fixture";
import { slugify } from "@/utils/slugify";
import { useFavorites } from "@/utils/useFavorites";
import { triggerHaptic } from "@/utils/haptics";
import { Kadinlar2LigTabType } from "./Kadinlar2LigHeader";

interface Kadinlar2LigHomePortalProps {
  data: Kadinlar2LigData;
  onNavigateTab: (tab: Kadinlar2LigTabType) => void;
  onSelectGroup: (groupNo: number, tab?: "standings" | "fixtures") => void;
  onSelectMatch: (match: Match) => void;
  searchQuery?: string;
  showOnlyFavorites?: boolean;
}

export const Kadinlar2LigHomePortal: React.FC<Kadinlar2LigHomePortalProps> = ({
  data,
  onNavigateTab,
  onSelectGroup,
  onSelectMatch,
  searchQuery = "",
  showOnlyFavorites = false,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [feedFilter, setFeedFilter] = useState<"all" | "today" | "upcoming" | "finished">("all");

  const todayStr = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }, []);

  const allMatches = useMemo(() => data.tum_maclar || [], [data.tum_maclar]);

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

  // İstatistikler
  const stats = useMemo(() => {
    const totalMatches = allMatches.length;
    const scoredMatches = allMatches.filter(
      (m) => m.durum === "BİTTİ" || (m.skor && m.skor.includes("-") && m.skor.trim() !== "-")
    ).length;
    const upcomingMatches = totalMatches - scoredMatches;
    const todayCount = allMatches.filter((m) => m.tarih === todayStr).length;

    return {
      totalMatches,
      scoredMatches,
      upcomingMatches,
      todayCount,
      totalGroups: data.gruplar.length,
      totalTeams: data.tum_takimlar.length,
    };
  }, [allMatches, todayStr, data.gruplar.length, data.tum_takimlar.length]);

  // Bugünün Maçları
  const todayMatches = useMemo(() => {
    return allMatches.filter((m) => m.tarih === todayStr);
  }, [allMatches, todayStr]);

  // Son Biten Maçlar (En son 6 maç)
  const recentResults = useMemo(() => {
    return allMatches
      .filter((m) => m.durum === "BİTTİ" || (m.skor && m.skor.includes("-") && m.skor.trim() !== "-"))
      .slice(0, 6);
  }, [allMatches]);

  // Yaklaşan Maçlar (En yakın 6 maç)
  const upcomingMatches = useMemo(() => {
    return allMatches
      .filter((m) => m.durum !== "BİTTİ" && (!m.skor || !m.skor.includes("-") || m.skor === "- : -"))
      .slice(0, 6);
  }, [allMatches]);

  // Grup Liderleri (Her grubun 1. ve 2. sırası - Çeyrek Final Hattı)
  const topTeamsPerGroup = useMemo(() => {
    return data.gruplar.map((g) => ({
      grup_no: g.grup_no,
      grup_adi: g.grup_adi,
      leader: g.puan_durumu[0] || null,
      runnerUp: g.puan_durumu[1] || null,
      completedMatches: (g.fikstur || []).filter((m) => m.durum === "BİTTİ").length,
      totalMatches: g.fikstur?.length || g.mac_sayisi || 0,
    }));
  }, [data.gruplar]);

  // Canlı Hub akışı
  const activeFeedMatches = useMemo(() => {
    let list: Kadinlar2LigMatch[] = [];
    if (feedFilter === "today") list = todayMatches;
    else if (feedFilter === "finished") list = recentResults;
    else if (feedFilter === "upcoming") list = upcomingMatches;
    else list = todayMatches.length > 0 ? todayMatches : upcomingMatches;

    if (showOnlyFavorites) {
      list = list.filter((m) => isFavorite(m.takim_a) || isFavorite(m.takim_b));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.takim_a.toLowerCase().includes(q) ||
          m.takim_b.toLowerCase().includes(q) ||
          m.sehir.toLowerCase().includes(q) ||
          m.salon.toLowerCase().includes(q)
      );
    }
    return list;
  }, [feedFilter, todayMatches, recentResults, upcomingMatches, showOnlyFavorites, searchQuery, isFavorite]);

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      {/* 1. ÜST KONTROL BAR: FİLTRE HAPLARI & HIZLI GRUP SEÇİCİ */}
      <div className="glass-panel rounded-2xl p-2.5 sm:p-3 border border-slate-800/90 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-sm">
        {/* Sol: Akış Filtreleri (Canlı Hub, Bugün, Bitenler, Fikstür) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setFeedFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              feedFilter === "all"
                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red font-bold"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50"
            }`}
          >
            <span>Canlı Hub</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
              {stats.totalMatches}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFeedFilter("today")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              feedFilter === "today"
                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red font-bold"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50"
            }`}
          >
            <Flame size={12} className={feedFilter === "today" ? "text-amber-200 fill-amber-300" : "text-rose-400"} />
            <span>Bugün</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                stats.todayCount > 0 ? "bg-rose-500 text-white" : "bg-black/30 text-slate-400"
              }`}
            >
              {stats.todayCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFeedFilter("finished")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              feedFilter === "finished"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-glow-emerald font-bold"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50"
            }`}
          >
            <CheckCircle2 size={12} className={feedFilter === "finished" ? "text-emerald-100" : "text-emerald-400"} />
            <span>Sonuçlar</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
              {stats.scoredMatches}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFeedFilter("upcoming")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              feedFilter === "upcoming"
                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red font-bold"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50"
            }`}
          >
            <Calendar size={12} className={feedFilter === "upcoming" ? "text-white" : "text-rose-400"} />
            <span>Yaklaşan</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
              {stats.upcomingMatches}
            </span>
          </button>
        </div>

        {/* Sağ: Hızlı Kısayol Butonları */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => onNavigateTab("statu")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all font-semibold"
          >
            <FileText size={12} className="text-amber-400" />
            <span>Lig Statüsü</span>
          </button>
          <button
            onClick={() => onNavigateTab("standings")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all font-semibold"
          >
            <Trophy size={12} className="text-amber-400" />
            <span>Puan Durumu</span>
          </button>
        </div>
      </div>

      {/* 2. HIZLI GRUP GEZİNTİSİ (16 Grup Butonu) */}
      <div className="glass-panel rounded-2xl p-2.5 sm:p-3 border border-slate-800/90 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Layers size={13} className="text-rose-400" />
            <span>16 Grup Hızlı Erişim:</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {stats.totalTeams} Kulüp • 32 Çeyrek Finalist
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {data.gruplar.map((g) => (
            <button
              key={g.grup_no}
              onClick={() => onSelectGroup(g.grup_no, "standings")}
              className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Grup {g.grup_no}</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded-full border border-slate-700/40">
                {g.takim_sayisi}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. ANA İÇERİK IZGARASI (Sol: Maç Akışı / Sağ: Liderler & Statü) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SOL VE ORTA: CANLI MAÇ AKIŞI (2 Kolon) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Bölüm Başlığı */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
              <h2 className="text-sm font-extrabold text-white uppercase tracking-tight">
                {feedFilter === "today"
                  ? "Bugünün Karşılaşmaları"
                  : feedFilter === "finished"
                  ? "Son Tamamlanan Maçlar"
                  : feedFilter === "upcoming"
                  ? "Yaklaşan Fikstür Maçları"
                  : todayMatches.length > 0
                  ? "Bugünün Karşılaşmaları"
                  : "Yaklaşan Fikstür Maçları"}
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab("fixtures")}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
            >
              <span>Tüm Fikstür</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Maç Kartları */}
          {activeFeedMatches.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 border border-slate-800/90 text-center space-y-2">
              <Calendar size={32} className="mx-auto text-slate-600" />
              <p className="text-xs text-slate-400">
                {feedFilter === "today"
                  ? "Bugün takvimde Kadınlar 2. Ligi maçı bulunmuyor."
                  : "Seçili filtreye uygun maç bulunamadı."}
              </p>
              {feedFilter === "today" && (
                <button
                  onClick={() => setFeedFilter("upcoming")}
                  className="text-xs text-rose-400 hover:underline font-semibold"
                >
                  Yaklaşan maçları görüntüle ➔
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {activeFeedMatches.map((m) => {
                const isFinished = m.durum === "BİTTİ";
                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectMatch(convertToMatch(m))}
                    className="glass-panel border border-slate-800/80 hover:border-slate-700 bg-slate-900/65 hover:bg-slate-850/90 rounded-2xl p-3.5 transition-all shadow-card hover:shadow-card-hover cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
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
                        <div className="flex items-center gap-1 text-slate-400 truncate max-w-[170px]" title={`${m.sehir} - ${m.salon}`}>
                          <MapPin size={11} className="shrink-0 text-rose-400" />
                          <span className="truncate">{m.sehir}</span>
                        </div>
                      </div>

                      {/* Karşılaşma Gövdesi */}
                      <div className="flex items-center justify-between gap-2.5">
                        {/* Ev Sahibi */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/takim/${slugify(m.takim_a)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0"
                            >
                              {m.takim_a_logo && !m.takim_a_logo.includes("takimlogoyok") ? (
                                <Image
                                  src={m.takim_a_logo}
                                  alt={m.takim_a}
                                  width={22}
                                  height={22}
                                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded bg-white/5 p-0.5"
                                  unoptimized={m.takim_a_logo.startsWith("http")}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                  {m.takim_a.slice(0, 2)}
                                </div>
                              )}
                            </Link>
                            <Link
                              href={`/takim/${slugify(m.takim_a)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-bold text-xs sm:text-[13px] text-slate-100 hover:text-rose-400 truncate block hover:underline"
                            >
                              {m.takim_a}
                            </Link>
                          </div>
                        </div>

                        {/* Skor / VS Rozeti */}
                        <div className="shrink-0 text-center px-1">
                          {isFinished ? (
                            <span className="text-sm font-black font-mono px-2 py-0.5 rounded-lg bg-slate-950 border border-emerald-500/40 text-emerald-400 shadow-xs">
                              {m.skor || "3-0"}
                            </span>
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-slate-400 text-[11px]">
                              VS
                            </div>
                          )}
                        </div>

                        {/* Deplasman */}
                        <div className="flex-1 min-w-0 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/takim/${slugify(m.takim_b)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-bold text-xs sm:text-[13px] text-slate-100 hover:text-rose-400 truncate block hover:underline"
                            >
                              {m.takim_b}
                            </Link>
                            <Link
                              href={`/takim/${slugify(m.takim_b)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0"
                            >
                              {m.takim_b_logo && !m.takim_b_logo.includes("takimlogoyok") ? (
                                <Image
                                  src={m.takim_b_logo}
                                  alt={m.takim_b}
                                  width={22}
                                  height={22}
                                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded bg-white/5 p-0.5"
                                  unoptimized={m.takim_b_logo.startsWith("http")}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                  {m.takim_b.slice(0, 2)}
                                </div>
                              )}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Alt Çubuk */}
                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-[10px] font-mono text-slate-500">#{m.mac_no || m.id}</span>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/karsilastir?takim1=${slugify(m.takim_a)}&takim2=${slugify(m.takim_b)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-semibold"
                        >
                          <Swords size={10} />
                          <span>H2H</span>
                        </Link>
                        <span className="text-[10px] font-semibold text-rose-400 group-hover:underline flex items-center gap-0.5">
                          <span>Detay</span>
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

        {/* SAĞ KOLON: 16 GRUP ÇEYREK FİNAL LİDERLERİ & STATÜ ÖZETİ */}
        <div className="space-y-4">
          {/* 16 Grup Liderleri Tablosu */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800/90 shadow-card space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-amber-400" />
                <h3 className="font-extrabold text-xs sm:text-sm text-white uppercase tracking-tight">
                  Çeyrek Final Hattı (Top 2)
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab("leaders")}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-0.5"
              >
                <span>Tümü</span>
                <ChevronRight size={11} />
              </button>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto no-scrollbar pr-1">
              {topTeamsPerGroup.slice(0, 8).map((grp) => (
                <div
                  key={grp.grup_no}
                  onClick={() => onSelectGroup(grp.grup_no, "standings")}
                  className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-rose-300">Grup {grp.grup_no}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {grp.completedMatches}/{grp.totalMatches} Maç
                    </span>
                  </div>

                  {grp.leader && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-emerald-400 font-black font-mono text-[11px]">1.</span>
                        {grp.leader.logo && !grp.leader.logo.includes("takimlogoyok") && (
                          <Image
                            src={grp.leader.logo}
                            alt=""
                            width={16}
                            height={16}
                            className="w-3.5 h-3.5 object-contain rounded shrink-0 bg-white/5 p-0.5"
                            unoptimized={grp.leader.logo.startsWith("http")}
                          />
                        )}
                        <span className="text-slate-200 truncate font-semibold text-[11px]">
                          {grp.leader.volleybox_name || grp.leader.takim_adi}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-white text-[11px] bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                        {grp.leader.p}P
                      </span>
                    </div>
                  )}

                  {grp.runnerUp && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-emerald-400/80 font-black font-mono text-[11px]">2.</span>
                        {grp.runnerUp.logo && !grp.runnerUp.logo.includes("takimlogoyok") && (
                          <Image
                            src={grp.runnerUp.logo}
                            alt=""
                            width={16}
                            height={16}
                            className="w-3.5 h-3.5 object-contain rounded shrink-0 bg-white/5 p-0.5"
                            unoptimized={grp.runnerUp.logo.startsWith("http")}
                          />
                        )}
                        <span className="text-slate-300 truncate text-[11px]">
                          {grp.runnerUp.volleybox_name || grp.runnerUp.takim_adi}
                        </span>
                      </div>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {grp.runnerUp.p}P
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigateTab("leaders")}
              className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-bold text-center transition-all cursor-pointer"
            >
              16 Grubun Tamamını Gör ➔
            </button>
          </div>

          {/* Statü Bilgi Rozeti */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800/90 shadow-card bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-slate-900/80 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles size={16} />
              <h4 className="font-extrabold text-xs uppercase tracking-wider">
                1. Lig'e Yükselme Sistemi
              </h4>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              16 gruptan ilk 2 sırayı alan <strong className="text-white">32 takım</strong> Çeyrek Final'e yükselir. Çeyrek final, yarı final ve final etapları sonucunda <strong className="text-amber-300">4 takım Arabica Coffee House Kadınlar 1. Ligi</strong>'ne yükselir.
            </p>
            <button
              onClick={() => onNavigateTab("statu")}
              className="text-xs text-amber-300 hover:text-white font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Resmi statü şemasını incele</span>
              <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
