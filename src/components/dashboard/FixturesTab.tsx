"use client";

import React from "react";
import { Virtuoso } from "react-virtuoso";
import { DateNavigationRibbon } from "@/components/match/DateNavigationRibbon";
import { FilterBar } from "@/components/FilterBar";
import { LeagueSection } from "@/components/match/LeagueSection";
import { CityGroupBanner } from "@/components/dashboard/CityGroupBanner";
import { CollapseControlBar } from "@/components/dashboard/CollapseControlBar";
import { FixturesEmptyState } from "@/components/dashboard/FixturesEmptyState";
import type { FixturesData, Match } from "@/types/fixture";
import { getLeagueDisplayTitle } from "@/utils/grouping";
import type { FixtureCityGroup, FixtureSection, VolleyboxStats } from "@/utils/dashboardFilters";
import type { DashboardFilters } from "@/hooks/useDashboardFilters";
import type { CollapseControls } from "@/hooks/useCollapseControls";

interface FixturesTabProps {
  data: FixturesData | undefined;
  filters: DashboardFilters;
  todayStr: string;
  counts: { all: number; upcoming: number; finished: number };
  liveMatchesCount: number;
  volleyboxStats: VolleyboxStats;
  groupedSections: FixtureSection[];
  fixturesByCity: FixtureCityGroup[];
  allFixtureLeagueKeys: string[];
  cityCollapse: CollapseControls;
  leagueCollapse: CollapseControls;
  favorites: string[];
  onToggleFavorite: (matchId: string) => void;
  onSelectMatch: (match: Match | null) => void;
  isAllCities: boolean;
  onSelectCity: (slug: string) => void;
}

/** FİKSTÜR SEKMESİ */
export const FixturesTab: React.FC<FixturesTabProps> = ({
  data,
  filters,
  todayStr,
  counts,
  liveMatchesCount,
  volleyboxStats,
  groupedSections,
  fixturesByCity,
  allFixtureLeagueKeys,
  cityCollapse,
  leagueCollapse,
  favorites,
  onToggleFavorite,
  onSelectMatch,
  isAllCities,
  onSelectCity,
}) => {
  const {
    selectedDate,
    setSelectedDate,
    statusFilter,
    setStatusFilter,
    selectedCategory,
    setSelectedCategory,
    selectedHall,
    setSelectedHall,
    searchQuery,
    setSearchQuery,
    volleyboxFilter,
    setVolleyboxFilter,
    showOnlyFavorites,
    resetFilters,
    isFiltered,
  } = filters;

  return (
    <div>
      {/* Sonuçlar sayfasıyla aynı hızlı tarih şeridi */}
      <DateNavigationRibbon
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        todayStr={todayStr}
        statusFilter={statusFilter as "all" | "upcoming" | "finished"}
        onSelectStatusFilter={() => {}}
        counts={{
          all: counts.all,
          live: liveMatchesCount,
          finished: counts.finished,
          upcoming: counts.upcoming,
        }}
        showStatusFilters={false}
      />

      {/* Flashscore Filtre Barı (HEPSİ / OYNANACAK / BİTENLER) */}
      {data?.filters && (
        <FilterBar
          categories={data.filters.categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          statusFilter={statusFilter}
          onSelectStatusFilter={setStatusFilter}
          counts={counts}
          halls={data.filters.halls}
          selectedHall={selectedHall}
          onSelectHall={setSelectedHall}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          volleyboxFilter={volleyboxFilter}
          onSelectVolleyboxFilter={setVolleyboxFilter}
          volleyboxStats={volleyboxStats}
          onReset={resetFilters}
          isFiltered={isFiltered}
        />
      )}

      {/* Toplu İl ve Lig Gizleme / Gösterme Kontrol Çubuğu */}
      {fixturesByCity.length > 0 && (
        <CollapseControlBar
          variant="fixtures"
          cityCount={fixturesByCity.length}
          leagueCount={allFixtureLeagueKeys.length}
          areAllCitiesCollapsed={cityCollapse.areAllCollapsed}
          areAllLeaguesCollapsed={leagueCollapse.areAllCollapsed}
          onExpandCities={cityCollapse.expandAll}
          onCollapseCities={cityCollapse.collapseAll}
          onExpandLeagues={leagueCollapse.expandAll}
          onCollapseLeagues={leagueCollapse.collapseAll}
        />
      )}

      {/* Resmi Fikstür Tablosu: İllere Göre Gruplanmış ve Açılır/Kapanır */}
      {fixturesByCity.length > 0 && (
        <Virtuoso
          useWindowScroll
          data={fixturesByCity}
          increaseViewportBy={{ top: 600, bottom: 900 }}
          itemContent={(_, cityGroup) => {
            const isCityCollapsed = Boolean(cityCollapse.collapsed[cityGroup.city]);

            return (
              <div className="space-y-3 pb-6">
                {/* Şehir Başlık Banner'ı: Tıklandığında o ilin maçlarını gizler/açar */}
                <CityGroupBanner
                  cityName={cityGroup.city}
                  totalMatches={cityGroup.totalMatches}
                  isCollapsed={isCityCollapsed}
                  onToggle={() => cityCollapse.toggle(cityGroup.city)}
                  noun="fikstürünü"
                  isAllCities={isAllCities}
                  onSelectCity={onSelectCity}
                />

                {/* Bu Şehirdeki Fikstür Tabloları */}
                {!isCityCollapsed && (
                  <div className="space-y-4 animate-in fade-in-50 duration-200">
                    {cityGroup.sections.map((sec, idx) => {
                      const leagueKey = `${cityGroup.city}::${sec.title}::${sec.subTitle || ""}`;
                      return (
                        <LeagueSection
                          key={`${cityGroup.city}-${sec.title}-${sec.subTitle}-${idx}`}
                          leagueTitle={getLeagueDisplayTitle(sec.title, sec.subTitle)}
                          cityName={cityGroup.city}
                          matches={sec.matches}
                          favorites={favorites}
                          onToggleFavorite={onToggleFavorite}
                          onSelectMatch={onSelectMatch}
                          isCollapsed={Boolean(leagueCollapse.collapsed[leagueKey])}
                          onToggleCollapse={() => leagueCollapse.toggle(leagueKey)}
                          mode="fixtures"
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }}
        />
      )}

      {/* Sonuç Bulunamadı / İl Sezon Takvimi Bekleniyor */}
      {groupedSections.length === 0 && (
        <FixturesEmptyState
          city={data?.city}
          hasNoMatches={(data?.matches || []).length === 0}
          showOnlyFavorites={showOnlyFavorites}
          isFiltered={isFiltered}
          onSelectCity={onSelectCity}
          onResetFilters={resetFilters}
        />
      )}
    </div>
  );
};
