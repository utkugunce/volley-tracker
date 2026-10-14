import type { Match, StandingItem } from "@/types/fixture";
import type { Kadinlar2LigMatch, Kadinlar2LigTeam } from "@/types/kadinlar2Lig";
import { trLower } from "./turkishLocale";

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

function parseRatio(val: string | number | undefined): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  if (val === "MAX" || val === "Infinity") return 999999;
  const num = parseFloat(val.replace(",", "."));
  return isNaN(num) ? 0 : num;
}

/**
 * Standart FIVB / TVF Voleybol Sıralama Kriterleri:
 * 1. Galibiyet Sayısı (Won) - Azalan
 * 2. Puan (Points) - Azalan
 * 3. Set Averajı (Sets Won / Sets Lost) - Azalan
 * 4. Sayı Averajı (Points Won / Points Lost) - Azalan
 * 5. Takım Adı (Alfabetik)
 */
export function compareStandingsFivb(
  a: { won: number; points: number; setRatio: number; pointRatio: number; team: string },
  b: { won: number; points: number; setRatio: number; pointRatio: number; team: string }
): number {
  if (a.won !== b.won) return b.won - a.won;
  if (a.points !== b.points) return b.points - a.points;
  if (Math.abs(a.setRatio - b.setRatio) > 0.0001) return b.setRatio - a.setRatio;
  if (Math.abs(a.pointRatio - b.pointRatio) > 0.0001) return b.pointRatio - a.pointRatio;
  return a.team.localeCompare(b.team, "tr");
}

/**
 * Altyapı StandingItem dizisini simüle eder.
 */
export function simulateAltyapiStandings(
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

  for (const r of initialRows) {
    teamMap.set(r.team.trim(), {
      initialRank: r.rank,
      team: r.team.trim(),
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

/**
 * Kadınlar 2. Ligi Kadinlar2LigTeam dizisini simüle eder.
 */
export function simulateK2Standings(
  initialRows: Kadinlar2LigTeam[],
  simulations: Record<string, SimulationScore>,
  upcomingMatches: Kadinlar2LigMatch[]
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

  for (const r of initialRows) {
    teamMap.set(r.takim_adi.trim(), {
      initialRank: r.sira,
      team: r.takim_adi.trim(),
      played: r.o,
      won: r.g,
      lost: r.m,
      points: r.p,
      setsWon: r.as,
      setsLost: r.vs,
      pointsWon: r.asp,
      pointsLost: r.vsp,
    });
  }

  for (const m of upcomingMatches) {
    const score = simulations[m.id];
    if (!score) continue;

    const homeTeam = m.takim_a.trim();
    const awayTeam = m.takim_b.trim();
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

  const initialPointsMap = new Map(initialRows.map((r) => [r.takim_adi.trim(), r.p]));

  return rows.map((r, idx) => {
    const rank = idx + 1;
    const initialPts = initialPointsMap.get(r.team) ?? r.points;
    return {
      ...r,
      rank,
      diffRank: r.initialRank - rank,
      diffPoints: r.points - initialPts,
    };
  });
}
