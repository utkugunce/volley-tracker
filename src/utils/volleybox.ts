import mappingsJson from "../../data/volleybox-mappings.json";
import {
  VolleyboxMapping,
  VolleyboxLeagueMapping,
  VolleyboxMappingsFile,
} from "@/types/fixture";

/**
 * Normalizes a string for dictionary indexing (lowercased and trimmed).
 */
export function normalizeKey(text: string): string {
  return text.trim().toLocaleLowerCase("tr-TR");
}

/**
 * Extracts category classification into "u18", "u16", or undefined.
 */
export function extractAgeGroup(category?: string): "u18" | "u16" | undefined {
  if (!category) return undefined;
  const lower = category.toLowerCase();
  if (lower.includes("genç") || lower.includes("u18") || lower.includes("genc")) {
    return "u18";
  }
  if (lower.includes("yıldız") || lower.includes("u16") || lower.includes("yildiz")) {
    return "u16";
  }
  return undefined;
}

/**
 * Normalizes Turkish city name to a standard slug for indexing.
 */
export function normalizeCitySlug(city?: string): string {
  if (!city) return "";
  return city
    .toLowerCase()
    .trim()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Builds an index Map from mappings data.
 * Keys stored:
 * - `team::category` (exact)
 * - `team::ageGroup` (e.g. team::u18 or team::u16)
 * - `team` (general fallback)
 */
export function buildVolleyboxMap(
  data: VolleyboxMappingsFile = mappingsJson as unknown as VolleyboxMappingsFile
): Map<string, VolleyboxMapping> {
  const map = new Map<string, VolleyboxMapping>();

  for (const item of data.mappings || []) {
    // Kırık linkler kullanıcıya gösterilmez
    if (item.confidence === "broken") continue;

    const catKey = normalizeKey(item.internal_category);
    const citySlug = normalizeCitySlug(item.city || item.city_slug);
    const age = extractAgeGroup(item.internal_category) || (item.age_category?.toLowerCase() as "u18" | "u16");

    const allNames = [item.internal_name, ...(item.aliases || []), ...(item.synonyms || [])];
    for (const name of allNames) {
      if (!name) continue;
      const teamKey = normalizeKey(name);

      // Şehir spesifik indeksler
      if (citySlug) {
        map.set(`${teamKey}::${catKey}::${citySlug}`, item);
        if (age) {
          map.set(`${teamKey}::${age}::${citySlug}`, item);
        }
        map.set(`${teamKey}::${citySlug}`, item);
      }

      // Genel indeksler (şehir verilmediğinde veya genel fallback)
      if (!map.has(`${teamKey}::${catKey}`)) {
        map.set(`${teamKey}::${catKey}`, item);
      }

      if (age && !map.has(`${teamKey}::${age}`)) {
        map.set(`${teamKey}::${age}`, item);
      }

      // Genel takım adı fallback (verified olan önceliklidir)
      if (!map.has(teamKey) || map.get(teamKey)?.confidence !== "verified") {
        map.set(teamKey, item);
      }
    }
  }

  return map;
}

// Module-level cached instance for teams
let cachedMap: Map<string, VolleyboxMapping> | null = null;

export function getDefaultVolleyboxMap(): Map<string, VolleyboxMapping> {
  if (!cachedMap) {
    cachedMap = buildVolleyboxMap();
  }
  return cachedMap;
}

/**
 * Retrieves the Volleybox profile mapping for a given team name, category and optional city.
 * Returns undefined if no mapping exists or if marked broken.
 */
export function getVolleyboxMapping(
  teamName: string,
  category?: string,
  customMap?: Map<string, VolleyboxMapping>,
  city?: string
): VolleyboxMapping | undefined {
  if (!teamName || !teamName.trim()) {
    return undefined;
  }

  const map = customMap || getDefaultVolleyboxMap();
  const teamKey = normalizeKey(teamName);
  const citySlug = normalizeCitySlug(city);

  if (category) {
    const rawCat = normalizeKey(category);
    const leaguePart = rawCat.split(" - ")[0].trim();
    const age = extractAgeGroup(category);

    // 1. Şehir + Kategori / Yaş grubu spesifik eşleşmeler
    if (citySlug) {
      const matchCityCat = map.get(`${teamKey}::${rawCat}::${citySlug}`);
      if (matchCityCat) return matchCityCat;

      if (leaguePart) {
        const matchCityLeague = map.get(`${teamKey}::${leaguePart}::${citySlug}`);
        if (matchCityLeague) return matchCityLeague;
      }

      if (age) {
        const matchCityAge = map.get(`${teamKey}::${age}::${citySlug}`);
        if (matchCityAge) return matchCityAge;
      }
    }

    // 2. Kategori bazlı genel eşleşmeler
    const directMatch = map.get(`${teamKey}::${rawCat}`);
    if (directMatch) return directMatch;

    if (leaguePart) {
      const leagueMatch = map.get(`${teamKey}::${leaguePart}`);
      if (leagueMatch) return leagueMatch;
    }

    if (age) {
      const ageMatch = map.get(`${teamKey}::${age}`);
      if (ageMatch) return ageMatch;
    }

    // 3. Şehir bazlı genel eşleşme fallback
    if (citySlug) {
      const matchCity = map.get(`${teamKey}::${citySlug}`);
      if (matchCity) return matchCity;
    }
  } else if (citySlug) {
    const matchCity = map.get(`${teamKey}::${citySlug}`);
    if (matchCity) return matchCity;
  }

  // 4. Takım adıyla genel eşleşme fallback
  return map.get(teamKey);
}

/**
 * Builds an index Map from league mappings data.
 * Keys stored:
 * - `league::city`
 * - `ageGroup::city` (e.g. u18::istanbul)
 * - `ageGroup` (default fallback, e.g. u18)
 * - `league` (default fallback)
 */
export function buildVolleyboxLeagueMap(
  data: VolleyboxMappingsFile = mappingsJson as unknown as VolleyboxMappingsFile
): Map<string, VolleyboxLeagueMapping> {
  const map = new Map<string, VolleyboxLeagueMapping>();

  for (const item of data.leagues || []) {
    if (item.confidence === "broken") continue;
    // Sezon kontrolü: Sadece güncel sezona (2026/27) ait turnuva profilleri indekslenir
    if (item.season && item.season !== "2026/27") continue;

    const leagueKey = normalizeKey(item.internal_name);
    const citySlug = normalizeCitySlug(item.city_slug || item.city);
    const age = item.age_category?.toLowerCase() || extractAgeGroup(item.internal_name);

    if (citySlug) {
      map.set(`${leagueKey}::${citySlug}`, item);
      if (age) {
        map.set(`${age}::${citySlug}`, item);
      }
    }

    // İstanbul veya ilk gelen kayıt genel varsayılan (fallback) olur
    if (!map.has(leagueKey) || citySlug === "istanbul") {
      map.set(leagueKey, item);
      if (age) {
        map.set(age, item);
      }
    }
  }

  return map;
}

// Module-level cached instance for leagues
let cachedLeagueMap: Map<string, VolleyboxLeagueMapping> | null = null;

export function getDefaultVolleyboxLeagueMap(): Map<string, VolleyboxLeagueMapping> {
  if (!cachedLeagueMap) {
    cachedLeagueMap = buildVolleyboxLeagueMap();
  }
  return cachedLeagueMap;
}

/**
 * Retrieves the Volleybox tournament profile for a given league name and city.
 */
export function getVolleyboxLeagueMapping(
  leagueName: string,
  city?: string,
  customMap?: Map<string, VolleyboxLeagueMapping>
): VolleyboxLeagueMapping | undefined {
  if (!leagueName || !leagueName.trim()) {
    return undefined;
  }

  const map = customMap || getDefaultVolleyboxLeagueMap();
  const rawLeague = normalizeKey(leagueName);
  const leagueClean = rawLeague.split(" - ")[0].trim();
  const citySlug = normalizeCitySlug(city);
  const age = extractAgeGroup(leagueName);

  // 1. Şehir ve tam lig adı
  if (citySlug) {
    const directCityMatch = map.get(`${leagueClean}::${citySlug}`);
    if (directCityMatch) return directCityMatch;

    if (age) {
      const ageCityMatch = map.get(`${age}::${citySlug}`);
      if (ageCityMatch) return ageCityMatch;
    }

    // Belirli bir il belirtildiyse ve o ilde turnuva bulunamadıysa (veya eski sezonsa),
    // asla başka bir ilin (örn. İstanbul) turnuvasına sessizce fallback yapma!
    return undefined;
  }

  // 2. Şehir belirtilmediyse genel lig adı veya yaş grubu
  const directMatch = map.get(leagueClean);
  if (directMatch) return directMatch;

  if (age) {
    const ageMatch = map.get(age);
    if (ageMatch) return ageMatch;
  }

  return undefined;
}

