/** İki takım arasında kafa kafaya karşılaştırma. */
import { slugify } from "../slugify";
import { compareMatchDateTime } from "../calendar";
import { getTeamDetailsBySlug } from "./details";
import { loadAllCityData } from "./loaders";
import type { HeadToHeadComparison, HeadToHeadMatch } from "./types";

export function getHeadToHeadComparison(slug1: string, slug2: string): HeadToHeadComparison | null {
  if (!slug1 || !slug2 || slug1 === slug2) return null;

  const team1 = getTeamDetailsBySlug(slug1);
  const team2 = getTeamDetailsBySlug(slug2);

  if (!team1 || !team2) return null;

  const { matches: allMatches } = loadAllCityData();

  const t1Aliases = new Set<string>([slugify(team1.teamName), team1.slug]);
  if (team1.mapping?.matched_as) t1Aliases.add(slugify(team1.mapping.matched_as));
  if (team1.mapping?.internal_name) t1Aliases.add(slugify(team1.mapping.internal_name));

  const t2Aliases = new Set<string>([slugify(team2.teamName), team2.slug]);
  if (team2.mapping?.matched_as) t2Aliases.add(slugify(team2.mapping.matched_as));
  if (team2.mapping?.internal_name) t2Aliases.add(slugify(team2.mapping.internal_name));

  const h2hMatches: HeadToHeadMatch[] = [];
  let team1Wins = 0;
  let team2Wins = 0;
  let upcomingMatches = 0;
  let team1SetsWon = 0;
  let team2SetsWon = 0;

  for (const m of allMatches) {
    const homeSlug = slugify(m.home_team || "");
    const awaySlug = slugify(m.away_team || "");

    const homeIsT1 = t1Aliases.has(homeSlug);
    const awayIsT1 = t1Aliases.has(awaySlug);
    const homeIsT2 = t2Aliases.has(homeSlug);
    const awayIsT2 = t2Aliases.has(awaySlug);

    const isMatchBetweenThem = (homeIsT1 && awayIsT2) || (homeIsT2 && awayIsT1);
    if (!isMatchBetweenThem) continue;

    let winner: "team1" | "team2" | "draw" | null = null;
    const isT1Home = homeIsT1;

    const t1Score = isT1Home ? m.home_score : m.away_score;
    const t2Score = isT1Home ? m.away_score : m.home_score;

    if (m.status === "finished") {
      if (typeof t1Score === "number" && typeof t2Score === "number") {
        team1SetsWon += t1Score;
        team2SetsWon += t2Score;
        if (t1Score > t2Score) {
          winner = "team1";
          team1Wins++;
        } else if (t2Score > t1Score) {
          winner = "team2";
          team2Wins++;
        } else {
          winner = "draw";
        }
      }
    } else {
      upcomingMatches++;
    }

    h2hMatches.push({
      id: m.id,
      date: m.date,
      time: m.time,
      category: m.category,
      hall: m.hall,
      city: m.city,
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      homeScore: m.home_score,
      awayScore: m.away_score,
      setScores: m.set_scores,
      status: m.status,
      winner,
    });
  }

  h2hMatches.sort((a, b) => compareMatchDateTime(b, a));

  let sharedGroup: HeadToHeadComparison["sharedGroup"] | undefined;
  for (const ctx1 of team1.standingsContexts) {
    const matchingCtx2 = team2.standingsContexts.find(
      (ctx2) => ctx1.groupName === ctx2.groupName && ctx1.category === ctx2.category
    );
    if (matchingCtx2) {
      sharedGroup = {
        groupName: ctx1.groupName,
        category: ctx1.category,
        city: ctx1.city,
        team1Row: ctx1.standingRow,
        team2Row: matchingCtx2.standingRow,
      };
      break;
    }
  }

  return {
    team1,
    team2,
    matches: h2hMatches,
    summary: {
      totalMatches: h2hMatches.length,
      team1Wins,
      team2Wins,
      upcomingMatches,
      team1SetsWon,
      team2SetsWon,
    },
    sharedGroup,
    isSameGroup: Boolean(sharedGroup),
  };
}
