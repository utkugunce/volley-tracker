"use client";

import React, { useState, useMemo } from "react";
import { Match, CityInfo, StandingItem } from "@/types/fixture";
import { TeamBadge } from "@/components/TeamBadge";
import {
  Trophy,
  Flame,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Activity,
  Globe,
  Sparkles,
} from "lucide-react";
import {
  formatDateTurkish,
  compareMatchDateTime,
  isMatchPassed,
  isTodayOrUnscoredYesterday,
  getYesterdayString,
} from "@/utils/calendar";
import { isMatchScored } from "@/utils/matchScoring";
import { getVolleyboxMapping } from "@/utils/volleybox";
import { LeagueFinderWidget } from "@/components/LeagueFinderWidget";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { VolleyMatchRow } from "@/components/match/VolleyMatchRow";

interface HomePortalViewProps {
  matches: Match[];
  city?: string;
  currentCitySlug?: string;
  onSelectCity: (slug: string) => void;
  citiesList: CityInfo[];
  standings?: Record<string, StandingItem[]>;
  favorites: string[];
  onToggleFavorite: (matchId: string) => void;
  onSelectMatch: (match: Match) => void;
  onNavigateTab: (tab: "results" | "today" | "fixtures" | "standings" | "group-status") => void;
  todayStr: string;
  yesterdayStr: string;
  totalMatchesCount?: number;
  scoredMatchesCount?: number;
}

export const HomePortalView: React.FC<HomePortalViewProps> = ({
  matches = [],
  city = "Tüm İller",
  currentCitySlug = "all",
  onSelectCity,
  citiesList = [],
  standings = {},
  favorites = [],
  onToggleFavorite,
  onSelectMatch,
  onNavigateTab,
  todayStr,
  yesterdayStr,
  totalMatchesCount,
  scoredMatchesCount,
}) => {
  const [feedFilter, setFeedFilter] = useState<"all" | "today" | "upcoming" | "finished">("all");

  const stats = useMemo(() => {
    const totalMatches = totalMatchesCount ?? matches.length;
    const loadedScored = matches.filter(isMatchScored).length;
    const scoredMatches =
      typeof scoredMatchesCount === "number" && totalMatches > matches.length
        ? Math.max(scoredMatchesCount, loadedScored)
        : loadedScored;
    const upcomingMatches = Math.max(totalMatches - scoredMatches, 0);
    const effectiveYesterday = yesterdayStr || (todayStr ? getYesterdayString(todayStr) : "");
    const todayCount = matches.filter((m) =>
      isTodayOrUnscoredYesterday(m.date, isMatchScored(m), todayStr, effectiveYesterday)
    ).length;

    return {
      totalMatches,
      scoredMatches,
      upcomingMatches,
      todayCount,
    };
  }, [matches, todayStr, yesterdayStr, totalMatchesCount, scoredMatchesCount]);

  const todayMatches = useMemo(() => {
    const effectiveYesterday = yesterdayStr || (todayStr ? getYesterdayString(todayStr) : "");
    return matches
      .filter((m) =>
        isTodayOrUnscoredYesterday(m.date, isMatchScored(m), todayStr, effectiveYesterday)
      )
      .sort((a, b) => {
        const aToday = a.date === todayStr ? 0 : 1;
        const bToday = b.date === todayStr ? 0 : 1;
        return aToday - bToday || compareMatchDateTime(a, b, "asc");
      });
  }, [matches, todayStr, yesterdayStr]);

  const recentResults = useMemo(() => {
    return matches
      .filter(isMatchScored)
      .sort((a, b) => compareMatchDateTime(a, b, "desc"))
      .slice(0, 8);
  }, [matches]);

  const upcomingMatches = useMemo(() => {
    const valid = matches
      .filter((m) => !isMatchScored(m) && m.date && m.date !== "TBD" && !isMatchPassed(m.date, m.time, m.status))
      .sort((a, b) => compareMatchDateTime(a, b, "asc"));
    return valid.slice(0, 8);
  }, [matches]);

  const activeCities = useMemo(() => {
    return citiesList
      .filter((c) => (c.matches_count || 0) > 0)
      .sort((a, b) => (b.matches_count || 0) - (a.matches_count || 0))
      .slice(0, 10);
  }, [citiesList]);

  const groupLeaders = useMemo(() => {
    const leaders: {
      groupTitle: string;
      team: string;
      played: number;
      won: number;
      points: number;
    }[] = [];

    Object.entries(standings).forEach(([groupName, rows]) => {
      if (Array.isArray(rows) && rows.length > 0) {
        const top = rows[0];
        if (top && top.team) {
          leaders.push({
            groupTitle: groupName,
            team: top.team,
            played: top.played || 0,
            won: top.won || 0,
            points: top.points || 0,
          });
        }
      }
    });

    return leaders.slice(0, 5);
  }, [standings]);

  const displayMatches = useMemo(() => {
    if (feedFilter === "today") return todayMatches;
    if (feedFilter === "finished") return recentResults;
    if (feedFilter === "upcoming") return upcomingMatches;
    return null;
  }, [feedFilter, todayMatches, recentResults, upcomingMatches]);

  const cityScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollCities = (delta: number) => {
    if (cityScrollRef.current) {
      cityScrollRef.current.scrollBy({ left: delta, behavior: "smooth" });
    }
  };

  const handleDragScroll = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    let isDown = true;
    const startX = e.pageX - el.offsetLeft;
    const scrollLeft = el.scrollLeft;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDown) return;
      ev.preventDefault();
      const x = ev.pageX - el.offsetLeft;
      el.scrollLeft = scrollLeft - (x - startX) * 1.5;
    };

    const onMouseUp = () => {
      isDown = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      {/* Sayfa Başlığı (Semantik H1 & Canlı Gösterge) */}
      <div className="flex items-center justify-between pb-1">
        <h1 className="text-sm sm:text-base font-bold uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
          <span className="hero-heading-gradient">TVF Altyapı Maç Merkezi & Bülteni</span>
        </h1>
        <span className="text-[11px] font-display tabular-nums text-ink-3">
          {city === "all" ? "81 İl" : city} · {stats.totalMatches} Maç
        </span>
      </div>

      {/* 1. ÜST KONTROL BAR: FOTMOB / APPLE SPORTS SEGMENTED FİLTRE */}
      <div className="glass-panel rounded-2xl p-2 sm:p-2.5 border border-line/70 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 min-w-0">
        {/* Sol: Akış Filtreleri (Tümü, Bugün, Bitenler, Fikstür) */}
        <div
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 shrink-0"
        >
          <button
            type="button"
            onClick={() => setFeedFilter("all")}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold shrink-0 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
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
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold shrink-0 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
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
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold shrink-0 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
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
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold shrink-0 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
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

        {/* Sağ: Hızlı İl Geçiş Hapları (Yatay Kaydırılabilir ve Ok Destekli) */}
        <div className="hidden md:flex items-center gap-1 min-w-0 flex-1 justify-end">
          <span className="text-[11px] font-medium text-ink-3 mr-1 shrink-0 hidden xl:inline">İl:</span>
          
          <button
            type="button"
            onClick={() => scrollCities(-150)}
            className="p-1 rounded-md text-ink-3 hover:text-white hover:bg-surface-raised transition-colors shrink-0 cursor-pointer"
            title="Sola kaydır"
            aria-label="İlleri sola kaydır"
          >
            <ChevronLeft size={14} />
          </button>

          <div
            ref={cityScrollRef}
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
            onMouseDown={handleDragScroll}
            className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 min-w-0 max-w-full cursor-grab active:cursor-grabbing scroll-smooth select-none"
          >
            <button
              type="button"
              onClick={() => onSelectCity("all")}
              className={`px-2.5 py-1 min-h-[32px] rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentCitySlug === "all"
                  ? "bg-primary/20 text-primary font-bold border border-primary/30"
                  : "text-ink-2 hover:text-white hover:bg-surface-raised/50"
              }`}
            >
              Tümü
            </button>
            {activeCities.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => onSelectCity(c.slug)}
                className={`px-2.5 py-1 min-h-[32px] rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  currentCitySlug === c.slug
                    ? "bg-primary/20 text-primary font-bold border border-primary/30"
                    : "text-ink-2 hover:text-white hover:bg-surface-raised/50"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollCities(150)}
            className="p-1 rounded-md text-ink-3 hover:text-white hover:bg-surface-raised transition-colors shrink-0 cursor-pointer"
            title="Sağa kaydır"
            aria-label="İlleri sağa kaydır"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 2. ANA İÇERİK DÜZENİ: TAM GENİŞLİK MAÇ AKIŞI */}
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
                  Diğer sekmeleri veya farklı bir ili seçerek maçları listeleyebilirsiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {(displayMatches || []).map((match) => (
                  <VolleyMatchRow
                    key={match.id}
                    match={match}
                    isFavorite={favorites.includes(match.id)}
                    onToggleFavorite={onToggleFavorite}
                    onSelectMatch={onSelectMatch}
                    todayStr={todayStr}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* BÖLÜM 1: BUGÜNÜN MAÇLARI (BELİRGİN SPOTLIGHT HERO KARTI) */}
            {todayMatches.length > 0 ? (
              <div className="relative rounded-2xl p-3.5 sm:p-4 bg-gradient-to-b from-surface-raised/90 via-surface to-surface border-2 border-emerald-500/40 shadow-xl overflow-hidden space-y-3">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
                
                {/* Spotlight Başlık Şeridi */}
                <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2.5 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <div>
                      <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <span>Günün Maç Programı & Canlı Skorlar</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                          {todayMatches.length} Maç
                        </span>
                      </h2>
                      <p className="text-[11px] text-ink-3 font-medium">
                        {formatDateTurkish(todayStr)} · TVF Canlı Altyapı Bülteni
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateTab("today")}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Günün Maçları Tabı</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                {/* Maç Listesi */}
                <div className="space-y-1.5 relative z-10">
                  {todayMatches.map((match) => (
                    <VolleyMatchRow
                      key={match.id}
                      match={match}
                      isFavorite={favorites.includes(match.id)}
                      onToggleFavorite={onToggleFavorite}
                      onSelectMatch={onSelectMatch}
                      todayStr={todayStr}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-4 sm:p-5 bg-surface border border-line/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white">Bugün İçin Planlanmış Maç Bulunmuyor</h3>
                    <p className="text-[11px] text-ink-3 mt-0.5">
                      Günün TVF bülteninde resmi karşılaşma yok. Yaklaşan fikstür ve sonuçları inceleyebilirsiniz.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab("fixtures")}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-fg hover:bg-primary-hover text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-md flex items-center gap-1.5"
                >
                  <span>Fikstüre Git</span>
                  <ArrowRight size={13} />
                </button>
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
                      isFavorite={favorites.includes(match.id)}
                      onToggleFavorite={onToggleFavorite}
                      onSelectMatch={onSelectMatch}
                      todayStr={todayStr}
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
                      isFavorite={favorites.includes(match.id)}
                      onToggleFavorite={onToggleFavorite}
                      onSelectMatch={onSelectMatch}
                      todayStr={todayStr}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ALT KISIM: 2 KOLONLU WIDGET PANELİ */}
            <ScrollReveal delayMs={50}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {/* 1. KART: GRUP LİDERLERİ */}
                {groupLeaders.length > 0 && (
                  <div className="glass-panel rounded-2xl p-3.5 border border-line/70 space-y-3">
                    <div className="flex items-center justify-between border-b border-line/50 pb-2">
                      <div className="flex items-center gap-2">
                        <Trophy size={14} className="text-primary" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                          Grup Liderleri
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigateTab("standings")}
                        className="text-[11px] text-ink-2 hover:text-white font-semibold cursor-pointer transition-colors"
                      >
                        Puan Durumu →
                      </button>
                    </div>

                    <div
                      className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-1"
                      tabIndex={0}
                      role="region"
                      aria-label="Grup liderleri"
                    >
                      {groupLeaders.map((lead, idx) => {
                        const mapping = getVolleyboxMapping(lead.team, undefined, undefined, city);
                        const logo = mapping?.local_logo || mapping?.logo_url;

                        return (
                          <div
                            key={`${lead.groupTitle}-${idx}`}
                            className="p-2 rounded-lg bg-surface-muted/70 border border-line/40 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0 flex items-center gap-2">
                              <TeamBadge name={lead.team} logoUrl={logo} size="xs" />
                              <div className="min-w-0">
                                <div className="font-semibold text-white truncate text-xs">
                                  {lead.team}
                                </div>
                                <div className="text-[10px] text-ink-3 truncate">
                                  {lead.groupTitle.replace("TVF ", "").replace(" 2026-2027", "")}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 font-mono tabular-nums">
                              <div className="text-ink font-bold text-xs">
                                {lead.points} P
                              </div>
                              <div className="text-[10px] text-ink-3">
                                {lead.won}/{lead.played} G
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. KART: AKTİF İLLER FİKSTÜR ERİŞİMİ */}
                <div className="glass-panel rounded-2xl p-3.5 border border-line/70 space-y-3">
                  <div className="flex items-center justify-between border-b border-line/50 pb-2">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-primary" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Aktif İller Fikstürü
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono tabular-nums text-ink-3">
                      {activeCities.length} İl
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {activeCities.map((item) => {
                      const isSelected = currentCitySlug === item.slug;
                      return (
                        <button
                          key={item.slug}
                          type="button"
                          onClick={() => {
                            onSelectCity(item.slug);
                            onNavigateTab("fixtures");
                          }}
                          className={`p-2 rounded-lg border text-left transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] cursor-pointer flex items-center justify-between gap-1 text-xs ${
                            isSelected
                              ? "bg-primary/15 border-primary/50 text-white font-bold"
                              : "bg-surface-muted/70 hover:bg-surface-raised/60 border-line/40 text-ink-2 hover:text-white"
                          }`}
                        >
                          <span className="truncate">{item.name}</span>
                          <span className="text-[10px] font-mono tabular-nums text-ink-3 shrink-0">
                            {item.matches_count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* İNTERAKTİF YAŞ & KATEGORİ HESAPLAYICI */}
            <div className="pt-1">
              <ScrollReveal><LeagueFinderWidget /></ScrollReveal>
            </div>

            {/* 3. KART: HIZLI PLATFORM BİLGİSİ */}
            <div className="rounded-2xl p-3 bg-surface border border-line/60 text-[11px] text-ink-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-primary shrink-0" />
                <span>TVF Resmi Bülteni & Volleybox Entegrasyonu</span>
              </div>
              <span className="font-mono font-semibold text-ink shrink-0">81 İl Canlı Takip</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
