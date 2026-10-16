import { useMemo } from "react";
import type { FixturesData } from "@/types/fixture";
import { isMatchScored } from "@/utils/matchScoring";
import { isMatchPlayedOrScored } from "@/utils/calendar";
import { computeVolleyboxStats } from "@/utils/dashboardFilters";
import type { CityListItem } from "@/hooks/useCitiesList";

interface UseDashboardStatsOptions {
  data: FixturesData;
  citiesList: CityListItem[];
  currentCitySlug: string;
  todayStr: string;
  yesterdayStr: string;
}

/** Header rozetleri, sekme sayaçları ve Volleybox istatistikleri için türetilmiş değerler. */
export function useDashboardStats({
  data,
  citiesList,
  currentCitySlug,
  todayStr,
  yesterdayStr,
}: UseDashboardStatsOptions) {
  // Tüm benzersiz takım isimleri (Spotlight Arama ve Kulübüm widget'ı için)
  const allTeamNames = useMemo(() => {
    const set = new Set<string>(Array.isArray(data?.all_teams) ? data.all_teams : []);
    (data?.matches || []).forEach((m) => {
      if (m.home_team) set.add(m.home_team);
      if (m.away_team) set.add(m.away_team);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
  }, [data?.all_teams, data?.matches]);

  // Bugün oynanacak veya dünden skoru henüz girilmemiş maç sayısı (Header rozeti için)
  const todayMatchesCount = useMemo(() => {
    return (data?.matches || []).filter(
      (m) => m.date === todayStr || (m.date === yesterdayStr && !isMatchScored(m))
    ).length;
  }, [data, todayStr, yesterdayStr]);

  // Türkiye genelindeki toplam maç sayısı
  const totalMatchesAcrossAll = useMemo(() => {
    return citiesList.reduce((acc, c) => acc + (c.matches_count || 0), 0);
  }, [citiesList]);

  // Sonuçlanan veya oynanan maçların benzersiz tarihleri (En yeni tarihten geriye doğru sıralı)
  const uniqueResultDates = useMemo(() => {
    if (!data?.matches) return [];
    const set = new Set(
      data.matches
        .filter((m) => isMatchPlayedOrScored(m, todayStr))
        .map((m) => m.date)
        .filter((d) => d && d !== "TBD")
    );
    return Array.from(set).sort().reverse();
  }, [data, todayStr]);

  // Durum bazlı toplamlar (Sadece tarihi açıklanan maçlar)
  const counts = useMemo(() => {
    const validMatches = (data?.matches || []).filter((m) => m.date && m.date !== "TBD");
    const all = validMatches.length;
    const upcoming = validMatches.filter((m) => m.status === "upcoming").length;
    const finished = validMatches.filter((m) => m.status === "finished").length;
    return { all, upcoming, finished };
  }, [data]);

  // Sonuçlanan toplam maç sayısı (Header rozeti ve Sonuçlar sekmesi için)
  const resultsCount = useMemo(() => {
    const loadedMatches = data?.matches || [];
    const loadedScored = loadedMatches.filter(isMatchScored).length;
    if (
      typeof data?.scored_matches === "number" &&
      data.total_matches > loadedMatches.length
    ) {
      return Math.max(data.scored_matches, loadedScored);
    }
    return loadedScored;
  }, [data]);

  // Canlı maç sayısı
  const liveMatchesCount = useMemo(() => {
    return (data?.matches || []).filter((m) => m.status === "live").length;
  }, [data]);

  // Dünün sonuçlar sekmesinde gösterilecek maç sayısı (skorlu + skorsuz)
  const yesterdayResultsCount = useMemo(() => {
    return (data?.matches || []).filter((m) => m.date === yesterdayStr).length;
  }, [data, yesterdayStr]);

  // Türkiye genelindeki toplam biten / sonuçlanan maç sayısı
  const totalResultsAcrossAll = useMemo(() => {
    if (currentCitySlug === "all") return resultsCount;
    return citiesList.reduce((acc, c) => acc + (c.finished_count || c.scored_matches || 0), resultsCount);
  }, [citiesList, currentCitySlug, resultsCount]);

  // Volleybox senkronizasyon ve skor istatistikleri
  const volleyboxStats = useMemo(
    () => computeVolleyboxStats(data?.matches || [], todayStr),
    [data, todayStr]
  );

  return {
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
  };
}
