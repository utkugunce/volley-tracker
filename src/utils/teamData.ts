import fs from "fs";
import path from "path";
import { Match, StandingItem } from "@/types/fixture";
import { slugify } from "./slugify";
import { getVolleyboxMapping } from "./volleybox";
import { VolleyboxMapping } from "@/types/fixture";
import { applyOverridesToMatches } from "./overrides";

export interface TeamStandingContext {
  groupName: string;
  category: string;
  city: string;
  standingRow: StandingItem;
  fullGroupTable: StandingItem[];
}

export interface TeamMatchDetail extends Match {
  isHome: boolean;
  opponent: string;
  teamScore?: number | null;
  opponentScore?: number | null;
  result?: "win" | "loss" | "upcoming";
}

export interface TeamDetails {
  teamName: string;
  slug: string;
  cities: string[];
  categories: string[];
  mapping?: VolleyboxMapping;
  matches: TeamMatchDetail[];
  standingsContexts: TeamStandingContext[];
  form: Array<{ matchId: string; result: "W" | "L"; score: string; opponent: string; date: string }>;
  stats: {
    totalMatches: number;
    played: number;
    wins: number;
    losses: number;
    upcoming: number;
  };
}

let cachedAllData: {
  matches: Match[];
  standingsByCity: Record<string, { city: string; standings: Record<string, any> }>;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 60 * 1000; // 1 minute

function loadAllCityData() {
  const now = Date.now();
  if (cachedAllData && now - cachedAllData.timestamp < CACHE_TTL_MS) {
    return cachedAllData;
  }

  const citiesDir = path.join(process.cwd(), "data", "cities");
  const allMatches: Match[] = [];
  const standingsByCity: Record<string, { city: string; standings: Record<string, any> }> = {};

  if (fs.existsSync(citiesDir)) {
    const files = fs.readdirSync(citiesDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      try {
        const fullPath = path.join(citiesDir, file);
        const content = fs.readFileSync(fullPath, "utf-8");
        const parsed = JSON.parse(content);
        const cityName = parsed.city || file.replace(".json", "");

        if (Array.isArray(parsed.matches)) {
          for (const m of parsed.matches) {
            allMatches.push({
              ...m,
              city: m.city || cityName,
            });
          }
        }

        if (parsed.standings && typeof parsed.standings === "object") {
          standingsByCity[cityName] = {
            city: cityName,
            standings: parsed.standings,
          };
        }
      } catch (err) {
        console.error(`Error loading city data for ${file}:`, err);
      }
    }
  }

  cachedAllData = {
    matches: applyOverridesToMatches(allMatches),
    standingsByCity,
    timestamp: now,
  };

  return cachedAllData;
}

export function getTeamDetailsBySlug(targetSlug: string): TeamDetails | null {
  if (!targetSlug) return null;

  const normalizedTargetSlug = slugify(targetSlug);
  const { matches: allMatches, standingsByCity } = loadAllCityData();

  let officialTeamName: string | null = null;
  const teamMatches: TeamMatchDetail[] = [];
  const standingsContexts: TeamStandingContext[] = [];
  const citiesSet = new Set<string>();
  const categoriesSet = new Set<string>();

  // 1. Taramada maçları eşleştir
  for (const m of allMatches) {
    const homeSlug = slugify(m.home_team);
    const awaySlug = slugify(m.away_team);

    const isHome = homeSlug === normalizedTargetSlug;
    const isAway = awaySlug === normalizedTargetSlug;

    if (isHome || isAway) {
      if (!officialTeamName) {
        officialTeamName = isHome ? m.home_team : m.away_team;
      }

      if (m.city) citiesSet.add(m.city);
      if (m.category) categoriesSet.add(m.category);

      let result: "win" | "loss" | "upcoming" = "upcoming";
      let teamScore: number | null = null;
      let opponentScore: number | null = null;

      if (m.status === "finished") {
        teamScore = (isHome ? m.home_score : m.away_score) ?? null;
        opponentScore = (isHome ? m.away_score : m.home_score) ?? null;

        if (teamScore !== null && opponentScore !== null) {
          result = teamScore > opponentScore ? "win" : "loss";
        }
      }

      teamMatches.push({
        ...m,
        isHome,
        opponent: isHome ? m.away_team : m.home_team,
        teamScore,
        opponentScore,
        result,
      });
    }
  }

  // 2. Puan durumlarını eşleştir
  for (const [cityName, cityGroup] of Object.entries(standingsByCity)) {
    const standings = cityGroup.standings;
    for (const [groupName, groupData] of Object.entries(standings)) {
      const table: StandingItem[] = Array.isArray(groupData)
        ? groupData
        : (groupData as any)?.table || [];

      const foundRow = table.find((item) => {
        const itemSlug = slugify(item.team);
        return itemSlug === normalizedTargetSlug;
      });

      if (foundRow) {
        if (!officialTeamName) {
          officialTeamName = foundRow.team;
        }
        citiesSet.add(cityName);

        const cat = groupName.includes("Genç") || groupName.includes("U18")
          ? "Genç Kızlar Süper Lig"
          : groupName.includes("Yıldız") || groupName.includes("U16")
          ? "Yıldız Kızlar Süper Lig"
          : groupName.split(" - ")[0];
        categoriesSet.add(cat);

        standingsContexts.push({
          groupName,
          category: cat,
          city: cityName,
          standingRow: foundRow,
          fullGroupTable: table,
        });
      }
    }
  }

  if (!officialTeamName && teamMatches.length === 0 && standingsContexts.length === 0) {
    return null;
  }

  const teamName = officialTeamName || targetSlug;

  // Maçları tarihe göre sırala (TBD sona)
  teamMatches.sort((a, b) => {
    if (a.date === "TBD") return 1;
    if (b.date === "TBD") return -1;
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return (a.time || "").localeCompare(b.time || "");
  });

  // Form (son 5 tamamlanmış maç)
  const finishedMatches = teamMatches.filter((m) => m.status === "finished" && m.result !== "upcoming");
  const formMatches = finishedMatches.slice(-5);
  const form = formMatches.map((m) => ({
    matchId: m.id,
    result: (m.result === "win" ? "W" : "L") as "W" | "L",
    score: m.score || `${m.teamScore} - ${m.opponentScore}`,
    opponent: m.opponent,
    date: m.date,
  }));

  const played = finishedMatches.length;
  const wins = finishedMatches.filter((m) => m.result === "win").length;
  const losses = finishedMatches.filter((m) => m.result === "loss").length;
  const upcoming = teamMatches.filter((m) => m.status !== "finished").length;

  // Volleybox profili
  const firstCat = Array.from(categoriesSet)[0];
  const mapping = getVolleyboxMapping(teamName, firstCat);

  return {
    teamName,
    slug: normalizedTargetSlug,
    cities: Array.from(citiesSet),
    categories: Array.from(categoriesSet),
    mapping,
    matches: teamMatches,
    standingsContexts,
    form,
    stats: {
      totalMatches: teamMatches.length,
      played,
      wins,
      losses,
      upcoming,
    },
  };
}

export function getAllTeamSlugs(): string[] {
  const { matches, standingsByCity } = loadAllCityData();
  const slugs = new Set<string>();

  for (const m of matches) {
    if (m.home_team) slugs.add(slugify(m.home_team));
    if (m.away_team) slugs.add(slugify(m.away_team));
  }

  for (const cityGroup of Object.values(standingsByCity)) {
    for (const groupData of Object.values(cityGroup.standings)) {
      const table: StandingItem[] = Array.isArray(groupData)
        ? groupData
        : (groupData as any)?.table || [];
      for (const item of table) {
        if (item.team) slugs.add(slugify(item.team));
      }
    }
  }

  return Array.from(slugs).filter(Boolean);
}
