"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { TeamBadge } from "@/components/TeamBadge";
import {
  Trophy,
  Flame,
  Calendar,
  CheckCircle2,
  MapPin,
  Star,
  ChevronRight,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Kadinlar2LigData, Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
import { Match } from "@/types/fixture";
import { useFavorites } from "@/utils/useFavorites";
import {
  convertK2MatchToMatch,
  getKadinlar2LigTeamName,
  normalizeK2Date,
} from "@/utils/kadinlar2LigConverter";
import { isMatchScored } from "@/utils/matchScoring";
import { compareMatchDateTime, formatDateTurkish } from "@/utils/calendar";
import { getVolleyboxMapping } from "@/utils/volleybox";
import { Kadinlar2LigTabType } from "./Kadinlar2LigHeader";

interface Kadinlar2LigHomePortalProps {
  data: Kadinlar2LigData;
  onNavigateTab: (tab: Kadinlar2LigTabType) => void;
  onSelectGroup: (groupNo: number, tab?: "standings" | "fixtures") => void;
  onSelectMatch: (match: Match) => void;
  selectedMatchId?: string | null;
  searchQuery?: string;
  showOnlyFavorites?: boolean;
}

export const Kadinlar2LigHomePortal: React.FC<Kadinlar2LigHomePortalProps> = ({
  data,
  onNavigateTab,
  onSelectGroup,
  onSelectMatch,
  selectedMatchId,
  searchQuery = "",
  showOnlyFavorites = false,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [feedFilter, setFeedFilter] = useState<"all" | "today" | "upcoming" | "finished">("all");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<number | "all">("all");

  // Bugün tarihi — yalnızca client tarafında hesaplanır (hydration error #418 önleme)
  const [todayStr, setTodayStr] = useState("");
  useEffect(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    setTodayStr(`${day}.${month}.${year}`);
  }, []);

  const todayIso = useMemo(() => {
    if (!todayStr) return "";
    return normalizeK2Date(todayStr);
  }, [todayStr]);

  // Standart Match dizisi
  const convertedMatches = useMemo(() => {
    return (data.tum_maclar || []).map(convertK2MatchToMatch);
  }, [data.tum_maclar]);

  // İstatistikler
  const stats = useMemo(() => {
    const totalMatches = convertedMatches.length;
    const scoredMatches = convertedMatches.filter(isMatchScored).length;
    const upcomingMatches = totalMatches - scoredMatches;
    const todayCount = convertedMatches.filter((m) => m.date === todayIso).length;

    return {
      totalMatches,
      scoredMatches,
      upcomingMatches,
      todayCount,
      totalGroups: data.gruplar.length,
      totalTeams: data.tum_takimlar.length,
    };
  }, [convertedMatches, todayIso, data.gruplar.length, data.tum_takimlar.length]);

  // Filtrelemeler (Grup, Arama, Favoriler)
  const matchesByGroupAndSearch = useMemo(() => {
    return convertedMatches.filter((m) => {
      if (selectedGroupFilter !== "all" && m.group !== `Grup ${selectedGroupFilter}`) {
        return false;
      }
      if (showOnlyFavorites) {
        if (!isFavorite(m.home_team) && !isFavorite(m.away_team)) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTeams = m.home_team.toLowerCase().includes(q) || m.away_team.toLowerCase().includes(q);
        const inCity = (m.city || "").toLowerCase().includes(q);
        const inHall = (m.hall || "").toLowerCase().includes(q);
        if (!inTeams && !inCity && !inHall) return false;
      }
      return true;
    });
  }, [convertedMatches, selectedGroupFilter, showOnlyFavorites, searchQuery, isFavorite]);

  // Bugünün Maçları
  const todayMatches = useMemo(() => {
    if (!todayIso) return [];
    return matchesByGroupAndSearch
      .filter((m) => m.date === todayIso)
      .sort((a, b) => compareMatchDateTime(a, b, "asc"));
  }, [matchesByGroupAndSearch, todayIso]);

  // Yaklaşan Maçlar (Oynanmamış en yakın maçlar)
  const upcomingMatches = useMemo(() => {
    return matchesByGroupAndSearch
      .filter((m) => !isMatchScored(m) && m.date !== todayIso)
      .sort((a, b) => compareMatchDateTime(a, b, "asc"))
      .slice(0, 10);
  }, [matchesByGroupAndSearch, todayIso]);

  // Son Biten Maçlar (En yeni skorlanan maçlar)
  const recentResults = useMemo(() => {
    return matchesByGroupAndSearch
      .filter(isMatchScored)
      .sort((a, b) => compareMatchDateTime(a, b, "desc"))
      .slice(0, 10);
  }, [matchesByGroupAndSearch]);

  // Filtrelenmiş Liste (feedFilter !== 'all' olduğunda)
  const displayMatches = useMemo(() => {
    if (feedFilter === "today") return todayMatches;
    if (feedFilter === "finished") return recentResults;
    if (feedFilter === "upcoming") return upcomingMatches;
    return null;
  }, [feedFilter, todayMatches, recentResults, upcomingMatches]);

  // Grup Liderleri (Çeyrek Final Hattı)
  const topTeamsPerGroup = useMemo(() => {
    return data.gruplar.map((g) => ({
      grup_no: g.grup_no,
      grup_adi: g.grup_adi || `Grup ${g.grup_no}`,
      leader: g.puan_durumu[0] || null,
      runnerUp: g.puan_durumu[1] || null,
      completedMatches: (g.fikstur || []).filter((m) => m.durum === "BİTTİ").length,
      totalMatches: g.fikstur?.length || g.mac_sayisi || 0,
    }));
  }, [data.gruplar]);

  const handleToggleFavorite = (matchId: string) => {
    const m = convertedMatches.find((x) => x.id === matchId);
    if (m) toggleFavorite(m.home_team);
  };

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      {/* Sayfa Başlığı (Semantik H1 & Canlı Gösterge) */}
      <div className="flex items-center justify-between pb-1">
        <h1 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-done shrink-0" />
          <span>TVF Kadınlar 2. Ligi Maç Merkezi & Bülteni</span>
        </h1>
        <span className="text-[11px] font-display tabular-nums text-ink-2">
          {selectedGroupFilter === "all" ? "16 Grup" : `Grup ${selectedGroupFilter}`} · {stats.totalMatches} Maç
        </span>
      </div>

      {/* 1. ÜST KONTROL BAR: FİLTRE HAPLARI & HIZLI GRUP SEÇİCİ */}
      <div className="glass-panel rounded-2xl p-2.5 sm:p-3 border border-slate-800/90 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-sm">
        {/* Sol: Akış Filtreleri (Canlı Hub, Bugün, Bitenler, Fikstür) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setFeedFilter("all")}
            className={`px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              feedFilter === "all"
                ? "bg-selected-strong text-white font-bold shadow-glow-selected"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white"
            }`}
          >
            <span>Canlı Hub</span>
            <span className="text-[10px] font-display font-semibold tabular-nums text-current">
              {stats.totalMatches}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFeedFilter("today")}
            className={`px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              feedFilter === "today"
                ? "bg-selected-strong text-white font-bold shadow-glow-selected"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white"
            }`}
          >
            <Flame size={13} className={feedFilter === "today" ? "fill-white/30 text-white" : "text-ink-2"} />
            <span>Bugün</span>
            {stats.todayCount > 0 && (
              <span className="text-[10px] font-display font-semibold tabular-nums text-ink-2">
                {stats.todayCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFeedFilter("finished")}
            className={`px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              feedFilter === "finished"
                ? "bg-done text-done-fg font-bold"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white"
            }`}
          >
            <CheckCircle2 size={13} className={feedFilter === "finished" ? "text-done-fg" : "text-emerald-400"} />
            <span>Biten Skorlar</span>
            <span className="text-[10px] font-display font-semibold tabular-nums text-current">
              {stats.scoredMatches}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFeedFilter("upcoming")}
            className={`px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              feedFilter === "upcoming"
                ? "bg-selected-strong text-white font-bold shadow-glow-selected"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white"
            }`}
          >
            <Calendar size={13} className={feedFilter === "upcoming" ? "text-white" : "text-sky-400"} />
            <span>Gelecek Maçlar</span>
            <span className="text-[10px] font-display font-semibold tabular-nums text-current">
              {stats.upcomingMatches}
            </span>
          </button>
        </div>

        {/* Sağ: Hızlı Grup Geçiş Hapları */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 border-t md:border-t-0 border-slate-800/60 pt-2 md:pt-0">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">Grup:</span>
          <button
            type="button"
            onClick={() => setSelectedGroupFilter("all")}
            className={`px-2.5 py-1 min-h-[36px] rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
              selectedGroupFilter === "all"
                ? "bg-primary/20 text-primary border border-primary/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Tümü
          </button>
          {data.gruplar.map((g) => (
            <button
              key={g.grup_no}
              type="button"
              onClick={() => setSelectedGroupFilter(g.grup_no)}
              className={`px-2.5 py-1 min-h-[36px] rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                selectedGroupFilter === g.grup_no
                  ? "bg-primary/20 text-primary border border-primary/40 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Grup {g.grup_no}
            </button>
          ))}
        </div>
      </div>

      {/* 2. ANA İÇERİK DÜZENİ: TAM GENİŞLİK MAÇ AKIŞI */}
      <div className="w-full space-y-4">
        {feedFilter !== "all" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
              <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                <span>
                  {feedFilter === "today"
                    ? "Bugünün Maçları"
                    : feedFilter === "finished"
                    ? "Biten Maç Sonuçları"
                    : "Yaklaşan Fikstür"}
                </span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  ({(displayMatches || []).length} Maç)
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setFeedFilter("all")}
                className="text-xs text-ink-2 hover:text-ink font-semibold cursor-pointer"
              >
                Tüm Akışa Dön →
              </button>
            </div>

            {(displayMatches || []).length === 0 ? (
              <div className="text-center py-10 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
                <p className="text-xs font-semibold text-slate-300 mb-1">
                  Bu filtreye ait maç bulunamadı.
                </p>
                <p className="text-[11px] text-slate-500">
                  Diğer sekmeleri veya farklı bir grubu seçerek maçları listeleyebilirsiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {(displayMatches || []).map((match) => (
                  <MatchRow
                    key={match.id}
                    match={match}
                    isSelected={selectedMatchId === match.id}
                    isFavorite={isFavorite(match.home_team) || isFavorite(match.away_team)}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectMatch={onSelectMatch}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* FEED FILTER === "ALL": DENGELİ ANA GÖRÜNÜM */
          <div className="space-y-5">
            {/* BÖLÜM 1: BUGÜNÜN MAÇLARI (Varsa en üstte) */}
            {todayMatches.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-done" />
                    <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span>Bugünün Maçları</span>
                      <span className="text-ink-2 font-display tabular-nums">({todayMatches.length})</span>
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 font-medium">
                    {formatDateTurkish(todayStr)}
                  </span>
                </div>

                <div className="space-y-2">
                  {todayMatches.map((match) => (
                    <MatchRow
                      key={match.id}
                      match={match}
                      isSelected={selectedMatchId === match.id}
                      isFavorite={isFavorite(match.home_team) || isFavorite(match.away_team)}
                      onToggleFavorite={handleToggleFavorite}
                      onSelectMatch={onSelectMatch}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* BÖLÜM 2: YAKLAŞAN ÖNE ÇIKAN KARŞILAŞMALAR */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-surface-raised border border-line flex items-center justify-center text-ink-2">
                    <Calendar size={12} />
                  </div>
                  <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    Yaklaşan Fikstür
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab("fixtures")}
                  className="text-xs text-ink-2 hover:text-ink font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Tüm Fikstür</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              <div className="space-y-2">
                {upcomingMatches.length === 0 ? (
                  <div className="text-center py-6 bg-slate-900/50 border border-slate-800 rounded-2xl text-xs text-slate-400">
                    Yakın tarihte planlanmış yeni maç bulunmuyor.
                  </div>
                ) : (
                  upcomingMatches.map((match) => (
                    <MatchRow
                      key={match.id}
                      match={match}
                      isSelected={selectedMatchId === match.id}
                      isFavorite={isFavorite(match.home_team) || isFavorite(match.away_team)}
                      onToggleFavorite={handleToggleFavorite}
                      onSelectMatch={onSelectMatch}
                    />
                  ))
                )}
              </div>
            </div>

            {/* BÖLÜM 3: SON BİTEN MAÇLAR VE SKORLAR */}
            {recentResults.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 size={12} />
                    </div>
                    <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                      Son Biten Maçlar & Skorlar
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("results")}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Tüm Sonuçlar ({stats.scoredMatches})</span>
                    <ChevronRight size={13} />
                  </button>
                </div>

                <div className="space-y-2">
                  {recentResults.map((match) => (
                    <MatchRow
                      key={match.id}
                      match={match}
                      isSelected={selectedMatchId === match.id}
                      isFavorite={isFavorite(match.home_team) || isFavorite(match.away_team)}
                      onToggleFavorite={handleToggleFavorite}
                      onSelectMatch={onSelectMatch}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ================= ALT KISIM: 2 KOLONLU WİDGET VE BİLGİ PANELİ ================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              {/* 1. KART: ZİRVE YARIŞI / GRUP LİDERLERİ */}
              <div className="glass-panel rounded-2xl p-3.5 border border-slate-800/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/70 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                      <Trophy size={12} />
                    </div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Grup Liderleri (Çeyrek Final Hattı)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("leaders")}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    Tüm Gruplar →
                  </button>
                </div>

                <div
                  className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1"
                  tabIndex={0}
                  role="region"
                  aria-label="Grup liderleri"
                >
                  {topTeamsPerGroup.map((grp) => {
                    const leaderName = grp.leader
                      ? getKadinlar2LigTeamName(grp.leader.takim_adi, grp.leader.volleybox_name)
                      : null;
                    const mapping = leaderName
                      ? getVolleyboxMapping(leaderName, "Kadınlar 2. Ligi")
                      : null;
                    const logo = mapping?.local_logo || mapping?.logo_url;

                    return (
                      <div
                        key={grp.grup_no}
                        onClick={() => onSelectGroup(grp.grup_no, "standings")}
                        className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 transition-colors flex items-center justify-between gap-2 text-xs cursor-pointer"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="font-bold text-[10px] text-ink-2 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50 shrink-0">
                            Grup {grp.grup_no}
                          </span>
                          {leaderName ? (
                            <>
                              <TeamBadge name={leaderName} logoUrl={logo} size="xs" />
                              <div className="font-bold text-white truncate text-xs">
                                {leaderName}
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500">-</span>
                          )}
                        </div>

                        {grp.leader && (
                          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                            <span className="text-slate-400">
                              {grp.leader.g}G - {grp.leader.m}M
                            </span>
                            <span className="font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                              {grp.leader.p} P
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. KART: RESMİ STATÜ & 1. LİG'E YÜKSELME SİSTEMİ */}
              <div className="glass-panel rounded-2xl p-4 border border-slate-800/90 shadow-card bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-slate-900/80 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Sparkles size={16} />
                    <h3 className="font-black text-xs uppercase tracking-wider text-white">
                      1. Lig&apos;e Yükselme Sistemi
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    16 gruptan ilk 2 sırayı alan <strong className="text-white">32 takım</strong> Çeyrek Final&apos;e yükselir. Çeyrek final, yarı final ve final etapları sonucunda <strong className="text-amber-300">4 takım Arabica Coffee House Kadınlar 1. Ligi</strong>&apos;ne yükselir.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="block text-slate-400 text-[10px]">Çeyrek Final</span>
                      <strong className="text-white">32 Kulüp (8x4)</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="block text-slate-400 text-[10px]">1. Lig Bileti</span>
                      <strong className="text-amber-300">4 Kulüp</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab("statu")}
                  className="text-xs text-amber-300 hover:text-white font-bold flex items-center gap-1 hover:underline cursor-pointer pt-2"
                >
                  <span>Resmi statü şemasını incele</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>

            {/* 3. KART: HIZLI PLATFORM BİLGİSİ */}
            <div className="rounded-2xl p-3 bg-gradient-to-r from-slate-900 to-surface-muted border border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-ink-2 shrink-0" />
                <span>TVF Resmi Bülteni & Volleybox Entegrasyonu</span>
              </div>
              <span className="font-mono font-bold text-slate-200 shrink-0">16 Grup Canlı Takip</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ========================================================================= */
/* ALT BİLEŞEN: FotMob / Sofascore STANDARTLARINDA TEMİZ MAÇ ŞERİDİ */
/* ========================================================================= */
interface MatchRowProps {
  match: Match;
  isSelected?: boolean;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelectMatch: (m: Match) => void;
}

const MatchRow: React.FC<MatchRowProps> = ({
  match,
  isSelected = false,
  isFavorite,
  onToggleFavorite,
  onSelectMatch,
}) => {
  const hasScore = isMatchScored(match);

  const homeMapping = getVolleyboxMapping(match.home_team, "Kadınlar 2. Ligi", undefined, match.city);
  const awayMapping = getVolleyboxMapping(match.away_team, "Kadınlar 2. Ligi", undefined, match.city);
  const homeLogo = homeMapping?.local_logo || homeMapping?.logo_url;
  const awayLogo = awayMapping?.local_logo || awayMapping?.logo_url;

  const homeScore = match.home_score ?? match.score?.split("-")[0]?.trim();
  const awayScore = match.away_score ?? match.score?.split("-")[1]?.trim();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectMatch(match)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectMatch(match);
        }
      }}
      className={`group relative bg-canvas/70 hover:bg-panel border rounded-xl p-2.5 sm:p-3 transition-all duration-150 cursor-pointer shadow-xs active:scale-[0.995] ${
        isSelected
          ? "border-primary/60 ring-2 ring-primary/40 bg-panel"
          : "border-slate-800/80 hover:border-primary/40"
      }`}
    >
      {/* Üst Satır: Şehir, Grup ve Salon */}
      <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-400 mb-1.5 pb-1 border-b border-slate-800/50">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-bold text-sky-400 bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-800/40">
            {match.city || "Genel"}
          </span>
          <span className="truncate text-slate-400">
            {match.group || "Kadınlar 2. Ligi"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
          {match.hall && (
            <span className="hidden sm:inline-flex items-center gap-0.5 truncate max-w-[150px]">
              <MapPin size={10} className="text-slate-500" />
              <span className="truncate">{match.hall}</span>
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(match.id);
            }}
            className={`p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-md transition-colors ${
              isFavorite ? "text-amber-400" : "text-slate-400 hover:text-amber-400"
            }`}
            title={isFavorite ? "Favorilerden Çıkar" : "Favoriye Ekle"}
            aria-label={isFavorite ? "Favorilerden Çıkar" : "Favoriye Ekle"}
          >
            <Star size={14} className={isFavorite ? "fill-amber-400" : ""} />
          </button>
        </div>
      </div>

      {/* Orta Satır: Takımlar ve Skor / Zaman */}
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        {/* Sol: 2 Takım Satırı */}
        <div className="space-y-1.5 min-w-0">
          {/* Ev Sahibi */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <TeamBadge name={match.home_team} logoUrl={homeLogo} size="xs" />
              <span className="text-xs sm:text-sm font-bold text-white group-hover:text-ink transition-colors truncate">
                {match.home_team}
              </span>
            </div>
            {hasScore && (
              <span className="font-mono font-scoreboard tabular-nums font-black text-xs sm:text-sm text-emerald-400 pl-2">
                {homeScore}
              </span>
            )}
          </div>

          {/* Deplasman */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <TeamBadge name={match.away_team} logoUrl={awayLogo} size="xs" />
              <span className="text-xs sm:text-sm font-bold text-white group-hover:text-ink transition-colors truncate">
                {match.away_team}
              </span>
            </div>
            {hasScore && (
              <span className="font-mono font-scoreboard tabular-nums font-black text-xs sm:text-sm text-emerald-400 pl-2">
                {awayScore}
              </span>
            )}
          </div>
        </div>

        {/* Sağ: Skor veya Saat / Durum Kutusu */}
        <div className="flex flex-col items-end justify-center shrink-0 min-w-[70px]">
          {hasScore ? (
            <div className="text-right">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-600/50 font-mono font-scoreboard tabular-nums font-bold text-xs text-emerald-300">
                <span>{homeScore}</span>
                <span>:</span>
                <span>{awayScore}</span>
              </div>
              {match.set_scores && match.set_scores.length > 0 && (
                <div className="text-[9px] font-mono font-scoreboard tabular-nums text-slate-400 mt-1 max-w-[110px] truncate text-right">
                  {match.set_scores.join(", ")}
                </div>
              )}
            </div>
          ) : (
            <div className="text-right">
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono font-bold text-xs text-slate-200">
                <Clock size={11} className="text-ink-2" />
                <span>{match.time || "--:--"}</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1 text-right">
                {match.date || "TBD"}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
