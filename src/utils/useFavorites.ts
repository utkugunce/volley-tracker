"use client";

import { useState, useEffect, useCallback } from "react";
import { slugify } from "./slugify";

const STORAGE_KEY = "volley_favorite_teams";
const EVENT_NAME = "volley-favorites-changed";

/**
 * Normalizes a team name for consistent favorite lookup (lowercase slugified).
 */
export function normalizeFavoriteKey(teamName: string): string {
  return slugify(teamName || "");
}

/**
 * Reads favorites safely from localStorage.
 */
export function getStoredFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Custom React hook to manage favorite teams in localStorage.
 * Automatically synchronizes across tabs and reactive components on the same page.
 */
export function useFavorites() {
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync state from localStorage on mount and whenever the event fires
  const syncFromStorage = useCallback(() => {
    const list = getStoredFavorites();
    setFavoriteTeams(list);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    syncFromStorage();

    const handleCustomChange = () => syncFromStorage();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) syncFromStorage();
    };

    window.addEventListener(EVENT_NAME, handleCustomChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(EVENT_NAME, handleCustomChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [syncFromStorage]);

  const saveFavorites = useCallback((newList: string[]) => {
    setFavoriteTeams(newList);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
        window.dispatchEvent(new Event(EVENT_NAME));
      } catch (err) {
        console.warn("Could not save favorite teams to localStorage:", err);
      }
    }
  }, []);

  const isFavorite = useCallback(
    (teamName: string): boolean => {
      if (!teamName) return false;
      const key = normalizeFavoriteKey(teamName);
      return favoriteTeams.some((fav) => normalizeFavoriteKey(fav) === key);
    },
    [favoriteTeams]
  );

  const toggleFavorite = useCallback(
    (teamName: string) => {
      if (!teamName || !teamName.trim()) return;
      const key = normalizeFavoriteKey(teamName);
      const exists = favoriteTeams.some((fav) => normalizeFavoriteKey(fav) === key);

      let updated: string[];
      if (exists) {
        updated = favoriteTeams.filter((fav) => normalizeFavoriteKey(fav) !== key);
      } else {
        updated = [...favoriteTeams, teamName.trim()];
      }
      saveFavorites(updated);
    },
    [favoriteTeams, saveFavorites]
  );

  const addFavorite = useCallback(
    (teamName: string) => {
      if (!teamName || !teamName.trim()) return;
      if (!isFavorite(teamName)) {
        saveFavorites([...favoriteTeams, teamName.trim()]);
      }
    },
    [favoriteTeams, isFavorite, saveFavorites]
  );

  const removeFavorite = useCallback(
    (teamName: string) => {
      if (!teamName) return;
      const key = normalizeFavoriteKey(teamName);
      saveFavorites(favoriteTeams.filter((fav) => normalizeFavoriteKey(fav) !== key));
    },
    [favoriteTeams, saveFavorites]
  );

  return {
    favoriteTeams,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    isLoaded,
    count: favoriteTeams.length,
  };
}
