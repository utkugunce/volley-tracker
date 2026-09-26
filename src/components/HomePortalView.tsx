"use client";

import React, { useState, useMemo } from "react";
import { Match, CityInfo } from "@/types/fixture";
import { TeamBadge } from "@/components/TeamBadge";
import { TeamVolleyboxLink } from "@/components/TeamVolleyboxLink";
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
  Globe,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatDateTurkish, compareMatchDateTime, isMatchPassed } from "@/utils/calendar";
import { isMatchScored } from "@/components/DashboardClient";
import { getMatchForfeitInfo } from "@/utils/forfeit";
import { getVolleyboxMapping } from "@/utils/volleybox";

interface HomePortalViewProps {
  matches: Match[];
  city?: string;
  currentCitySlug?: string;
  onSelectCity: (slug: string) => void;
  citiesList: CityInfo[];
  standings?: Record<string, any[]>;
  favorites: string[];
  onToggleFavorite: (matchId: string) => void;
  onSelectMatch: (match: Match) => void;
  onNavigateTab: (tab: "results" | "today" | "fixtures" | "standings" | "group-status") => void;
  todayStr: string;
  yesterdayStr: string;
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
}) => {
  // Filtre sekmesi: "all" | "today" | "upcoming" | "finished"
  const [feedFilter, setFeedFilter] = useState<"all" | "today" | "upcoming" | "finished">("all");

  // İstatistikler
  const stats = useMemo(() => {
    const totalMatches = matches.length;
    const scoredMatches = matches.filter(isMatchScored).length;
    const upcomingMatches = totalMatches - scoredMatches;
    const todayCount = matches.filter((m) => m.date === todayStr).length;

    return {
      totalMatches,
      scoredMatches,
      upcomingMatches,
      todayCount,
    };
  }, [matches, todayStr]);

  // Bugünün Maçları
  const todayMatches = useMemo(() => {
    return matches
      .filter((m) => m.date === todayStr)
      .sort((a, b) => compareMatchDateTime(a, b, "asc"));
  }, [matches, todayStr]);

  // Son Biten Maçlar (En yeni 8 maç)
  const recentResults = useMemo(() => {
    return matches
      .filter(isMatchScored)
      .sort((a, b) => compareMatchDateTime(a, b, "desc"))
      .slice(0, 8);
  }, [matches]);

  // Yaklaşan Maçlar (Oynanmamış en yakın 8 maç)
  const upcomingMatches = useMemo(() => {
    const valid = matches
      .filter((m) => !isMatchScored(m) && m.date && m.date !== "TBD" && !isMatchPassed(m.date, m.time, m.status))
      .sort((a, b) => compareMatchDateTime(a, b, "asc"));
    return valid.slice(0, 8);
  }, [matches]);

  // Aktif İller Listesi (Maçı olan iller öncelikli)
  const activeCities = useMemo(() => {
    return citiesList
      .filter((c) => (c.matches_count || 0) > 0)
      .sort((a, b) => (b.matches_count || 0) - (a.matches_count || 0))
      .slice(0, 10);
  }, [citiesList]);

  // Grup Liderleri (Standings tablosundan 1. sıradakiler)
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

  // Filtrelenmiş Liste
  const displayMatches = useMemo(() => {
    if (feedFilter === "today") return todayMatches;
    if (feedFilter === "finished") return recentResults;
    if (feedFilter === "upcoming") return upcomingMatches;
    return null; // "all" durumunda bölümlere ayrılmış görünüm kullanılır
  }, [feedFilter, todayMatches, recentResults, upcomingMatches]);

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      {/* 1. ÜST KONTROL BAR: FİLTRE HAPLARI & HIZLI İL SEÇİMİ */}
      <div className="glass-panel rounded-2xl p-2.5 sm:p-3 border border-slate-800/90 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-sm">
        {/* Sol: Akış Filtreleri (Tümü, Bugün, Bitenler, Fikstür) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setFeedFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              feedFilter === "all"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white"
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
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white"
            }`}
          >
            <Flame size={13} className={feedFilter === "today" ? "fill-white/30 text-white" : "text-rose-400"} />
            <span>Bugün</span>
            {stats.todayCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-700 text-white font-mono font-bold shadow-xs">
                {stats.todayCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFeedFilter("finished")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              feedFilter === "finished"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white"
            }`}
          >
            <CheckCircle2 size={13} className={feedFilter === "finished" ? "text-white" : "text-emerald-400"} />
            <span>Biten Skorlar</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
              {stats.scoredMatches}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFeedFilter("upcoming")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              feedFilter === "upcoming"
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white"
            }`}
          >
            <Calendar size={13} className={feedFilter === "upcoming" ? "text-white" : "text-sky-400"} />
            <span>Gelecek Maçlar</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
              {stats.upcomingMatches}
            </span>
          </button>
        </div>

        {/* Sağ: Hızlı İl Geçiş Hapları */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 border-t md:border-t-0 border-slate-800/60 pt-2 md:pt-0">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">İl:</span>
          <button
            type="button"
            onClick={() => onSelectCity("all")}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
              currentCitySlug === "all"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Tümü
          </button>
          {activeCities.slice(0, 5).map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => onSelectCity(c.slug)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                currentCitySlug === c.slug
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. ANA İÇERİK DÜZENİ: SOLDA MAÇ AKIŞI (68%), SAĞDA BİLGİ PANELİ (32%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ================= SOL SÜTUN: MAÇ AKIŞI ================= */}
        <div className="lg:col-span-8 space-y-4">
          {/* Eğer filtrelenmiş tek bir mod seçildiyse doğrudan o listeyi göster */}
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
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
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
                    Diğer sekmeleri veya farklı bir ili seçerek maçları listeleyebilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(displayMatches || []).map((match) => (
                    <MatchRow
                      key={match.id}
                      match={match}
                      isFavorite={favorites.includes(match.id)}
                      onToggleFavorite={onToggleFavorite}
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
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <span>Bugünün Maçları</span>
                        <span className="text-rose-400 font-mono">({todayMatches.length})</span>
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
                        isFavorite={favorites.includes(match.id)}
                        onToggleFavorite={onToggleFavorite}
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
                    <div className="w-5 h-5 rounded-md bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <Calendar size={12} />
                    </div>
                    <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                      Yaklaşan Fikstür
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab("fixtures")}
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
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
                        isFavorite={favorites.includes(match.id)}
                        onToggleFavorite={onToggleFavorite}
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
                        isFavorite={favorites.includes(match.id)}
                        onToggleFavorite={onToggleFavorite}
                        onSelectMatch={onSelectMatch}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= SAĞ SÜTUN: WIDGET VE BİLGİ PANELİ ================= */}
        <div className="lg:col-span-4 space-y-3.5 sticky top-24">
          {/* 1. KART: ZİRVE YARIŞI / GRUP LİDERLERİ */}
          {groupLeaders.length > 0 && (
            <div className="glass-panel rounded-2xl p-3.5 border border-slate-800/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/70 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Trophy size={12} />
                  </div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Grup Liderleri
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab("standings")}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                >
                  Puan Durumu →
                </button>
              </div>

              <div className="space-y-2">
                {groupLeaders.map((lead, idx) => {
                  const mapping = getVolleyboxMapping(lead.team, undefined, undefined, city);
                  const logo = mapping?.local_logo || mapping?.logo_url;

                  return (
                    <div
                      key={`${lead.groupTitle}-${idx}`}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 transition-colors flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <TeamBadge name={lead.team} logoUrl={logo} size="xs" />
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate text-xs">
                            {lead.team}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {lead.groupTitle.replace("TVF ", "").replace(" 2026-2027", "")}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs">
                          {lead.points} P
                        </div>
                        <div className="text-[10px] text-slate-300 font-medium mt-0.5 font-mono">
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
          <div className="glass-panel rounded-2xl p-3.5 border border-slate-800/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/70 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Globe size={12} />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Aktif İller Fikstürü
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
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
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-1 text-xs ${
                      isSelected
                        ? "bg-rose-950/70 border-rose-500/60 text-white font-bold"
                        : "bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.2 rounded-md shrink-0">
                      {item.matches_count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. KART: HIZLI PLATFORM BİLGİSİ */}
          <div className="rounded-2xl p-3 bg-gradient-to-r from-slate-900 to-[#0e1627] border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-rose-400 shrink-0" />
              <span>TVF Resmi Bülteni & Volleybox Entegrasyonu</span>
            </div>
            <span className="font-mono font-bold text-slate-300 shrink-0">81 İl</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* ALT BİLEŞEN: FotMob STANDARTLARINDA TEMİZ VE YÜKSEK OKUNABİLİR MAÇ ŞERİDİ */
/* ========================================================================= */
interface MatchRowProps {
  match: Match;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelectMatch: (m: Match) => void;
}

const MatchRow: React.FC<MatchRowProps> = ({
  match,
  isFavorite,
  onToggleFavorite,
  onSelectMatch,
}) => {
  const hasScore = isMatchScored(match);
  const forfeit = getMatchForfeitInfo(match);

  const homeMapping = getVolleyboxMapping(match.home_team, match.category, undefined, match.city);
  const awayMapping = getVolleyboxMapping(match.away_team, match.category, undefined, match.city);
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
      className="group relative bg-[#0f172a]/70 hover:bg-[#18233c] border border-slate-800/80 hover:border-rose-500/40 rounded-xl p-2.5 sm:p-3 transition-all duration-150 cursor-pointer shadow-xs active:scale-[0.995]"
    >
      {/* Üst Satır: Şehir, Lig ve Salon */}
      <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-400 mb-1.5 pb-1 border-b border-slate-800/50">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-bold text-sky-400 bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-800/40">
            {match.city || "Genel"}
          </span>
          <span className="truncate text-slate-400">
            {match.category} • {match.group}
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
              <span className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-100 transition-colors truncate">
                {match.home_team}
              </span>
            </div>
            {hasScore && (
              <span className="font-mono font-black text-xs sm:text-sm text-emerald-400 pl-2">
                {homeScore}
              </span>
            )}
          </div>

          {/* Deplasman */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <TeamBadge name={match.away_team} logoUrl={awayLogo} size="xs" />
              <span className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-100 transition-colors truncate">
                {match.away_team}
              </span>
            </div>
            {hasScore && (
              <span className="font-mono font-black text-xs sm:text-sm text-emerald-400 pl-2">
                {awayScore}
              </span>
            )}
          </div>
        </div>

        {/* Sağ: Skor veya Saat / Durum Kutusu */}
        <div className="flex flex-col items-end justify-center shrink-0 min-w-[70px]">
          {hasScore ? (
            <div className="text-right">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-600/50 font-mono font-bold text-xs text-emerald-300">
                <span>{homeScore}</span>
                <span>:</span>
                <span>{awayScore}</span>
              </div>
              {match.set_scores && match.set_scores.length > 0 && (
                <div className="text-[9px] font-mono text-slate-400 mt-1 max-w-[110px] truncate text-right">
                  {match.set_scores.join(", ")}
                </div>
              )}
              {forfeit.isForfeit && (
                <span className="text-[9px] text-amber-400 font-bold block mt-0.5">Hükmen</span>
              )}
            </div>
          ) : (
            <div className="text-right">
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono font-bold text-xs text-slate-200">
                <Clock size={11} className="text-rose-400" />
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
