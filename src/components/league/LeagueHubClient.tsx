"use client";

import React, { useState, useMemo, useEffect, useLayoutEffect } from "react";
import { LeagueData } from "@/utils/leagueData";
import { Match } from "@/types/fixture";
import dynamic from "next/dynamic";

const MatchCenterDrawer = dynamic(
  () => import("@/components/MatchCenterDrawer").then((mod) => mod.MatchCenterDrawer),
  { ssr: false }
);
const SpotlightSearchModal = dynamic(
  () => import("@/components/SpotlightSearchModal").then((mod) => mod.SpotlightSearchModal),
  { ssr: false }
);
import { useFavorites } from "@/utils/useFavorites";
import { generateSeasonIcs, downloadIcsFile } from "@/utils/ics";
import { compareMatchDateTime } from "@/utils/calendar";
import { formatGroupName } from "@/utils/grouping";
import { slugify } from "@/utils/slugify";
import { downloadStandingsCsv } from "@/components/StandingsTable";
import type { LeagueTabType } from "./hub/types";
import { LeagueHubHeader } from "./hub/LeagueHubHeader";
import { LeagueHero } from "./hub/LeagueHero";
import { LeagueTabsBar } from "./hub/LeagueTabsBar";
import { LeagueStandingsTab } from "./hub/LeagueStandingsTab";
import { LeagueFixturesTab } from "./hub/LeagueFixturesTab";
import { LeagueResultsTab } from "./hub/LeagueResultsTab";
import { LeagueStatsTab } from "./hub/LeagueStatsTab";
import { LeagueTeamsTab } from "./hub/LeagueTeamsTab";

export type { LeagueTabType } from "./hub/types";

interface LeagueHubClientProps {
  league: LeagueData;
  initialTab?: LeagueTabType;
}

export const LeagueHubClient: React.FC<LeagueHubClientProps> = ({
  league,
  initialTab = "standings",
}) => {
  const [activeTab, setActiveTab] = useState<LeagueTabType>(initialTab);

  // Sayfa statik/ISR üretildiği için `?tab=` sunucuda okunmaz; istemcide ilk boyamadan önce uygulanır
  // (ör. /lig/istanbul/genc-kizlar-super-lig?tab=fixtures).
  useLayoutEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (
      (tab === "standings" || tab === "fixtures" || tab === "results" || tab === "stats" || tab === "teams") &&
      tab !== initialTab
    ) {
      setActiveTab(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedFixtureDate, setSelectedFixtureDate] = useState<string>("all");
  const [selectedResultDate, setSelectedResultDate] = useState<string>("all");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  const { favoriteTeams: favorites, isFavorite, toggleFavorite } = useFavorites();

  // Bugün & Dün — yalnızca client tarafında hesaplanır (hydration error #418 önleme)
  const [todayStr, setTodayStr] = useState("");
  const [yesterdayStr, setYesterdayStr] = useState("");

  useEffect(() => {
    const computeDate = (offsetDays = 0) => {
      const d = new Date();
      d.setDate(d.getDate() - offsetDays);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    setTodayStr(computeDate(0));
    setYesterdayStr(computeDate(1));
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
    <div className="min-h-screen bg-canvas text-slate-100 flex flex-col selection:bg-primary/30 selection:text-white">
      {/* 1. ÜST GEZİNME VE BAŞLIK ŞERİDİ */}
      <LeagueHubHeader
        copiedLink={copiedLink}
        handleCopyLink={handleCopyLink}
        league={league}
        setIsSearchOpen={setIsSearchOpen}
      />

      {/* 2. LİG HERO BİLGİ ALANI */}
      <LeagueHero
        handleDownloadCalendar={handleDownloadCalendar}
        handleDownloadCsv={handleDownloadCsv}
        league={league}
        progressPercent={progressPercent}
      />

      {/* 3. İKİNCİL GEZİNME (SEKMELER VE GRUP SEÇİCİ) */}
      <LeagueTabsBar
        activeTab={activeTab}
        groupNames={groupNames}
        league={league}
        selectedGroup={selectedGroup}
        setActiveTab={setActiveTab}
        setSelectedGroup={setSelectedGroup}
      />

      {/* 4. ANA İÇERİK ALANI */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1 space-y-6">
        {/* TAB 1: PUAN DURUMU */}
        {activeTab === "standings" && (
          <LeagueStandingsTab
            displayedFinishedMatches={displayedFinishedMatches}
            displayedGroups={displayedGroups}
            displayedUpcomingMatches={displayedUpcomingMatches}
            favorites={favorites}
            finishedSections={finishedSections}
            league={league}
            setActiveTab={setActiveTab}
            setSelectedMatch={setSelectedMatch}
            toggleFavorite={toggleFavorite}
            upcomingSections={upcomingSections}
          />
        )}

        {/* TAB 2: FİKSTÜR (GELECEK MAÇLAR - ANASAYFA İLE AYNI FİXTURETABLE DÜZENİ) */}
        {activeTab === "fixtures" && (
          <LeagueFixturesTab
            displayedUpcomingMatches={displayedUpcomingMatches}
            favorites={favorites}
            fixtureDateCounts={fixtureDateCounts}
            league={league}
            selectedFixtureDate={selectedFixtureDate}
            setSelectedFixtureDate={setSelectedFixtureDate}
            setSelectedMatch={setSelectedMatch}
            setTeamSearchQuery={setTeamSearchQuery}
            teamSearchQuery={teamSearchQuery}
            todayStr={todayStr}
            toggleFavorite={toggleFavorite}
            uniqueFixtureDates={uniqueFixtureDates}
            upcomingSections={upcomingSections}
            yesterdayStr={yesterdayStr}
          />
        )}

        {/* TAB 3: SONUÇLAR (BİTEN MAÇLAR - ANASAYFA İLE AYNI FİXTURETABLE DÜZENİ) */}
        {activeTab === "results" && (
          <LeagueResultsTab
            displayedFinishedMatches={displayedFinishedMatches}
            favorites={favorites}
            finishedSections={finishedSections}
            league={league}
            resultDateCounts={resultDateCounts}
            selectedResultDate={selectedResultDate}
            setSelectedMatch={setSelectedMatch}
            setSelectedResultDate={setSelectedResultDate}
            setTeamSearchQuery={setTeamSearchQuery}
            teamSearchQuery={teamSearchQuery}
            todayStr={todayStr}
            toggleFavorite={toggleFavorite}
            uniqueResultDates={uniqueResultDates}
            yesterdayStr={yesterdayStr}
          />
        )}

        {/* TAB 4: İSTATİSTİKLER & LİDERLER */}
        {activeTab === "stats" && (
          <LeagueStatsTab league={league} />
        )}

        {/* TAB 5: KATILAN TAKIMLAR */}
        {activeTab === "teams" && (
          <LeagueTeamsTab
            displayedTeams={displayedTeams}
            league={league}
            setTeamSearchQuery={setTeamSearchQuery}
            teamSearchQuery={teamSearchQuery}
          />
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
