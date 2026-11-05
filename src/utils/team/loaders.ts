/** Takım verisi yükleyicileri: 81 il maç/puan durumu ve kadro önbellekleri. */
import fs from "fs";
import path from "path";
import { Match } from "@/types/fixture";
import { applyOverridesToMatches, getOverridesDataSync, type MatchOverride } from "../overrides";
import { TeamRostersDatabase } from "@/types/roster";
import { isCityHidden } from "../cityHelper";
import type { StandingsCityEntry } from "./types";

let cachedAllData: {
  matches: Match[];
  standingsByCity: Record<string, StandingsCityEntry>;
  timestamp: number;
  overridesKey: string;
} | null = null;

/** Override uygulanmamış, diskten okunmuş ham veri (deploy boyunca değişmez). */
let rawAllData: {
  matches: Match[];
  standingsByCity: Record<string, StandingsCityEntry>;
  timestamp: number;
} | null = null;

// data/*.json derleme paketinden okunur ve yalnızca yeni deploy ile değişir.
const CACHE_TTL_MS = process.env.NODE_ENV === "production" ? Number.POSITIVE_INFINITY : 60 * 1000;

/** Override kümesinin ucuz imzası: yalnızca bir override eklenir/değişirse yeniden uygulanır. */
function getOverridesKey(overrides: Record<string, MatchOverride>): string {
  return Object.values(overrides)
    .map((o) => `${o.match_id}:${o.updated_at}`)
    .sort()
    .join("|");
}

let cachedRosters: TeamRostersDatabase | null = null;
let rostersTimestamp = 0;

export function loadTeamRosters(): TeamRostersDatabase {
  const now = Date.now();
  if (cachedRosters && now - rostersTimestamp < CACHE_TTL_MS) {
    return cachedRosters;
  }
  const rostersPath = path.join(process.cwd(), "data", "team-rosters.json");
  if (fs.existsSync(rostersPath)) {
    try {
      cachedRosters = JSON.parse(fs.readFileSync(rostersPath, "utf-8"));
      rostersTimestamp = now;
      return cachedRosters!;
    } catch (e) {
      console.error("Error reading team-rosters.json:", e);
    }
  }
  return cachedRosters || {};
}

export function extractVolleyboxTeamId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/-t(\d+)$/);
  if (m) return `t${m[1]}`;
  const m2 = url.match(/\/t(\d+)$/);
  if (m2) return `t${m2[1]}`;
  const parts = url.replace(/\/$/, "").split("/").pop()?.split("-") || [];
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i].startsWith("t") && /^\d+$/.test(parts[i].slice(1))) {
      return parts[i];
    }
  }
  return null;
}

export function loadAllCityData(): {
  matches: Match[];
  standingsByCity: Record<string, StandingsCityEntry>;
  timestamp: number;
} {
  const now = Date.now();
  const overrides = getOverridesDataSync().overrides;
  const currentOverridesKey = getOverridesKey(overrides);

  if (
    cachedAllData &&
    now - cachedAllData.timestamp < CACHE_TTL_MS &&
    cachedAllData.overridesKey === currentOverridesKey
  ) {
    return cachedAllData;
  }

  // Ham veri önbellekte varsa disk I/O yapmadan doğrudan override'ı uygula
  if (rawAllData && now - rawAllData.timestamp < CACHE_TTL_MS) {
    const patchedMatches = applyOverridesToMatches(rawAllData.matches, overrides);
    cachedAllData = {
      matches: patchedMatches,
      standingsByCity: rawAllData.standingsByCity,
      timestamp: now,
      overridesKey: currentOverridesKey,
    };
    return cachedAllData;
  }

  // 1. Ham veriyi diskten yükle
  const raw = readRawDataFromDisk(now);
  rawAllData = raw;

  // 2. Override'ları uygula ve önbellekle
  const patchedMatches = applyOverridesToMatches(raw.matches, overrides);
  cachedAllData = {
    matches: patchedMatches,
    standingsByCity: raw.standingsByCity,
    timestamp: now,
    overridesKey: currentOverridesKey,
  };

  return cachedAllData;
}

/** Diskten salt JSON dosyalarını okur (override uygulamaz). */
function readRawDataFromDisk(now: number): {
  matches: Match[];
  standingsByCity: Record<string, StandingsCityEntry>;
  timestamp: number;
} {
  const allMatches: Match[] = [];
  const standingsByCity: Record<string, StandingsCityEntry> = {};

  const citiesDir = path.join(process.cwd(), "data", "cities");
  if (fs.existsSync(citiesDir)) {
    const files = fs.readdirSync(citiesDir);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const fileSlug = file.replace(/\.json$/, "");
      if (isCityHidden(fileSlug)) continue;

      const fullPath = path.join(citiesDir, file);
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        const parsed = JSON.parse(content);
        const cityName = parsed.city || fileSlug;
        if (isCityHidden(cityName) || isCityHidden(parsed.slug)) continue;

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

  return { matches: allMatches, standingsByCity, timestamp: now };
}

export const loadAllData = loadAllCityData;
