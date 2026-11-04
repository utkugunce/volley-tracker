import type { Match, StandingItem } from "@/types/fixture";
import type { UnifiedFixture, UnifiedStanding, TeamAliasMapping } from "@/types/unified";

/**
 * Altyapı Match nesnesini standart UnifiedFixture formatına dönüştürür.
 */
export function matchToUnified(m: Match): UnifiedFixture {
  return {
    id: m.id,
    league: "altyapi",
    home_team: m.home_team,
    away_team: m.away_team,
    date: m.date,
    time: m.time,
    hall: m.hall,
    city: m.city,
    category: m.category,
    age_group: m.age_group,
    gender: m.gender,
    group: m.group,
    match_no: m.match_no,
    score: m.score,
    home_score: m.home_score,
    away_score: m.away_score,
    set_scores: m.set_scores,
    status: m.status,
    volleybox: m.volleybox,
  };
}

/**
 * Altyapı StandingItem nesnesini standart UnifiedStanding formatına dönüştürür.
 */
export function standingItemToUnified(s: StandingItem): UnifiedStanding {
  return {
    rank: s.rank,
    team_name: s.team,
    played: s.played,
    won: s.won,
    lost: s.lost,
    points: s.points,
    sets_won: s.sets_won,
    sets_lost: s.sets_lost,
    set_ratio: s.set_ratio,
    points_won: s.points_won,
    points_lost: s.points_lost,
    point_ratio: s.point_ratio,
  };
}

/**
 * TVF resmi adı ile Volleybox eşleştirmesinden TeamAliasMapping nesnesi oluşturur.
 */
export function createTeamAliasMapping(
  alias: string,
  official_name: string,
  volleybox_name?: string | null,
  volleybox_url?: string | null
): TeamAliasMapping {
  let volleybox_slug: string | null = null;
  if (volleybox_url) {
    const match = volleybox_url.match(/\/(?:team|club)s?\/([^/?#]+)/i);
    if (match) volleybox_slug = match[1];
  }

  return {
    alias,
    official_name,
    volleybox_name: volleybox_name ?? null,
    volleybox_url: volleybox_url ?? null,
    volleybox_slug,
  };
}
