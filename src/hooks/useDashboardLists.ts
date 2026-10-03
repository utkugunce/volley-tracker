import { useMemo } from "react";
import type { FixturesData } from "@/types/fixture";
import { groupResultsByCityAndLeague, type CityResultGroup } from "@/utils/grouping";
import {
  filterFixtureMatches,
  filterResultMatches,
  filterStandingsByCategory,
  groupMatchesIntoSections,
  groupSectionsByCity,
} from "@/utils/dashboardFilters";
import type { DashboardFilters } from "@/hooks/useDashboardFilters";

interface UseDashboardListsOptions {
  data: FixturesData;
  filters: DashboardFilters;
  favorites: string[];
  todayStr: string;
  yesterdayStr: string;
  isAllCities: boolean;
}

/** Fikstür / Sonuçlar / Puan Durumu sekmeleri için filtrelenmiş ve gruplanmış listeler. */
export function useDashboardLists({
  data,
  filters,
  favorites,
  todayStr,
  yesterdayStr,
  isAllCities,
}: UseDashboardListsOptions) {
  const {
    showOnlyFavorites,
    selectedCategory,
    selectedDate,
    statusFilter,
    selectedHall,
    searchQuery,
    volleyboxFilter,
    selectedResultDate,
    resultsSubTab,
  } = filters;

  // Filtrelenmiş Maç Listesi
  const filteredMatches = useMemo(() => {
    return filterFixtureMatches(data?.matches || [], {
      showOnlyFavorites,
      favorites,
      selectedCategory,
      selectedDate,
      statusFilter,
      selectedHall,
      searchQuery,
      volleyboxFilter,
      todayStr,
    });
  }, [data, showOnlyFavorites, favorites, selectedCategory, selectedDate, statusFilter, selectedHall, searchQuery, volleyboxFilter, todayStr]);

  // Lig & Gruba göre grupla (Genç Kızlar Süper Lig - A Grubu, B Grubu vb.)
  // Tüm İller seçildiğinde görseldeki yere il adı yazılır ve iller ayrılır
  const groupedSections = useMemo(
    () => groupMatchesIntoSections(filteredMatches, isAllCities, data?.city),
    [filteredMatches, isAllCities, data?.city]
  );

  // Fikstür maçlarını illere göre grupla (Her ilin altında lig ve grup tabloları)
  const fixturesByCity = useMemo(
    () => groupSectionsByCity(groupedSections, data?.city),
    [groupedSections, data?.city]
  );

  // Sadece skoru/sonucu olan maçlar için filtrelenmiş liste
  const filteredResultMatches = useMemo(() => {
    return filterResultMatches(data?.matches || [], {
      selectedResultDate,
      resultsSubTab,
      yesterdayStr,
      showOnlyFavorites,
      favorites,
      selectedCategory,
      selectedHall,
      searchQuery,
      volleyboxFilter,
    });
  }, [data, selectedResultDate, resultsSubTab, yesterdayStr, showOnlyFavorites, favorites, selectedCategory, selectedHall, searchQuery, volleyboxFilter]);

  // Sonuçlar için Şehir ve Lig bazlı hiyerarşik gruplama (İzmir başlığı altında U18 / U16 ve A Grubu / B Grubu)
  const resultsByCityAndLeague = useMemo<CityResultGroup[]>(() => {
    return groupResultsByCityAndLeague(filteredResultMatches, data?.city);
  }, [filteredResultMatches, data?.city]);

  // Sonuçlar sekmesi il / lig anahtarları
  const resultCityKeys = useMemo(
    () => resultsByCityAndLeague.map((c) => c.city),
    [resultsByCityAndLeague]
  );
  const allResultLeagueKeys = useMemo(() => {
    const keys: string[] = [];
    resultsByCityAndLeague.forEach((c) => {
      c.leagues.forEach((l) => {
        keys.push(`${c.city}::${l.categoryKey}`);
      });
    });
    return keys;
  }, [resultsByCityAndLeague]);

  // Fikstür sekmesi il / lig anahtarları
  const fixtureCityKeys = useMemo(
    () => fixturesByCity.map((c) => c.city),
    [fixturesByCity]
  );
  const allFixtureLeagueKeys = useMemo(() => {
    const keys: string[] = [];
    fixturesByCity.forEach((c) => {
      c.sections.forEach((sec) => {
        keys.push(`${c.city}::${sec.title}::${sec.subTitle || ""}`);
      });
    });
    return keys;
  }, [fixturesByCity]);

  const activeStandings = useMemo(
    () => filterStandingsByCategory(data?.standings, selectedCategory),
    [data?.standings, selectedCategory]
  );

  return {
    groupedSections,
    fixturesByCity,
    filteredResultMatches,
    resultsByCityAndLeague,
    resultCityKeys,
    allResultLeagueKeys,
    fixtureCityKeys,
    allFixtureLeagueKeys,
    activeStandings,
  };
}
