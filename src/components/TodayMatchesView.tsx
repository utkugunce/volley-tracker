"use client";

import React, { useMemo, useState } from "react";
import { Match, CityInfo } from "@/types/fixture";
import { FixtureTable } from "@/components/FixtureTable";
import { TeamVolleyboxLink } from "@/components/TeamVolleyboxLink";
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
} from "lucide-react";
import { formatDateTurkish, isMatchPassed } from "@/utils/calendar";

interface TodayMatchesViewProps {
  matches: Match[];
  city?: string;
  currentCitySlug?: string;
  onSelectCity?: (slug: string) => void;
  citiesList?: CityInfo[];
  todayStr: string;
  favorites: string[];
  onToggleFavorite: (matchId: string) => void;
  splitScreenMode?: boolean;
  onNavigateToFullFixtures: () => void;
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
  splitScreenMode = false,
  onNavigateToFullFixtures,
}) => {
  const [quickStatus, setQuickStatus] = useState<"all" | "upcoming" | "finished">("all");
  const [displayMode, setDisplayMode] = useState<"cards" | "table">("cards");

  // Bugünün tüm maçları
  const todayMatches = useMemo(() => {
    return matches.filter((m) => m.date === todayStr);
  }, [matches, todayStr]);

  // Durum filtrelemesi
  const filteredTodayMatches = useMemo(() => {
    if (quickStatus === "all") return todayMatches;
    return todayMatches.filter((m) => m.status === quickStatus);
  }, [todayMatches, quickStatus]);

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
    const isFav = favorites.includes(m.id);
    const isFinished = m.status === "finished";
    const homeWon = isFinished && (m.home_score ?? 0) > (m.away_score ?? 0);
    const awayWon = isFinished && (m.away_score ?? 0) > (m.home_score ?? 0);
    const disc = m.volleybox?.discrepancy;

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
        className={`bg-slate-800/60 rounded-xl border transition-all duration-200 shadow-md hover:shadow-lg flex flex-col justify-between overflow-hidden ${
          disc?.has_diff
            ? "border-amber-500/60 ring-1 ring-amber-400/30"
            : isFav
            ? "border-amber-500/50 ring-1 ring-amber-400/30"
            : "border-slate-700/80 hover:border-slate-600"
        }`}
      >
        {/* Kart Üst Bilgi Başlığı */}
        <div className="px-3.5 py-2 bg-slate-900/60 border-b border-slate-700/50 flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {m.city && city === "Tüm İller" && (
              <span className="font-bold px-1.5 py-0.2 rounded bg-slate-700 text-slate-200 text-[10px]">
                {m.city}
              </span>
            )}
            <span className="font-semibold text-slate-200 truncate text-[11px]">
              {m.category}
            </span>
            <span className="text-slate-500 text-[10px]">•</span>
            <span className="text-slate-400 text-[10px]">{m.group}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isFinished ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700">
                BİTTİ
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-950/80 text-sky-300 border border-sky-700 flex items-center gap-1">
                <Clock size={10} />
                <span>{m.time}</span>
              </span>
            )}
            <button
              onClick={() => onToggleFavorite(m.id)}
              className="p-1 rounded text-slate-500 hover:text-amber-400 transition-colors"
              title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
            >
              <Star size={13} className={isFav ? "fill-amber-400 text-amber-400" : ""} />
            </button>
          </div>
        </div>

        {/* Skorboard / Takım Alanı */}
        <div className="p-3.5 space-y-2.5">
          {/* Ev Sahibi Takım */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <TeamVolleyboxLink
                teamName={m.home_team}
                category={m.category || m.age_group}
                className={`text-sm ${
                  homeWon
                    ? "font-black text-white"
                    : isFinished
                    ? "font-normal text-slate-400"
                    : "font-bold text-slate-200"
                }`}
              />
            </div>
            <div className="shrink-0 font-mono text-base font-black">
              {isFinished ? (
                <span
                  className={`px-2 py-0.5 rounded ${
                    homeWon
                      ? "bg-primary text-white shadow-sm"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {homeScoreText}
                </span>
              ) : (
                <span className="text-slate-500 text-xs font-normal">--</span>
              )}
            </div>
          </div>

          {/* Deplasman Takımı */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <TeamVolleyboxLink
                teamName={m.away_team}
                category={m.category || m.age_group}
                className={`text-sm ${
                  awayWon
                    ? "font-black text-white"
                    : isFinished
                    ? "font-normal text-slate-400"
                    : "font-bold text-slate-200"
                }`}
              />
            </div>
            <div className="shrink-0 font-mono text-base font-black">
              {isFinished ? (
                <span
                  className={`px-2 py-0.5 rounded ${
                    awayWon
                      ? "bg-primary text-white shadow-sm"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {awayScoreText}
                </span>
              ) : (
                <span className="text-slate-500 text-xs font-normal">--</span>
              )}
            </div>
          </div>

          {/* Set Skorları */}
          {isFinished && m.set_scores && m.set_scores.length > 0 && (
            <div className="pt-2 border-t border-slate-700/50 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 font-medium">Setler:</span>
              {m.set_scores.map((set, sIdx) => (
                <span
                  key={sIdx}
                  className="px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-200 text-[10px] font-mono font-medium border border-slate-600/60"
                >
                  {set}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Kart Alt Bilgi: Salon & Volleybox */}
        <div className="px-3.5 py-2 bg-slate-900/50 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-1 min-w-0 truncate" title={m.hall}>
            <MapPin size={11} className="text-slate-500 shrink-0" />
            <span className="truncate">{m.hall}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {disc?.has_diff && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-700/50"
                title={`Bülten değişikliği tespit edildi! (${disc.details || "Saat/Salon farklı"})`}
              >
                <AlertTriangle size={9} />
                <span>Değişti</span>
              </span>
            )}
            {m.volleybox?.url ? (
              <a
                href={m.volleybox.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-indigo-400 hover:text-indigo-300 hover:underline text-[10px]"
                title="Volleybox maç kaydına git"
              >
                <span>Volleybox</span>
                <ExternalLink size={10} />
              </a>
            ) : (
              <span className="text-[10px] text-slate-500">VB Girişi Yok</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. DASHBOARD KPI METRİK KARTLARI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {/* KPI 1: Toplam Fikstür */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              {city === "Tüm İller" ? "Toplam Fikstür" : `${city} Fikstürü`}
            </span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">
              {dashboardKpis.totalMatchesCount}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {city === "Tüm İller" ? `${dashboardKpis.activeCities} Aktif İl Bütünü` : "Sezon Maçları"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-950/60 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-800/40">
            <Trophy size={20} />
          </div>
        </div>

        {/* KPI 2: Günün Programı */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Günün Maçları
            </span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">
              {dashboardKpis.todayTotal}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {dashboardKpis.todayTotal > 0
                ? `${dashboardKpis.todayUpcoming} bekliyor • ${dashboardKpis.todayFinished} bitti`
                : nextMatchDay
                ? `Sıradaki: ${formatDateTurkish(nextMatchDay.date).split(" ")[0]} ${formatDateTurkish(nextMatchDay.date).split(" ")[1]}`
                : "Bugün maç yok"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/60 text-amber-400 flex items-center justify-center shrink-0 border border-amber-800/40">
            <Flame size={20} />
          </div>
        </div>

        {/* KPI 3: Volleybox Eşleşmesi */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              VB Eşleşme
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5 block">
              %{dashboardKpis.syncedPercent}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {dashboardKpis.syncedCount} / {dashboardKpis.totalMatchesCount} Maç Eşleşti
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-800/40">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* KPI 4: Skor Giriş Durumu */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 sm:p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Skor Durumu
            </span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">
              {dashboardKpis.scoredCount}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {dashboardKpis.unscoredPassed > 0 ? (
                <span className="text-rose-400 font-bold">
                  {dashboardKpis.unscoredPassed} Maç Skorsuz!
                </span>
              ) : (
                <span className="text-emerald-400 font-medium">Tüm skorlar güncel</span>
              )}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-950/60 text-sky-400 flex items-center justify-center shrink-0 border border-sky-800/40">
            <Activity size={20} />
          </div>
        </div>
      </div>

      {/* 2. AKTİF İL HIZLI KARTLARI */}
      {onSelectCity && (
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          {citiesList === undefined ? (
            <div className="flex items-center gap-2 py-1">
              <div className="h-8 w-24 bg-slate-200 animate-pulse rounded-xl" />
              <div className="h-8 w-24 bg-slate-200 animate-pulse rounded-xl" />
              <div className="h-8 w-24 bg-slate-200 animate-pulse rounded-xl" />
            </div>
          ) : (
            activeCityCards.map((item) => {
              const isSelected = currentCitySlug === item.slug;
              const IconComponent = item.icon;

              return (
                <button
                  key={item.slug}
                  onClick={() => onSelectCity(item.slug)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-slate-800 text-white border-primary shadow-sm ring-2 ring-primary/40 font-bold"
                      : "bg-slate-800/40 text-slate-300 hover:bg-slate-800/70 border-slate-700"
                  }`}
                >
                  <IconComponent
                    size={14}
                    className={isSelected ? "text-primary" : "text-slate-400"}
                  />
                  <span>{item.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected
                        ? "bg-primary text-white"
                        : "bg-slate-700 text-slate-300"
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
      <div className="bg-gradient-to-r from-[#0b1325] via-slate-900 to-[#0b1325] border border-slate-800 rounded-xl p-3.5 sm:p-4 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 uppercase tracking-wider">
                <Flame size={12} className="text-primary animate-pulse" />
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
            <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex items-center gap-0.5">
              <button
                onClick={() => setDisplayMode("cards")}
                className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                  displayMode === "cards"
                    ? "bg-primary text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Dashboard Kart Görünümü"
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Kartlar</span>
              </button>
              <button
                onClick={() => setDisplayMode("table")}
                className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                  displayMode === "table"
                    ? "bg-primary text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Detaylı Tablo Görünümü"
              >
                <TableIcon size={13} />
                <span className="hidden sm:inline">Tablo</span>
              </button>
            </div>

            <button
              onClick={onNavigateToFullFixtures}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors"
              title="Tüm sezon takvimini ve tarih şeridini görüntüle"
            >
              <span>Tüm Fikstür</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Hızlı Filtre Butonları */}
        {todayMatches.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Durum:</span>
            <button
              onClick={() => setQuickStatus("all")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                quickStatus === "all"
                  ? "bg-primary text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Tümü ({dashboardKpis.todayTotal})
            </button>
            <button
              onClick={() => setQuickStatus("upcoming")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                quickStatus === "upcoming"
                  ? "bg-sky-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Oynanacak ({dashboardKpis.todayUpcoming})
            </button>
            <button
              onClick={() => setQuickStatus("finished")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                quickStatus === "finished"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Bitenler ({dashboardKpis.todayFinished})
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
                splitScreenMode={splitScreenMode}
              />
            ))}
          </div>
        )
      ) : (
        /* 5. BUGÜN MAÇ YOKSA VEYA FİLTREDE BULUNAMADIYSA */
        <div className="space-y-6">
          {todayMatches.length === 0 ? (
            /* Bugün Maç Yok Bilgilendirmesi */
            <div className="bg-gradient-to-br from-[#0f172a] via-[#0b1325] to-[#1e293b] border border-slate-800 rounded-2xl p-6 text-center shadow-xl">
              <div className="w-12 h-12 rounded-full bg-amber-950/60 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-800/40">
                <CalendarDays size={22} />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white mb-1">
                Bugün ({formattedToday}) İçin Planlanmış Maç Bulunmuyor
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                TVF bülteninde {city === "Tüm İller" ? "Türkiye genelinde" : `${city} ilinde`} bugün oynanacak karşılaşma bulunmamaktadır.
              </p>
              <button
                onClick={onNavigateToFullFixtures}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-md"
              >
                <span>Tüm Sezon Fikstürüne Git</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-6 text-center shadow-md">
              <SearchX size={24} className="text-slate-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-300 mb-2">
                Seçtiğiniz duruma uygun maç bulunamadı.
              </p>
              <button
                onClick={() => setQuickStatus("all")}
                className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-md"
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
                      splitScreenMode={splitScreenMode}
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
