"use client";

import React, { useMemo, useState } from "react";
import { Match, CityInfo } from "@/types/fixture";
import { FixtureTable } from "@/components/FixtureTable";
import { TeamVolleyboxLink } from "@/components/TeamVolleyboxLink";
import { LeagueVolleyboxLink } from "@/components/LeagueVolleyboxLink";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  ArrowRight,
  MapPin,
  SearchX,
  History,
  CalendarDays,
  LayoutGrid,
  Table as TableIcon,
  Globe,
  Trophy,
  ExternalLink,
  Star,
  Activity,
  AlertTriangle,
  Navigation,
} from "lucide-react";
import { formatDateTurkish, isMatchPassed, compareMatchTimes } from "@/utils/calendar";
import { useFavorites } from "@/utils/useFavorites";
import { getHallNavigationUrl, getHallDetails } from "@/utils/halls";
import { getMatchForfeitInfo } from "@/utils/forfeit";
import { PrintScheduleButton } from "./PrintScheduleButton";

interface TodayMatchesViewProps {
  matches: Match[];
  city?: string;
  currentCitySlug?: string;
  onSelectCity?: (slug: string) => void;
  citiesList?: CityInfo[];
  todayStr: string;
  favorites: string[];
  onToggleFavorite: (matchId: string) => void;
  onNavigateToFullFixtures?: () => void;
  onSelectMatch?: (match: Match) => void;
}

export const TodayMatchesView: React.FC<TodayMatchesViewProps> = ({
  matches = [],
  city = "Tüm İller",
  currentCitySlug = "all",
  onSelectCity,
  citiesList = [],
  todayStr,
  favorites,
  onToggleFavorite,
  onNavigateToFullFixtures = () => {},
  onSelectMatch,
}) => {
  const [quickStatus, setQuickStatus] = useState<"all" | "upcoming" | "finished" | "favorites">("all");
  const [displayMode, setDisplayMode] = useState<"cards" | "table">("cards");
  const { isFavorite: isTeamFavorite, count: favoriteTeamsCount } = useFavorites();

  // Bugünün tüm maçları
  const todayMatches = useMemo(() => {
    return matches.filter((m) => m.date === todayStr);
  }, [matches, todayStr]);

  const isMatchFavorite = useMemo(() => {
    return (m: Match) => {
      return (
        favorites.includes(m.id) ||
        isTeamFavorite(m.home_team) ||
        isTeamFavorite(m.away_team)
      );
    };
  }, [favorites, isTeamFavorite]);

  const todayFavoritesCount = useMemo(() => {
    return todayMatches.filter(isMatchFavorite).length;
  }, [todayMatches, isMatchFavorite]);

  // Durum filtrelemesi (Her zaman erken saatteki maç ilk gösterilecek şekilde saat sıralamalı)
  const filteredTodayMatches = useMemo(() => {
    let base = todayMatches;
    if (quickStatus === "upcoming") {
      base = todayMatches.filter((m) => m.status === "upcoming");
    } else if (quickStatus === "finished") {
      base = todayMatches.filter((m) => m.status === "finished");
    } else if (quickStatus === "favorites") {
      base = todayMatches.filter(isMatchFavorite);
    }
    return [...base].sort((m1, m2) => compareMatchTimes(m1.time, m2.time));
  }, [todayMatches, quickStatus, isMatchFavorite]);

  // Dashboard KPI Sayıları
  const dashboardKpis = useMemo(() => {
    const validMatches = matches.filter((m) => m.date && m.date !== "TBD");
    const totalMatchesCount = validMatches.length;

    const todayTotal = todayMatches.length;
    const todayUpcoming = todayMatches.filter((m) => m.status === "upcoming").length;
    const todayFinished = todayMatches.filter((m) => m.status === "finished").length;

    const syncedMatches = validMatches.filter((m) => m.volleybox?.synced);
    const syncedCount = syncedMatches.length;
    const syncedPercent =
      totalMatchesCount > 0 ? Math.round((syncedCount / totalMatchesCount) * 100) : 0;

    const scoredCount = syncedMatches.filter((m) => m.volleybox?.has_score).length;
    const unscoredPassed = syncedMatches.filter(
      (m) => !m.volleybox?.has_score && isMatchPassed(m.volleybox?.vb_date || m.date, m.time, m.status)
    ).length;

    // Aktif il sayısı
    const activeCities = new Set(validMatches.map((m) => m.city).filter(Boolean)).size;

    return {
      totalMatchesCount,
      activeCities: activeCities,
      todayTotal,
      todayUpcoming,
      todayFinished,
      syncedCount,
      syncedPercent,
      scoredCount,
      unscoredPassed,
    };
  }, [matches, todayMatches]);

  // Eğer bugün maç yoksa: Sıradaki en yakın maç tarihini ve maçlarını bul
  const nextMatchDay = useMemo(() => {
    if (todayMatches.length > 0) return null;

    const futureDates = Array.from(
      new Set(
        matches
          .filter((m) => m.date && m.date !== "TBD" && m.date > todayStr)
          .map((m) => m.date)
      )
    ).sort();

    if (futureDates.length === 0) {
      const allDates = Array.from(
        new Set(matches.filter((m) => m.date && m.date !== "TBD").map((m) => m.date))
      ).sort();
      if (allDates.length > 0) {
        const d = allDates[0];
        return {
          date: d,
          matches: matches.filter((m) => m.date === d),
        };
      }
      return null;
    }

    const nextDate = futureDates[0];
    return {
      date: nextDate,
      matches: matches.filter((m) => m.date === nextDate),
    };
  }, [matches, todayMatches.length, todayStr]);

  // Eğer bugün maç yoksa: En son tamamlanmış maç gününü bul (Son Skorlar)
  const recentFinishedDay = useMemo(() => {
    if (todayMatches.length > 0) return null;

    const pastDates = Array.from(
      new Set(
        matches
          .filter((m) => m.date && m.date !== "TBD" && m.date < todayStr && m.status === "finished")
          .map((m) => m.date)
      )
    )
      .sort()
      .reverse();

    if (pastDates.length === 0) return null;

    const lastDate = pastDates[0];
    return {
      date: lastDate,
      matches: matches.filter((m) => m.date === lastDate && m.status === "finished"),
    };
  }, [matches, todayMatches.length, todayStr]);

  // Bugünün maçlarını grupla (Tablo modu için)
  const groupedSections = useMemo(() => {
    const sections: {
      [key: string]: {
        title: string;
        subTitle: string;
        matches: Match[];
      };
    } = {};

    filteredTodayMatches.forEach((m) => {
      const prefix = city === "Tüm İller" && m.city ? `${m.city} • ` : "";
      const groupKey = `${prefix}${m.category} - ${m.group}`;
      if (!sections[groupKey]) {
        sections[groupKey] = {
          title: `${prefix}${m.category}`,
          subTitle: m.group,
          matches: [],
        };
      }
      sections[groupKey].matches.push(m);
    });

    // Her bölümün maçlarını saat sırasına göre diz (Erken saat ilk)
    Object.values(sections).forEach((sec) => {
      sec.matches.sort((m1, m2) => compareMatchTimes(m1.time, m2.time));
    });

    return Object.values(sections).sort((a, b) =>
      (a.title || "").localeCompare(b.title || "", "tr")
    );
  }, [filteredTodayMatches, city]);

  // Sıradaki maç günü grupları (Tablo modu için)
  const nextGroupedSections = useMemo(() => {
    if (!nextMatchDay) return [];
    const sections: {
      [key: string]: {
        title: string;
        subTitle: string;
        matches: Match[];
      };
    } = {};

    nextMatchDay.matches.forEach((m) => {
      const prefix = city === "Tüm İller" && m.city ? `${m.city} • ` : "";
      const groupKey = `${prefix}${m.category} - ${m.group}`;
      if (!sections[groupKey]) {
        sections[groupKey] = {
          title: `${prefix}${m.category}`,
          subTitle: m.group,
          matches: [],
        };
      }
      sections[groupKey].matches.push(m);
    });

    // Sıradaki maç günü maçlarını saat sırasına göre diz (Erken saat ilk)
    Object.values(sections).forEach((sec) => {
      sec.matches.sort((m1, m2) => compareMatchTimes(m1.time, m2.time));
    });

    return Object.values(sections).sort((a, b) =>
      (a.title || "").localeCompare(b.title || "", "tr")
    );
  }, [nextMatchDay, city]);

  // Bugünün Türkçe tarihi
  const formattedToday = useMemo(() => {
    return formatDateTurkish(todayStr);
  }, [todayStr]);

  // Aktif iller listesi (Hızlı Dashboard Kartları için)
  const activeCityCards = useMemo(() => {
    if (!citiesList || citiesList.length === 0) {
      return [];
    }

    const cards: {
      slug: string;
      name: string;
      count: number;
      icon: React.ComponentType<{ size?: number; className?: string }>;
    }[] = [
      { slug: "all", name: "Tüm İller", count: dashboardKpis.totalMatchesCount, icon: Globe },
    ];

    const active = citiesList.filter((c) => (c.matches_count || 0) > 0);
    active.sort((a, b) => (b.matches_count || 0) - (a.matches_count || 0));

    for (const c of active) {
      cards.push({
        slug: c.slug,
        name: c.name,
        count: c.matches_count || 0,
        icon: MapPin,
      });
    }

    return cards;
  }, [dashboardKpis.totalMatchesCount, citiesList]);

  // Tekil bir maç kartı bileşeni (Dashboard Match Card)
  const renderDashboardMatchCard = (m: Match) => {
    const isFav = isMatchFavorite(m);
    const isFinished = m.status === "finished";
    const homeWon = isFinished && (m.home_score ?? 0) > (m.away_score ?? 0);
    const awayWon = isFinished && (m.away_score ?? 0) > (m.home_score ?? 0);
    const disc = m.volleybox?.discrepancy;
    const forfeitInfo = getMatchForfeitInfo(m);

    const homeScoreText =
      m.home_score !== null && m.home_score !== undefined
        ? String(m.home_score)
        : m.score && m.score.includes("-")
        ? m.score.split("-")[0]?.trim() || "-"
        : "-";

    const awayScoreText =
      m.away_score !== null && m.away_score !== undefined
        ? String(m.away_score)
        : m.score && m.score.includes("-")
        ? m.score.split("-")[1]?.trim() || "-"
        : "-";

    return (
      <div
        key={m.id}
        className={`glass-card rounded-2xl border transition-all duration-300 shadow-card hover:shadow-card-hover flex flex-col justify-between overflow-hidden group ${
          disc?.has_diff
            ? "border-amber-500/60 ring-1 ring-amber-400/30"
            : isFav
            ? "border-amber-500/60 ring-1 ring-amber-400/40"
            : "border-slate-800 hover:border-slate-600/80"
        }`}
      >
        {/* Kart Üst Bilgi Başlığı */}
        <div className="px-4 py-2.5 bg-slate-900/70 border-b border-slate-800/80 flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {m.city && city === "Tüm İller" && (
              <span className="font-bold px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 text-slate-200 text-[10px] uppercase tracking-wider">
                {m.city}
              </span>
            )}
            <LeagueVolleyboxLink
              league={m.category}
              city={m.city || (city !== "Tüm İller" ? city : undefined)}
              className="font-bold text-slate-200 hover:text-amber-400 truncate text-[11px] tracking-wide"
              showExternalIcon={false}
            >
              {m.category}
            </LeagueVolleyboxLink>
            <span className="text-slate-600 text-[10px]">•</span>
            <span className="text-slate-400 text-[11px]">{m.group}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isFinished ? (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider border shadow-xs flex items-center gap-1 ${
                forfeitInfo.isForfeit
                  ? "bg-amber-950/90 text-amber-300 border-amber-500/40"
                  : "bg-emerald-950/90 text-emerald-300 border-emerald-500/40"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${forfeitInfo.isForfeit ? "bg-amber-400" : "bg-emerald-400"}`} />
                {forfeitInfo.isForfeit ? "HÜKMEN" : "BİTTİ"}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-sky-950/90 text-sky-300 border border-sky-500/40 flex items-center gap-1 shadow-xs">
                <Clock size={10} className="text-sky-400" />
                <span className="font-mono">{m.time}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => onToggleFavorite(m.id)}
              className="p-1 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-90"
              title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
              aria-label={isFav ? `${m.home_team} - ${m.away_team} maçını favorilerden çıkar` : `${m.home_team} - ${m.away_team} maçını favorilere ekle`}
            >
              <Star size={14} aria-hidden="true" className={isFav ? "fill-amber-400 text-amber-400" : ""} />
            </button>
          </div>
        </div>

        {/* Skorboard / Takım Alanı */}
        <div className="p-4 space-y-2.5">
          {/* Ev Sahibi Takım */}
          <div className={`flex items-center justify-between gap-3 p-1 rounded-xl transition-all ${
            homeWon ? "bg-white/[0.03] border-l-2 border-primary pl-2.5" : ""
          }`}>
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <TeamVolleyboxLink
                teamName={m.home_team}
                category={m.category || m.age_group}
                city={m.city || (city === "Tüm İller" ? undefined : city)}
                logoClassName="!w-9 !h-9 sm:!w-10 sm:!h-10 rounded-xl p-1 shadow-md"
                className={`text-sm transition-colors group-hover:text-white ${
                  homeWon
                    ? "font-black text-white"
                    : isFinished
                    ? "font-medium text-slate-400"
                    : "font-bold text-slate-200"
                }`}
              />
            </div>
            <div className="shrink-0 font-mono text-base font-black">
              {isFinished ? (
                <span
                  className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg text-sm transition-all ${
                    homeWon
                      ? "bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-glow-red font-black"
                      : "bg-slate-800/90 text-slate-400 border border-slate-700/60"
                  }`}
                >
                  {homeScoreText}
                </span>
              ) : (
                <span className="text-slate-600 text-xs font-normal">--</span>
              )}
            </div>
          </div>

          {/* Deplasman Takımı */}
          <div className={`flex items-center justify-between gap-3 p-1 rounded-xl transition-all ${
            awayWon ? "bg-white/[0.03] border-l-2 border-primary pl-2.5" : ""
          }`}>
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <TeamVolleyboxLink
                teamName={m.away_team}
                category={m.category || m.age_group}
                city={m.city || (city === "Tüm İller" ? undefined : city)}
                logoClassName="!w-9 !h-9 sm:!w-10 sm:!h-10 rounded-xl p-1 shadow-md"
                className={`text-sm transition-colors group-hover:text-white ${
                  awayWon
                    ? "font-black text-white"
                    : isFinished
                    ? "font-medium text-slate-400"
                    : "font-bold text-slate-200"
                }`}
              />
            </div>
            <div className="shrink-0 font-mono text-base font-black">
              {isFinished ? (
                <span
                  className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg text-sm transition-all ${
                    awayWon
                      ? "bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-glow-red font-black"
                      : "bg-slate-800/90 text-slate-400 border border-slate-700/60"
                  }`}
                >
                  {awayScoreText}
                </span>
              ) : (
                <span className="text-slate-600 text-xs font-normal">--</span>
              )}
            </div>
          </div>

          {/* Set Skorları */}
          {isFinished && m.set_scores && m.set_scores.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Setler:</span>
              {m.set_scores.map((set, sIdx) => (
                <span
                  key={sIdx}
                  className="px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-200 text-[10px] font-mono font-bold border border-slate-700/60 shadow-xs"
                >
                  {set}
                </span>
              ))}
              {forfeitInfo.isForfeit && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  (Hükmen)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Kart Alt Bilgi: Salon & Volleybox */}
        <div className="px-4 py-2.5 bg-slate-900/40 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 gap-2">
          {m.hall && m.hall !== "TBD" ? (
            <a
              href={getHallNavigationUrl(m.hall, m.city || (city === "Tüm İller" ? undefined : city))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 min-w-0 truncate text-slate-300 hover:text-white group/hall transition-colors cursor-pointer"
              title={`${m.hall} — Haritada Gör & Yol Tarifi Al`}
              onClick={(e) => e.stopPropagation()}
            >
              <MapPin size={12} className="text-red-400 group-hover/hall:scale-110 shrink-0 transition-transform" />
              <span className="truncate underline decoration-slate-600 group-hover/hall:decoration-red-400 font-medium">
                {m.hall}
              </span>
              <Navigation size={10} className="text-slate-400 group-hover/hall:text-red-400 shrink-0" />
            </a>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-500 min-w-0 truncate">
              <MapPin size={12} className="shrink-0" />
              <span>Salon Belirtilmedi</span>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {disc?.has_diff && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-700/60 shadow-xs"
                title={`Bülten değişikliği tespit edildi! (${disc.details || "Saat/Salon farklı"})`}
              >
                <AlertTriangle size={10} className="text-amber-400" />
                <span>Değişti</span>
              </span>
            )}
            {m.volleybox?.url ? (
              <a
                href={m.volleybox.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-sky-400 hover:text-sky-300 transition-colors bg-sky-950/40 hover:bg-sky-900/60 px-2 py-0.5 rounded-md border border-sky-800/40 text-[10px]"
                title="Volleybox maç kaydına git"
              >
                <span>Volleybox</span>
                <ExternalLink size={10} />
              </a>
            ) : (
              <span className="text-[10px] text-slate-600 font-medium">VB Girişi Yok</span>
            )}
          </div>

          {onSelectMatch && (
            <button
              onClick={() => onSelectMatch(m)}
              className="w-full py-2 px-3 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-bold border-t border-slate-800/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Maç Merkezi & Setler</span>
              <ArrowRight size={12} className="text-red-400" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. DASHBOARD KPI METRİK KARTLARI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* KPI 1: Toplam Fikstür */}
        <div className="glass-panel rounded-2xl p-3.5 sm:p-4 flex items-center justify-between border-slate-800/80 hover:border-indigo-500/40 transition-all duration-300 shadow-card hover:shadow-card-hover group relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              {city === "Tüm İller" ? "Toplam Fikstür" : `${city} Fikstürü`}
            </span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block tracking-tight group-hover:text-indigo-200 transition-colors">
              {dashboardKpis.totalMatchesCount}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
              {city === "Tüm İller" ? `${dashboardKpis.activeCities} Aktif İl Bütünü` : "Sezon Maçları"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-900/70 to-indigo-950/90 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-700/50 shadow-inner group-hover:scale-110 transition-transform">
            <Trophy size={20} />
          </div>
        </div>

        {/* KPI 2: Günün Programı */}
        <div className="glass-panel rounded-2xl p-3.5 sm:p-4 flex items-center justify-between border-slate-800/80 hover:border-amber-500/40 transition-all duration-300 shadow-card hover:shadow-card-hover group relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Günün Maçları
            </span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block tracking-tight group-hover:text-amber-200 transition-colors">
              {dashboardKpis.todayTotal}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
              {dashboardKpis.todayTotal > 0
                ? `${dashboardKpis.todayUpcoming} bekliyor • ${dashboardKpis.todayFinished} bitti`
                : nextMatchDay
                ? `Sıradaki: ${formatDateTurkish(nextMatchDay.date).split(" ")[0]} ${formatDateTurkish(nextMatchDay.date).split(" ")[1]}`
                : "Bugün maç yok"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-900/70 to-amber-950/90 text-amber-400 flex items-center justify-center shrink-0 border border-amber-700/50 shadow-inner group-hover:scale-110 transition-transform">
            <Flame size={20} />
          </div>
        </div>

        {/* KPI 3: Volleybox Eşleşmesi */}
        <div className="glass-panel rounded-2xl p-3.5 sm:p-4 flex items-center justify-between border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300 shadow-card hover:shadow-card-hover group relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              VB Eşleşme
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5 block tracking-tight">
              %{dashboardKpis.syncedPercent}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
              {dashboardKpis.syncedCount} / {dashboardKpis.totalMatchesCount} Maç Eşleşti
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-900/70 to-emerald-950/90 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-700/50 shadow-inner group-hover:scale-110 transition-transform">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* KPI 4: Skor Giriş Durumu */}
        <div className="glass-panel rounded-2xl p-3.5 sm:p-4 flex items-center justify-between border-slate-800/80 hover:border-sky-500/40 transition-all duration-300 shadow-card hover:shadow-card-hover group relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-500/20 transition-all" />
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Skor Durumu
            </span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block tracking-tight group-hover:text-sky-200 transition-colors">
              {dashboardKpis.scoredCount}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
              {dashboardKpis.unscoredPassed > 0 ? (
                <span className="text-rose-400 font-bold animate-pulse">
                  {dashboardKpis.unscoredPassed} Maç Skorsuz!
                </span>
              ) : (
                <span className="text-emerald-400 font-medium">Tüm skorlar güncel</span>
              )}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-900/70 to-sky-950/90 text-sky-400 flex items-center justify-center shrink-0 border border-sky-700/50 shadow-inner group-hover:scale-110 transition-transform">
            <Activity size={20} />
          </div>
        </div>
      </div>

      {/* 2. AKTİF İL HIZLI KARTLARI */}
      {onSelectCity && (
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1" role="tablist" aria-label="Aktif şehir hızlı erişim sekmeleri">
          {citiesList === undefined ? (
            <div className="flex items-center gap-2 py-1">
              <div className="h-8 w-24 bg-slate-800/60 animate-pulse rounded-xl" />
              <div className="h-8 w-24 bg-slate-800/60 animate-pulse rounded-xl" />
              <div className="h-8 w-24 bg-slate-800/60 animate-pulse rounded-xl" />
            </div>
          ) : (
            activeCityCards.map((item) => {
              const isSelected = currentCitySlug === item.slug;
              const IconComponent = item.icon;

              return (
                <button
                  key={item.slug}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={`${item.name}, ${item.count} maç`}
                  onClick={() => onSelectCity(item.slug)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isSelected
                      ? "bg-gradient-to-r from-red-600/90 to-rose-700/90 text-white border-red-500 shadow-glow-red font-bold ring-2 ring-red-500/30"
                      : "glass-panel text-slate-300 hover:text-white hover:bg-slate-800/70 border-slate-800/80"
                  }`}
                >
                  <IconComponent
                    size={14}
                    aria-hidden="true"
                    className={isSelected ? "text-white" : "text-slate-400"}
                  />
                  <span>{item.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected
                        ? "bg-black/30 text-white"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* 3. ANA GÜNÜN MAÇLARI / PROGRAM BAŞLIK ÇUBUĞU */}
      <div className="glass-panel border border-slate-800/90 rounded-2xl p-4 sm:p-4.5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-28 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 uppercase tracking-wider">
                <Flame size={12} className="text-red-400 animate-pulse" />
                Günün Maçları & Canlı Skor
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {city === "Tüm İller" ? "Türkiye Geneli" : city}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              <Calendar size={18} className="text-amber-400 shrink-0" />
              <span>{formattedToday}</span>
            </h1>
          </div>

          {/* Sağ Kontroller: Görünüm Değiştirici (Kart / Tablo) & Tüm Fikstür */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Kart vs Tablo Görünümü */}
            <div className="bg-slate-900/80 p-0.5 rounded-xl border border-slate-800 flex items-center gap-0.5" role="tablist" aria-label="Görünüm biçimi">
              <button
                type="button"
                role="tab"
                aria-selected={displayMode === "cards"}
                aria-label="Kartlar görünümü"
                onClick={() => setDisplayMode("cards")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  displayMode === "cards"
                    ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Dashboard Kart Görünümü"
              >
                <LayoutGrid size={13} aria-hidden="true" />
                <span className="hidden sm:inline">Kartlar</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={displayMode === "table"}
                aria-label="Tablo görünümü"
                onClick={() => setDisplayMode("table")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  displayMode === "table"
                    ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Detaylı Tablo Görünümü"
              >
                <TableIcon size={13} aria-hidden="true" />
                <span className="hidden sm:inline">Tablo</span>
              </button>
            </div>

            <PrintScheduleButton title="Bülten Yazdır" />

            <button
              type="button"
              onClick={onNavigateToFullFixtures}
              aria-label="Tüm sezon fikstürünü ve tarih şeridini görüntüle"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-3 py-1.5 rounded-xl border border-slate-700/80 transition-all hover:border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
              title="Tüm sezon takvimini ve tarih şeridini görüntüle"
            >
              <span>Tüm Fikstür</span>
              <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Hızlı Filtre Butonları */}
        {todayMatches.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap" role="tablist" aria-label="Maç durum filtresi">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Durum:</span>
            <button
              type="button"
              role="tab"
              aria-selected={quickStatus === "all"}
              onClick={() => setQuickStatus("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                quickStatus === "all"
                  ? "bg-red-600 text-white shadow-xs font-bold"
                  : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 hover:text-white border border-slate-700/50"
              }`}
            >
              Tümü ({dashboardKpis.todayTotal})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={quickStatus === "upcoming"}
              onClick={() => setQuickStatus("upcoming")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                quickStatus === "upcoming"
                  ? "bg-sky-600 text-white shadow-xs font-bold"
                  : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 hover:text-white border border-slate-700/50"
              }`}
            >
              Oynanacak ({dashboardKpis.todayUpcoming})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={quickStatus === "finished"}
              onClick={() => setQuickStatus("finished")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                quickStatus === "finished"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 hover:text-white border border-slate-700/50"
              }`}
            >
              Bitenler ({dashboardKpis.todayFinished})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={quickStatus === "favorites"}
              onClick={() => setQuickStatus("favorites")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                quickStatus === "favorites"
                  ? "bg-amber-500/25 text-amber-300 border border-amber-500/60 shadow-glow-amber font-bold"
                  : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 hover:text-white border border-slate-700/50"
              }`}
              title="Favori takımlarınızın ve maçlarınızın programı"
            >
              <Star size={11} className={quickStatus === "favorites" ? "fill-amber-400 text-amber-400" : "text-amber-400/80"} />
              <span>Favorilerim</span>
              <span className="bg-black/40 text-amber-300 text-[10px] px-1 rounded-full font-mono font-bold">
                {todayFavoritesCount}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 4. BUGÜNÜN MAÇLARI GÖRÜNÜMÜ */}
      {filteredTodayMatches.length > 0 ? (
        displayMode === "cards" ? (
          /* Kart Görünümü (Dashboard Grid) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {filteredTodayMatches.map((m) => renderDashboardMatchCard(m))}
          </div>
        ) : (
          /* Tablo Görünümü */
          <div className="space-y-4">
            {groupedSections.map((sec, idx) => (
              <FixtureTable
                key={idx}
                title={sec.title}
                subTitle={sec.subTitle}
                matches={sec.matches}
                favorites={favorites}
                onToggleFavorite={onToggleFavorite}
                city={city}
                onSelectMatch={onSelectMatch}
              />
            ))}
          </div>
        )
      ) : (
        /* 5. BUGÜN MAÇ YOKSA VEYA FİLTREDE BULUNAMADIYSA */
        <div className="space-y-6">
          {todayMatches.length === 0 ? (
            /* Bugün Maç Yok Bilgilendirmesi */
            <div className="glass-panel border border-slate-800/90 rounded-2xl p-6 sm:p-8 text-center shadow-xl relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-900/60 to-amber-950/80 text-amber-400 flex items-center justify-center mx-auto mb-3.5 border border-amber-700/50 shadow-inner">
                  <CalendarDays size={26} />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white mb-1.5">
                  Bugün ({formattedToday}) İçin Planlanmış Maç Bulunmuyor
                </h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
                  TVF bülteninde {city === "Tüm İller" ? "Türkiye genelinde" : `${city} ilinde`} bugün oynanacak karşılaşma bulunmamaktadır.
                </p>
                <button
                  onClick={onNavigateToFullFixtures}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-glow-red hover:scale-[1.02] active:scale-95"
                >
                  <span>Tüm Sezon Fikstürüne Git</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel border border-slate-800/80 rounded-2xl p-6 text-center shadow-md">
              <SearchX size={26} className="text-slate-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-300 mb-3">
                Seçtiğiniz duruma uygun maç bulunamadı.
              </p>
              <button
                onClick={() => setQuickStatus("all")}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                Filtreyi Sıfırla
              </button>
            </div>
          )}

          {/* Akıllı Yedek Görünüm 1: Sıradaki En Yakın Maç Günü */}
          {nextMatchDay && nextMatchDay.matches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={14} className="text-sky-400" />
                    <span>Sıradaki Maç Günü:</span>
                    <span className="text-primary font-black">
                      {formatDateTurkish(nextMatchDay.date)}
                    </span>
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {nextMatchDay.matches.length} Karşılaşma
                </span>
              </div>

              {displayMode === "cards" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {nextMatchDay.matches.map((m) => renderDashboardMatchCard(m))}
                </div>
              ) : (
                <div className="space-y-4">
                  {nextGroupedSections.map((sec, idx) => (
                    <FixtureTable
                      key={idx}
                      title={sec.title}
                      subTitle={sec.subTitle}
                      matches={sec.matches}
                      favorites={favorites}
                      onToggleFavorite={onToggleFavorite}
                      city={city}
                      onSelectMatch={onSelectMatch}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Akıllı Yedek Görünüm 2: Son Tamamlanan Karşılaşmalar */}
          {recentFinishedDay && recentFinishedDay.matches.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1 border-t border-slate-700/50 pt-4">
                <div className="flex items-center gap-2">
                  <History size={14} className="text-slate-500" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Son Tamamlanan Maçlar:{" "}
                    <span className="text-white font-extrabold">
                      {formatDateTurkish(recentFinishedDay.date)}
                    </span>
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  {recentFinishedDay.matches.length} Sonuç
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                {recentFinishedDay.matches.map((m) => renderDashboardMatchCard(m))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
