"use client";

import React from "react";
import { Virtuoso } from "react-virtuoso";
import { Calendar } from "lucide-react";
import { DateNavigationRibbon } from "@/components/match/DateNavigationRibbon";
import { FilterBar } from "@/components/FilterBar";
import { LeagueSection } from "@/components/match/LeagueSection";
import { CityGroupBanner } from "@/components/dashboard/CityGroupBanner";
import { CollapseControlBar } from "@/components/dashboard/CollapseControlBar";
import { ResultsEmptyState } from "@/components/dashboard/ResultsEmptyState";
import type { FixturesData, Match } from "@/types/fixture";
import { formatDateTurkish } from "@/utils/calendar";
import { getLeagueDisplayTitle, type CityResultGroup } from "@/utils/grouping";
import type { AppMainTab } from "@/utils/dashboardRoutes";
import type { VolleyboxStats } from "@/utils/dashboardFilters";
import type { DashboardFilters } from "@/hooks/useDashboardFilters";
import type { CollapseControls } from "@/hooks/useCollapseControls";

interface ResultsTabProps {
  data: FixturesData | undefined;
  filters: DashboardFilters;
  todayStr: string;
  yesterdayStr: string;
  uniqueResultDates: string[];
  resultsCount: number;
  yesterdayResultsCount: number;
  totalResultsAcrossAll: number;
  volleyboxStats: VolleyboxStats;
  filteredResultMatches: Match[];
  resultsByCityAndLeague: CityResultGroup[];
  allResultLeagueKeys: string[];
  cityCollapse: CollapseControls;
  leagueCollapse: CollapseControls;
  favorites: string[];
  onToggleFavorite: (matchId: string) => void;
  onSelectMatch: (match: Match | null) => void;
  isAllCities: boolean;
  onSelectCity: (slug: string) => void;
  setActiveMainTab: (tab: AppMainTab) => void;
}

/** SONUÇLAR SEKMESİ (SADECE BİTEN / SKORLU MAÇLAR) */
export const ResultsTab: React.FC<ResultsTabProps> = ({
  data,
  filters,
  todayStr,
  yesterdayStr,
  uniqueResultDates,
  resultsCount,
  yesterdayResultsCount,
  totalResultsAcrossAll,
  volleyboxStats,
  filteredResultMatches,
  resultsByCityAndLeague,
  allResultLeagueKeys,
  cityCollapse,
  leagueCollapse,
  favorites,
  onToggleFavorite,
  onSelectMatch,
  isAllCities,
  onSelectCity,
  setActiveMainTab,
}) => {
  const {
    selectedResultDate,
    setSelectedResultDate,
    resultsSubTab,
    setResultsSubTab,
    selectedCategory,
    setSelectedCategory,
    selectedHall,
    setSelectedHall,
    searchQuery,
    setSearchQuery,
    volleyboxFilter,
    setVolleyboxFilter,
    showOnlyFavorites,
    handleSelectResultsSubTab,
    resetFilters,
    isFiltered,
  } = filters;

  return (
    <div>
      {/* Flashscore Yatay Tarih Şeridi (Sonuçlar Modunda - Zümrüt Yeşili Temalı) */}
      <DateNavigationRibbon
        selectedDate={selectedResultDate}
        onSelectDate={(d) => {
          setSelectedResultDate(d);
          if (d === "all") {
            setResultsSubTab("all");
          } else if (d === yesterdayStr) {
            setResultsSubTab("yesterday");
          } else {
            setResultsSubTab("all");
          }
        }}
        todayStr={todayStr}
        availableDates={uniqueResultDates}
        showStatusFilters={false}
        statusFilter="finished"
        onSelectStatusFilter={() => {}}
        counts={{ all: resultsCount, live: 0, finished: resultsCount, upcoming: 0 }}
      />

      {/* Flashscore Filtre Barı (Sonuçlar Modunda) */}
      {data?.filters && (
        <FilterBar
          categories={data.filters.categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          statusFilter="finished"
          onSelectStatusFilter={() => {}}
          counts={{
            all: resultsCount,
            upcoming: 0,
            finished: resultsCount,
          }}
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
          isResultsTab={true}
          resultsSubTab={resultsSubTab}
          onSelectResultsSubTab={handleSelectResultsSubTab}
          yesterdayCount={yesterdayResultsCount}
        />
      )}

      {/* Seçilen Tarihin Sonuçları Bilgi ve Kolay Geçiş Rozeti */}
      {selectedResultDate !== "all" && (
        <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/60 rounded-xl px-3.5 py-2.5 mb-4 text-xs text-emerald-300 shadow-sm max-w-6xl mx-auto flex-wrap gap-2">
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
              {filteredResultMatches.length} Maç
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedResultDate("all");
              setResultsSubTab("all");
            }}
            className="text-xs text-emerald-400 hover:text-emerald-200 font-semibold underline underline-offset-2 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Tüm Sonuçları Göster ({resultsCount})</span>
          </button>
        </div>
      )}

      {/* Toplu İl ve Lig Gizleme / Gösterme Kontrol Çubuğu */}
      {resultsByCityAndLeague.length > 0 && (
        <CollapseControlBar
          variant="results"
          cityCount={resultsByCityAndLeague.length}
          leagueCount={allResultLeagueKeys.length}
          areAllCitiesCollapsed={cityCollapse.areAllCollapsed}
          areAllLeaguesCollapsed={leagueCollapse.areAllCollapsed}
          onExpandCities={cityCollapse.expandAll}
          onCollapseCities={cityCollapse.collapseAll}
          onExpandLeagues={leagueCollapse.expandAll}
          onCollapseLeagues={leagueCollapse.collapseAll}
        />
      )}

      {/* Sonuçlar Tablosu: Şehir Başlığı Altında Ligler (U18/U16) ve Gruplar (A Grubu, B Grubu) */}
      {resultsByCityAndLeague.length > 0 && (
        <Virtuoso
          useWindowScroll
          data={resultsByCityAndLeague}
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
                  noun="maçlarını"
                  isAllCities={isAllCities}
                  onSelectCity={onSelectCity}
                />

                {/* Bu Şehirdeki Ligler (Örn: Genç Kızlar Süper Lig (U18), Yıldız Kızlar Süper Lig (U16)) */}
                {!isCityCollapsed && (
                  <div className="space-y-3 animate-in fade-in-50 duration-200">
                    {cityGroup.leagues.map((sec, idx) => {
                      const leagueKey = `${cityGroup.city}::${sec.categoryKey}`;
                      return (
                        <LeagueSection
                          key={`${cityGroup.city}-${sec.categoryKey}-${idx}`}
                          leagueTitle={getLeagueDisplayTitle(sec.title, sec.subTitle)}
                          cityName={cityGroup.city}
                          matches={sec.matches}
                          favorites={favorites}
                          onToggleFavorite={onToggleFavorite}
                          onSelectMatch={onSelectMatch}
                          isCollapsed={Boolean(leagueCollapse.collapsed[leagueKey])}
                          onToggleCollapse={() => leagueCollapse.toggle(leagueKey)}
                          mode="results"
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

      {/* Sonuç Bulunamadı */}
      {resultsByCityAndLeague.length === 0 && (
        <ResultsEmptyState
          city={data?.city}
          resultsSubTab={resultsSubTab}
          yesterdayStr={yesterdayStr}
          resultsCount={resultsCount}
          filteredResultCount={filteredResultMatches.length}
          totalResultsAcrossAll={totalResultsAcrossAll}
          selectedResultDate={selectedResultDate}
          showOnlyFavorites={showOnlyFavorites}
          isFiltered={isFiltered}
          setResultsSubTab={setResultsSubTab}
          setActiveMainTab={setActiveMainTab}
          onSelectCity={onSelectCity}
          onResetFilters={resetFilters}
        />
      )}
    </div>
  );
};
