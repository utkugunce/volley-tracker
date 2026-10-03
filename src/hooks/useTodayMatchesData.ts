import { useMemo, useState } from "react";
import type { CityInfo, Match } from "@/types/fixture";
import { formatDateTurkish, compareMatchTimes, isTodayOrUnscoredYesterday, getYesterdayString } from "@/utils/calendar";
import { useFavorites } from "@/utils/useFavorites";
import { isMatchScored } from "@/utils/matchScoring";
import {
  buildActiveCityCards,
  computeDashboardKpis,
  findNextMatchDay,
  findRecentFinishedDay,
  groupMatchesIntoSections,
} from "@/utils/todayMatches";

export type TodayQuickStatus = "all" | "upcoming" | "finished" | "favorites";

interface UseTodayMatchesDataArgs {
  matches: Match[];
  city: string;
  citiesList: CityInfo[];
  todayStr: string;
  yesterdayStr?: string;
  favorites: string[];
}

/**
 * "Günün Maçları" görünümünün türetilmiş verileri: bugünün / dünden kalan maçlar, favori sayacı,
 * hızlı durum filtresi, KPI'lar, sıradaki / son maç günü yedek görünümleri ve tablo bölümleri.
 */
export function useTodayMatchesData({
  matches,
  city,
  citiesList,
  todayStr,
  yesterdayStr,
  favorites,
}: UseTodayMatchesDataArgs) {
  const [quickStatus, setQuickStatus] = useState<TodayQuickStatus>("all");
  const { isFavorite: isTeamFavorite } = useFavorites();

  const effectiveYesterdayStr = yesterdayStr || getYesterdayString(todayStr);

  // Bugünün tüm maçları ve dünden skoru henüz girilmemiş (gecikmiş) maçlar
  const todayMatches = useMemo(() => {
    return matches.filter((m) =>
      isTodayOrUnscoredYesterday(m.date, isMatchScored(m), todayStr, effectiveYesterdayStr)
    );
  }, [matches, todayStr, effectiveYesterdayStr]);

  const isMatchFavorite = useMemo(() => {
    return (m: Match) => {
      return (
        favorites.includes(m.id) ||
        isTeamFavorite(m.home_team) ||
        isTeamFavorite(m.away_team)
      );
    };
  }, [favorites, isTeamFavorite]);

  const todayFavoritesCount = useMemo(() => {
    return todayMatches.filter(isMatchFavorite).length;
  }, [todayMatches, isMatchFavorite]);

  // Durum filtrelemesi (Her zaman erken saatteki maç ilk gösterilecek şekilde saat sıralamalı)
  const filteredTodayMatches = useMemo(() => {
    let base = todayMatches;
    if (quickStatus === "upcoming") {
      base = todayMatches.filter((m) => m.status === "upcoming" || !isMatchScored(m));
    } else if (quickStatus === "finished") {
      base = todayMatches.filter((m) => isMatchScored(m));
    } else if (quickStatus === "favorites") {
      base = todayMatches.filter(isMatchFavorite);
    }
    return [...base].sort((m1, m2) => {
      if (m1.date !== m2.date) {
        return m1.date.localeCompare(m2.date);
      }
      return compareMatchTimes(m1.time, m2.time);
    });
  }, [todayMatches, quickStatus, isMatchFavorite]);

  // Dashboard KPI Sayıları
  const dashboardKpis = useMemo(
    () => computeDashboardKpis(matches, todayMatches, todayStr),
    [matches, todayMatches, todayStr]
  );

  // Eğer bugün maç yoksa: Sıradaki en yakın maç tarihini ve maçlarını bul
  const nextMatchDay = useMemo(
    () => findNextMatchDay(matches, todayMatches.length, todayStr),
    [matches, todayMatches.length, todayStr]
  );

  // Eğer bugün maç yoksa: En son tamamlanmış maç gününü bul (Son Skorlar)
  const recentFinishedDay = useMemo(
    () => findRecentFinishedDay(matches, todayMatches.length, todayStr),
    [matches, todayMatches.length, todayStr]
  );

  // Bugünün maçlarını grupla (Tablo modu için)
  const groupedSections = useMemo(
    () => groupMatchesIntoSections(filteredTodayMatches, city),
    [filteredTodayMatches, city]
  );

  // Sıradaki maç günü grupları (Tablo modu için)
  const nextGroupedSections = useMemo(() => {
    if (!nextMatchDay) return [];
    return groupMatchesIntoSections(nextMatchDay.matches, city);
  }, [nextMatchDay, city]);

  // Bugünün Türkçe tarihi
  const formattedToday = useMemo(() => {
    return formatDateTurkish(todayStr);
  }, [todayStr]);

  // Aktif iller listesi (Hızlı Dashboard Kartları için)
  const activeCityCards = useMemo(
    () => buildActiveCityCards(citiesList, dashboardKpis.totalMatchesCount),
    [dashboardKpis.totalMatchesCount, citiesList]
  );

  return {
    quickStatus,
    setQuickStatus,
    effectiveYesterdayStr,
    todayMatches,
    isMatchFavorite,
    todayFavoritesCount,
    filteredTodayMatches,
    dashboardKpis,
    nextMatchDay,
    recentFinishedDay,
    groupedSections,
    nextGroupedSections,
    formattedToday,
    activeCityCards,
  };
}
