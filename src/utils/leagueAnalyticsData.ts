import type { StandingItem } from "@/types/fixture";
import { loadAllCityData } from "./teamData";
import { buildLeagueAnalytics, type AnalyticsStandingsGroup, type LeagueAnalytics } from "./leagueAnalytics";

/**
 * Sunucu tarafı erişimci: şehir JSON'larından (teamData önbelleğiyle aynı ömürde) lig analizini üretir.
 * Analiz, veri önbelleği yenilenene kadar bellekte tutulur; her takım sayfası ayrı hesaplama yapmaz.
 */
const cache = new WeakMap<object, LeagueAnalytics>();

export function getLeagueAnalytics(): LeagueAnalytics {
  const data = loadAllCityData();
  const hit = cache.get(data);
  if (hit) return hit;

  const standings: AnalyticsStandingsGroup[] = [];
  for (const [city, entry] of Object.entries(data.standingsByCity)) {
    for (const [groupName, groupData] of Object.entries(entry.standings)) {
      const rows: StandingItem[] = Array.isArray(groupData) ? groupData : groupData?.table || [];
      standings.push({ city, groupName, rows });
    }
  }

  const analytics = buildLeagueAnalytics({ matches: data.matches, standings });
  cache.set(data, analytics);
  return analytics;
}
