import type { Match, StandingItem } from "@/types/fixture";
import { slugify } from "./slugify";
import { normalizeCitySlug } from "./volleybox";
import {
  computeRecentForm,
  computeTeamStats,
  type RecentForm,
  type StatsMatchInput,
  type TeamStatsSummary,
} from "./performanceStats";
import {
  analyzeSchedule,
  evaluatePlayoffRace,
  type PlayoffStatus,
  type RaceTeamResult,
  type ScheduleAnalysis,
} from "./playoffRace";

/**
 * Lig geneli analiz (saf fonksiyonlar). Girdi: tüm maçlar + puan durumu tabloları.
 * Takımlar puan durumu gruplarına göre ele alınır; maç ile grup eşleşmesi `<kategori> - <grup>` anahtarıyla yapılır.
 */

export const K2_STANDINGS_CITY = "TVF Kadınlar 2. Ligi";
export const K2_CATEGORY = "Kadınlar 2. Ligi";

/** Kadınlar 2. Ligi'nde ilk 2 (uygulamadaki puan durumu göstergesiyle aynı), diğer liglerde ilk 4 final etabına çıkar. */
export const DEFAULT_PLAYOFF_CUTOFF = 4;
export const K2_PLAYOFF_CUTOFF = 2;

export interface AnalyticsStandingsGroup {
  /** Puan durumu şehri (Kadınlar 2. Ligi için "TVF Kadınlar 2. Ligi"). */
  city: string;
  /** Puan durumu grup adı (maçlardaki `${category} - ${group}` ile eşleşir). */
  groupName: string;
  rows: StandingItem[];
}

export interface AnalyticsInput {
  matches: Match[];
  standings: AnalyticsStandingsGroup[];
}

/** TVF bültenlerinde maça çıkmayan takımın adının başına eklenen "(H) - " ibaresini temizler. */
export function normalizeTeamName(name: string): string {
  return (name || "").replace(/^\s*\(H\)\s*-\s*/i, "").trim();
}

export function teamKey(name: string): string {
  return slugify(normalizeTeamName(name));
}

export interface LeagueTeamRef {
  team: string;
  slug: string;
  city: string;
  category: string;
  groupName: string;
  /** Takım sayfası adresi. */
  href: string;
}

export interface LeagueTeamEntry extends LeagueTeamRef {
  groupId: string;
  rank: number;
  standingPoints: number;
  standingPlayed: number;
  stats: TeamStatsSummary;
  form: RecentForm;
}

export interface LeagueGroupAnalysis {
  id: string;
  city: string;
  /** Puan durumundaki ham grup adı. */
  groupName: string;
  category: string;
  cutoff: number;
  schedule: Pick<ScheduleAnalysis, "complete" | "meetingsPerPair" | "reason">;
  teams: LeagueTeamEntry[];
  race: RaceTeamResult[];
}

export interface MetricEntry extends LeagueTeamRef {
  value: number | null;
  played: number;
  extra?: Record<string, number | string | boolean | null>;
  form?: Array<"W" | "L">;
}

export interface PlayoffGroupSummary {
  id: string;
  city: string;
  category: string;
  groupName: string;
  cutoff: number;
  remainingMatches: number;
  qualified: LeagueTeamRef[];
  eliminated: LeagueTeamRef[];
  openCount: number;
}

export interface LeagueLists {
  longestWinStreaks: MetricEntry[];
  bestSetRatio: MetricEntry[];
  bestForm: MetricEntry[];
  topScoring: MetricEntry[];
  topConceding: MetricEntry[];
  playoff: {
    groupsTotal: number;
    groupsCalculated: number;
    groups: PlayoffGroupSummary[];
  };
  totals: { teams: number; groups: number; finishedMatches: number };
}

export interface LeagueAnalytics {
  groups: LeagueGroupAnalysis[];
  categories: string[];
  /** Anahtar: "all" veya kategori adı. */
  lists: Record<string, LeagueLists>;
}

export const MIN_MATCHES_SET_RATIO = 2;
export const MIN_MATCHES_FORM = 3;
export const MIN_MATCHES_POINTS = 2;
export const MIN_WIN_STREAK = 2;

function groupIdFor(city: string, groupName: string): string {
  return city === K2_STANDINGS_CITY ? `k2|${groupName}` : `${normalizeCitySlug(city)}|${groupName}`;
}

function matchGroupId(m: Match): string {
  if (m.category === K2_CATEGORY) return `k2|${m.group}`;
  return `${normalizeCitySlug(m.city || "İstanbul")}|${m.category} - ${m.group}`;
}

function categoryOf(group: AnalyticsStandingsGroup, sample?: Match): string {
  if (group.city === K2_STANDINGS_CITY) return K2_CATEGORY;
  if (sample?.category) return sample.category;
  return group.groupName.split(" - ")[0];
}

function teamHref(slug: string, city: string): string {
  if (city === K2_STANDINGS_CITY) return `/takim/${slug}`;
  const citySlug = normalizeCitySlug(city);
  return citySlug && citySlug !== "istanbul" ? `/takim/${slug}/${citySlug}` : `/takim/${slug}`;
}

function toStatsInput(m: Match, key: string): StatsMatchInput | null {
  const isHome = teamKey(m.home_team) === key;
  const isAway = teamKey(m.away_team) === key;
  if (!isHome && !isAway) return null;
  return {
    id: m.id,
    date: m.date,
    time: m.time,
    status: m.status,
    isHome,
    opponent: isHome ? m.away_team : m.home_team,
    teamScore: isHome ? m.home_score : m.away_score,
    opponentScore: isHome ? m.away_score : m.home_score,
    set_scores: m.set_scores,
    score: m.score,
    home_team: m.home_team,
    away_team: m.away_team,
    home_score: m.home_score,
    away_score: m.away_score,
  };
}

const byName = (a: { team: string }, b: { team: string }) => a.team.localeCompare(b.team, "tr-TR");

export function ref(t: LeagueTeamEntry): LeagueTeamRef {
  return { team: t.team, slug: t.slug, city: t.city, category: t.category, groupName: t.groupName, href: t.href };
}

function metric(
  t: LeagueTeamEntry,
  value: number | null,
  extra?: MetricEntry["extra"],
  form?: MetricEntry["form"]
): MetricEntry {
  return { ...ref(t), value, played: t.stats.played, extra, form };
}

function isActiveWinStreak(t: LeagueTeamEntry): boolean {
  return t.stats.streak?.type === "W" && t.stats.streak.length === t.stats.longestWinStreak;
}

function buildLists(teams: LeagueTeamEntry[], groups: LeagueGroupAnalysis[], topN: number): LeagueLists {
  const longestWinStreaks = teams
    .filter((t) => t.stats.longestWinStreak >= MIN_WIN_STREAK)
    .sort(
      (a, b) =>
        b.stats.longestWinStreak - a.stats.longestWinStreak ||
        Number(isActiveWinStreak(b)) - Number(isActiveWinStreak(a)) ||
        b.stats.played - a.stats.played ||
        byName(a, b)
    )
    .slice(0, topN)
    .map((t) => metric(t, t.stats.longestWinStreak, { active: isActiveWinStreak(t) }));

  const bestSetRatio = teams
    .filter((t) => t.stats.played >= MIN_MATCHES_SET_RATIO && t.stats.setsFor > 0)
    .sort((a, b) => {
      const ra = a.stats.setRatio ?? Infinity;
      const rb = b.stats.setRatio ?? Infinity;
      if (ra !== rb) return rb > ra ? 1 : -1;
      return b.stats.setsFor - a.stats.setsFor || b.stats.played - a.stats.played || byName(a, b);
    })
    .slice(0, topN)
    .map((t) => metric(t, t.stats.setRatio, { setsFor: t.stats.setsFor, setsAgainst: t.stats.setsAgainst }));

  const bestForm = teams
    .filter((t) => t.form.matches >= MIN_MATCHES_FORM)
    .sort(
      (a, b) =>
        b.form.points / b.form.maxPoints - a.form.points / a.form.maxPoints ||
        b.form.wins / b.form.matches - a.form.wins / a.form.matches ||
        b.form.matches - a.form.matches ||
        byName(a, b)
    )
    .slice(0, topN)
    .map((t) =>
      metric(t, t.form.points, { maxPoints: t.form.maxPoints, wins: t.form.wins, matches: t.form.matches }, t.form.results)
    );

  const withPoints = teams.filter((t) => t.stats.points && t.stats.points.matches >= MIN_MATCHES_POINTS);
  const pointExtra = (t: LeagueTeamEntry) => ({
    perMatchFor: t.stats.points?.avgForPerMatch ?? null,
    perMatchAgainst: t.stats.points?.avgAgainstPerMatch ?? null,
    pointsFor: t.stats.points?.pointsFor ?? null,
    pointsAgainst: t.stats.points?.pointsAgainst ?? null,
    sets: t.stats.points?.sets ?? null,
  });
  const topScoring = [...withPoints]
    .sort(
      (a, b) =>
        (b.stats.points?.avgForPerSet ?? 0) - (a.stats.points?.avgForPerSet ?? 0) ||
        (b.stats.points?.sets ?? 0) - (a.stats.points?.sets ?? 0) ||
        byName(a, b)
    )
    .slice(0, topN)
    .map((t) => metric(t, t.stats.points?.avgForPerSet ?? null, pointExtra(t)));
  const topConceding = [...withPoints]
    .sort(
      (a, b) =>
        (b.stats.points?.avgAgainstPerSet ?? 0) - (a.stats.points?.avgAgainstPerSet ?? 0) ||
        (b.stats.points?.sets ?? 0) - (a.stats.points?.sets ?? 0) ||
        byName(a, b)
    )
    .slice(0, topN)
    .map((t) => metric(t, t.stats.points?.avgAgainstPerSet ?? null, pointExtra(t)));

  const playoffGroups: PlayoffGroupSummary[] = [];
  let calculated = 0;
  for (const g of groups) {
    if (!g.schedule.complete) continue;
    calculated++;
    const status = new Map<string, PlayoffStatus>(g.race.map((r) => [r.team, r.status]));
    const qualified = g.teams.filter((t) => status.get(t.slug) === "qualified");
    const eliminated = g.teams.filter((t) => status.get(t.slug) === "eliminated");
    if (qualified.length === 0 && eliminated.length === 0) continue;
    playoffGroups.push({
      id: g.id,
      city: g.city === K2_STANDINGS_CITY ? "Türkiye" : g.city,
      category: g.category,
      groupName: g.groupName,
      cutoff: g.cutoff,
      remainingMatches: g.race.reduce((s, r) => s + r.remaining, 0) / 2,
      qualified: qualified.map(ref),
      eliminated: eliminated.map(ref),
      openCount: g.teams.length - qualified.length - eliminated.length,
    });
  }
  playoffGroups.sort(
    (a, b) =>
      a.remainingMatches - b.remainingMatches ||
      a.city.localeCompare(b.city, "tr-TR") ||
      a.groupName.localeCompare(b.groupName, "tr-TR")
  );

  return {
    longestWinStreaks,
    bestSetRatio,
    bestForm,
    topScoring,
    topConceding,
    playoff: { groupsTotal: groups.length, groupsCalculated: calculated, groups: playoffGroups },
    totals: {
      teams: teams.length,
      groups: groups.length,
      finishedMatches: Math.round(teams.reduce((s, t) => s + t.stats.played, 0) / 2),
    },
  };
}

export function buildLeagueAnalytics(input: AnalyticsInput, options: { topN?: number } = {}): LeagueAnalytics {
  const topN = options.topN ?? 10;

  const matchesByGroup = new Map<string, Match[]>();
  for (const m of input.matches) {
    const id = matchGroupId(m);
    const list = matchesByGroup.get(id);
    if (list) list.push(m);
    else matchesByGroup.set(id, [m]);
  }

  const groups: LeagueGroupAnalysis[] = [];
  const seenIds = new Set<string>();

  for (const g of input.standings) {
    const id = groupIdFor(g.city, g.groupName);
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    if (!g.rows || g.rows.length === 0) continue;

    const groupMatches = matchesByGroup.get(id) ?? [];
    const category = categoryOf(g, groupMatches[0]);
    const cutoff = g.city === K2_STANDINGS_CITY ? K2_PLAYOFF_CUTOFF : DEFAULT_PLAYOFF_CUTOFF;

    // Aynı takım iki kez yazılmışsa ilk satır esas alınır.
    const rows: Array<{ key: string; row: StandingItem }> = [];
    const keys = new Set<string>();
    for (const row of g.rows) {
      const key = teamKey(row.team);
      if (!key || keys.has(key)) continue;
      keys.add(key);
      rows.push({ key, row });
    }

    const memberMatches = groupMatches.filter((m) => keys.has(teamKey(m.home_team)) && keys.has(teamKey(m.away_team)));

    const teams: LeagueTeamEntry[] = rows.map(({ key, row }) => {
      const inputs = memberMatches.map((m) => toStatsInput(m, key)).filter((x): x is StatsMatchInput => x !== null);
      return {
        team: normalizeTeamName(row.team),
        slug: key,
        city: g.city,
        category,
        groupName: g.groupName,
        href: teamHref(key, g.city),
        groupId: id,
        rank: row.rank,
        standingPoints: row.points ?? 0,
        standingPlayed: row.played ?? 0,
        stats: computeTeamStats(inputs),
        form: computeRecentForm(inputs, 5),
      };
    });

    const schedule = analyzeSchedule(
      teams.map((t) => ({ team: t.slug, played: t.standingPlayed })),
      memberMatches.map((m) => ({ home: teamKey(m.home_team), away: teamKey(m.away_team), status: m.status }))
    );

    const race = evaluatePlayoffRace(
      teams.map((t) => ({ team: t.slug, played: t.standingPlayed, points: t.standingPoints })),
      schedule.remaining,
      cutoff,
      schedule.complete
    );

    groups.push({
      id,
      city: g.city,
      groupName: g.groupName,
      category,
      cutoff,
      schedule: { complete: schedule.complete, meetingsPerPair: schedule.meetingsPerPair, reason: schedule.reason },
      teams,
      race,
    });
  }

  const categories = Array.from(new Set(groups.map((g) => g.category))).sort((a, b) => a.localeCompare(b, "tr-TR"));
  const lists: Record<string, LeagueLists> = {
    all: buildLists(
      groups.flatMap((g) => g.teams),
      groups,
      topN
    ),
  };
  for (const c of categories) {
    const gs = groups.filter((g) => g.category === c);
    lists[c] = buildLists(
      gs.flatMap((g) => g.teams),
      gs,
      topN
    );
  }

  return { groups, categories, lists };
}

export interface TeamAnalysisContext {
  group: LeagueGroupAnalysis;
  entry: LeagueTeamEntry;
  race: RaceTeamResult | undefined;
}

/**
 * Takım sayfasındaki puan durumu bağlamından (şehir + grup adı) analizdeki grubu ve takımı bulur.
 * Kadınlar 2. Ligi bağlamlarında grup adı "TVF Kadınlar 2. Ligi - Grup N" biçiminde önek taşır.
 */
export function findTeamAnalysis(
  analytics: LeagueAnalytics,
  params: { teamKeys: string[]; city: string; groupName: string }
): TeamAnalysisContext | null {
  const k2Prefix = `${K2_STANDINGS_CITY} - `;
  const isK2 = params.groupName.startsWith(k2Prefix);
  const id = isK2
    ? groupIdFor(K2_STANDINGS_CITY, params.groupName.slice(k2Prefix.length))
    : groupIdFor(params.city, params.groupName);
  const group = analytics.groups.find((g) => g.id === id);
  if (!group) return null;
  const wanted = new Set(params.teamKeys.map((k) => teamKey(k)).filter(Boolean));
  const entry = group.teams.find((t) => wanted.has(t.slug));
  if (!entry) return null;
  return { group, entry, race: group.race.find((r) => r.team === entry.slug) };
}
