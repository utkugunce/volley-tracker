"use client";

import React, { useMemo } from "react";
import { Match, CityInfo } from "@/types/fixture";
import { TeamVolleyboxLink } from "@/components/TeamVolleyboxLink";
import {
  Trophy,
  Flame,
  Calendar,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Star,
  ExternalLink,
  Activity,
  Layers,
  Sparkles,
  ShieldCheck,
  Compass,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { formatDateTurkish, compareMatchDateTime, isMatchPassed } from "@/utils/calendar";
import { isMatchScored } from "@/components/DashboardClient";
import { getMatchForfeitInfo } from "@/utils/forfeit";

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
}) => {
  // 1. Genel İstatistikler
  const stats = useMemo(() => {
    const totalMatches = matches.length;
    const scoredMatches = matches.filter(isMatchScored).length;
    const upcomingMatches = totalMatches - scoredMatches;
    const syncedWithVolleybox = matches.filter((m) => m.volleybox?.synced).length;

    // Benzersiz takımlar
    const teams = new Set<string>();
    matches.forEach((m) => {
      if (m.home_team) teams.add(m.home_team);
      if (m.away_team) teams.add(m.away_team);
    });

    return {
      totalMatches,
      scoredMatches,
      upcomingMatches,
      syncedWithVolleybox,
      totalTeams: teams.size,
      activeCitiesCount: citiesList.length > 0 ? citiesList.length : 81,
    };
  }, [matches, citiesList]);

  // 2. Bugünün Maçları
  const todayMatches = useMemo(() => {
    return matches
      .filter((m) => m.date === todayStr)
      .sort((a, b) => compareMatchDateTime(a, b, "asc"));
  }, [matches, todayStr]);

  // 3. Son Biten Maçlar (En yeni 6 maç)
  const recentResults = useMemo(() => {
    return matches
      .filter(isMatchScored)
      .sort((a, b) => compareMatchDateTime(a, b, "desc"))
      .slice(0, 6);
  }, [matches]);

  // 4. Öne Çıkan / Yaklaşan Zirve Karşılaşmaları
  // Eğer bugün maç varsa ilk maç, yoksa yaklaşan ilk derbi / maç
  const featuredMatches = useMemo(() => {
    const upcoming = matches
      .filter((m) => !isMatchScored(m) && m.date && m.date !== "TBD" && !isMatchPassed(m.date, m.time, m.status))
      .sort((a, b) => compareMatchDateTime(a, b, "asc"));

    if (upcoming.length > 0) {
      return upcoming.slice(0, 4);
    }
    // Gelecek maç yoksa son bültendeki ilk 4 maç
    return matches.slice(0, 4);
  }, [matches]);

  // 5. Popüler İller Listesi (İstanbul, Ankara, İzmir, Bursa, Kayseri, Tekirdağ vb.)
  const featuredCities = useMemo(() => {
    const prioritySlugs = [
      "istanbul",
      "ankara",
      "izmir",
      "bursa",
      "tekirdag",
      "kayseri",
      "canakkale",
      "hatay",
      "samsun",
      "balikesir",
      "manisa",
      "eskisehir",
    ];

    const result: { slug: string; name: string; matchCount: number }[] = [];
    prioritySlugs.forEach((slug) => {
      const found = citiesList.find((c) => c.slug.toLowerCase() === slug.toLowerCase());
      if (found) {
        result.push({
          slug: found.slug,
          name: found.name,
          matchCount: found.matches_count ?? (found as any).matchCount ?? (found as any).match_count ?? 0,
        });
      } else {
        // Fallback for known major cities
        const count = matches.filter((m) => (m.city || "").toLowerCase().includes(slug)).length;
        result.push({
          slug,
          name: slug.charAt(0).toUpperCase() + slug.slice(1),
          matchCount: count,
        });
      }
    });

    return result.slice(0, 8);
  }, [citiesList, matches]);

  // 6. Grup ve Lig Liderleri (Standings'ten rank 1 olanlar)
  const groupLeaders = useMemo(() => {
    const leaders: {
      groupTitle: string;
      rank: number;
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
            rank: top.rank || 1,
            team: top.team,
            played: top.played || 0,
            won: top.won || 0,
            points: top.points || 0,
          });
        }
      }
    });

    return leaders.slice(0, 4);
  }, [standings]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* 1. HERO KARŞILAMA VE PLATFORM GENEL BAKIŞI */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0d1627] to-[#1a0f1d] border border-slate-800/80 p-5 sm:p-7 shadow-2xl">
        {/* Dekoratif Işık Efekti */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-bold tracking-wide uppercase shadow-xs">
              <Sparkles size={13} className="text-rose-400" />
              <span>Türkiye Voleybol Federasyonu Altyapı Portalı</span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
              Genç & Yıldız Kızlar Süper Lig{" "}
              <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                Canlı Maç & Veri Merkezi
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              81 İl Temsilciliği resmi fikstürleri, anlık maç sonuçları, set dökümleri, canlı puan durumu ve Volleybox.net entegrasyonlu takım profilleri tek çatı altında.
            </p>

            {/* Hızlı Butonlar */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onNavigateTab("today")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50 transition-all cursor-pointer active:scale-95"
              >
                <Flame size={14} className="fill-white/20 animate-pulse" />
                <span>Günün Maçları ({todayMatches.length})</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab("fixtures")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 hover:text-white text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Calendar size={14} className="text-sky-400" />
                <span>Tüm Fikstür</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab("results")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 hover:text-white text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-95"
              >
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Sonuçlar ({stats.scoredMatches})</span>
              </button>
            </div>
          </div>

          {/* 4 Canlı KPI Rozeti */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 shrink-0">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 sm:p-3.5 backdrop-blur-md shadow-inner text-center">
              <div className="flex items-center justify-center gap-1.5 text-sky-400 mb-1">
                <MapPin size={15} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">İller</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-white font-mono">81 İl</div>
              <div className="text-[10px] text-slate-400">TVF Temsilcilikleri</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 sm:p-3.5 backdrop-blur-md shadow-inner text-center">
              <div className="flex items-center justify-center gap-1.5 text-rose-400 mb-1">
                <Activity size={15} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Maçlar</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-white font-mono">{stats.totalMatches}</div>
              <div className="text-[10px] text-slate-400">Resmi Bültende</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 sm:p-3.5 backdrop-blur-md shadow-inner text-center">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 mb-1">
                <ShieldCheck size={15} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kulüpler</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-white font-mono">{stats.totalTeams}+</div>
              <div className="text-[10px] text-slate-400">Altyapı Takımı</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 sm:p-3.5 backdrop-blur-md shadow-inner text-center">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1">
                <ExternalLink size={15} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Volleybox</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-white font-mono">%{Math.round((stats.syncedWithVolleybox / (stats.totalMatches || 1)) * 100)}</div>
              <div className="text-[10px] text-slate-400">Senkronizasyon</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CANLI & GÜNÜN MAÇLARI / ÖNE ÇIKAN DERBİLER */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <h2 className="text-sm sm:text-base font-black text-white tracking-wide uppercase flex items-center gap-2">
              <span>{todayMatches.length > 0 ? "Bugünün Maçları" : "Öne Çıkan Karşılaşmalar"}</span>
              <span className="text-xs font-normal text-slate-400">
                ({todayMatches.length > 0 ? formatDateTurkish(todayStr) : "Yaklaşan Program"})
              </span>
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab("fixtures")}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Tüm Fikstür</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Maç Kartları Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(todayMatches.length > 0 ? todayMatches.slice(0, 4) : featuredMatches).map((match) => {
            const isFav = favorites.includes(match.id);
            const forfeit = getMatchForfeitInfo(match);
            const hasScore = isMatchScored(match);

            return (
              <div
                key={match.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectMatch(match)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectMatch(match);
                  }
                }}
                className="group relative bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800/90 hover:border-rose-500/50 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl hover:shadow-rose-950/20 active:scale-[0.99] flex flex-col justify-between"
              >
                {/* Üst Bilgi Barı: Kategori, Grup, Şehir ve Tarih/Saat */}
                <div className="flex items-center justify-between gap-2 text-[11px] mb-3 border-b border-slate-800/60 pb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-sky-300 font-bold border border-slate-700/50">
                      {match.city || "Genel"}
                    </span>
                    <span className="text-slate-400 font-medium">
                      {match.category} • {match.group}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-300 font-semibold flex items-center gap-1">
                      <Calendar size={11} className="text-slate-500" />
                      {match.date} {match.time}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(match.id);
                      }}
                      className={`p-1 rounded-md transition-colors ${
                        isFav ? "text-amber-400" : "text-slate-600 hover:text-amber-400"
                      }`}
                      title={isFav ? "Favorilerden Çıkar" : "Favoriye Ekle"}
                    >
                      <Star size={14} className={isFav ? "fill-amber-400" : ""} />
                    </button>
                  </div>
                </div>

                {/* Takımlar ve Skor / VS */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-1">
                  {/* Ev Sahibi */}
                  <div className="flex items-center justify-end gap-2.5 text-right min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-200 transition-colors truncate">
                      {match.home_team}
                    </span>
                    <TeamVolleyboxLink
                      teamName={match.home_team}
                      category={match.category}
                      city={match.city}
                      showFavoriteButton={false}
                    />
                  </div>

                  {/* Skor veya VS Rozeti */}
                  <div className="flex flex-col items-center justify-center px-2">
                    {hasScore ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-600/60 font-mono font-black text-sm text-emerald-300 shadow-xs">
                        <span>{match.home_score ?? match.score?.split("-")[0]?.trim()}</span>
                        <span className="text-emerald-500/80">-</span>
                        <span>{match.away_score ?? match.score?.split("-")[1]?.trim()}</span>
                      </div>
                    ) : (
                      <div className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono font-extrabold text-xs">
                        VS
                      </div>
                    )}
                    {forfeit.isForfeit && (
                      <span className="text-[9px] text-amber-400 font-bold tracking-tight mt-0.5">Hükmen</span>
                    )}
                  </div>

                  {/* Deplasman */}
                  <div className="flex items-center justify-start gap-2.5 text-left min-w-0">
                    <TeamVolleyboxLink
                      teamName={match.away_team}
                      category={match.category}
                      city={match.city}
                      showFavoriteButton={false}
                    />
                    <span className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-200 transition-colors truncate">
                      {match.away_team}
                    </span>
                  </div>
                </div>

                {/* Alt Salon Bilgisi */}
                <div className="mt-3 pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate flex items-center gap-1">
                    <MapPin size={11} className="text-slate-500 shrink-0" />
                    {match.hall || "Salon Belirtilmedi"}
                  </span>
                  <span className="text-slate-500 text-[10px] group-hover:text-rose-300 transition-colors shrink-0">
                    Maç Merkezi →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. SON BİTEN MAÇLAR VE SKORLAR VİTRİNİ */}
      {recentResults.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={15} />
              </div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-wide uppercase">
                Son Biten Maçlar & Skorlar
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab("results")}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Tüm Sonuçlar ({stats.scoredMatches})</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentResults.map((match) => {
              const forfeit = getMatchForfeitInfo(match);
              return (
                <div
                  key={match.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectMatch(match)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectMatch(match);
                    }
                  }}
                  className="bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-3.5 transition-all cursor-pointer shadow-sm active:scale-[0.99] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span className="font-semibold text-slate-300">{match.city}</span>
                    <span className="font-mono text-slate-400">{match.date}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <TeamVolleyboxLink
                          teamName={match.home_team}
                          category={match.category}
                          city={match.city}
                          showFavoriteButton={false}
                        />
                        <span className="text-xs font-bold text-white truncate">{match.home_team}</span>
                      </div>
                      <span className="font-mono font-black text-xs text-emerald-400">
                        {match.home_score ?? match.score?.split("-")[0]?.trim()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <TeamVolleyboxLink
                          teamName={match.away_team}
                          category={match.category}
                          city={match.city}
                          showFavoriteButton={false}
                        />
                        <span className="text-xs font-bold text-white truncate">{match.away_team}</span>
                      </div>
                      <span className="font-mono font-black text-xs text-emerald-400">
                        {match.away_score ?? match.score?.split("-")[1]?.trim()}
                      </span>
                    </div>
                  </div>

                  {/* Set skorları ve hükmen rozeti */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-mono truncate">
                      {match.set_scores && match.set_scores.length > 0
                        ? match.set_scores.join(", ")
                        : "Maç Tamamlandı"}
                    </span>
                    {forfeit.isForfeit && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        Hükmen
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. POPÜLER İLLER HIZLI ERİŞİM VİTRİNİ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Compass size={15} />
            </div>
            <h2 className="text-sm sm:text-base font-black text-white tracking-wide uppercase">
              Popüler İller ve Fikstürler
            </h2>
          </div>

          <span className="text-xs text-slate-400 font-medium">81 İl Aktif</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {featuredCities.map((item) => {
            const isSelected = currentCitySlug === item.slug;

            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => {
                  onSelectCity(item.slug);
                  onNavigateTab("fixtures");
                }}
                className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer group active:scale-95 ${
                  isSelected
                    ? "bg-sky-950/60 border-sky-500/60 text-white shadow-lg shadow-sky-950/50"
                    : "bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white"
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs sm:text-sm font-bold truncate group-hover:text-sky-300 transition-colors">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    {item.matchCount > 0 ? `${item.matchCount} Maç` : "Fikstür"}
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-500 group-hover:text-sky-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. GRUP LİDERLERİ & ZİRVE YARIŞI */}
      {groupLeaders.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Trophy size={15} />
              </div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-wide uppercase">
                Zirve Yarışı • Grup Liderleri
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab("standings")}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Puan Durumu Tablosu</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {groupLeaders.map((lead, idx) => (
              <div
                key={`${lead.groupTitle}-${idx}`}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-2 hover:border-amber-500/30 transition-colors"
              >
                <div className="text-[10px] text-slate-400 font-semibold truncate uppercase tracking-wider">
                  {lead.groupTitle.split("-")[1] || lead.groupTitle}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <TeamVolleyboxLink teamName={lead.team} showFavoriteButton={false} />
                    <span className="text-xs font-bold text-white truncate">{lead.team}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold text-xs">
                    {lead.points} P
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/40">
                  <span>{lead.played} Maç ({lead.won}G)</span>
                  <span className="text-emerald-400 font-semibold">1. Sırada</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
