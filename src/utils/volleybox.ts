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
  return text.trim().toLowerCase();
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

    const teamKey = normalizeKey(item.internal_name);
    const catKey = normalizeKey(item.internal_category);

    // Tam eşleşme: "vakıfbank::genç kızlar süper lig"
    map.set(`${teamKey}::${catKey}`, item);

    // Yaş grubu bazlı indeks: "vakıfbank::u18"
    const age = extractAgeGroup(item.internal_category) || (item.age_category?.toLowerCase() as "u18" | "u16");
    if (age) {
      map.set(`${teamKey}::${age}`, item);
    }

    // Genel takım adı fallback (verified olan önceliklidir)
    if (!map.has(teamKey) || map.get(teamKey)?.confidence !== "verified") {
      map.set(teamKey, item);
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
 * Retrieves the Volleybox profile mapping for a given team name and category.
 * Returns undefined if no mapping exists or if marked broken.
 */
export function getVolleyboxMapping(
  teamName: string,
  category?: string,
  customMap?: Map<string, VolleyboxMapping>
): VolleyboxMapping | undefined {
  if (!teamName || !teamName.trim()) {
    return undefined;
  }

  const map = customMap || getDefaultVolleyboxMap();
  const teamKey = normalizeKey(teamName);

  if (category) {
    const rawCat = normalizeKey(category);

    // 1. Doğrudan takım ve kategori string eşleşmesi
    const directMatch = map.get(`${teamKey}::${rawCat}`);
    if (directMatch) return directMatch;

    // 2. Kategori " - " içeriyorsa lig kısmını ayırıp dene ("Genç Kızlar Süper Lig - A Grubu" -> "Genç Kızlar Süper Lig")
    const leaguePart = rawCat.split(" - ")[0].trim();
    if (leaguePart) {
      const leagueMatch = map.get(`${teamKey}::${leaguePart}`);
      if (leagueMatch) return leagueMatch;
    }

    // 3. Yaş grubu etiketi ile dene (u18 veya u16)
    const age = extractAgeGroup(category);
    if (age) {
      const ageMatch = map.get(`${teamKey}::${age}`);
      if (ageMatch) return ageMatch;
    }
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
  }

  // 2. Şehirsiz genel lig adı veya yaş grubu
  const directMatch = map.get(leagueClean);
  if (directMatch) return directMatch;

  if (age) {
    const ageMatch = map.get(age);
    if (ageMatch) return ageMatch;
  }

  return undefined;
}

