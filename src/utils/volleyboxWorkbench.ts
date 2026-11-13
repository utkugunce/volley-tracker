import type { Match, StandingItem } from "@/types/fixture";
import { getMatchForfeitInfo } from "@/utils/forfeit";
import { isMatchScored } from "@/utils/matchScoring";
import { sameGroup } from "@/utils/standingsForm";
import { parseStandingKey } from "@/utils/standingsParsing";
import { trIncludes, trLower } from "@/utils/turkishLocale";
import { getVolleyboxLeagueMapping, getVolleyboxMapping } from "@/utils/volleybox";

export type VolleyboxQueueTab =
  | "missing_scores"
  | "discrepancies"
  | "unsynced"
  | "unmapped_teams"
  | "standings_anomalies";

export interface UnmappedTeamItem {
  key: string;
  teamName: string;
  city: string;
  category: string;
  matchCount: number;
  volleyboxSearchUrl: string;
  leagueVolleyboxUrl: string | null;
}

export interface StandingsAnomalyTeamDiff {
  team: string;
  tvfPlayed: number;
  calcPlayed: number;
  tvfWon: number;
  calcWon: number;
  tvfPoints: number;
  calcPoints: number;
}

export interface StandingsAnomalyItem {
  groupKey: string;
  city: string;
  category: string;
  forfeitMatchCount: number;
  discrepancyTeams: StandingsAnomalyTeamDiff[];
}

export interface VolleyboxWorkbenchCounts {
  missingScores: number;
  discrepancies: number;
  unsynced: number;
  unmappedTeams: number;
  standingsAnomalies: number;
  totalActionable: number;
  totalValidMatches: number;
  syncedMatches: number;
  syncPercent: number;
}

export interface VolleyboxWorkbenchData {
  missingScores: Match[];
  discrepancies: Match[];
  unsynced: Match[];
  unmappedTeams: UnmappedTeamItem[];
  standingsAnomalies: StandingsAnomalyItem[];
  counts: VolleyboxWorkbenchCounts;
}

const VALID_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Resolves official Volleybox team name (`matched_as`) with TVF name fallback. */
export function getResolvedVolleyboxTeamName(
  teamName: string,
  category?: string,
  city?: string
): string {
  if (!teamName || !teamName.trim()) return "";
  const mapping = getVolleyboxMapping(teamName, category, undefined, city);
  return mapping?.matched_as?.trim() || teamName.trim();
}

/** Formats TVF set scores into clean comma-separated Volleybox entry text. */
export function formatSetScoresForVolleybox(setScores?: string[] | null): string {
  if (!Array.isArray(setScores) || setScores.length === 0) return "";
  return setScores
    .map((s) =>
      String(s || "")
        .replace(/[()]/g, "")
        .replace(/\s+/g, "")
        .replace(/[:–]/g, "-")
        .trim()
    )
    .filter(Boolean)
    .join(", ");
}

/** Builds a concise single-line Volleybox operator entry summary for a match. */
export function formatMatchForVolleyboxCopy(match: Match, defaultCity?: string): string {
  const effectiveCity = match.city || (defaultCity && defaultCity !== "Tüm İller" ? defaultCity : undefined);
  const home = getResolvedVolleyboxTeamName(match.home_team, match.category, effectiveCity);
  const away = getResolvedVolleyboxTeamName(match.away_team, match.category, effectiveCity);
  const datePart = [match.date && match.date !== "TBD" ? match.date : "TBD", match.time && match.time !== "--:--" ? match.time : ""]
    .filter(Boolean)
    .join(" ");

  const scored = isMatchScored(match);
  const scorePart = scored
    ? `${match.home_score ?? ""}-${match.away_score ?? ""}`.replace(/^-|-$/g, "") || match.score || ""
    : "";
  const setsText = scored ? formatSetScoresForVolleybox(match.set_scores) : "";
  const resultPart = scorePart ? (setsText ? `${scorePart} (${setsText})` : scorePart) : "";
  const hallPart = match.hall && match.hall !== "TBD" ? match.hall : "";

  return [datePart, `${home} - ${away}`, resultPart, hallPart].filter(Boolean).join(" | ");
}

/** Returns true when a match belongs to the parsed standing group context. */
function matchBelongsToStandingContext(
  m: Match,
  ctx: ReturnType<typeof parseStandingKey>
): boolean {
  const ctxCity = ctx.city || "";
  if (ctxCity && m.city && trLower(m.city) !== trLower(ctxCity)) return false;
  const league = trLower(ctx.leagueFullName || "");
  if (league && m.category) {
    const cat = trLower(m.category);
    if (!trIncludes(cat, league) && !trIncludes(league, cat)) return false;
  }
  if (ctx.displayGroup && ctx.displayGroup !== "Genel" && m.group && !sameGroup(m.group, ctx.displayGroup)) {
    return false;
  }
  return true;
}

/** Computes volleyball standings points (3-0/3-1 -> 3/0, 3-2 -> 2/1). */
function computeVolleyballMatchPoints(homeScore: number, awayScore: number): { homePts: number; awayPts: number } {
  if (homeScore > awayScore) {
    return awayScore >= 2 ? { homePts: 2, awayPts: 1 } : { homePts: 3, awayPts: 0 };
  }
  return homeScore >= 2 ? { homePts: 1, awayPts: 2 } : { homePts: 0, awayPts: 3 };
}

/**
 * Detects groups with forfeit (`25-0`) matches or discrepancies between official TVF
 * standings and calculated results from finished matches.
 */
export function detectStandingsAnomalies(
  matches: Match[],
  standings?: Record<string, StandingItem[]>,
  defaultCity?: string
): StandingsAnomalyItem[] {
  const anomalies: StandingsAnomalyItem[] = [];
  const coveredGroupSignatures = new Set<string>();

  if (standings && Object.keys(standings).length > 0) {
    for (const [groupKey, items] of Object.entries(standings)) {
      if (!Array.isArray(items) || items.length === 0) continue;

      const ctx = parseStandingKey(groupKey, defaultCity);
      const groupMatches = matches.filter((m) => matchBelongsToStandingContext(m, ctx) && isMatchScored(m));
      if (groupMatches.length === 0) continue;

      const forfeitMatchCount = groupMatches.filter((m) => getMatchForfeitInfo(m).isForfeit).length;

      // Calculate played/won/points per normalized team name
      const calcByTeam = new Map<string, { played: number; won: number; points: number }>();
      const addResult = (team: string, wonMatch: boolean, pts: number) => {
        const key = trLower(team.trim());
        const prev = calcByTeam.get(key) || { played: 0, won: 0, points: 0 };
        calcByTeam.set(key, {
          played: prev.played + 1,
          won: prev.won + (wonMatch ? 1 : 0),
          points: prev.points + pts,
        });
      };

      for (const m of groupMatches) {
        const h = m.home_score ?? Number(m.score?.split("-")[0]?.trim());
        const a = m.away_score ?? Number(m.score?.split("-")[1]?.trim());
        if (Number.isNaN(h) || Number.isNaN(a) || h === a) continue;
        const { homePts, awayPts } = computeVolleyballMatchPoints(h, a);
        addResult(m.home_team, h > a, homePts);
        addResult(m.away_team, a > h, awayPts);
      }

      const discrepancyTeams: StandingsAnomalyTeamDiff[] = [];
      for (const row of items) {
        if (!row.team) continue;
        const key = trLower(row.team.trim());
        const calc = calcByTeam.get(key);
        if (!calc) continue;

        const tvfPlayed = row.played ?? 0;
        const tvfWon = row.won ?? 0;
        const tvfPoints = row.points ?? 0;

        if (tvfPlayed !== calc.played || tvfWon !== calc.won) {
          discrepancyTeams.push({
            team: row.team,
            tvfPlayed,
            calcPlayed: calc.played,
            tvfWon,
            calcWon: calc.won,
            tvfPoints,
            calcPoints: calc.points,
          });
        }
      }

      if (forfeitMatchCount > 0 || discrepancyTeams.length > 0) {
        const effCity = ctx.city || (defaultCity && defaultCity !== "Tüm İller" ? defaultCity : "Genel");
        coveredGroupSignatures.add(`${trLower(effCity)}::${trLower(ctx.leagueFullName)}`);
        anomalies.push({
          groupKey,
          city: effCity,
          category: ctx.leagueFullName,
          forfeitMatchCount,
          discrepancyTeams,
        });
      }
    }
  }

  // Also capture forfeit groups from matches if standings data wasn't present for that group
  const forfeitGroups = new Map<string, { city: string; category: string; count: number }>();
  for (const m of matches) {
    if (!isMatchScored(m) || !getMatchForfeitInfo(m).isForfeit) continue;
    const effCity = m.city || (defaultCity && defaultCity !== "Tüm İller" ? defaultCity : "Genel");
    const sig = `${trLower(effCity)}::${trLower(m.category || "")}`;
    if (coveredGroupSignatures.has(sig)) continue;
    const groupSuffix = m.group ? ` - ${m.group}` : "";
    const key = `${effCity} - ${m.category || "Voleybol Ligi"}${groupSuffix}`;
    const existing = forfeitGroups.get(key) || {
      city: effCity,
      category: `${m.category || "Voleybol Ligi"}${groupSuffix}`,
      count: 0,
    };
    existing.count += 1;
    forfeitGroups.set(key, existing);
  }

  for (const [groupKey, info] of forfeitGroups.entries()) {
    anomalies.push({
      groupKey,
      city: info.city,
      category: info.category,
      forfeitMatchCount: info.count,
      discrepancyTeams: [],
    });
  }

  return anomalies.sort(
    (a, b) => b.forfeitMatchCount + b.discrepancyTeams.length - (a.forfeitMatchCount + a.discrepancyTeams.length)
  );
}

/**
 * Classifies all TVF matches & standings into operator queues for Volleybox data entry.
 */
export function buildVolleyboxWorkbenchData(
  matches: Match[],
  standings?: Record<string, StandingItem[]>,
  defaultCity?: string
): VolleyboxWorkbenchData {
  const missingScores: Match[] = [];
  const discrepancies: Match[] = [];
  const unsynced: Match[] = [];
  const unmappedMap = new Map<string, UnmappedTeamItem>();

  let validMatchesCount = 0;
  let syncedMatchesCount = 0;

  const trackUnmappedTeam = (teamName: string, category: string, city: string) => {
    const clean = teamName?.trim();
    if (!clean || clean === "TBD" || trLower(clean) === "bay") return;
    const mapping = getVolleyboxMapping(clean, category, undefined, city);
    if (mapping?.volleybox_url) return;

    const dedupeKey = `${trLower(city)}::${trLower(category)}::${trLower(clean)}`;
    const existing = unmappedMap.get(dedupeKey);
    if (existing) {
      existing.matchCount += 1;
      return;
    }

    const leagueMapping = getVolleyboxLeagueMapping(category, city);
    unmappedMap.set(dedupeKey, {
      key: dedupeKey,
      teamName: clean,
      city,
      category,
      matchCount: 1,
      volleyboxSearchUrl: `https://women.volleybox.net/tr/search?q=${encodeURIComponent(clean)}`,
      leagueVolleyboxUrl: leagueMapping?.volleybox_url ?? null,
    });
  };

  for (const m of matches) {
    const effectiveCity = m.city || (defaultCity && defaultCity !== "Tüm İller" ? defaultCity : "Genel");
    const effectiveCategory = m.category || m.age_group || "Voleybol Ligi";
    const hasValidDate = Boolean(m.date && VALID_DATE_RE.test(m.date));
    const scored = isMatchScored(m);

    if (hasValidDate) {
      validMatchesCount += 1;
      if (m.volleybox?.synced) {
        syncedMatchesCount += 1;
      }
    }

    // Queue 1: TVF has score, Volleybox is synced but missing score
    if (scored && m.volleybox?.synced && !m.volleybox?.has_score) {
      missingScores.push(m);
    }

    // Queue 2: Bulletin discrepancy between TVF and Volleybox (schedule changed)
    if (m.volleybox?.synced && m.volleybox?.discrepancy?.has_diff) {
      discrepancies.push(m);
    }

    // Queue 3: Dated TVF matches not yet entered on Volleybox
    if (hasValidDate && !m.volleybox?.synced) {
      unsynced.push(m);
    }

    // Queue 4: Unmapped teams across matches
    trackUnmappedTeam(m.home_team, effectiveCategory, effectiveCity);
    trackUnmappedTeam(m.away_team, effectiveCategory, effectiveCity);
  }

  missingScores.sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.time || "").localeCompare(a.time || ""));
  discrepancies.sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.time || "").localeCompare(b.time || ""));
  unsynced.sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.time || "").localeCompare(b.time || ""));

  const unmappedTeams = Array.from(unmappedMap.values()).sort(
    (a, b) => b.matchCount - a.matchCount || a.city.localeCompare(b.city, "tr") || a.teamName.localeCompare(b.teamName, "tr")
  );

  const standingsAnomalies = detectStandingsAnomalies(matches, standings, defaultCity);

  const counts: VolleyboxWorkbenchCounts = {
    missingScores: missingScores.length,
    discrepancies: discrepancies.length,
    unsynced: unsynced.length,
    unmappedTeams: unmappedTeams.length,
    standingsAnomalies: standingsAnomalies.length,
    totalActionable:
      missingScores.length + discrepancies.length + unsynced.length + unmappedTeams.length + standingsAnomalies.length,
    totalValidMatches: validMatchesCount,
    syncedMatches: syncedMatchesCount,
    syncPercent: validMatchesCount > 0 ? Math.round((syncedMatchesCount / validMatchesCount) * 100) : 0,
  };

  return {
    missingScores,
    discrepancies,
    unsynced,
    unmappedTeams,
    standingsAnomalies,
    counts,
  };
}
