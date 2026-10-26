"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { Kadinlar2LigData } from "@/types/kadinlar2Lig";
import { Match, StandingItem } from "@/types/fixture";
import { useFavorites } from "@/utils/useFavorites";

const MobileMatchDrawer = dynamic(
  () => import("@/components/MobileMatchDrawer").then((mod) => mod.MobileMatchDrawer),
  { ssr: false }
);
const SpotlightSearchModal = dynamic(
  () => import("@/components/SpotlightSearchModal").then((mod) => mod.SpotlightSearchModal),
  { ssr: false }
);
import { MatchInspectorPanel } from "@/components/match/MatchInspectorPanel";
import { PrimaryTeamWidget } from "@/components/PrimaryTeamWidget";
import { slugify } from "@/utils/slugify";
import { SultanlarLigiHeader } from "./SultanlarLigiHeader";
import { SultanlarLigiSidebar } from "./SultanlarLigiSidebar";
import { SultanlarLigiStandings } from "./SultanlarLigiStandings";
import { SultanlarLigiStatuView } from "./SultanlarLigiStatuView";
import { Kadinlar2LigFixtures } from "@/components/kadinlar-2-lig/Kadinlar2LigFixtures";
import { Kadinlar2LigTeams } from "@/components/kadinlar-2-lig/Kadinlar2LigTeams";
import { Kadinlar2LigTodayMatches } from "@/components/kadinlar-2-lig/Kadinlar2LigTodayMatches";
import { Kadinlar2LigResults } from "@/components/kadinlar-2-lig/Kadinlar2LigResults";
import { Kadinlar2LigMobileNav } from "@/components/kadinlar-2-lig/Kadinlar2LigMobileNav";
import { Kadinlar2LigHomePortal } from "@/components/kadinlar-2-lig/Kadinlar2LigHomePortal";
import { Kadinlar2LigCompare } from "@/components/kadinlar-2-lig/Kadinlar2LigCompare";
import { AppShell } from "@/components/layout/AppShell";
import {
  convertK2MatchToMatch,
  getKadinlar2LigTeamName,
  toggleKadinlar2LigMatchFavorite,
} from "@/utils/kadinlar2LigConverter";
import {
  expandKadinlar2LigData,
  type Kadinlar2LigCompactData,
} from "@/utils/kadinlar2LigPayload";
import {
  getSultanlarLigiRoute,
  parseSultanlarLigiRoute,
  SultanlarTabType,
} from "@/utils/sultanlarLigiRoutes";
import { kadinlar2LigMatchToUnified } from "@/utils/unifiedAdapters";
import type { UnifiedFixture } from "@/types/unified";

interface SultanlarLigiClientProps {
  initialData: Kadinlar2LigData | Kadinlar2LigCompactData;
  initialTab?: SultanlarTabType;
}

export const SultanlarLigiClient: React.FC<SultanlarLigiClientProps> = ({
  initialData,
  initialTab,
}) => {
  const [data] = useState<Kadinlar2LigData>(() => expandKadinlar2LigData(initialData));
  const [activeTab, setActiveTab] = useState<SultanlarTabType>(initialTab || "home");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [compareSlug1, setCompareSlug1] = useState<string | undefined>(undefined);

  const { count: favoritesCount, isFavorite, toggleFavorite } = useFavorites();

  const currentGroupData = data.gruplar[0];

  // Bugün tarihi — yalnızca client tarafında hesaplanır
  const [todayStr, setTodayStr] = useState("");
  useEffect(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    setTodayStr(`${day}.${month}.${year}`);
  }, []);

  const todayMatchesCount = useMemo(() => {
    return (data.tum_maclar || []).filter((m) => m.tarih === todayStr).length;
  }, [data.tum_maclar, todayStr]);

  const resultsCount = useMemo(() => {
    return (data.tum_maclar || []).filter((m) => {
      const u: UnifiedFixture = kadinlar2LigMatchToUnified(m);
      return u.status === "finished";
    }).length;
  }, [data.tum_maclar]);

  const convertedMatches: Match[] = useMemo(() => {
    return (data.tum_maclar || []).map(convertK2MatchToMatch);
  }, [data.tum_maclar]);

  const standingsMap: Record<string, StandingItem[]> = useMemo(() => {
    const res: Record<string, StandingItem[]> = {};
    (data.gruplar || []).forEach((g) => {
      const key = g.grup_adi || "Lig Etabı";
      res[key] = (g.puan_durumu || []).map((t) => ({
        rank: t.sira,
        team: getKadinlar2LigTeamName(t.takim_adi, t.volleybox_name),
        played: t.o,
        won: t.g,
        lost: t.m,
        points: t.p,
        sets_won: t.as,
        sets_lost: t.vs,
        set_ratio: t.sav,
        points_won: t.asp,
        points_lost: t.vsp,
        point_ratio: t.spav,
        form: [],
      }));
    });
    return res;
  }, [data.gruplar]);

  // Spotlight Arama Verileri
  const searchableTeams = useMemo(() => {
    return Array.from(
      new Set(
        (data.tum_takimlar || []).map((t) =>
          getKadinlar2LigTeamName(t.takim_adi, t.volleybox_name)
        )
      )
    );
  }, [data.tum_takimlar]);

  const searchableHalls = useMemo(() => {
    return Array.from(new Set((data.tum_maclar || []).map((m) => m.salon).filter(Boolean)));
  }, [data.tum_maclar]);

  const searchableCities = useMemo(() => {
    const unique = Array.from(new Set((data.tum_maclar || []).map((m) => m.sehir).filter(Boolean)));
    return unique.map((c) => ({ name: c, slug: slugify(c) }));
  }, [data.tum_maclar]);

  const searchableCategories = useMemo(() => {
    return ["Vodafone Sultanlar Ligi", "Lig Etabı"];
  }, []);

  // Spotlight Kısayolu (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelectTab = (tab: SultanlarTabType) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const targetPath = getSultanlarLigiRoute(tab);
      const currentPath = window.location.pathname;
      if (currentPath !== targetPath) {
        window.history.pushState({ tab }, "", targetPath);
      }
    }
  };

  const handleCompareTeam = (teamSlug: string) => {
    setCompareSlug1(teamSlug);
    setActiveTab("karsilastir");
    if (typeof window !== "undefined") {
      const targetUrl = `/sultanlar-ligi/karsilastir?takim1=${encodeURIComponent(teamSlug)}`;
      window.history.pushState({ tab: "karsilastir" }, "", targetUrl);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Tarayıcı İleri / Geri Butonları Senkronizasyonu
  useEffect(() => {
    const handlePopState = () => {
      const { tab } = parseSultanlarLigiRoute(window.location.pathname);
      setActiveTab(tab);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileDrawerOpen(true);
    }
  };

  const handleCloseInspector = () => {
    setSelectedMatch(null);
    if (typeof window !== "undefined") {
      const u = new URL(window.location.href);
      if (u.searchParams.has("match")) {
        u.searchParams.delete("match");
        window.history.replaceState({}, "", u.toString());
      }
    }
  };

  const handleCloseMobileDrawer = () => {
    setIsMobileDrawerOpen(false);
  };

  const handleToggleFavoriteMatch = (match: Match) => {
    toggleKadinlar2LigMatchFavorite(match.id);
  };

  return (
    <AppShell
      header={
        <SultanlarLigiHeader
          metadata={data.metadata}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          todayMatchesCount={todayMatchesCount}
          resultsCount={resultsCount}
          favoritesCount={favoritesCount}
          showOnlyFavorites={showOnlyFavorites}
          onToggleFavoritesOnly={() => setShowOnlyFavorites((prev) => !prev)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
      }
      sidebar={
        <SultanlarLigiSidebar
          groups={data.gruplar}
          activeTab={activeTab}
          favoritesCount={favoritesCount}
          showOnlyFavorites={showOnlyFavorites}
          onToggleFavoritesOnly={() => setShowOnlyFavorites((prev) => !prev)}
          onSelectTab={handleSelectTab}
        />
      }
      inspector={
        selectedMatch ? (
          <MatchInspectorPanel
            match={selectedMatch}
            onClose={handleCloseInspector}
            isFavorite={isFavorite(selectedMatch.home_team) || isFavorite(selectedMatch.away_team)}
            onToggleFavorite={() => handleToggleFavoriteMatch(selectedMatch)}
            standingsMap={standingsMap}
            matches={convertedMatches}
          />
        ) : null
      }
    >
      <div className="space-y-6">
        <PrimaryTeamWidget />

        {/* GENEL BAKIŞ / PORTAL TABI */}
        {activeTab === "home" && (
          <Kadinlar2LigHomePortal
            data={data}
            onNavigateTab={handleSelectTab}
            onSelectGroup={(_groupNo, tab) => handleSelectTab(tab || "standings")}
            onSelectMatch={handleSelectMatch}
            selectedMatchId={selectedMatch?.id || null}
            searchQuery={searchQuery}
            showOnlyFavorites={showOnlyFavorites}
          />
        )}

        {/* GÜNÜN MAÇLARI TABI */}
        {activeTab === "today" && (
          <Kadinlar2LigTodayMatches
            allMatches={data.tum_maclar || []}
            groups={data.gruplar}
            onSelectMatch={handleSelectMatch}
            searchQuery={searchQuery}
            showOnlyFavorites={showOnlyFavorites}
            onToggleFavoritesOnly={() => setShowOnlyFavorites((prev) => !prev)}
            selectedMatchId={selectedMatch?.id || null}
          />
        )}

        {/* SONUÇLAR TABI */}
        {activeTab === "results" && (
          <Kadinlar2LigResults
            allMatches={data.tum_maclar || []}
            groups={data.gruplar}
            onSelectMatch={handleSelectMatch}
            searchQuery={searchQuery}
            showOnlyFavorites={showOnlyFavorites}
            onToggleFavoritesOnly={() => setShowOnlyFavorites((prev) => !prev)}
            selectedMatchId={selectedMatch?.id || null}
          />
        )}

        {/* PUAN CETVELİ TABI */}
        {activeTab === "standings" && (
          <div className="space-y-8">
            <SultanlarLigiStandings
              group={currentGroupData}
              searchQuery={searchQuery}
              showOnlyFavorites={showOnlyFavorites}
              onCompareTeam={handleCompareTeam}
            />

            {/* PUAN CETVELİ ALTINDA: FİKSTÜR */}
            <div className="space-y-4 pt-6 border-t border-slate-800/80">
              <Kadinlar2LigFixtures
                group={currentGroupData}
                groups={data.gruplar}
                allMatches={data.tum_maclar}
                isAllGroups={false}
                searchQuery={searchQuery}
                showOnlyFavorites={showOnlyFavorites}
                onSelectMatch={handleSelectMatch}
                selectedMatchId={selectedMatch?.id || null}
              />
            </div>
          </div>
        )}

        {/* FİKSTÜR TABI */}
        {activeTab === "fixtures" && (
          <Kadinlar2LigFixtures
            group={currentGroupData}
            groups={data.gruplar}
            allMatches={data.tum_maclar}
            isAllGroups={false}
            searchQuery={searchQuery}
            showOnlyFavorites={showOnlyFavorites}
            onSelectMatch={handleSelectMatch}
            selectedMatchId={selectedMatch?.id || null}
          />
        )}

        {/* KULÜPLER TABI */}
        {activeTab === "teams" && (
          <Kadinlar2LigTeams
            teams={data.tum_takimlar}
            onSelectGroup={() => handleSelectTab("standings")}
            onCompareTeam={handleCompareTeam}
            searchQuery={searchQuery}
            showOnlyFavorites={showOnlyFavorites}
            compareBasePath="/sultanlar-ligi/karsilastir"
          />
        )}

        {/* H2H KARŞILAŞTIR TABI */}
        {activeTab === "karsilastir" && (
          <Kadinlar2LigCompare
            data={data}
            initialSlug1={compareSlug1}
            onSelectGroup={() => handleSelectTab("standings")}
          />
        )}

        {/* STATÜ TABI */}
        {activeTab === "statu" && (
          <SultanlarLigiStatuView totalTeams={data.tum_takimlar?.length || 14} />
        )}
      </div>

      {/* MOBİL ALT GEÇİŞ MENÜSÜ */}
      <Kadinlar2LigMobileNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        todayCount={todayMatchesCount}
      />

      {/* MOBİL MAÇ DETAY DRAWER */}
      <MobileMatchDrawer
        isOpen={isMobileDrawerOpen}
        onClose={handleCloseMobileDrawer}
        match={selectedMatch}
        isFavorite={
          selectedMatch
            ? isFavorite(selectedMatch.home_team) || isFavorite(selectedMatch.away_team)
            : false
        }
        onToggleFavorite={() => selectedMatch && handleToggleFavoriteMatch(selectedMatch)}
        standingsMap={standingsMap}
        matches={convertedMatches}
      />

      {/* SPOTLIGHT GLOBAL ARAMA MODALI */}
      <SpotlightSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        matches={convertedMatches}
        teams={searchableTeams}
        halls={searchableHalls}
        cities={searchableCities}
        categories={searchableCategories}
        onSelectMatch={(m) => {
          handleSelectMatch(m);
          setIsSearchOpen(false);
        }}
        onSelectTeam={(t) => {
          setSearchQuery(t);
          handleSelectTab("teams");
          setIsSearchOpen(false);
        }}
      />
    </AppShell>
  );
};
