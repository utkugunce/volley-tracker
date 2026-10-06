import { useState, useEffect } from "react";
import type { Match } from "@/types/fixture";
import { checkAndTriggerMatchReminders } from "@/utils/notifications";
import { useVisibleInterval } from "./useVisibleInterval";

/** Favori maçlar (LocalStorage) ve 30 dk kala tarayıcı hatırlatmaları. */
export function useFavorites(matches: Match[] | undefined) {
  // Favoriler (Flashscore Yıldız İmzası - LocalStorage ile kaydedilir)
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tvf_favorites");
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Favori maçlar için 30 dakika kala tarayıcı hatırlatma kontrolü (GÖREV 2)
  const remindersEnabled = favorites.length > 0 && !!matches && matches.length > 0;

  useEffect(() => {
    // Sayfa açıldığında veya favori değiştiğinde hemen kontrol et
    if (remindersEnabled && matches) checkAndTriggerMatchReminders(matches, favorites);
  }, [favorites, matches, remindersEnabled]);

  // Sekme görünürken her 60 saniyede bir düzenli kontrol et (arka planda durur, geri gelince hemen kontrol eder)
  useVisibleInterval(
    () => {
      if (matches && matches.length > 0) checkAndTriggerMatchReminders(matches, favorites);
    },
    60000,
    remindersEnabled
  );

  const toggleFavorite = (matchId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(matchId)
        ? prev.filter((id) => id !== matchId)
        : [...prev, matchId];
      try {
        localStorage.setItem("tvf_favorites", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return { favorites, toggleFavorite };
}
