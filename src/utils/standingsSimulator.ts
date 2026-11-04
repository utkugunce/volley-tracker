import type { Match, StandingItem } from "@/types/fixture";

export type SimulationScore = "3-0" | "3-1" | "3-2" | "2-3" | "1-3" | "0-3";

export interface SimulatedMatchScore {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  score: SimulationScore;
}

export interface SimulatedStandingRow {
  rank: number;
  initialRank: number;
  team: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  setsWon: number;
  setsLost: number;
  setRatio: number;
  setRatioDisplay: string;
  pointsWon: number;
  pointsLost: number;
  pointRatio: number;
  pointRatioDisplay: string;
  diffRank: number; // positive = moved up, negative = moved down
  diffPoints: number;
}

/**
 * 3-0 veya 3-1: Galip 3, Mağlup 0 puan
 * 3-2: Galip 2, Mağlup 1 puan
 * 2-3: Galip 1, Mağlup 2 puan
 * 1-3 veya 0-3: Galip 0, Mağlup 3 puan
 */
export function getScorePointsAndSets(score: SimulationScore): {
  homePoints: number;
  awayPoints: number;
  homeSets: number;
  awaySets: number;
} {
  switch (score) {
    case "3-0":
      return { homePoints: 3, awayPoints: 0, homeSets: 3, awaySets: 0 };
    case "3-1":
      return { homePoints: 3, awayPoints: 0, homeSets: 3, awaySets: 1 };
    case "3-2":
      return { homePoints: 2, awayPoints: 1, homeSets: 3, awaySets: 2 };
    case "2-3":
      return { homePoints: 1, awayPoints: 2, homeSets: 2, awaySets: 3 };
    case "1-3":
      return { homePoints: 0, awayPoints: 3, homeSets: 1, awaySets: 3 };
    case "0-3":
      return { homePoints: 0, awayPoints: 3, homeSets: 0, awaySets: 3 };
  }
}

/**
 * FIVB Sıralama Kriterleri:
 * 1. Puan (Points) - Büyük olan üstte
 * 2. Galibiyet (Matches Won) - Büyük olan üstte
 * 3. Set Oranı (Sets Won / Sets Lost) - Büyük olan üstte
 * 4. Sayı Oranı (Points Won / Points Lost) - Büyük olan üstte
 * 5. Takım adı (Alfabetik)
 */
export function compareStandingsFivb(
  a: {
    points: number;
    won: number;
    setRatio: number;
    pointRatio: number;
    team: string;
  },
  b: {
    points: number;
    won: number;
    setRatio: number;
    pointRatio: number;
    team: string;
  }
): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.won !== a.won) return b.won - a.won;
  if (Math.abs(b.setRatio - a.setRatio) > 0.0001) return b.setRatio - a.setRatio;
  if (Math.abs(b.pointRatio - a.pointRatio) > 0.0001) return b.pointRatio - a.pointRatio;
  return a.team.localeCompare(b.team, "tr");
}

/**
 * Verilen mevcut puan durumu ve oynanacak maçların simülasyon skorlarına göre
 * yeni puan durumunu ve sıra/puan farklarını hesaplar.
 */
export function simulateStandings(
  initialRows: StandingItem[],
  simulations: Record<string, SimulationScore>,
  upcomingMatches: Match[]
): SimulatedStandingRow[] {
  const teamMap = new Map<
    string,
    {
      initialRank: number;
      team: string;
      played: number;
      won: number;
      lost: number;
      points: number;
      setsWon: number;
      setsLost: number;
      pointsWon: number;
      pointsLost: number;
    }
  >();

  // Başlangıç değerlerini doldur
  for (const r of initialRows) {
    const rawKey = r.team.trim();
    teamMap.set(rawKey, {
      initialRank: r.rank,
      team: r.team,
      played: r.played,
      won: r.won,
      lost: r.lost,
      points: r.points,
      setsWon: r.sets_won,
      setsLost: r.sets_lost,
      pointsWon: r.points_won,
      pointsLost: r.points_lost,
    });
  }

  // Simülasyon skorlarını uygula
  for (const m of upcomingMatches) {
    const score = simulations[m.id];
    if (!score) continue;

    const homeTeam = m.home_team.trim();
    const awayTeam = m.away_team.trim();
    const home = teamMap.get(homeTeam);
    const away = teamMap.get(awayTeam);
    if (!home || !away) continue;

    const res = getScorePointsAndSets(score);

    home.played += 1;
    home.points += res.homePoints;
    home.setsWon += res.homeSets;
    home.setsLost += res.awaySets;
    if (res.homePoints > res.awayPoints) {
      home.won += 1;
      away.lost += 1;
    } else {
      home.lost += 1;
      away.won += 1;
    }

    away.played += 1;
    away.points += res.awayPoints;
    away.setsWon += res.awaySets;
    away.setsLost += res.homeSets;
  }

  // Sırala ve rank ata
  const rows = Array.from(teamMap.values()).map((t) => {
    const setRatio = t.setsLost === 0 ? (t.setsWon > 0 ? 999999 : 0) : t.setsWon / t.setsLost;
    const pointRatio = t.pointsLost === 0 ? (t.pointsWon > 0 ? 999999 : 0) : t.pointsWon / t.pointsLost;
    return {
      ...t,
      setRatio,
      setRatioDisplay: t.setsLost === 0 ? (t.setsWon > 0 ? "MAX" : "0.000") : setRatio.toFixed(3),
      pointRatio,
      pointRatioDisplay: t.pointsLost === 0 ? (t.pointsWon > 0 ? "MAX" : "0.000") : pointRatio.toFixed(3),
    };
  });

  rows.sort(compareStandingsFivb);

  const initialPointsMap = new Map(initialRows.map((r) => [r.team.trim(), r.points]));

  return rows.map((r, idx) => {
    const rank = idx + 1;
    const initialPts = initialPointsMap.get(r.team) ?? r.points;
    return {
      ...r,
      rank,
      diffRank: r.initialRank - rank, // initialRank 3, newRank 1 -> diff +2 (yükseldi)
      diffPoints: r.points - initialPts,
    };
  });
}

export const simulateAltyapiStandings = simulateStandings;
