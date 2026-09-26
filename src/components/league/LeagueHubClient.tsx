"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ExternalLink,
  Users,
  Download,
  Share2,
  Check,
  Star,
  Flame,
  Activity,
  Layers,
  Search,
  CheckCircle2,
  ArrowRight,
  Shield,
  FileSpreadsheet,
} from "lucide-react";
import { LeagueData } from "@/utils/leagueData";
import { Match } from "@/types/fixture";
import { TeamVolleyboxLink } from "@/components/TeamVolleyboxLink";
import { FixtureTable } from "@/components/FixtureTable";
import { DateRibbon } from "@/components/DateRibbon";
import { MatchCenterDrawer } from "@/components/MatchCenterDrawer";
import { SpotlightSearchModal } from "@/components/SpotlightSearchModal";
import { useFavorites } from "@/utils/useFavorites";
import { generateSeasonIcs, downloadIcsFile } from "@/utils/ics";
import { getMatchForfeitInfo } from "@/utils/forfeit";
import { formatDateTurkish, compareMatchDateTime } from "@/utils/calendar";
import { formatGroupName } from "@/utils/grouping";
import { slugify } from "@/utils/slugify";
import { downloadStandingsCsv } from "@/components/StandingsTable";

export type LeagueTabType = "standings" | "fixtures" | "results" | "stats" | "teams";

interface LeagueHubClientProps {
  league: LeagueData;
  initialTab?: LeagueTabType;
}

export const LeagueHubClient: React.FC<LeagueHubClientProps> = ({
  league,
  initialTab = "standings",
}) => {
  const [activeTab, setActiveTab] = useState<LeagueTabType>(initialTab);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedFixtureDate, setSelectedFixtureDate] = useState<string>("all");
  const [selectedResultDate, setSelectedResultDate] = useState<string>("all");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  const { favoriteTeams: favorites, isFavorite, toggleFavorite } = useFavorites();

  const { todayStr, yesterdayStr } = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const today = `${y}-${m}-${d}`;

    const yDate = new Date(now);
    yDate.setDate(yDate.getDate() - 1);
    const yy = yDate.getFullYear();
    const ym = String(yDate.getMonth() + 1).padStart(2, "0");
    const yd = String(yDate.getDate()).padStart(2, "0");
    const yesterday = `${yy}-${ym}-${yd}`;

    return { todayStr: today, yesterdayStr: yesterday };
  }, []);

  // Fikstür maçlarının benzersiz tarihleri
  const uniqueFixtureDates = useMemo(() => {
    const set = new Set(
      league.upcomingMatches
        .map((m) => m.date)
        .filter((d) => d && d !== "TBD")
    );
    return Array.from(set).sort();
  }, [league.upcomingMatches]);

  const fixtureDateCounts = useMemo(() => {
    const counts: { [dateStr: string]: number } = {};
    league.upcomingMatches.forEach((m) => {
      if (m.date && m.date !== "TBD") {
        counts[m.date] = (counts[m.date] || 0) + 1;
      }
    });
    return counts;
  }, [league.upcomingMatches]);

  // Sonuçlanan maçların benzersiz tarihleri (En yeni tarihten geriye doğru)
  const uniqueResultDates = useMemo(() => {
    const set = new Set(
      league.finishedMatches
        .map((m) => m.date)
        .filter((d) => d && d !== "TBD")
    );
    return Array.from(set).sort().reverse();
  }, [league.finishedMatches]);

  const resultDateCounts = useMemo(() => {
    const counts: { [dateStr: string]: number } = {};
    league.finishedMatches.forEach((m) => {
      if (m.date && m.date !== "TBD") {
        counts[m.date] = (counts[m.date] || 0) + 1;
      }
    });
    return counts;
  }, [league.finishedMatches]);

  // Gruplar listesi
  const groupNames = useMemo(() => {
    return league.groups.map((g) => g.rawGroup);
  }, [league.groups]);

  // Seçili gruba göre filtrelenmiş puan durumu
  const displayedGroups = useMemo(() => {
    if (selectedGroup === "all") return league.groups;
    return league.groups.filter((g) => g.rawGroup === selectedGroup);
  }, [league.groups, selectedGroup]);

  // Seçili gruba ve tarihe göre filtrelenmiş fikstür
  const displayedUpcomingMatches = useMemo(() => {
    let list = league.upcomingMatches;
    if (selectedGroup !== "all") {
      list = list.filter((m) => m.group === selectedGroup || m.group?.includes(selectedGroup));
    }
    if (selectedFixtureDate !== "all") {
      list = list.filter((m) => m.date === selectedFixtureDate);
    }
    if (teamSearchQuery.trim()) {
      const q = teamSearchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.home_team.toLowerCase().includes(q) ||
          m.away_team.toLowerCase().includes(q) ||
          m.hall.toLowerCase().includes(q) ||
          (m.group && m.group.toLowerCase().includes(q))
      );
    }
    return list;
  }, [league.upcomingMatches, selectedGroup, selectedFixtureDate, teamSearchQuery]);

  // Seçili gruba ve tarihe göre filtrelenmiş sonuçlar
  const displayedFinishedMatches = useMemo(() => {
    let list = league.finishedMatches;
    if (selectedGroup !== "all") {
      list = list.filter((m) => m.group === selectedGroup || m.group?.includes(selectedGroup));
    }
    if (selectedResultDate !== "all") {
      list = list.filter((m) => m.date === selectedResultDate);
    }
    if (teamSearchQuery.trim()) {
      const q = teamSearchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.home_team.toLowerCase().includes(q) ||
          m.away_team.toLowerCase().includes(q) ||
          m.hall.toLowerCase().includes(q) ||
          (m.group && m.group.toLowerCase().includes(q))
      );
    }
    return list;
  }, [league.finishedMatches, selectedGroup, selectedResultDate, teamSearchQuery]);

  // Fikstür maçlarını gruplara göre düzenle (Anasayfadaki gibi FixtureTable formatında)
  const upcomingSections = useMemo(() => {
    const map = new Map<string, { title: string; subTitle: string; matches: Match[] }>();

    displayedUpcomingMatches.forEach((m) => {
      const groupName = m.group ? formatGroupName(m.group) : "Tek Grup";
      if (!map.has(groupName)) {
        map.set(groupName, {
          title: league.category,
          subTitle: groupName,
          matches: [],
        });
      }
      map.get(groupName)!.matches.push(m);
    });

    const sections = Array.from(map.values()).sort((a, b) =>
      a.subTitle.localeCompare(b.subTitle, "tr", { numeric: true })
    );

    sections.forEach((sec) => {
      sec.matches.sort((m1, m2) => compareMatchDateTime(m1, m2, "asc"));
    });

    return sections;
  }, [displayedUpcomingMatches, league.category]);

  // Sonuçlanan maçları gruplara göre düzenle (Anasayfadaki gibi FixtureTable formatında)
  const finishedSections = useMemo(() => {
    const map = new Map<string, { title: string; subTitle: string; matches: Match[] }>();

    displayedFinishedMatches.forEach((m) => {
      const groupName = m.group ? formatGroupName(m.group) : "Tek Grup";
      if (!map.has(groupName)) {
        map.set(groupName, {
          title: league.category,
          subTitle: groupName,
          matches: [],
        });
      }
      map.get(groupName)!.matches.push(m);
    });

    const sections = Array.from(map.values()).sort((a, b) =>
      a.subTitle.localeCompare(b.subTitle, "tr", { numeric: true })
    );

    sections.forEach((sec) => {
      sec.matches.sort((m1, m2) => compareMatchDateTime(m1, m2, "desc"));
    });

    return sections;
  }, [displayedFinishedMatches, league.category]);

  // Filtrelenmiş takımlar
  const displayedTeams = useMemo(() => {
    let list = league.teams;
    if (selectedGroup !== "all") {
      list = list.filter((t) => t.group === selectedGroup || t.group?.includes(selectedGroup));
    }
    if (teamSearchQuery.trim()) {
      const q = teamSearchQuery.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    return list;
  }, [league.teams, selectedGroup, teamSearchQuery]);

  // Takvim (.ics) indirme
  const handleDownloadCalendar = () => {
    if (league.matches.length === 0) return;
    const icsContent = generateSeasonIcs(league.matches, league.leagueName);
    downloadIcsFile(`${slugify(league.leagueName)}-sezon-fikstur.ics`, icsContent);
  };

  // CSV İndirme
  const handleDownloadCsv = () => {
    const allRows = league.groups.flatMap((g) => g.table);
    if (allRows.length === 0) return;
    downloadStandingsCsv(allRows, `${slugify(league.leagueName)}-puan-durumu`);
  };

  // Bağlantıyı kopyalama
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // İlerleme yüzdesi
  const progressPercent =
    league.stats.totalMatches > 0
      ? Math.round((league.stats.finishedMatches / league.stats.totalMatches) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-red-600/30 selection:text-white">
      {/* 1. ÜST GEZİNME VE BAŞLIK ŞERİDİ */}
      <header className="sticky top-0 z-40 bg-[#070b14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href={league.citySlug ? `/${league.citySlug}` : "/"}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Geri dön"
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">Geri</span>
            </Link>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
              <Link href="/" className="hover:text-white transition-colors">
                Anasayfa
              </Link>
              <span>/</span>
              <Link
                href={league.citySlug ? `/${league.citySlug}` : "/"}
                className="hover:text-sky-300 text-sky-400 font-medium transition-colors"
              >
                {league.city}
              </Link>
              <span>/</span>
              <span className="text-white font-bold truncate">{league.category}</span>
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Ara (Ctrl+K)"
            >
              <Search size={14} className="text-slate-400" />
              <span className="hidden sm:inline">Ara</span>
              <kbd className="hidden md:inline-block text-[10px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={handleCopyLink}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Bağlantıyı kopyala"
            >
              {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
              <span className="hidden sm:inline">{copiedLink ? "Kopyalandı!" : "Paylaş"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. LİG HERO BİLGİ ALANI */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0b1325] via-[#070b14] to-[#070b14] border-b border-slate-800/80 py-6 sm:py-8 px-4">
        <div className="absolute top-0 right-1/4 w-96 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-10 w-72 h-36 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 space-y-4">
          {/* Rozetler Satırı */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg bg-sky-950/80 text-sky-300 border border-sky-600/40">
              <MapPin size={12} className="text-sky-400" />
              <span>{league.city} TVF İl Temsilciliği</span>
            </span>

            <span className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-600/40">
              <Trophy size={12} className="text-amber-400" />
              <span>{league.category}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              <Users size={12} className="text-slate-400" />
              <span>{league.ageGroup}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg bg-slate-800/60 text-slate-400 border border-slate-700/60">
              <Calendar size={12} />
              <span>{league.season} Sezonu</span>
            </span>

            {league.volleyboxMapping?.volleybox_url && (
              <a
                href={league.volleyboxMapping.volleybox_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/80 transition-colors shadow-xs"
                title="Volleybox Turnuva Sayfasına Git"
              >
                <span>Volleybox Turnuva Profili</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          {/* Ana Lig Başlığı ve Eylemler */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                {league.leagueName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                {league.city} ili {league.category} ligi canlı puan durumu, haftalık maç fikstürleri, kesinleşmiş set skorları ve detaylı takım istatistikleri.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {league.matches.length > 0 && (
                <button
                  onClick={handleDownloadCalendar}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90 text-white px-3.5 py-2 rounded-xl shadow-glow-red transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                  title="Tüm lig fikstürünü takviminize (.ics) indirin"
                >
                  <Download size={14} />
                  <span>Sezonu Takvime Ekle</span>
                </button>
              )}

              {league.groups.length > 0 && (
                <button
                  onClick={handleDownloadCsv}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                  title="Puan durumunu CSV olarak indirin"
                >
                  <FileSpreadsheet size={14} className="text-emerald-400" />
                  <span>Puan Durumu İndir (CSV)</span>
                </button>
              )}
            </div>
          </div>

          {/* KPI İstatistik Kartları */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 pt-2">
            <div className="glass-panel p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Toplam Maç
              </span>
              <span className="text-lg sm:text-xl font-black text-white font-mono mt-0.5 block">
                {league.stats.totalMatches}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Planlanan Fikstür</span>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tamamlanan
              </span>
              <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-0.5 block">
                {league.stats.finishedMatches}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">%{progressPercent} İlerleme</span>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Gelecek Maç
              </span>
              <span className="text-lg sm:text-xl font-black text-amber-400 font-mono mt-0.5 block">
                {league.stats.upcomingMatches}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Oynanacak Maç</span>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Katılan Takım
              </span>
              <span className="text-lg sm:text-xl font-black text-sky-400 font-mono mt-0.5 block">
                {league.stats.totalTeams}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Kulüp & Şube</span>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Lider Takım
              </span>
              <span className="text-sm font-black text-amber-300 truncate mt-1 block" title={league.stats.leaderTeam?.name}>
                {league.stats.leaderTeam ? league.stats.leaderTeam.name : "-"}
              </span>
              <span className="text-[10px] text-amber-400/80 font-mono">
                {league.stats.leaderTeam ? `${league.stats.leaderTeam.points} Puan` : ""}
              </span>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Ortalama Set
              </span>
              <span className="text-lg sm:text-xl font-black text-purple-400 font-mono mt-0.5 block">
                {league.stats.avgSetsPerMatch}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">{league.stats.totalSets} Toplam Set</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. İKİNCİL GEZİNME (SEKMELER VE GRUP SEÇİCİ) */}
      <div className="bg-[#0b1325]/95 border-b border-slate-800/80 sticky top-[57px] z-30 px-4 py-2.5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Ana Sekmeler */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
            <button
              onClick={() => setActiveTab("standings")}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === "standings"
                  ? "bg-primary text-white shadow-glow-red"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/70"
              }`}
            >
              <Trophy size={14} />
              <span>Puan Durumu</span>
            </button>

            <button
              onClick={() => setActiveTab("fixtures")}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === "fixtures"
                  ? "bg-primary text-white shadow-glow-red"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/70"
              }`}
            >
              <Calendar size={14} />
              <span>Fikstür ({league.stats.upcomingMatches})</span>
            </button>

            <button
              onClick={() => setActiveTab("results")}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === "results"
                  ? "bg-primary text-white shadow-glow-red"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/70"
              }`}
            >
              <CheckCircle2 size={14} />
              <span>Sonuçlar ({league.stats.finishedMatches})</span>
            </button>

            <button
              onClick={() => setActiveTab("stats")}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === "stats"
                  ? "bg-primary text-white shadow-glow-red"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/70"
              }`}
            >
              <Activity size={14} />
              <span>İstatistikler & Liderler</span>
            </button>

            <button
              onClick={() => setActiveTab("teams")}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeTab === "teams"
                  ? "bg-primary text-white shadow-glow-red"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/70"
              }`}
            >
              <Users size={14} />
              <span>Takımlar ({league.stats.totalTeams})</span>
            </button>
          </div>

          {/* Grup Filtresi (Birden fazla grup varsa göster) */}
          {groupNames.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs shrink-0">
              <span className="text-[11px] text-slate-400 font-semibold mr-1">Grup:</span>
              <button
                onClick={() => setSelectedGroup("all")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
                  selectedGroup === "all"
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                    : "bg-slate-800/80 text-slate-400 hover:text-white"
                }`}
              >
                Tüm Gruplar
              </button>
              {groupNames.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGroup(g)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
                    selectedGroup === g
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                      : "bg-slate-800/80 text-slate-400 hover:text-white"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. ANA İÇERİK ALANI */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1 space-y-6">
        {/* TAB 1: PUAN DURUMU */}
        {activeTab === "standings" && (
          <div className="space-y-6">
            {displayedGroups.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-400 text-sm">
                Bu gruba ait puan durumu tablosu bulunmuyor.
              </div>
            ) : (
              displayedGroups.map((grp) => (
                <div
                  key={grp.groupName}
                  className="glass-panel border border-slate-800/80 rounded-2xl overflow-hidden shadow-card"
                >
                  <div className="bg-gradient-to-r from-slate-900/90 via-[#0d1424]/90 to-slate-900/90 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                        <Trophy size={14} />
                      </div>
                      <h2 className="text-sm font-extrabold text-white tracking-wide">
                        {grp.groupName} - PUAN DURUMU
                      </h2>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {grp.table.length} Takım
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-700/80 text-slate-400 text-[11px] bg-slate-900/40">
                          <th className="py-2.5 px-3 w-10 text-center">Sıra</th>
                          <th className="py-2.5 px-3 min-w-[200px]">Takım</th>
                          <th className="py-2.5 px-2.5 text-center font-semibold">O</th>
                          <th className="py-2.5 px-2.5 text-center font-semibold text-emerald-400">G</th>
                          <th className="py-2.5 px-2.5 text-center font-semibold text-rose-400">M</th>
                          <th className="py-2.5 px-2.5 text-center font-semibold">AS</th>
                          <th className="py-2.5 px-2.5 text-center font-semibold">VS</th>
                          <th className="py-2.5 px-2.5 text-center font-semibold">SAV</th>
                          <th className="py-2.5 px-2.5 text-center font-bold text-white bg-slate-800/60">
                            Puan
                          </th>
                          <th className="py-2.5 px-3 text-center">Son 5</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {grp.table.map((row, idx) => {
                          const isTop = row.rank === 1;
                          return (
                            <tr
                              key={row.team}
                              className={`transition-colors hover:bg-slate-800/50 ${
                                isTop ? "bg-amber-500/5" : ""
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center font-mono">
                                <span
                                  className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-bold ${
                                    row.rank === 1
                                      ? "bg-amber-500 text-black font-black"
                                      : row.rank === 2
                                      ? "bg-slate-300 text-black font-black"
                                      : row.rank === 3
                                      ? "bg-amber-700 text-white font-bold"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {row.rank || idx + 1}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <TeamVolleyboxLink
                                    teamName={row.team}
                                    category={league.category}
                                    city={league.city}
                                    className="font-bold text-white hover:text-primary transition-colors text-xs"
                                  />
                                </div>
                              </td>
                              <td className="py-2.5 px-2.5 text-center font-mono text-slate-300">{row.played}</td>
                              <td className="py-2.5 px-2.5 text-center font-mono text-emerald-400 font-bold">
                                {row.won}
                              </td>
                              <td className="py-2.5 px-2.5 text-center font-mono text-rose-400 font-bold">
                                {row.lost}
                              </td>
                              <td className="py-2.5 px-2.5 text-center font-mono text-slate-300">{row.sets_won}</td>
                              <td className="py-2.5 px-2.5 text-center font-mono text-slate-300">{row.sets_lost}</td>
                              <td className="py-2.5 px-2.5 text-center font-mono text-slate-400">
                                {row.set_ratio || "0"}
                              </td>
                              <td className="py-2.5 px-2.5 text-center font-mono font-black text-white bg-slate-800/50 text-sm">
                                {row.points}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {(row.form || []).slice(-5).map((f, fIdx) => (
                                    <span
                                      key={fIdx}
                                      className={`w-4 h-4 rounded text-[9px] font-black inline-flex items-center justify-center ${
                                        f === "W"
                                          ? "bg-emerald-500 text-white"
                                          : "bg-rose-500 text-white"
                                      }`}
                                    >
                                      {f}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: FİKSTÜR (GELECEK MAÇLAR - ANASAYFA İLE AYNI FİXTURETABLE DÜZENİ) */}
        {activeTab === "fixtures" && (
          <div className="space-y-4">
            {/* Flashscore Yatay Tarih Şeridi (Fikstür Modunda) */}
            {uniqueFixtureDates.length > 0 && (
              <DateRibbon
                dates={uniqueFixtureDates}
                selectedDate={selectedFixtureDate}
                onSelectDate={setSelectedFixtureDate}
                dateCounts={fixtureDateCounts}
                todayStr={todayStr}
                yesterdayStr={yesterdayStr}
                variant="red"
              />
            )}

            {/* Arama ve Bilgi Kontrol Çubuğu */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                <h2 className="text-sm font-bold text-white">
                  Fikstür & Maç Programı ({displayedUpcomingMatches.length})
                </h2>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Takım veya salon ara..."
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Seçilen Tarihin Maçları Bilgi ve Kolay Geçiş Rozeti */}
            {selectedFixtureDate !== "all" && (
              <div className="flex items-center justify-between bg-sky-950/40 border border-sky-800/60 rounded-xl px-3.5 py-2.5 text-xs text-sky-300 shadow-sm flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-sky-400 shrink-0" />
                  <span>
                    <strong>Seçilen Tarih:</strong> {formatDateTurkish(selectedFixtureDate)}
                  </span>
                  <span className="text-[11px] bg-sky-500/20 text-sky-200 border border-sky-500/30 px-2 py-0.5 rounded-full font-bold font-mono">
                    {displayedUpcomingMatches.length} Maç
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFixtureDate("all")}
                  className="text-xs text-sky-400 hover:text-sky-200 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Tüm Fikstürü Göster ({league.stats.upcomingMatches})
                </button>
              </div>
            )}

            {upcomingSections.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-400 text-sm">
                {selectedFixtureDate !== "all"
                  ? `${formatDateTurkish(selectedFixtureDate)} tarihinde oynanacak maç bulunmuyor.`
                  : teamSearchQuery
                  ? "Aramanıza uygun gelecek maç bulunamadı."
                  : "Planlanmış gelecek maç bulunamadı."}
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingSections.map((sec, idx) => (
                  <FixtureTable
                    key={`${sec.title}-${sec.subTitle}-${idx}`}
                    title={sec.title}
                    subTitle={sec.subTitle}
                    matches={sec.matches}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                    city={league.city}
                    showCityBadge={false}
                    onSelectMatch={setSelectedMatch}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SONUÇLAR (BİTEN MAÇLAR - ANASAYFA İLE AYNI FİXTURETABLE DÜZENİ) */}
        {activeTab === "results" && (
          <div className="space-y-4">
            {/* Flashscore Yatay Tarih Şeridi (Sonuçlar Modunda - Zümrüt Yeşili) */}
            {uniqueResultDates.length > 0 && (
              <DateRibbon
                dates={uniqueResultDates}
                selectedDate={selectedResultDate}
                onSelectDate={setSelectedResultDate}
                dateCounts={resultDateCounts}
                todayStr={todayStr}
                yesterdayStr={yesterdayStr}
                variant="emerald"
              />
            )}

            {/* Arama ve Bilgi Kontrol Çubuğu */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <h2 className="text-sm font-bold text-white">
                  Oynanan Maç Sonuçları ({displayedFinishedMatches.length})
                </h2>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Takım veya salon ara..."
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Seçilen Tarihin Sonuçları Bilgi ve Kolay Geçiş Rozeti */}
            {selectedResultDate !== "all" && (
              <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/60 rounded-xl px-3.5 py-2.5 text-xs text-emerald-300 shadow-sm flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-emerald-400 shrink-0" />
                  <span>
                    <strong>
                      {selectedResultDate === yesterdayStr
                        ? "Dünün Sonuçları:"
                        : `${formatDateTurkish(selectedResultDate)} Sonuçları:`}
                    </strong>{" "}
                    {formatDateTurkish(selectedResultDate)}
                  </span>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold font-mono">
                    {displayedFinishedMatches.length} Maç
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedResultDate("all")}
                  className="text-xs text-emerald-400 hover:text-emerald-200 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Tüm Sonuçları Göster ({league.stats.finishedMatches})
                </button>
              </div>
            )}

            {finishedSections.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-400 text-sm">
                {selectedResultDate !== "all"
                  ? `${formatDateTurkish(selectedResultDate)} tarihinde sonuçlanan maç bulunmuyor.`
                  : teamSearchQuery
                  ? "Aramanıza uygun tamamlanan maç bulunamadı."
                  : "Henüz tamamlanmış maç skoru bulunmuyor."}
              </div>
            ) : (
              <div className="space-y-4">
                {finishedSections.map((sec, idx) => (
                  <FixtureTable
                    key={`${sec.title}-${sec.subTitle}-${idx}`}
                    title={sec.title}
                    subTitle={sec.subTitle}
                    matches={sec.matches}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                    city={league.city}
                    showCityBadge={false}
                    onSelectMatch={setSelectedMatch}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: İSTATİSTİKLER & LİDERLER */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Lider Takım */}
              <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900 relative overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                  <Trophy size={20} />
                </div>
                <span className="text-xs font-bold text-amber-400 block uppercase tracking-wider">
                  Lig Sıralaması Lideri
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {league.stats.leaderTeam?.name || "Belirlenmedi"}
                </h3>
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-300">
                  <span>Puan: <strong className="text-white font-mono">{league.stats.leaderTeam?.points || 0}</strong></span>
                  <span>•</span>
                  <span>Galibiyet: <strong className="text-emerald-400 font-mono">{league.stats.leaderTeam?.won || 0}</strong></span>
                </div>
              </div>

              {/* En Çok Set Kazanan Takım */}
              <div className="glass-panel p-5 rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-950/20 via-slate-900 to-slate-900 relative overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
                  <Flame size={20} />
                </div>
                <span className="text-xs font-bold text-sky-400 block uppercase tracking-wider">
                  En Çok Set Kazanan
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {league.stats.mostSetsWonTeam?.name || "Belirlenmedi"}
                </h3>
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-300">
                  <span>Kazanılan Set: <strong className="text-white font-mono">{league.stats.mostSetsWonTeam?.setsWon || 0}</strong></span>
                </div>
              </div>

              {/* Namağlup Takımlar */}
              <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-900 relative overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <Shield size={20} />
                </div>
                <span className="text-xs font-bold text-emerald-400 block uppercase tracking-wider">
                  Namağlup Takımlar
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {league.stats.undefeatedTeams.length > 0
                    ? league.stats.undefeatedTeams.join(", ")
                    : "Namağlup takım kalmadı"}
                </h3>
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-300">
                  <span>Toplam {league.stats.undefeatedTeams.length} Takım Kayıpsız</span>
                </div>
              </div>
            </div>

            {/* Salon Listesi */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <MapPin size={16} className="text-primary" />
                <span>Bu Ligin Oynandığı Spor Salonları ({league.halls.length})</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {league.halls.map((h) => (
                  <span
                    key={h}
                    className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-xl"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: KATILAN TAKIMLAR */}
        {activeTab === "teams" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-sky-400" />
                <h2 className="text-sm font-bold text-white">
                  Mücadele Eden Kulüpler ({displayedTeams.length})
                </h2>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Kulüp adı ara..."
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {displayedTeams.map((team) => (
                <div
                  key={team.name}
                  className="glass-panel border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <TeamVolleyboxLink
                        teamName={team.name}
                        category={league.category}
                        city={league.city}
                        className="font-black text-white text-sm hover:text-primary transition-colors block"
                      />
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        {team.group || league.category}
                      </span>
                    </div>

                    {team.rank && (
                      <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg shrink-0">
                        #{team.rank}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs py-2 bg-slate-900/60 rounded-xl border border-slate-800/60">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Maç</span>
                      <strong className="text-white font-mono">{team.played}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Galibiyet</span>
                      <strong className="text-emerald-400 font-mono">{team.won}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Mağlubiyet</span>
                      <strong className="text-rose-400 font-mono">{team.lost}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Puan</span>
                      <strong className="text-amber-300 font-mono">{team.points ?? "-"}</strong>
                    </div>
                  </div>

                  <Link
                    href={`/takim/${team.slug}`}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Takım Profilini Aç</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Maç Merkezi Drawer */}
      <MatchCenterDrawer
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        city={league.city}
        isFavorite={selectedMatch ? isFavorite(selectedMatch.id) : false}
        onToggleFavorite={selectedMatch ? () => toggleFavorite(selectedMatch.id) : undefined}
      />

      {/* Spotlight Arama Modalı */}
      <SpotlightSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        teams={league.teams.map((t) => t.name)}
        halls={league.halls}
        categories={Array.from(new Set(league.matches.map((m) => m.category).filter(Boolean)))}
        cities={[{ name: league.city, slug: league.citySlug }]}
      />
    </div>
  );
};
