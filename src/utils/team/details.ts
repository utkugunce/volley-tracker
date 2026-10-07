/** Takım detay sayfası verisi (getTeamDetailsBySlug). */
import fs from "fs";
import path from "path";
import { slugify } from "../slugify";
import { getVolleyboxMapping, normalizeCitySlug } from "../volleybox";
import { compareMatchDateTime } from "../calendar";
import { TeamRosterRecord } from "@/types/roster";
import { isCityHidden } from "../cityHelper";
import { extractVolleyboxTeamId, loadAllCityData, loadTeamRosters } from "./loaders";
import { extractClubRoot, findClubSisterTeams } from "./sisters";
import { getSlugIndex } from "./slugIndex";
import type { OtherCityTeam, Player, TeamDetails, TeamMatchDetail, TeamStandingContext } from "./types";

export function getTeamDetailsBySlug(targetSlug: string, cityFilter?: string): TeamDetails | null {
  if (!targetSlug) return null;
  if (cityFilter && isCityHidden(cityFilter)) return null;

  const allData = loadAllCityData();
  const { matches: allMatches, standingsByCity } = allData;
  const index = getSlugIndex(allData);

  // Şehir öneki kontrolü (örn: izmir-vakifbank -> citySlug: izmir, cleanSlug: vakifbank)
  let cleanSlug = slugify(targetSlug);
  let requestedCitySlug = cityFilter ? normalizeCitySlug(cityFilter) : "";

  if (!requestedCitySlug) {
    for (const cSlug of index.knownCitySlugs) {
      if (cleanSlug.startsWith(`${cSlug}-`)) {
        requestedCitySlug = cSlug;
        cleanSlug = cleanSlug.slice(cSlug.length + 1);
        break;
      }
    }
  }

  // 1. Önce bu takımın yer aldığı tüm şehirleri tespit et
  const teamCitiesMap = new Map<string, { officialName: string; count: number }>();
  const matchIndices = index.matchesBySlug.get(cleanSlug) ?? [];

  for (const i of matchIndices) {
    const m = allMatches[i];
    const mCity = m.city || "İstanbul";

    if (index.homeKeys[i].has(cleanSlug)) {
      const resolvedName = index.homeMapping[i]?.matched_as || m.home_team;
      const entry = teamCitiesMap.get(mCity) || { officialName: resolvedName, count: 0 };
      entry.count++;
      teamCitiesMap.set(mCity, entry);
    }
    if (index.awayKeys[i].has(cleanSlug)) {
      const resolvedName = index.awayMapping[i]?.matched_as || m.away_team;
      const entry = teamCitiesMap.get(mCity) || { officialName: resolvedName, count: 0 };
      entry.count++;
      teamCitiesMap.set(mCity, entry);
    }
  }

  const standingHits = index.standingsBySlug.get(cleanSlug) ?? [];
  for (const hit of standingHits) {
    const resolvedName = hit.rowMapping?.matched_as || hit.row.team;
    const entry = teamCitiesMap.get(hit.cityName) || { officialName: resolvedName, count: 0 };
    entry.count++;
    teamCitiesMap.set(hit.cityName, entry);
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

  for (const i of matchIndices) {
    const m = allMatches[i];
    const mCity = m.city || "İstanbul";

    // Şehir izolasyonu: Altyapı liglerinde sadece o ilin maçları; ulusal liglerde (Kadınlar 2. Ligi) tüm maçlar
    const isNationalMatch = m.category === "Kadınlar 2. Ligi";
    if (!isNationalMatch && normalizeCitySlug(mCity) !== selectedCitySlug) {
      continue;
    }

    const isHome: boolean = index.homeKeys[i].has(cleanSlug);
    const isAway: boolean = index.awayKeys[i].has(cleanSlug);

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

  // Puan durumları (seçili şehir veya ulusal ligler)
  for (const { cityName, groupName, table, row: foundRow } of standingHits) {
    const isNationalStandings = cityName === "TVF Kadınlar 2. Ligi";
    if (!isNationalStandings && normalizeCitySlug(cityName) !== selectedCitySlug) {
      continue;
    }

    const is2Lig = cityName === "TVF Kadınlar 2. Ligi" || groupName.includes("Grup");
    const isGenc = groupName.includes("Genç") || groupName.includes("U18");
    const is1Lig = groupName.includes("1. Lig") || groupName.includes("1.Lig") || groupName.includes("1. Ligi");
    const cat = is2Lig && cityName === "TVF Kadınlar 2. Ligi"
      ? "Kadınlar 2. Ligi"
      : isGenc
      ? (is1Lig ? "Genç Kızlar 1. Ligi" : "Genç Kızlar Süper Lig")
      : groupName.includes("Yıldız") || groupName.includes("U16")
      ? "Yıldız Kızlar Süper Lig"
      : groupName.split(" - ")[0];
    categoriesSet.add(cat);

    standingsContexts.push({
      groupName: is2Lig && cityName === "TVF Kadınlar 2. Ligi" ? `TVF Kadınlar 2. Ligi - ${groupName}` : groupName,
      category: cat,
      city: is2Lig && cityName === "TVF Kadınlar 2. Ligi" ? (selectedCity || "Türkiye") : selectedCity,
      standingRow: foundRow,
      fullGroupTable: table,
    });
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
  let mapping = getVolleyboxMapping(officialTeamName, firstCat, undefined, selectedCity);
  if (!mapping) {
    mapping = getVolleyboxMapping(officialTeamName, "Kadınlar 2. Ligi", undefined, selectedCity);
  }
  if (!mapping) {
    mapping = getVolleyboxMapping(officialTeamName);
  }

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

  // Volleybox Kadro Verisi (data/team-rosters.json)
  let volleyboxRoster: TeamRosterRecord | undefined = undefined;
  let roster: Player[] | undefined = undefined;

  try {
    const allRosters = loadTeamRosters();
    const vbId = extractVolleyboxTeamId(mapping?.volleybox_url);

    if (vbId && allRosters[vbId]) {
      volleyboxRoster = allRosters[vbId];
    } else {
      // url veya matched_as fallback
      for (const record of Object.values(allRosters)) {
        if (mapping?.volleybox_url && record.volleybox_url === mapping.volleybox_url) {
          volleyboxRoster = record;
          break;
        }
        if (mapping?.matched_as && record.matched_as === mapping.matched_as) {
          volleyboxRoster = record;
          break;
        }
        if (record.internal_name && slugify(record.internal_name) === cleanSlug) {
          volleyboxRoster = record;
          break;
        }
      }
    }

    if (volleyboxRoster && volleyboxRoster.seasons) {
      // En dolu veya en güncel sezonu seç
      const seasonsEntries = Object.entries(volleyboxRoster.seasons);
      // Öncelik: Oyuncusu olan en güncel sezon
      let selectedSeason = seasonsEntries.find(([_, s]) => s.total_players > 0)?.[1];
      if (!selectedSeason && seasonsEntries.length > 0) {
        selectedSeason = seasonsEntries[0][1];
      }

      if (selectedSeason && selectedSeason.players && selectedSeason.players.length > 0) {
        roster = selectedSeason.players.map((p, idx) => ({
          number: p.number ? parseInt(p.number, 10) || (idx + 1) : idx + 1,
          name: p.name,
          position: p.position || "Bilinmiyor",
          birthYear: p.birth_year || undefined,
          isLibero: p.position === "Libero",
          isCaptain: idx === 0,
        }));
      }
    }
  } catch (err) {
    console.warn("Volleybox kadro verisi okunamadı:", err);
  }

  // Fallback: Eski src/data/rosters.json
  if (!roster) {
    try {
      const rostersPath = path.join(process.cwd(), "src/data/rosters.json");
      if (fs.existsSync(rostersPath)) {
        const rostersData: Record<string, Player[]> = JSON.parse(fs.readFileSync(rostersPath, "utf-8"));
        const possibleSlugs = [
          cleanSlug,
          extractClubRoot(officialTeamName).rootSlug,
          mapping?.internal_name ? slugify(mapping.internal_name) : "",
        ].filter(Boolean);

        for (const s of possibleSlugs) {
          if (rostersData[s]) {
            roster = rostersData[s];
            break;
          }
        }
      }
    } catch {
      // ignore
    }
  }

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
    roster,
    volleyboxRoster,
  };
}
