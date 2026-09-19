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

export interface ClubSisterTeam {
  teamName: string;
  slug: string;
  city: string;
  citySlug: string;
  path: string;
  ageCategory?: string; // "U18", "U16", "U14", vb.
  teamBranch?: string; // "A Takımı", "B Takımı", "C Takımı", vb.
  leagueName?: string; // "Genç Kızlar Süper Lig", vb.
  isCurrent: boolean;
  matchesCount?: number;
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
  clubTeams?: ClubSisterTeam[];
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

  // Bu kulübün U18, U16, B, C, D vs. tüm kardeş takımları
  const clubTeams = findClubSisterTeams(
    officialTeamName,
    cleanSlug,
    selectedCity,
    allMatches,
    standingsByCity,
    mapping
  );

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
    clubTeams,
  };
}

export function extractClubRoot(name: string): { rootName: string; rootSlug: string; branch?: string; age?: string } {
  if (!name) return { rootName: "", rootSlug: "" };

  let cleaned = name.trim();
  let branch: string | undefined = undefined;
  let age: string | undefined = undefined;

  // 1. Yaş Grubu Tespiti: U18, U16, U14, U12, U10 vb.
  const uMatch = cleaned.match(/\bU\s*(1[0-9]|2[0-1])\b/i);
  if (uMatch) {
    age = `U${uMatch[1]}`;
    cleaned = cleaned.replace(/\bU\s*(1[0-9]|2[0-1])\b/gi, "").trim();
  } else if (/\bGenç(?:ler)?\b/i.test(cleaned)) {
    age = "U18 (Genç)";
    cleaned = cleaned.replace(/\bGenç(?:ler)?\b/gi, "").trim();
  } else if (/\bYıldız(?:lar)?\b/i.test(cleaned)) {
    age = "U16 (Yıldız)";
    cleaned = cleaned.replace(/\bYıldız(?:lar)?\b/gi, "").trim();
  } else if (/\bKüçük(?:ler)?\b/i.test(cleaned)) {
    age = "U14 (Küçük)";
    cleaned = cleaned.replace(/\bKüçük(?:ler)?\b/gi, "").trim();
  } else if (/\bMidi\b/i.test(cleaned)) {
    age = "U12 (Midi)";
    cleaned = cleaned.replace(/\bMidi\b/gi, "").trim();
  }

  // 2. Branş / Takım Harfi Tespiti: - A, - B, - C, A Takımı, B Takımı, sonundaki " A", " B" veya (B)
  const branchMatch = cleaned.match(/(?:[-–—\s]\s*|\()([A-D])(?:\)|\s*Takımı|\s*Takım|\s*$)/i);
  if (branchMatch) {
    branch = `${branchMatch[1].toUpperCase()} Takımı`;
    cleaned = cleaned.replace(/(?:[-–—\s]\s*|\()([A-D])(?:\)|\s*Takımı|\s*Takım|\s*$)/gi, "").trim();
  }

  // 3. Sondaki tire ve fazla boşlukları temizle
  cleaned = cleaned.replace(/[-–—\s]+$/, "").trim();

  const rootSlug = slugify(cleaned);
  return {
    rootName: cleaned,
    rootSlug,
    branch,
    age,
  };
}

export function findClubSisterTeams(
  officialTeamName: string,
  currentSlug: string,
  selectedCity: string,
  allMatches: Match[],
  standingsByCity: Record<string, { city: string; standings: Record<string, any> }>,
  mapping?: VolleyboxMapping
): ClubSisterTeam[] {
  const currentExtraction = extractClubRoot(officialTeamName);
  const targetRoots = new Set<string>();

  // 1. Olası kulüp kök slug'larını topla
  if (currentExtraction.rootSlug) {
    targetRoots.add(currentExtraction.rootSlug);
    const withoutSk = currentExtraction.rootSlug
      .replace(/-sk$/, "")
      .replace(/-spor-kulubu$/, "")
      .replace(/-spor$/, "");
    if (withoutSk) targetRoots.add(withoutSk);
  }

  if (mapping?.internal_name) {
    const internalSlug = slugify(mapping.internal_name);
    targetRoots.add(internalSlug);
    const internalWithoutSk = internalSlug
      .replace(/-sk$/, "")
      .replace(/-spor-kulubu$/, "")
      .replace(/-spor$/, "");
    if (internalWithoutSk) targetRoots.add(internalWithoutSk);
  }

  if (targetRoots.size === 0) {
    return [];
  }

  // 2. Tüm maç ve puan tablolarındaki takımları topla
  const candidatesMap = new Map<string, {
    teamName: string;
    city: string;
    category?: string;
    count: number;
  }>();

  const addCandidate = (teamName: string, city: string, category?: string) => {
    if (!teamName) return;
    const key = `${teamName}__${city}`;
    const existing = candidatesMap.get(key) || { teamName, city, category, count: 0 };
    existing.count++;
    if (!existing.category && category) existing.category = category;
    candidatesMap.set(key, existing);
  };

  for (const m of allMatches) {
    const mCity = m.city || "İstanbul";
    addCandidate(m.home_team, mCity, m.category);
    addCandidate(m.away_team, mCity, m.category);
  }

  for (const [cityName, cityGroup] of Object.entries(standingsByCity)) {
    for (const [groupName, groupData] of Object.entries(cityGroup.standings)) {
      const table: StandingItem[] = Array.isArray(groupData) ? groupData : (groupData as any)?.table || [];
      for (const item of table) {
        if (item.team) {
          addCandidate(item.team, cityName, groupName);
        }
      }
    }
  }

  // 3. Kökü eşleşen adayları filtrele
  const results: ClubSisterTeam[] = [];
  const addedSlugs = new Set<string>();

  for (const cand of candidatesMap.values()) {
    const candMapping = getVolleyboxMapping(cand.teamName, cand.category, undefined, cand.city);
    const candExt = extractClubRoot(cand.teamName);

    const candRoots = new Set<string>();
    if (candExt.rootSlug) {
      candRoots.add(candExt.rootSlug);
      const candWithoutSk = candExt.rootSlug
        .replace(/-sk$/, "")
        .replace(/-spor-kulubu$/, "")
        .replace(/-spor$/, "");
      if (candWithoutSk) candRoots.add(candWithoutSk);
    }
    if (candMapping?.internal_name) {
      const islug = slugify(candMapping.internal_name);
      candRoots.add(islug);
      const islugWithoutSk = islug
        .replace(/-sk$/, "")
        .replace(/-spor-kulubu$/, "")
        .replace(/-spor$/, "");
      if (islugWithoutSk) candRoots.add(islugWithoutSk);
    }

    // Ortak kök var mı?
    let matchesRoot = false;
    for (const r of candRoots) {
      if (targetRoots.has(r)) {
        matchesRoot = true;
        break;
      }
    }

    if (matchesRoot) {
      const teamSlug = slugify(cand.teamName);
      const citySlug = normalizeCitySlug(cand.city);
      const uniqueKey = `${teamSlug}__${citySlug}`;

      if (addedSlugs.has(uniqueKey)) continue;
      addedSlugs.add(uniqueKey);

      const isCurrent =
        teamSlug === currentSlug ||
        cand.teamName.toLocaleLowerCase("tr-TR") === officialTeamName.toLocaleLowerCase("tr-TR");

      // Yaş kategorisi tespiti (takım adından veya kategoriden)
      let ageCat: string | undefined = candExt.age || candMapping?.age_category || undefined;
      if (!ageCat && cand.category) {
        if (/genç|u18/i.test(cand.category)) ageCat = "U18";
        else if (/yıldız|u16/i.test(cand.category)) ageCat = "U16";
        else if (/küçük|u14/i.test(cand.category)) ageCat = "U14";
        else if (/midi|u12/i.test(cand.category)) ageCat = "U12";
      }

      results.push({
        teamName: cand.teamName,
        slug: teamSlug,
        city: cand.city,
        citySlug,
        path: `/takim/${teamSlug}?sehir=${citySlug}`,
        ageCategory: ageCat || undefined,
        teamBranch: candExt.branch,
        leagueName: cand.category,
        isCurrent,
        matchesCount: cand.count,
      });
    }
  }

  // Şu anki takım listede yoksa ekle
  if (!results.some((r) => r.isCurrent)) {
    const curExt = extractClubRoot(officialTeamName);
    results.unshift({
      teamName: officialTeamName,
      slug: currentSlug,
      city: selectedCity,
      citySlug: normalizeCitySlug(selectedCity),
      path: `/takim/${currentSlug}?sehir=${normalizeCitySlug(selectedCity)}`,
      ageCategory: curExt.age || undefined,
      teamBranch: curExt.branch,
      isCurrent: true,
    });
  }

  // Sıralama:
  // 1) Aynı ildekiler önce
  // 2) U18, U16, U14 sırasıyla
  // 3) A takımı önce, sonra B, sonra C
  const ageOrder = (age?: string) => {
    if (!age) return 99;
    if (age.includes("18")) return 1;
    if (age.includes("16")) return 2;
    if (age.includes("14")) return 3;
    if (age.includes("12")) return 4;
    return 10;
  };

  const branchOrder = (br?: string) => {
    if (!br) return 1; // Ana takım
    if (br.includes("A")) return 2;
    if (br.includes("B")) return 3;
    if (br.includes("C")) return 4;
    return 5;
  };

  results.sort((a, b) => {
    // Aynı il öncelikli
    const aCitySame = a.city === selectedCity ? 0 : 1;
    const bCitySame = b.city === selectedCity ? 0 : 1;
    if (aCitySame !== bCitySame) return aCitySame - bCitySame;

    // Yaş grubu
    const aAge = ageOrder(a.ageCategory);
    const bAge = ageOrder(b.ageCategory);
    if (aAge !== bAge) return aAge - bAge;

    // Takım şubesi (A, B, C)
    const aBr = branchOrder(a.teamBranch);
    const bBr = branchOrder(b.teamBranch);
    if (aBr !== bBr) return aBr - bBr;

    return a.teamName.localeCompare(b.teamName, "tr-TR");
  });

  return results;
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

export interface TeamListItem {
  name: string;
  slug: string;
  city: string;
}

export interface HeadToHeadMatch {
  id: string;
  date: string;
  time?: string;
  category?: string;
  hall?: string;
  city?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number | null;
  awayScore?: number | null;
  setScores?: string[];
  status: "upcoming" | "finished" | "postponed" | "live";
  winner?: "team1" | "team2" | "draw" | null;
}

export interface HeadToHeadComparison {
  team1: TeamDetails;
  team2: TeamDetails;
  matches: HeadToHeadMatch[];
  summary: {
    totalMatches: number;
    team1Wins: number;
    team2Wins: number;
    upcomingMatches: number;
    team1SetsWon: number;
    team2SetsWon: number;
  };
  sharedGroup?: {
    groupName: string;
    category: string;
    city: string;
    team1Row?: StandingItem;
    team2Row?: StandingItem;
  };
  isSameGroup: boolean;
}

export function getAllTeamsList(): TeamListItem[] {
  const { matches, standingsByCity } = loadAllCityData();
  const map = new Map<string, TeamListItem>();

  const register = (name: string, city: string) => {
    if (!name || name.trim().length < 2) return;
    const cleanSlug = slugify(name);
    if (!map.has(cleanSlug)) {
      map.set(cleanSlug, {
        name: name.trim(),
        slug: cleanSlug,
        city: city || "İstanbul",
      });
    }
  };

  for (const m of matches) {
    if (m.home_team) register(m.home_team, m.city || "İstanbul");
    if (m.away_team) register(m.away_team, m.city || "İstanbul");
  }

  for (const [cityName, cityGroup] of Object.entries(standingsByCity)) {
    for (const groupData of Object.values(cityGroup.standings)) {
      const table: StandingItem[] = Array.isArray(groupData)
        ? groupData
        : (groupData as any)?.table || [];
      for (const item of table) {
        if (item.team) {
          register(item.team, cityName);
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

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

