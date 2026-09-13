import mappingsJson from "../../data/volleybox-mappings.json";
import { VolleyboxMapping, VolleyboxMappingsFile } from "@/types/fixture";

/**
 * Normalizes a string for dictionary indexing (lowercased and trimmed).
 */
export function normalizeKey(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * Extracts category classification into "u18", "u16", or undefined.
 */
function extractAgeGroup(category?: string): "u18" | "u16" | undefined {
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

// Module-level cached instance
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
