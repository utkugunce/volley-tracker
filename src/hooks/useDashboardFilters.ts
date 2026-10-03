import { useState, useCallback } from "react";
import type { AppMainTab } from "@/utils/dashboardRoutes";
import type { VolleyboxFilter } from "@/utils/dashboardFilters";

interface UseDashboardFiltersOptions {
  yesterdayStr: string;
  activeMainTab: AppMainTab;
}

/** Fikstür / Sonuçlar filtre durumları ve sıfırlama yardımcıları. */
export function useDashboardFilters({ yesterdayStr, activeMainTab }: UseDashboardFiltersOptions) {
  // Sonuçlar Alt Sekmesi: "all" (Tüm Sonuçlar) veya "yesterday" (Dünün Sonuçları)
  const [resultsSubTab, setResultsSubTab] = useState<"all" | "yesterday">("all");
  const [selectedResultDate, setSelectedResultDate] = useState("all");

  // Fikstür Filtre Durumları
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [selectedDate, setSelectedDate] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "upcoming" | "finished"
  const [selectedHall, setSelectedHall] = useState("Tümü");
  const [searchQuery, setSearchQuery] = useState("");
  const [volleyboxFilter, setVolleyboxFilter] = useState<VolleyboxFilter>("all");

  // Favoriler filtresi (yalnızca favori maçları göster)
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  /** İl değiştiğinde tüm filtreleri sıfırlar (favori filtresi hariç). */
  const resetFiltersForCityChange = useCallback(() => {
    setSelectedCategory("Tümü");
    setSelectedDate("all");
    setSelectedResultDate("all");
    setSelectedHall("Tümü");
    setStatusFilter("all");
    setVolleyboxFilter("all");
    setSearchQuery("");
    setResultsSubTab("all");
  }, []);

  const handleSelectResultsSubTab = (subTab: "all" | "yesterday") => {
    setResultsSubTab(subTab);
    if (subTab === "yesterday") {
      setSelectedResultDate(yesterdayStr);
    } else {
      setSelectedResultDate("all");
    }
  };

  const resetFilters = () => {
    setSelectedCategory("Tümü");
    setSelectedDate("all");
    setSelectedResultDate("all");
    setStatusFilter("all");
    setSelectedHall("Tümü");
    setVolleyboxFilter("all");
    setSearchQuery("");
    setShowOnlyFavorites(false);
    setResultsSubTab("all");
  };

  const isFiltered =
    selectedCategory !== "Tümü" ||
    (activeMainTab === "results" ? selectedResultDate !== "all" : selectedDate !== "all") ||
    statusFilter !== "all" ||
    selectedHall !== "Tümü" ||
    searchQuery.trim().length > 0 ||
    volleyboxFilter !== "all" ||
    showOnlyFavorites ||
    resultsSubTab !== "all";

  return {
    resultsSubTab,
    setResultsSubTab,
    selectedResultDate,
    setSelectedResultDate,
    selectedCategory,
    setSelectedCategory,
    selectedDate,
    setSelectedDate,
    statusFilter,
    setStatusFilter,
    selectedHall,
    setSelectedHall,
    searchQuery,
    setSearchQuery,
    volleyboxFilter,
    setVolleyboxFilter,
    showOnlyFavorites,
    setShowOnlyFavorites,
    resetFiltersForCityChange,
    handleSelectResultsSubTab,
    resetFilters,
    isFiltered,
  };
}

export type DashboardFilters = ReturnType<typeof useDashboardFilters>;
