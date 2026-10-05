"use client";

import { useCallback, useSyncExternalStore } from "react";
import { slugify } from "./slugify";

const STORAGE_KEY = "volley_favorite_teams";
const EVENT_NAME = "volley-favorites-changed";
const EMPTY_ARRAY: string[] = [];

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
  if (typeof window === "undefined") return EMPTY_ARRAY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_ARRAY;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : EMPTY_ARRAY;
  } catch {
    return EMPTY_ARRAY;
  }
}

// Module-level singleton store: memory cache & centralized subscriber set
let cachedFavorites: string[] = [];
let isStoreInitialized = false;
const listeners = new Set<() => void>();
let globalListenersRegistered = false;

function ensureGlobalListeners() {
  if (typeof window === "undefined" || globalListenersRegistered) return;
  globalListenersRegistered = true;

  const handleUpdate = () => {
    cachedFavorites = getStoredFavorites();
    listeners.forEach((listener) => listener());
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      handleUpdate();
    }
  };

  window.addEventListener(EVENT_NAME, handleUpdate);
  window.addEventListener("storage", handleStorage);
}

function getSnapshot(): string[] {
  if (typeof window === "undefined") return EMPTY_ARRAY;
  if (!isStoreInitialized) {
    cachedFavorites = getStoredFavorites();
    isStoreInitialized = true;
  }
  return cachedFavorites;
}

const getServerSnapshot = (): string[] => EMPTY_ARRAY;

function subscribe(callback: () => void) {
  listeners.add(callback);
  ensureGlobalListeners();
  return () => {
    listeners.delete(callback);
  };
}

function updateStoredFavorites(newList: string[]) {
  cachedFavorites = newList;
  isStoreInitialized = true;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      window.dispatchEvent(new Event(EVENT_NAME));
    } catch (err) {
      console.warn("Could not save favorite teams to localStorage:", err);
    }
  }
  listeners.forEach((listener) => listener());
}

/**
 * Custom React hook to manage favorite teams in localStorage using useSyncExternalStore.
 * Single centralized event listener across all components on the page, preventing
 * memory leaks and excessive localStorage queries.
 */
export function useFavorites() {
  const favoriteTeams = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

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
      updateStoredFavorites(updated);
    },
    [favoriteTeams]
  );

  const addFavorite = useCallback(
    (teamName: string) => {
      if (!teamName || !teamName.trim()) return;
      if (!isFavorite(teamName)) {
        updateStoredFavorites([...favoriteTeams, teamName.trim()]);
      }
    },
    [favoriteTeams, isFavorite]
  );

  const removeFavorite = useCallback(
    (teamName: string) => {
      if (!teamName) return;
      const key = normalizeFavoriteKey(teamName);
      updateStoredFavorites(favoriteTeams.filter((fav) => normalizeFavoriteKey(fav) !== key));
    },
    [favoriteTeams]
  );

  return {
    favoriteTeams,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    isLoaded: true,
    count: favoriteTeams.length,
  };
}
