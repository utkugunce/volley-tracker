import type { TeamDetails } from "./teamData";
import { computeTeamStats, type TeamStatsSummary } from "./performanceStats";
import { findTeamAnalysis, K2_STANDINGS_CITY } from "./leagueAnalytics";
import { getLeagueAnalytics } from "./leagueAnalyticsData";
import type { PlayoffStatus } from "./playoffRace";

/** Bir takımın bir puan durumu grubundaki play-off durumu (sayfaya gidecek hafif özet). */
export interface TeamPlayoffInfo {
  category: string;
  groupName: string;
  rank: number;
  points: number;
  played: number;
  groupSize: number;
  cutoff: number;
  /** Fikstürde açıklanmış kalan maç sayısı. */
  remaining: number;
  maxPoints: number;
  status: PlayoffStatus;
  /** Grubun fikstürü tamam mı (kesin durum yalnızca o zaman hesaplanır). */
  scheduleComplete: boolean;
}

export interface TeamStatsBundle {
  stats: TeamStatsSummary;
  playoff: TeamPlayoffInfo[];
}

/** Takım sayfası için istatistik ve play-off özeti. Yalnızca sunucuda çağrılır. */
export function getTeamStatsBundle(team: TeamDetails): TeamStatsBundle {
  const stats = computeTeamStats(team.matches);
  const analytics = getLeagueAnalytics();
  const playoff: TeamPlayoffInfo[] = [];

  for (const ctx of team.standingsContexts.slice(0, 3)) {
    const found = findTeamAnalysis(analytics, {
      teamKeys: [team.slug, ctx.standingRow.team, team.teamName],
      city: ctx.groupName.startsWith(`${K2_STANDINGS_CITY} - `) ? K2_STANDINGS_CITY : ctx.city,
      groupName: ctx.groupName,
    });
    if (!found || !found.race) continue;
    if (found.group.teams.length <= found.group.cutoff) continue; // Herkes zaten ilk N içinde; anlamsız.
    const remaining = found.race.remaining;
    playoff.push({
      category: found.group.category,
      groupName: ctx.groupName,
      rank: ctx.standingRow.rank,
      points: found.race.points,
      played: found.race.played,
      groupSize: found.group.teams.length,
      cutoff: found.group.cutoff,
      remaining,
      maxPoints: found.race.maxPoints,
      status: found.race.status,
      scheduleComplete: found.group.schedule.complete,
    });
  }

  return { stats, playoff };
}
