/** Takım slug'ı → maç/puan durumu satırları ters indeksi. */
import { Match, StandingItem, VolleyboxMapping } from "@/types/fixture";
import { slugify } from "../slugify";
import { getVolleyboxMapping, normalizeCitySlug } from "../volleybox";
import type { StandingsCityEntry } from "./types";

interface AllCityData {
  matches: Match[];
  standingsByCity: Record<string, StandingsCityEntry>;
  timestamp: number;
}

interface StandingHit {
  cityName: string;
  groupName: string;
  table: StandingItem[];
  row: StandingItem;
  rowMapping: VolleyboxMapping | undefined;
}

/**
 * Takım sayfası için ters indeks (slug → maç/puan durumu satırları).
 * Önceden her istekte tüm maçlar üzerinde (maç başına 2 Volleybox eşleştirmesi + slugify) tarama yapılıyordu;
 * indeks veri yüklemesiyle birlikte bir kez kurulur (cachedAllData ile aynı ömürde) ve istek başına yalnızca
 * ilgili takımın satırlarına bakılır.
 */
interface SlugIndex {
  homeMapping: Array<VolleyboxMapping | undefined>;
  awayMapping: Array<VolleyboxMapping | undefined>;
  homeKeys: Array<Set<string>>;
  awayKeys: Array<Set<string>>;
  matchesBySlug: Map<string, number[]>;
  standingsBySlug: Map<string, StandingHit[]>;
  knownCitySlugs: Set<string>;
}

const slugIndexCache = new WeakMap<AllCityData, SlugIndex>();

function slugKeysOf(team: string, mapping: VolleyboxMapping | undefined): Set<string> {
  const keys = new Set<string>([slugify(team)]);
  if (mapping?.matched_as) keys.add(slugify(mapping.matched_as));
  if (mapping?.internal_name) keys.add(slugify(mapping.internal_name));
  return keys;
}

export function getSlugIndex(data: AllCityData): SlugIndex {
  const cached = slugIndexCache.get(data);
  if (cached) return cached;

  const { matches, standingsByCity } = data;
  const homeMapping: Array<VolleyboxMapping | undefined> = new Array(matches.length);
  const awayMapping: Array<VolleyboxMapping | undefined> = new Array(matches.length);
  const homeKeys: Array<Set<string>> = new Array(matches.length);
  const awayKeys: Array<Set<string>> = new Array(matches.length);
  const matchesBySlug = new Map<string, number[]>();
  const knownCitySlugs = new Set<string>();

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const mCity = m.city || "İstanbul";
    if (m.city) knownCitySlugs.add(normalizeCitySlug(m.city));
    homeMapping[i] = getVolleyboxMapping(m.home_team, m.category, undefined, mCity);
    awayMapping[i] = getVolleyboxMapping(m.away_team, m.category, undefined, mCity);
    homeKeys[i] = slugKeysOf(m.home_team, homeMapping[i]);
    awayKeys[i] = slugKeysOf(m.away_team, awayMapping[i]);
    const all = new Set<string>([...homeKeys[i], ...awayKeys[i]]);
    for (const key of all) {
      const list = matchesBySlug.get(key);
      if (list) list.push(i);
      else matchesBySlug.set(key, [i]);
    }
  }

  const standingsBySlug = new Map<string, StandingHit[]>();
  for (const [cityName, cityGroup] of Object.entries(standingsByCity)) {
    knownCitySlugs.add(normalizeCitySlug(cityName));
    for (const [groupName, groupData] of Object.entries(cityGroup.standings)) {
      const table: StandingItem[] = Array.isArray(groupData)
        ? groupData
        : groupData?.table || [];
      const seen = new Set<string>();
      for (const row of table) {
        const rowMapping = getVolleyboxMapping(row.team, undefined, undefined, cityName);
        for (const key of slugKeysOf(row.team, rowMapping)) {
          if (seen.has(key)) continue; // table.find → grup başına ilk eşleşen satır
          seen.add(key);
          const hit: StandingHit = { cityName, groupName, table, row, rowMapping };
          const list = standingsBySlug.get(key);
          if (list) list.push(hit);
          else standingsBySlug.set(key, [hit]);
        }
      }
    }
  }

  const index: SlugIndex = {
    homeMapping,
    awayMapping,
    homeKeys,
    awayKeys,
    matchesBySlug,
    standingsBySlug,
    knownCitySlugs,
  };
  slugIndexCache.set(data, index);
  return index;
}
