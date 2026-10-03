"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { CityTabBar } from "@/components/CityTabBar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PrimaryTeamWidget } from "@/components/PrimaryTeamWidget";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { MatchInspectorPanel } from "@/components/match/MatchInspectorPanel";
import { MatchSelectionProvider } from "@/context/MatchSelectionContext";
import dynamic from "next/dynamic";
import { FixturesData } from "@/types/fixture";
import { isMatchScored } from "@/utils/matchScoring";

export { isMatchScored };

import { TabViewSkeleton } from "@/components/common/SkeletonLoaders";
import { TabViewLoading } from "@/components/dashboard/TabViewLoading";
import { LiveMatchBanner } from "@/components/dashboard/LiveMatchBanner";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { MobileLeaguesMenu } from "@/components/dashboard/MobileLeaguesMenu";
import { ResultsTab } from "@/components/dashboard/ResultsTab";
import { FixturesTab } from "@/components/dashboard/FixturesTab";
import { StandingsTab } from "@/components/dashboard/StandingsTab";

const HomePortalView = dynamic(
  () => import("@/components/HomePortalView").then((mod) => mod.HomePortalView),
  { loading: TabViewLoading }
);
const CompactMatchFeed = dynamic(
  () => import("@/components/match/CompactMatchFeed").then((mod) => mod.CompactMatchFeed),
  { loading: TabViewLoading }
);
const GroupStatusView = dynamic(
  () => import("@/components/GroupStatusView").then((mod) => mod.GroupStatusView),
  { loading: TabViewLoading }
);
const MobileMatchDrawer = dynamic(
  () => import("@/components/MobileMatchDrawer").then((mod) => mod.MobileMatchDrawer),
  { loading: TabViewLoading }
);

const NotificationBanner = dynamic(
  () => import("@/components/NotificationBanner").then((mod) => mod.NotificationBanner),
  { ssr: false }
);
const SpotlightSearchModal = dynamic(
  () => import("@/components/SpotlightSearchModal").then((mod) => mod.SpotlightSearchModal),
  { ssr: false }
);
import { AlertCircle } from "lucide-react";
import { getLeagueDisplayTitle } from "@/utils/grouping";
import { getAppRoute, parseAppRoute, type AppMainTab } from "@/utils/dashboardRoutes";
import { useFixturesData } from "@/hooks/useFixturesData";
import { useDashboardNavigation } from "@/hooks/useDashboardNavigation";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useCollapseControls } from "@/hooks/useCollapseControls";
import { useFavorites } from "@/hooks/useFavorites";
import { useCitiesList } from "@/hooks/useCitiesList";
import { useMatchSelection } from "@/hooks/useMatchSelection";
import { useSearchShortcut } from "@/hooks/useSearchShortcut";
import { useTodayYesterday } from "@/hooks/useTodayYesterday";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useDashboardLists } from "@/hooks/useDashboardLists";

// Dışarıdan import edilen (testler, sayfalar, diğer bileşenler) API'yi koru
export { getLeagueDisplayTitle, getAppRoute, parseAppRoute };
export type { AppMainTab };

interface DashboardClientProps {
  initialData: FixturesData;
  initialTab?: AppMainTab;
  initialCity?: string;
  initialDataPartial?: boolean;
}

export const DashboardClient: React.FC<DashboardClientProps> = ({
  initialData,
  initialTab = "home",
  initialCity = "all",
  initialDataPartial = false,
}) => {
  // Ana Sekmeler: "home" (Anasayfa Portalı), "results" (Sonuçlar), "today" (Günün Maçları), "fixtures" (Fikstür), "standings" (Puan Durumu) ve "group-status" (Grup Durumu)
  const [activeMainTab, setActiveMainTab] = useState<AppMainTab>(initialTab);

  // 81 İl Desteği - URL'den veya prop'tan gelen şehir ile başlar
  const [currentCitySlug, setCurrentCitySlug] = useState(initialCity || "all");

  const { data, isPartialData, loading, error, setError, ensureFullData, loadCityData, fetchData } =
    useFixturesData({ initialData, initialCity, initialDataPartial, currentCitySlug });

  const { todayStr, yesterdayStr } = useTodayYesterday();

  const filters = useDashboardFilters({ yesterdayStr, activeMainTab });
  const {
    selectedCategory,
    setSelectedCategory,
    setSelectedHall,
    setStatusFilter,
    showOnlyFavorites,
    setShowOnlyFavorites,
  } = filters;

  const { handleSelectTab, handleSelectCity } = useDashboardNavigation({
    activeMainTab,
    setActiveMainTab,
    currentCitySlug,
    setCurrentCitySlug,
    initialTab,
    initialCity,
    isPartialData,
    ensureFullData,
    loadCityData,
    setError,
    resetFiltersForCityChange: filters.resetFiltersForCityChange,
  });

  // Premium Özellikler: Maç Detay Çekmecesi & Spotlight Arama
  const [isLeaguesMenuOpen, setIsLeaguesMenuOpen] = useState(false);
  const { selectedMatch, setSelectedMatch, isMobileDrawerOpen, setIsMobileDrawerOpen, handleSelectMatch } =
    useMatchSelection(data?.matches);
  const { isSearchOpen, setIsSearchOpen } = useSearchShortcut();

  const { favorites, toggleFavorite } = useFavorites(data?.matches);
  const citiesList = useCitiesList();

  // Tüm İller seçili mi?
  const isAllCities = currentCitySlug === "all" || data?.city === "Tüm İller";

  const {
    allTeamNames,
    todayMatchesCount,
    totalMatchesAcrossAll,
    uniqueResultDates,
    counts,
    resultsCount,
    liveMatchesCount,
    yesterdayResultsCount,
    totalResultsAcrossAll,
    volleyboxStats,
  } = useDashboardStats({ data, citiesList, currentCitySlug, todayStr, yesterdayStr });

  const {
    groupedSections,
    fixturesByCity,
    filteredResultMatches,
    resultsByCityAndLeague,
    resultCityKeys,
    allResultLeagueKeys,
    fixtureCityKeys,
    allFixtureLeagueKeys,
    activeStandings,
  } = useDashboardLists({ data, filters, favorites, todayStr, yesterdayStr, isAllCities });

  // Şehir ve lig bazlı gizleme / daraltma durumları (Collapse / Accordion)
  const resultCityCollapse = useCollapseControls(resultCityKeys);
  const resultLeagueCollapse = useCollapseControls(allResultLeagueKeys);
  const fixtureCityCollapse = useCollapseControls(fixtureCityKeys);
  const fixtureLeagueCollapse = useCollapseControls(allFixtureLeagueKeys);

  return (
    <MatchSelectionProvider matches={data?.matches || []} initialMatchId={selectedMatch?.id}>
      <AppShell
        header={
          <>
            {/* 0. Favori Maç Hatırlatma Banner'ı */}
            <NotificationBanner favoritesCount={favorites.length} />

            {/* 1. Header (SONUÇLAR, GÜNÜN MAÇLARI, FİKSTÜR ve PUAN DURUMU Sekmeleriyle) */}
            <Header
              city={data?.city}
              currentCitySlug={currentCitySlug}
              onSelectCity={handleSelectCity}
              cities={citiesList}
              title={data?.title}
              updatedAt={data?.updated_at}
              totalMatches={data?.total_matches || 0}
              todayMatchesCount={todayMatchesCount}
              resultsCount={resultsCount}
              favoritesCount={favorites.length}
              showOnlyFavorites={showOnlyFavorites}
              onToggleFavoritesOnly={() => setShowOnlyFavorites(!showOnlyFavorites)}
              activeTab={activeMainTab}
              onSelectTab={handleSelectTab}
              onRefresh={fetchData}
              isLoading={loading}
              onOpenSearch={() => setIsSearchOpen(true)}
            />

            {/* Canlı Skor Göstergesi */}
            {liveMatchesCount > 0 && <LiveMatchBanner count={liveMatchesCount} />}

            {/* 2. Üst İl Sekmeleri (Fikstür, Sonuçlar ve Puan Durumu sayfalarında gösterilir) */}
            {activeMainTab !== "home" && (
              <CityTabBar
                currentCitySlug={currentCitySlug}
                onSelectCity={handleSelectCity}
                cities={citiesList}
                totalMatchesAcrossAll={totalMatchesAcrossAll}
              />
            )}
          </>
        }
        leftSidebar={
          <SidebarNavigation
            cities={citiesList}
            currentCity={currentCitySlug}
            onSelectCity={handleSelectCity}
            matches={data?.matches || []}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            favoritesCount={favorites.length}
            totalMatches={totalMatchesAcrossAll}
          />
        }
        rightSidebar={
          activeMainTab === "standings" ? undefined : (
            <MatchInspectorPanel
              match={selectedMatch}
              allMatches={data?.matches || []}
              standings={data?.standings}
              isLoading={loading}
              onClose={() => setSelectedMatch(null)}
              onToggleFavorite={toggleFavorite}
              isFavorite={selectedMatch ? favorites.includes(selectedMatch.id) : false}
            />
          )
        }
        footer={<DashboardFooter city={data?.city} />}
      >
        <div className="space-y-4">
          {/* Desteklenen Kulüp (Primary Team VIP Widget) */}
          <PrimaryTeamWidget
            matches={data?.matches || []}
            city={data?.city}
            onSelectMatch={handleSelectMatch}
            availableTeams={allTeamNames}
          />

        {/* Hata Durumu */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2 mb-4 text-xs font-semibold shadow-md">
            <AlertCircle size={15} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 3. SEÇİLEN SEKME GÖRÜNÜMÜ VEYA İSKELET YÜKLEYİCİ (SIFIR CLS) */}
        {loading ? (
          <TabViewSkeleton tab={activeMainTab} />
        ) : activeMainTab === "results" ? (
          /* ==================== SONUÇLAR SEKMESİ (SADECE BİTEN / SKORLU MAÇLAR) ==================== */
          <ResultsTab
            data={data}
            filters={filters}
            todayStr={todayStr}
            yesterdayStr={yesterdayStr}
            uniqueResultDates={uniqueResultDates}
            resultsCount={resultsCount}
            yesterdayResultsCount={yesterdayResultsCount}
            totalResultsAcrossAll={totalResultsAcrossAll}
            volleyboxStats={volleyboxStats}
            filteredResultMatches={filteredResultMatches}
            resultsByCityAndLeague={resultsByCityAndLeague}
            allResultLeagueKeys={allResultLeagueKeys}
            cityCollapse={resultCityCollapse}
            leagueCollapse={resultLeagueCollapse}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onSelectMatch={handleSelectMatch}
            isAllCities={isAllCities}
            onSelectCity={handleSelectCity}
            setActiveMainTab={setActiveMainTab}
          />
        ) : activeMainTab === "home" ? (
          /* ==================== ANASAYFA PORTAL & DASHBOARD ==================== */
          <HomePortalView
            matches={data?.matches || []}
            city={data?.city}
            currentCitySlug={currentCitySlug}
            onSelectCity={handleSelectCity}
            citiesList={citiesList}
            standings={data?.standings || {}}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onSelectMatch={handleSelectMatch}
            onNavigateTab={handleSelectTab}
            todayStr={todayStr}
            yesterdayStr={yesterdayStr}
            totalMatchesCount={data?.total_matches}
          />
        ) : activeMainTab === "today" ? (
          /* ==================== GÜNÜN MAÇLARI — Sofascore Kompakt Maç Akışı ==================== */
          <CompactMatchFeed
            matches={data?.matches || []}
            selectedMatchId={selectedMatch?.id || null}
            onSelectMatch={(m) => handleSelectMatch(m)}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            todayStr={todayStr}
            yesterdayStr={yesterdayStr}
            city={data?.city}
          />
        ) : activeMainTab === "fixtures" ? (
          /* ==================== FİKSTÜR SEKMESİ ==================== */
          <FixturesTab
            data={data}
            filters={filters}
            todayStr={todayStr}
            counts={counts}
            liveMatchesCount={liveMatchesCount}
            volleyboxStats={volleyboxStats}
            groupedSections={groupedSections}
            fixturesByCity={fixturesByCity}
            allFixtureLeagueKeys={allFixtureLeagueKeys}
            cityCollapse={fixtureCityCollapse}
            leagueCollapse={fixtureLeagueCollapse}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onSelectMatch={handleSelectMatch}
            isAllCities={isAllCities}
            onSelectCity={handleSelectCity}
          />
        ) : activeMainTab === "standings" ? (
          /* ==================== PUAN DURUMU SEKMESİ ==================== */
          <StandingsTab data={data} activeStandings={activeStandings} />
        ) : (
          /* ==================== GRUP DURUMU SEKMESİ (VOLLEYBOX) ==================== */
          <div>
            <GroupStatusView
              selectedCity={currentCitySlug}
              onSelectCity={handleSelectCity}
              citiesList={citiesList}
              onRefresh={fetchData}
              isLoading={loading}
            />
          </div>
        )}
        </div>
      </AppShell>

      {/* 4. Mobil Sabit Alt Menü (Sofascore Standardı) */}
      <MobileBottomNav
        activeTab={
          showOnlyFavorites
            ? "favorites"
            : filters.statusFilter === "live"
            ? "live"
            : activeMainTab === "standings"
            ? "standings"
            : isLeaguesMenuOpen
            ? "leagues"
            : "matches"
        }
        onSelectTab={(tab) => {
          if (tab === "matches") {
            setIsLeaguesMenuOpen(false);
            setShowOnlyFavorites(false);
            setStatusFilter("all");
            handleSelectTab("today");
          } else if (tab === "live") {
            setIsLeaguesMenuOpen(false);
            setShowOnlyFavorites(false);
            setStatusFilter("live");
            handleSelectTab("today");
          } else if (tab === "standings") {
            setIsLeaguesMenuOpen(false);
            setShowOnlyFavorites(false);
            handleSelectTab("standings");
          } else if (tab === "leagues") {
            setIsLeaguesMenuOpen(true);
          } else if (tab === "favorites") {
            setIsLeaguesMenuOpen(false);
            setShowOnlyFavorites(true);
            handleSelectTab("fixtures");
          }
        }}
        favoriteCount={favorites.length}
        liveCount={liveMatchesCount}
        todayMatchesCount={todayMatchesCount}
        resultsCount={resultsCount}
      />

      {/* 5. Mobil Maç Detayı: Alttan Açılan Çekmece (MobileMatchDrawer) */}
      {isMobileDrawerOpen && selectedMatch && (
        <MobileMatchDrawer
          isOpen
          match={selectedMatch}
          onClose={() => setIsMobileDrawerOpen(false)}
          allMatches={data?.matches || []}
          standings={data?.standings}
          onToggleFavorite={toggleFavorite}
          isFavorite={favorites.includes(selectedMatch.id)}
        />
      )}

      {/* 6. Mobil Tam Ekran Ligler Menüsü (Sol Panel Ağacı) */}
      {isLeaguesMenuOpen && (
        <MobileLeaguesMenu
          cities={citiesList}
          currentCitySlug={currentCitySlug}
          matches={data?.matches || []}
          selectedCategory={selectedCategory}
          favoritesCount={favorites.length}
          totalMatches={totalMatchesAcrossAll}
          onSelectCity={handleSelectCity}
          onSelectCategory={setSelectedCategory}
          onClose={() => setIsLeaguesMenuOpen(false)}
        />
      )}

      {/* 6. Spotlight Hızlı Arama Modalı (Cmd + K) */}
      <SpotlightSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        teams={allTeamNames}
        halls={data?.filters?.halls || []}
        cities={citiesList}
        categories={data?.filters?.categories || []}
        onSelectCity={handleSelectCity}
        onSelectCategory={setSelectedCategory}
        onSelectHall={setSelectedHall}
      />
    </MatchSelectionProvider>
  );
};
