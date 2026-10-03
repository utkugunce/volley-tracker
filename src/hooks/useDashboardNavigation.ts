import { useEffect, useCallback, type Dispatch, type SetStateAction } from "react";
import { getAppRoute, parseAppRoute, type AppMainTab } from "@/utils/dashboardRoutes";

interface UseDashboardNavigationOptions {
  activeMainTab: AppMainTab;
  setActiveMainTab: Dispatch<SetStateAction<AppMainTab>>;
  currentCitySlug: string;
  setCurrentCitySlug: Dispatch<SetStateAction<string>>;
  initialTab: AppMainTab;
  initialCity: string;
  isPartialData: boolean;
  ensureFullData: () => Promise<boolean>;
  loadCityData: (slug: string) => Promise<void>;
  setError: Dispatch<SetStateAction<string | null>>;
  resetFiltersForCityChange: () => void;
}

/**
 * Sekme / il seçimi ve tarayıcı URL senkronizasyonu (pushState + popstate).
 */
export function useDashboardNavigation({
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
  resetFiltersForCityChange,
}: UseDashboardNavigationOptions) {
  // Sekme değiştiğinde tarayıcı URL'ini senkronize et (Şehir seçiliyse şehri korur: /grup-durumu/istanbul, /puan-durumu/istanbul vb.)
  const handleSelectTab = (tab: AppMainTab) => {
    const syncTabUrl = () => {
      if (typeof window === "undefined") return;
      const targetPath = getAppRoute(tab, currentCitySlug);
      const currentPath = window.location.pathname;
      if (
        currentPath !== targetPath &&
        !(tab === "home" && currentCitySlug === "all" && currentPath === "/")
      ) {
        window.history.pushState({ tab, city: currentCitySlug }, "", targetPath);
      }
    };

    if (isPartialData && tab !== "home") {
      void ensureFullData().then((loaded) => {
        if (loaded) {
          setActiveMainTab(tab);
          syncTabUrl();
        }
      });
    } else {
      setActiveMainTab(tab);
      syncTabUrl();
    }
  };

  const handleSelectCity = useCallback(async (slug: string, skipPushState = false) => {
    setCurrentCitySlug(slug);
    setError(null);
    resetFiltersForCityChange();

    // Tarayıcı URL'ini güncelle: Örneğin /puan-durumu -> /puan-durumu/istanbul
    if (!skipPushState && typeof window !== "undefined") {
      const targetPath = getAppRoute(activeMainTab, slug);
      const currentPath = window.location.pathname;
      if (currentPath !== targetPath) {
        window.history.pushState({ tab: activeMainTab, city: slug }, "", targetPath);
      }
    }

    await loadCityData(slug);
  }, [activeMainTab, setCurrentCitySlug, setError, resetFiltersForCityChange, loadCityData]);

  // Tarayıcı Geri/İleri butonları (popstate) dinleyicisi
  useEffect(() => {
    const handlePopState = () => {
      const { tab, city } = parseAppRoute(window.location.pathname);
      setActiveMainTab(tab);
      if (city !== currentCitySlug) {
        handleSelectCity(city, true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentCitySlug, handleSelectCity, setActiveMainTab]);

  useEffect(() => {
    if (initialTab) {
      setActiveMainTab(initialTab);
    }
  }, [initialTab, setActiveMainTab]);

  useEffect(() => {
    if (initialCity) {
      setCurrentCitySlug((prev) => (prev !== initialCity ? initialCity : prev));
    }
  }, [initialCity, setCurrentCitySlug]);

  return { handleSelectTab, handleSelectCity };
}
