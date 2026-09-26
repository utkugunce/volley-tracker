import fs from "fs";
import path from "path";
import { Match, StandingItem, VolleyboxLeagueMapping } from "@/types/fixture";
import { slugify } from "./slugify";
import { getVolleyboxLeagueMapping, extractAgeGroup } from "./volleybox";
import { compareMatchDateTime } from "./calendar";

export interface LeagueGroupStanding {
  groupName: string;
  rawGroup: string;
  table: StandingItem[];
}

export interface LeagueTeamSummary {
  name: string;
  slug: string;
  rank?: number;
  points?: number;
  played: number;
  won: number;
  lost: number;
  setsWon: number;
  setsLost: number;
  setRatio?: string;
  pointsWon?: number;
  pointsLost?: number;
  group?: string;
}

export interface LeagueStats {
  totalMatches: number;
  finishedMatches: number;
  upcomingMatches: number;
  forfeitMatches: number;
  totalTeams: number;
  totalSets: number;
  avgSetsPerMatch: string;
  leaderTeam?: {
    name: string;
    points: number;
    played: number;
    won: number;
    rank: number;
  };
  mostSetsWonTeam?: {
    name: string;
    setsWon: number;
  };
  undefeatedTeams: string[];
}

export interface LeagueData {
  leagueName: string;
  leagueSlug: string;
  city: string;
  citySlug: string;
  ageGroup: string; // e.g. "U18", "U16", "Büyük Kadınlar"
  category: string; // e.g. "Genç Kızlar Süper Lig"
  season: string;
  source?: string;
  updatedAt: string;
  groups: LeagueGroupStanding[];
  matches: Match[];
  upcomingMatches: Match[];
  finishedMatches: Match[];
  teams: LeagueTeamSummary[];
  stats: LeagueStats;
  halls: string[];
  volleyboxMapping?: VolleyboxLeagueMapping;
}

/**
 * Searches and loads all information for a specific league in a given city or across all cities.
 */
export function getLeagueData(citySlug: string, leagueSlug: string): LeagueData | null {
  const citiesDir = path.join(process.cwd(), "data", "cities");

  // Kadınlar 2. Ligi kontrolü
  if (citySlug === "kadinlar-2-ligi" || leagueSlug === "kadinlar-2-ligi" || leagueSlug.startsWith("kadinlar-2-lig")) {
    const k2Path = path.join(process.cwd(), "data", "kadinlar_2_lig.json");
    if (fs.existsSync(k2Path)) {
      try {
        const k2Data = JSON.parse(fs.readFileSync(k2Path, "utf-8"));
        const matches: Match[] = [];
        const groups: LeagueGroupStanding[] = [];
        const teamsMap = new Map<string, LeagueTeamSummary>();

        let totalSets = 0;
        let finishedMatches = 0;
        let upcomingMatches = 0;
        let forfeitMatches = 0;

        for (const g of k2Data.gruplar || []) {
          const groupTable: StandingItem[] = (g.puan_durumu || []).map((row: any) => ({
            rank: row.sira || 0,
            team: row.takim_adi || "",
            played: row.o || 0,
            won: row.g || 0,
            lost: row.m || 0,
            points: row.p || 0,
            sets_won: row.as || 0,
            sets_lost: row.vs || 0,
            set_ratio: String(row.sav || "0"),
            points_won: row.asp || 0,
            points_lost: row.vsp || 0,
            point_ratio: String(row.spav || "0"),
          }));

          groups.push({
            groupName: g.grup_adi || `Grup ${g.grup_no}`,
            rawGroup: `Grup ${g.grup_no}`,
            table: groupTable,
          });

          for (const row of groupTable) {
            teamsMap.set(row.team, {
              name: row.team,
              slug: slugify(row.team),
              rank: row.rank,
              points: row.points,
              played: row.played,
              won: row.won,
              lost: row.lost,
              setsWon: row.sets_won,
              setsLost: row.sets_lost,
              setRatio: row.set_ratio,
              group: g.grup_adi,
            });
          }
        }

        for (const m of k2Data.tum_maclar || []) {
          const isFin = m.durum === "BİTTİ" || (m.skor && m.skor.includes("-") && m.skor.trim() !== "-");
          if (isFin) finishedMatches++;
          else upcomingMatches++;

          let homeScore: number | null = null;
          let awayScore: number | null = null;
          if (m.skor && m.skor.includes("-")) {
            const [hs, as] = m.skor.split("-").map((s: string) => parseInt(s.trim(), 10));
            if (!isNaN(hs)) homeScore = hs;
            if (!isNaN(as)) awayScore = as;
            if (homeScore !== null && awayScore !== null) totalSets += homeScore + awayScore;
          }

          matches.push({
            id: String(m.id || `${m.grup_no}-${m.takim_a}-${m.takim_b}`),
            city: m.sehir || "Türkiye",
            date: m.tarih || "",
            time: m.saat || "",
            hall: m.salon || "",
            category: "TVF Kadınlar 2. Ligi",
            age_group: "Büyük Kadınlar",
            gender: "Kadın",
            group: m.grup_adi,
            match_no: String(m.mac_no || ""),
            home_team: m.takim_a || "",
            away_team: m.takim_b || "",
            score: m.skor || "- : -",
            home_score: homeScore,
            away_score: awayScore,
            status: isFin ? "finished" : "upcoming",
            volleybox: m.volleybox,
          });
        }

        const teams = Array.from(teamsMap.values()).sort((a, b) => (b.points || 0) - (a.points || 0));
        const leader = teams[0];
        const undefeated = teams.filter((t) => t.played > 0 && t.lost === 0).map((t) => t.name);
        const mostSets = [...teams].sort((a, b) => b.setsWon - a.setsWon)[0];

        return {
          leagueName: "TVF Kadınlar 2. Ligi",
          leagueSlug: "kadinlar-2-ligi",
          city: "Türkiye",
          citySlug: "turkiye",
          ageGroup: "Büyük Kadınlar",
          category: "Kadınlar 2. Ligi",
          season: "2026-2027",
          source: k2Data.metadata?.resmi_kaynaklar?.tvf_fikstur,
          updatedAt: k2Data.metadata?.guncellenme_zamani || new Date().toISOString(),
          groups,
          matches,
          upcomingMatches: matches.filter((m) => m.status === "upcoming"),
          finishedMatches: matches.filter((m) => m.status === "finished"),
          teams,
          stats: {
            totalMatches: matches.length,
            finishedMatches,
            upcomingMatches,
            forfeitMatches,
            totalTeams: teams.length,
            totalSets,
            avgSetsPerMatch: finishedMatches > 0 ? (totalSets / finishedMatches).toFixed(1) : "0",
            leaderTeam: leader
              ? { name: leader.name, points: leader.points || 0, played: leader.played, won: leader.won, rank: 1 }
              : undefined,
            mostSetsWonTeam: mostSets ? { name: mostSets.name, setsWon: mostSets.setsWon } : undefined,
            undefeatedTeams: undefeated,
          },
          halls: Array.from(new Set(matches.map((m) => m.hall).filter(Boolean))),
          volleyboxMapping: getVolleyboxLeagueMapping("TVF Kadınlar 2. Ligi"),
        };
      } catch (e) {
        console.error("Error loading kadinlar 2 lig in leagueData:", e);
      }
    }
  }

  // Altyapı ligleri: İlgili il dosyasını oku
  let cityFile = path.join(citiesDir, `${citySlug}.json`);
  let parsedCity: any = null;

  if (fs.existsSync(cityFile)) {
    try {
      parsedCity = JSON.parse(fs.readFileSync(cityFile, "utf-8"));
    } catch (e) {
      console.error(`Error reading ${cityFile}:`, e);
    }
  }

  // Eğer doğrudan şehir dosyası bulunamazsa tüm şehir dosyalarını tara
  if (!parsedCity && fs.existsSync(citiesDir)) {
    const files = fs.readdirSync(citiesDir).filter((f) => f.endsWith(".json"));
    for (const f of files) {
      try {
        const d = JSON.parse(fs.readFileSync(path.join(citiesDir, f), "utf-8"));
        if (slugify(d.city || "") === citySlug) {
          parsedCity = d;
          break;
        }
      } catch {}
    }
  }

  if (!parsedCity) {
    return null;
  }

  const cityName = parsedCity.city || citySlug;
  const allMatches: Match[] = parsedCity.matches || [];
  const allStandings: Record<string, StandingItem[]> = parsedCity.standings || {};

  // Bu lig ile eşleşen maçları filtrele
  const matchingMatches = allMatches.filter((m) => {
    const catSlug = slugify(m.category || "");
    const matchLeagueSlug = slugify(`${m.category || ""} ${m.group || ""}`);
    return (
      catSlug === leagueSlug ||
      leagueSlug === catSlug ||
      catSlug.includes(leagueSlug) ||
      leagueSlug.includes(catSlug) ||
      matchLeagueSlug.includes(leagueSlug)
    );
  });

  // Eğer kategori eşleşen maç yoksa en yakın kategoriyi bul
  const selectedCategory = matchingMatches.length > 0
    ? matchingMatches[0].category
    : Object.keys(allStandings).find((k) => slugify(k).includes(leagueSlug))?.split(" - ")[0] || leagueSlug;

  const relevantMatches = matchingMatches.length > 0
    ? matchingMatches
    : allMatches.filter((m) => m.category === selectedCategory);

  // Bu lige ait puan durumlarını filtrele
  const groups: LeagueGroupStanding[] = [];
  const cleanCatSlug = slugify(selectedCategory);

  for (const [groupName, table] of Object.entries(allStandings)) {
    const groupSlug = slugify(groupName);
    if (
      groupSlug.includes(cleanCatSlug) ||
      groupSlug.includes(leagueSlug) ||
      groupName.toLowerCase().includes(selectedCategory.toLowerCase())
    ) {
      const parts = groupName.split(" - ");
      const rawGroup = parts.length > 1 ? parts.slice(1).join(" - ").trim() : groupName;
      groups.push({
        groupName,
        rawGroup: rawGroup || "Tek Grup",
        table: Array.isArray(table) ? table : [],
      });
    }
  }

  // Takımları puan durumu ve maçlardan topla
  const teamsMap = new Map<string, LeagueTeamSummary>();

  for (const g of groups) {
    for (const row of g.table) {
      teamsMap.set(row.team, {
        name: row.team,
        slug: slugify(row.team),
        rank: row.rank,
        points: row.points,
        played: row.played,
        won: row.won,
        lost: row.lost,
        setsWon: row.sets_won,
        setsLost: row.sets_lost,
        setRatio: row.set_ratio,
        pointsWon: row.points_won,
        pointsLost: row.points_lost,
        group: g.rawGroup,
      });
    }
  }

  // Puan durumunda olmayan ama maçlarda yer alan takımları ekle
  for (const m of relevantMatches) {
    if (m.home_team && !teamsMap.has(m.home_team)) {
      teamsMap.set(m.home_team, {
        name: m.home_team,
        slug: slugify(m.home_team),
        played: 0,
        won: 0,
        lost: 0,
        setsWon: 0,
        setsLost: 0,
      });
    }
    if (m.away_team && !teamsMap.has(m.away_team)) {
      teamsMap.set(m.away_team, {
        name: m.away_team,
        slug: slugify(m.away_team),
        played: 0,
        won: 0,
        lost: 0,
        setsWon: 0,
        setsLost: 0,
      });
    }
  }

  // İstatistikleri hesapla
  let totalSets = 0;
  let finishedMatches = 0;
  let upcomingMatches = 0;
  let forfeitMatches = 0;

  for (const m of relevantMatches) {
    if (m.status === "finished") {
      finishedMatches++;
      if (m.home_score !== null && m.away_score !== null) {
        totalSets += (m.home_score || 0) + (m.away_score || 0);
      }
      if (
        (m.set_scores && m.set_scores.some((s) => s.includes("25-0") || s.includes("0-25"))) ||
        (m.score && (m.score.includes("Hükmen") || m.score.includes("3 - 0 (H)")))
      ) {
        forfeitMatches++;
      }
    } else {
      upcomingMatches++;
    }
  }

  // Maçları tarihe göre sırala
  relevantMatches.sort((a, b) => compareMatchDateTime(a, b, "asc"));

  const teams = Array.from(teamsMap.values()).sort((a, b) => {
    if ((b.points ?? -1) !== (a.points ?? -1)) {
      return (b.points ?? -1) - (a.points ?? -1);
    }
    return (a.rank ?? 99) - (b.rank ?? 99);
  });

  const leader = teams.find((t) => t.rank === 1) || teams[0];
  const undefeated = teams.filter((t) => t.played > 0 && t.lost === 0).map((t) => t.name);
  const mostSets = [...teams].sort((a, b) => b.setsWon - a.setsWon)[0];
  const ageGroup = extractAgeGroup(selectedCategory) === "u18" ? "U18 (Genç Kızlar)" : extractAgeGroup(selectedCategory) === "u16" ? "U16 (Yıldız Kızlar)" : "Altyapı";

  return {
    leagueName: `${cityName} ${selectedCategory}`,
    leagueSlug,
    city: cityName,
    citySlug: slugify(cityName),
    ageGroup,
    category: selectedCategory,
    season: "2026-2027",
    source: parsedCity.source,
    updatedAt: parsedCity.updated_at || new Date().toISOString(),
    groups,
    matches: relevantMatches,
    upcomingMatches: relevantMatches.filter((m) => m.status !== "finished"),
    finishedMatches: relevantMatches.filter((m) => m.status === "finished"),
    teams,
    stats: {
      totalMatches: relevantMatches.length,
      finishedMatches,
      upcomingMatches,
      forfeitMatches,
      totalTeams: teams.length,
      totalSets,
      avgSetsPerMatch: finishedMatches > 0 ? (totalSets / finishedMatches).toFixed(1) : "0",
      leaderTeam: leader
        ? { name: leader.name, points: leader.points || 0, played: leader.played, won: leader.won, rank: leader.rank || 1 }
        : undefined,
      mostSetsWonTeam: mostSets ? { name: mostSets.name, setsWon: mostSets.setsWon } : undefined,
      undefeatedTeams: undefeated,
    },
    halls: Array.from(new Set(relevantMatches.map((m) => m.hall).filter(Boolean))),
    volleyboxMapping: getVolleyboxLeagueMapping(selectedCategory, cityName),
  };
}
