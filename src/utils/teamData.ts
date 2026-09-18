import fs from "fs";
import path from "path";
import { Match, StandingItem } from "@/types/fixture";
import { slugify } from "./slugify";
import { getVolleyboxMapping, normalizeCitySlug } from "./volleybox";
import { VolleyboxMapping } from "@/types/fixture";
import { applyOverridesToMatches } from "./overrides";
import { compareMatchDateTime } from "./calendar";

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

export interface OtherCityTeam {
  city: string;
  citySlug: string;
  path: string;
}

export interface TeamDetails {
  teamName: string;
  slug: string;
  city: string;
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
  otherCities?: OtherCityTeam[];
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

export function getTeamDetailsBySlug(targetSlug: string, cityFilter?: string): TeamDetails | null {
  if (!targetSlug) return null;

  const { matches: allMatches, standingsByCity } = loadAllCityData();

  // Şehir öneki kontrolü (örn: izmir-vakifbank -> citySlug: izmir, cleanSlug: vakifbank)
  let cleanSlug = slugify(targetSlug);
  let requestedCitySlug = cityFilter ? normalizeCitySlug(cityFilter) : "";

  if (!requestedCitySlug) {
    const knownCitySlugs = new Set<string>();
    for (const m of allMatches) {
      if (m.city) knownCitySlugs.add(normalizeCitySlug(m.city));
    }
    for (const cityName of Object.keys(standingsByCity)) {
      knownCitySlugs.add(normalizeCitySlug(cityName));
    }

    for (const cSlug of knownCitySlugs) {
      if (cleanSlug.startsWith(`${cSlug}-`)) {
        requestedCitySlug = cSlug;
        cleanSlug = cleanSlug.slice(cSlug.length + 1);
        break;
      }
    }
  }

  // 1. Önce bu takımın yer aldığı tüm şehirleri tespit et
  const teamCitiesMap = new Map<string, { officialName: string; count: number }>();

  for (const m of allMatches) {
    const homeSlug = slugify(m.home_team);
    const awaySlug = slugify(m.away_team);
    const mCity = m.city || "İstanbul";
    const homeMapping = getVolleyboxMapping(m.home_team, m.category, undefined, mCity);
    const awayMapping = getVolleyboxMapping(m.away_team, m.category, undefined, mCity);

    const isHomeSlugMatch = Boolean(
      homeSlug === cleanSlug ||
      (homeMapping?.matched_as && slugify(homeMapping.matched_as) === cleanSlug) ||
      (homeMapping?.internal_name && slugify(homeMapping.internal_name) === cleanSlug)
    );

    const isAwaySlugMatch = Boolean(
      awaySlug === cleanSlug ||
      (awayMapping?.matched_as && slugify(awayMapping.matched_as) === cleanSlug) ||
      (awayMapping?.internal_name && slugify(awayMapping.internal_name) === cleanSlug)
    );

    if (isHomeSlugMatch) {
      const resolvedName = homeMapping?.matched_as || m.home_team;
      const entry = teamCitiesMap.get(mCity) || { officialName: resolvedName, count: 0 };
      entry.count++;
      teamCitiesMap.set(mCity, entry);
    }
    if (isAwaySlugMatch) {
      const resolvedName = awayMapping?.matched_as || m.away_team;
      const entry = teamCitiesMap.get(mCity) || { officialName: resolvedName, count: 0 };
      entry.count++;
      teamCitiesMap.set(mCity, entry);
    }
  }

  for (const [cityName, cityGroup] of Object.entries(standingsByCity)) {
    const standings = cityGroup.standings;
    for (const groupData of Object.values(standings)) {
      const table: StandingItem[] = Array.isArray(groupData)
        ? groupData
        : (groupData as any)?.table || [];

      const foundRow = table.find((item) => {
        const rowSlug = slugify(item.team);
        const rowMapping = getVolleyboxMapping(item.team, undefined, undefined, cityName);
        return (
          rowSlug === cleanSlug ||
          (rowMapping?.matched_as && slugify(rowMapping.matched_as) === cleanSlug) ||
          (rowMapping?.internal_name && slugify(rowMapping.internal_name) === cleanSlug)
        );
      });
      if (foundRow) {
        const rowMapping = getVolleyboxMapping(foundRow.team, undefined, undefined, cityName);
        const resolvedName = rowMapping?.matched_as || foundRow.team;
        const entry = teamCitiesMap.get(cityName) || { officialName: resolvedName, count: 0 };
        entry.count++;
        teamCitiesMap.set(cityName, entry);
      }
    }
  }

  if (teamCitiesMap.size === 0) {
    return null;
  }

  const allAvailableCities = Array.from(teamCitiesMap.keys());

  // Hedef şehri belirle:
  let selectedCity = "";
  if (requestedCitySlug) {
    selectedCity = allAvailableCities.find(
      (c) => normalizeCitySlug(c) === requestedCitySlug
    ) || "";
  }

  if (!selectedCity) {
    const ist = allAvailableCities.find((c) => normalizeCitySlug(c) === "istanbul");
    selectedCity = ist || allAvailableCities[0];
  }

  const selectedCitySlug = normalizeCitySlug(selectedCity);
  const officialTeamName = teamCitiesMap.get(selectedCity)?.officialName || targetSlug;

  // 2. YALNIZCA SEÇİLİ ŞEHİRDEKİ MAÇLARI VE PUAN DURUMLARINI TOPLA
  const teamMatches: TeamMatchDetail[] = [];
  const standingsContexts: TeamStandingContext[] = [];
  const categoriesSet = new Set<string>();

  for (const m of allMatches) {
    const homeSlug = slugify(m.home_team);
    const awaySlug = slugify(m.away_team);
    const mCity = m.city || "İstanbul";

    // Şehir izolasyonu: Takım profilinde SADECE o ilin maçları gösterilir
    if (normalizeCitySlug(mCity) !== selectedCitySlug) {
      continue;
    }

    const homeMapping = getVolleyboxMapping(m.home_team, m.category, undefined, mCity);
    const awayMapping = getVolleyboxMapping(m.away_team, m.category, undefined, mCity);

    const isHome: boolean = Boolean(
      homeSlug === cleanSlug ||
      (homeMapping?.matched_as && slugify(homeMapping.matched_as) === cleanSlug) ||
      (homeMapping?.internal_name && slugify(homeMapping.internal_name) === cleanSlug)
    );

    const isAway: boolean = Boolean(
      awaySlug === cleanSlug ||
      (awayMapping?.matched_as && slugify(awayMapping.matched_as) === cleanSlug) ||
      (awayMapping?.internal_name && slugify(awayMapping.internal_name) === cleanSlug)
    );

    if (isHome || isAway) {
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

  // Puan durumları (SADECE seçili şehir)
  for (const [cityName, cityGroup] of Object.entries(standingsByCity)) {
    if (normalizeCitySlug(cityName) !== selectedCitySlug) {
      continue;
    }

    const standings = cityGroup.standings;
    for (const [groupName, groupData] of Object.entries(standings)) {
      const table: StandingItem[] = Array.isArray(groupData)
        ? groupData
        : (groupData as any)?.table || [];

      const foundRow = table.find((item) => {
        const rowSlug = slugify(item.team);
        const rowMapping = getVolleyboxMapping(item.team, undefined, undefined, cityName);
        return (
          rowSlug === cleanSlug ||
          (rowMapping?.matched_as && slugify(rowMapping.matched_as) === cleanSlug) ||
          (rowMapping?.internal_name && slugify(rowMapping.internal_name) === cleanSlug)
        );
      });
      if (foundRow) {
        const isGenc = groupName.includes("Genç") || groupName.includes("U18");
        const is1Lig = groupName.includes("1. Lig") || groupName.includes("1.Lig") || groupName.includes("1. Ligi");
        const cat = isGenc
          ? (is1Lig ? "Genç Kızlar 1. Ligi" : "Genç Kızlar Süper Lig")
          : groupName.includes("Yıldız") || groupName.includes("U16")
          ? "Yıldız Kızlar Süper Lig"
          : groupName.split(" - ")[0];
        categoriesSet.add(cat);

        standingsContexts.push({
          groupName,
          category: cat,
          city: selectedCity,
          standingRow: foundRow,
          fullGroupTable: table,
        });
      }
    }
  }

  // Maçları tarihe ve erken saate göre sırala (TBD sona, erken saat ilk)
  teamMatches.sort((a, b) => compareMatchDateTime(a, b, "asc"));

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

  // Volleybox profili - o ilin takımına özel eşleme
  const firstCat = Array.from(categoriesSet)[0];
  const mapping = getVolleyboxMapping(officialTeamName, firstCat, undefined, selectedCity);

  // Bu kulübün diğer illerdeki takımları
  const otherCities: OtherCityTeam[] = allAvailableCities
    .filter((c) => normalizeCitySlug(c) !== selectedCitySlug)
    .map((c) => ({
      city: c,
      citySlug: normalizeCitySlug(c),
      path: `/takim/${cleanSlug}?sehir=${normalizeCitySlug(c)}`,
    }));

  return {
    teamName: officialTeamName,
    slug: cleanSlug,
    city: selectedCity,
    cities: [selectedCity],
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
    otherCities,
  };
}

export function getAllTeamSlugs(): string[] {
  const { matches, standingsByCity } = loadAllCityData();
  const slugs = new Set<string>();
  const teamCities = new Map<string, Set<string>>();

  const addTeamWithAliases = (name: string, city: string, category?: string) => {
    if (!name) return;
    const s = slugify(name);
    slugs.add(s);
    if (!teamCities.has(s)) teamCities.set(s, new Set());
    teamCities.get(s)!.add(city);

    const map = getVolleyboxMapping(name, category, undefined, city);
    if (map?.matched_as) {
      const ms = slugify(map.matched_as);
      slugs.add(ms);
      if (!teamCities.has(ms)) teamCities.set(ms, new Set());
      teamCities.get(ms)!.add(city);
    }
    if (map?.internal_name) {
      const is = slugify(map.internal_name);
      slugs.add(is);
      if (!teamCities.has(is)) teamCities.set(is, new Set());
      teamCities.get(is)!.add(city);
    }
  };

  for (const m of matches) {
    const mCity = m.city || "İstanbul";
    if (m.home_team) {
      addTeamWithAliases(m.home_team, mCity, m.category);
    }
    if (m.away_team) {
      addTeamWithAliases(m.away_team, mCity, m.category);
    }
  }

  for (const [cityName, cityGroup] of Object.entries(standingsByCity)) {
    for (const groupData of Object.values(cityGroup.standings)) {
      const table: StandingItem[] = Array.isArray(groupData)
        ? groupData
        : (groupData as any)?.table || [];
      for (const item of table) {
        if (item.team) {
          addTeamWithAliases(item.team, cityName);
        }
      }
    }
  }

  // Çoklu şehirde oynayan takımlar için şehir önekli slug'ları da ekle (örn: izmir-vakifbank)
  for (const [s, cities] of teamCities.entries()) {
    if (cities.size > 1) {
      for (const c of cities) {
        slugs.add(`${normalizeCitySlug(c)}-${s}`);
      }
    }
  }

  return Array.from(slugs).filter(Boolean);
}
