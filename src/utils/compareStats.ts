import type { HeadToHeadComparison, TeamDetails, TeamStandingContext } from "./teamData";
import { computeRecentForm, type RecentForm, type TeamStatsSummary } from "./performanceStats";
import { getTeamStatsBundle, type TeamPlayoffInfo } from "./teamStatsBundle";

export interface CompareStanding {
  groupName: string;
  category: string;
  rank: number;
  played: number;
  won: number;
  lost: number;
  points: number;
  setsWon: number | null;
  setsLost: number | null;
}

export interface CompareTeamStats {
  stats: TeamStatsSummary;
  form: RecentForm;
  standing: CompareStanding | null;
  playoff: TeamPlayoffInfo | null;
}

export interface CompareStatsData {
  team1: CompareTeamStats;
  team2: CompareTeamStats;
  sameGroup: boolean;
}

function toStanding(ctx: TeamStandingContext | undefined): CompareStanding | null {
  if (!ctx) return null;
  const r = ctx.standingRow;
  return {
    groupName: ctx.groupName,
    category: ctx.category,
    rank: r.rank,
    played: r.played,
    won: r.won,
    lost: r.lost,
    points: r.points,
    setsWon: typeof r.sets_won === "number" ? r.sets_won : null,
    setsLost: typeof r.sets_lost === "number" ? r.sets_lost : null,
  };
}

function pickContext(team: TeamDetails, shared?: { groupName: string; category: string }): TeamStandingContext | undefined {
  if (shared) {
    const hit = team.standingsContexts.find((c) => c.groupName === shared.groupName && c.category === shared.category);
    if (hit) return hit;
  }
  return team.standingsContexts[0];
}

function forTeam(team: TeamDetails, ctx: TeamStandingContext | undefined): CompareTeamStats {
  const bundle = getTeamStatsBundle(team);
  const playoff = ctx ? bundle.playoff.find((p) => p.groupName === ctx.groupName) ?? null : null;
  return {
    stats: bundle.stats,
    form: computeRecentForm(team.matches, 5),
    standing: toStanding(ctx),
    playoff,
  };
}

/** Karşılaştırma sayfası için iki takımın istatistik özeti (sunucuda hesaplanır, hafif JSON). */
export function buildCompareStats(comparison: HeadToHeadComparison): CompareStatsData {
  const shared = comparison.sharedGroup;
  const ctx1 = pickContext(comparison.team1, shared);
  const ctx2 = pickContext(comparison.team2, shared);
  return {
    team1: forTeam(comparison.team1, ctx1),
    team2: forTeam(comparison.team2, ctx2),
    sameGroup: comparison.isSameGroup,
  };
}

/**
 * İstemciye gönderilecek karşılaştırma verisinden kullanılmayan ağır alanları ayıklar
 * (tüm maç listesi, kadro, kardeş takımlar, grup tabloları). Tip aynı kalır; alanlar boş döner.
 */
export function slimComparison(c: HeadToHeadComparison): HeadToHeadComparison {
  const slim = (t: TeamDetails): TeamDetails => ({
    ...t,
    matches: [],
    roster: undefined,
    volleyboxRoster: undefined,
    clubTeams: undefined,
    otherCities: undefined,
    standingsContexts: t.standingsContexts.map((ctx) => ({ ...ctx, fullGroupTable: [] })),
  });
  return { ...c, team1: slim(c.team1), team2: slim(c.team2) };
}
