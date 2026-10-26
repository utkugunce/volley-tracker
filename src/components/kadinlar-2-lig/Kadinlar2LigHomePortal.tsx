"use client";

import React, { useState, useMemo, useEffect } from "react";
import { TeamBadge } from "@/components/TeamBadge";
import {
  Trophy,
  Flame,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Kadinlar2LigData } from "@/types/kadinlar2Lig";
import { Match } from "@/types/fixture";
import { useFavorites } from "@/utils/useFavorites";
import {
  convertK2MatchToMatch,
  getKadinlar2LigTeamName,
  normalizeK2Date,
  toggleKadinlar2LigMatchFavorite,
} from "@/utils/kadinlar2LigConverter";
import { isMatchScored } from "@/utils/matchScoring";
import { compareMatchDateTime, formatDateTurkish } from "@/utils/calendar";
import { getVolleyboxMapping } from "@/utils/volleybox";
import { trIncludes } from "@/utils/turkishLocale";
import { Kadinlar2LigTabType } from "./Kadinlar2LigHeader";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { VolleyMatchRow } from "@/components/match/VolleyMatchRow";

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

  const convertedMatches = useMemo(() => {
    return (data.tum_maclar || []).map(convertK2MatchToMatch);
  }, [data.tum_maclar]);

  const matchesByGroupAndSearch = useMemo(() => {
    return convertedMatches.filter((m) => {
      if (selectedGroupFilter !== "all" && m.group !== `Grup ${selectedGroupFilter}`) {
        return false;
      }
      if (showOnlyFavorites) {
        if (!isFavorite(m.home_team) && !isFavorite(m.away_team)) return false;
      }
      if (searchQuery) {
        const inTeams =
          trIncludes(m.home_team, searchQuery) || trIncludes(m.away_team, searchQuery);
        const inCity = trIncludes(m.city || "", searchQuery);
        const inHall = trIncludes(m.hall || "", searchQuery);
        const inGroup = trIncludes(m.group || "", searchQuery);
        if (!inTeams && !inCity && !inHall && !inGroup) return false;
      }
      return true;
    });
  }, [convertedMatches, selectedGroupFilter, showOnlyFavorites, searchQuery, isFavorite]);

  const stats = useMemo(() => {
    const totalMatches = matchesByGroupAndSearch.length;
    const scoredMatches = matchesByGroupAndSearch.filter(isMatchScored).length;
    const upcomingMatches = totalMatches - scoredMatches;
    const todayCount = todayIso
      ? matchesByGroupAndSearch.filter((m) => m.date === todayIso).length
      : 0;

    return {
      totalMatches,
      scoredMatches,
      upcomingMatches,
      todayCount,
      totalGroups: data.gruplar.length,
      totalTeams: data.tum_takimlar.length,
    };
  }, [matchesByGroupAndSearch, todayIso, data.gruplar.length, data.tum_takimlar.length]);

  const todayMatches = useMemo(() => {
    if (!todayIso) return [];
    return matchesByGroupAndSearch
      .filter((m) => m.date === todayIso)
      .sort((a, b) => compareMatchDateTime(a, b, "asc"));
  }, [matchesByGroupAndSearch, todayIso]);

  const allUpcomingMatches = useMemo(() => {
    return matchesByGroupAndSearch
      .filter((m) => !isMatchScored(m) && m.date !== todayIso)
      .sort((a, b) => compareMatchDateTime(a, b, "asc"));
  }, [matchesByGroupAndSearch, todayIso]);

  const upcomingMatches = useMemo(() => allUpcomingMatches.slice(0, 10), [allUpcomingMatches]);

  const allRecentResults = useMemo(() => {
    return matchesByGroupAndSearch
      .filter(isMatchScored)
      .sort((a, b) => compareMatchDateTime(a, b, "desc"));
  }, [matchesByGroupAndSearch]);

  const recentResults = useMemo(() => allRecentResults.slice(0, 10), [allRecentResults]);

  const displayMatches = useMemo(() => {
    if (feedFilter === "today") return todayMatches;
    if (feedFilter === "finished") return allRecentResults;
    if (feedFilter === "upcoming") return allUpcomingMatches;
    return null;
  }, [feedFilter, todayMatches, allRecentResults, allUpcomingMatches]);

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
    if (m) toggleKadinlar2LigMatchFavorite(m, isFavorite, toggleFavorite);
  };

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      {/* Sayfa Başlığı */}
      <div className="flex items-center justify-between pb-1">
        <h1 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
          <span className="hero-heading-gradient">TVF Kadınlar 2. Ligi Maç Merkezi & Bülteni</span>
        </h1>
        <span className="text-[11px] font-display tabular-nums text-ink-3">
          {selectedGroupFilter === "all" ? "16 Grup" : `Grup ${selectedGroupFilter}`} · {stats.totalMatches} Maç
        </span>
      </div>

      {/* 1. ÜST KONTROL BAR: FOTMOB / APPLE SPORTS SEGMENTED FİLTRE */}
      <div className="glass-panel rounded-2xl p-2 sm:p-2.5 border border-line/70 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setFeedFilter("all")}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              feedFilter === "all"
                ? "bg-primary text-primary-fg font-bold"
                : "text-ink-2 hover:text-white hover:bg-surface-raised/60"
            }`}
          >
            <span>Canlı Hub</span>
            <span className="text-[10px] font-display font-semibold tabular-nums opacity-80">
              {stats.totalMatches}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFeedFilter("today")}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              feedFilter === "today"
                ? "bg-primary text-primary-fg font-bold"
                : "text-ink-2 hover:text-white hover:bg-surface-raised/60"
            }`}
          >
            <Flame size={13} className={feedFilter === "today" ? "text-primary-fg" : "text-primary"} />
            <span>Bugün</span>
            {stats.todayCount > 0 && (
              <span className="text-[10px] font-display font-semibold tabular-nums opacity-80">
                {stats.todayCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFeedFilter("finished")}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              feedFilter === "finished"
                ? "bg-primary text-primary-fg font-bold"
                : "text-ink-2 hover:text-white hover:bg-surface-raised/60"
            }`}
          >
            <CheckCircle2 size={13} className={feedFilter === "finished" ? "text-primary-fg" : "text-done"} />
            <span>Biten Skorlar</span>
            <span className="text-[10px] font-display font-semibold tabular-nums opacity-80">
              {stats.scoredMatches}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFeedFilter("upcoming")}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              feedFilter === "upcoming"
                ? "bg-primary text-primary-fg font-bold"
                : "text-ink-2 hover:text-white hover:bg-surface-raised/60"
            }`}
          >
            <Calendar size={13} className={feedFilter === "upcoming" ? "text-primary-fg" : "text-ink-2"} />
            <span>Gelecek Maçlar</span>
            <span className="text-[10px] font-display font-semibold tabular-nums opacity-80">
              {stats.upcomingMatches}
            </span>
          </button>
        </div>

        {/* Sağ: Hızlı Grup Geçiş Hapları */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 border-t md:border-t-0 border-line/50 pt-2 md:pt-0">
          <span className="text-[11px] font-medium text-ink-3 mr-1 hidden sm:inline">Grup:</span>
          <button
            type="button"
            onClick={() => setSelectedGroupFilter("all")}
            className={`px-2.5 py-1 min-h-[32px] rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              selectedGroupFilter === "all"
                ? "bg-primary/15 text-primary font-bold"
                : "text-ink-2 hover:text-white hover:bg-surface-raised/50"
            }`}
          >
            Tümü
          </button>
          {data.gruplar.map((g) => (
            <button
              key={g.grup_no}
              type="button"
              onClick={() => setSelectedGroupFilter(g.grup_no)}
              className={`px-2.5 py-1 min-h-[32px] rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                selectedGroupFilter === g.grup_no
                  ? "bg-primary/15 text-primary font-bold"
                  : "text-ink-2 hover:text-white hover:bg-surface-raised/50"
              }`}
            >
              Grup {g.grup_no}
            </button>
          ))}
        </div>
      </div>

      {/* 2. ANA İÇERİK DÜZENİ */}
      <div className="w-full space-y-4">
        {feedFilter !== "all" ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-line/50">
              <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <span>
                  {feedFilter === "today"
                    ? "Bugünün Maçları"
                    : feedFilter === "finished"
                    ? "Biten Maç Sonuçları"
                    : "Yaklaşan Fikstür"}
                </span>
                <span className="text-xs font-mono tabular-nums font-normal text-ink-3">
                  ({(displayMatches || []).length} Maç)
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setFeedFilter("all")}
                className="text-xs text-primary hover:text-white font-semibold cursor-pointer transition-colors"
              >
                Tüm Akışa Dön →
              </button>
            </div>

            {(displayMatches || []).length === 0 ? (
              <div className="text-center py-10 bg-surface border border-line/60 rounded-2xl p-6">
                <p className="text-xs font-semibold text-ink mb-1">
                  Bu filtreye ait maç bulunamadı.
                </p>
                <p className="text-[11px] text-ink-3">
                  Diğer sekmeleri veya farklı bir grubu seçerek maçları listeleyebilirsiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {(displayMatches || []).map((match) => (
                  <VolleyMatchRow
                    key={match.id}
                    match={match}
                    isSelected={selectedMatchId === match.id}
                    isFavorite={isFavorite(match.home_team) || isFavorite(match.away_team)}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectMatch={onSelectMatch}
                    todayStr={todayIso}
                    leagueFallback="Kadınlar 2. Ligi"
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* BÖLÜM 1: BUGÜNÜN MAÇLARI */}
            {todayMatches.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-done" />
                    <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span>Bugünün Maçları</span>
                      <span className="text-ink-3 font-display tabular-nums font-normal">({todayMatches.length})</span>
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-ink-3 font-medium">
                    {formatDateTurkish(todayStr)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {todayMatches.map((match) => (
                    <VolleyMatchRow
                      key={match.id}
                      match={match}
                      isSelected={selectedMatchId === match.id}
                      isFavorite={isFavorite(match.home_team) || isFavorite(match.away_team)}
                      onToggleFavorite={handleToggleFavorite}
                      onSelectMatch={onSelectMatch}
                      todayStr={todayIso}
                      leagueFallback="Kadınlar 2. Ligi"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* BÖLÜM 2: YAKLAŞAN FİKSTÜR */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-primary" />
                  <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                    Yaklaşan Fikstür
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab("fixtures")}
                  className="text-xs text-ink-2 hover:text-white font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Tüm Fikstür</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              <div className="space-y-1.5">
                {upcomingMatches.length === 0 ? (
                  <div className="text-center py-6 bg-surface border border-line/60 rounded-2xl text-xs text-ink-3">
                    Yakın tarihte planlanmış yeni maç bulunmuyor.
                  </div>
                ) : (
                  upcomingMatches.map((match) => (
                    <VolleyMatchRow
                      key={match.id}
                      match={match}
                      isSelected={selectedMatchId === match.id}
                      isFavorite={isFavorite(match.home_team) || isFavorite(match.away_team)}
                      onToggleFavorite={handleToggleFavorite}
                      onSelectMatch={onSelectMatch}
                      todayStr={todayIso}
                      leagueFallback="Kadınlar 2. Ligi"
                    />
                  ))
                )}
              </div>
            </div>

            {/* BÖLÜM 3: SON BİTEN MAÇLAR VE SKORLAR */}
            {recentResults.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-done" />
                    <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                      Son Biten Maçlar & Skorlar
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("results")}
                    className="text-xs text-ink-2 hover:text-white font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Tüm Sonuçlar ({stats.scoredMatches})</span>
                    <ChevronRight size={13} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {recentResults.map((match) => (
                    <VolleyMatchRow
                      key={match.id}
                      match={match}
                      isSelected={selectedMatchId === match.id}
                      isFavorite={isFavorite(match.home_team) || isFavorite(match.away_team)}
                      onToggleFavorite={handleToggleFavorite}
                      onSelectMatch={onSelectMatch}
                      todayStr={todayIso}
                      leagueFallback="Kadınlar 2. Ligi"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ALT KISIM: 2 KOLONLU WIDGET PANELİ */}
            <ScrollReveal delayMs={60}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {/* 1. KART: GRUP LİDERLERİ */}
                <div className="glass-panel rounded-2xl p-3.5 border border-line/70 space-y-3">
                  <div className="flex items-center justify-between border-b border-line/50 pb-2">
                    <div className="flex items-center gap-2">
                      <Trophy size={14} className="text-primary" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Grup Liderleri (Çeyrek Final Hattı)
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateTab("leaders")}
                      className="text-[11px] text-ink-2 hover:text-white font-semibold cursor-pointer transition-colors"
                    >
                      Tüm Gruplar →
                    </button>
                  </div>

                  <div
                    className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-1"
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
                          className="p-2 rounded-lg bg-surface-muted/70 border border-line/40 hover:border-primary/40 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center justify-between gap-2 text-xs cursor-pointer"
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            <span className="font-mono font-semibold text-[10px] text-ink-3 w-12 shrink-0">
                              Grup {grp.grup_no}
                            </span>
                            {leaderName ? (
                              <>
                                <TeamBadge name={leaderName} logoUrl={logo} size="xs" />
                                <div className="font-semibold text-white truncate text-xs">
                                  {leaderName}
                                </div>
                              </>
                            ) : (
                              <span className="text-xs text-ink-3">-</span>
                            )}
                          </div>

                          {grp.leader && (
                            <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums text-[11px]">
                              <span className="text-ink-3">
                                {grp.leader.g}G-{grp.leader.m}M
                              </span>
                              <span className="font-bold text-ink">
                                {grp.leader.p}P
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. KART: RESMİ STATÜ & 1. LİG'E YÜKSELME SİSTEMİ */}
                <div className="glass-panel rounded-2xl p-4 border border-line/70 bg-surface space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles size={15} />
                      <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                        1. Lig&apos;e Yükselme Sistemi
                      </h3>
                    </div>
                    <p className="text-[11px] text-ink-2 leading-relaxed">
                      16 gruptan ilk 2 sırayı alan <strong className="text-white">32 takım</strong> Çeyrek Final&apos;e yükselir. Çeyrek final, yarı final ve final etapları sonucunda <strong className="text-white">4 takım Arabica Coffee House Kadınlar 1. Ligi</strong>&apos;ne yükselir.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-surface-muted/70 border border-line/40">
                        <span className="block text-ink-3 text-[10px]">Çeyrek Final</span>
                        <strong className="text-white font-mono">32 Kulüp (8x4)</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface-muted/70 border border-line/40">
                        <span className="block text-ink-3 text-[10px]">1. Lig Bileti</span>
                        <strong className="text-primary font-mono">4 Kulüp</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateTab("statu")}
                    className="text-xs text-primary hover:text-white font-semibold flex items-center gap-1 hover:underline cursor-pointer pt-2 transition-colors"
                  >
                    <span>Resmi statü şemasını incele</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            </ScrollReveal>

            {/* 3. KART: HIZLI PLATFORM BİLGİSİ */}
            <div className="rounded-2xl p-3 bg-surface border border-line/60 text-[11px] text-ink-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-primary shrink-0" />
                <span>TVF Resmi Bülteni & Volleybox Entegrasyonu</span>
              </div>
              <span className="font-mono font-semibold text-ink shrink-0">16 Grup Canlı Takip</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
