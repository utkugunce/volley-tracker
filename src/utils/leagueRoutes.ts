import { slugify } from "./slugify";

/**
 * Normalizes a league name and city to return the canonical URL for that league.
 * 
 * Examples:
 * - ("Genç Kızlar Süper Lig", "İstanbul") -> "/lig/istanbul/genc-kizlar-super-lig"
 * - ("TVF Kadınlar 2. Ligi", undefined) -> "/kadinlar-2-ligi"
 * - ("TVF Kadınlar 2. Ligi - Grup 3", undefined) -> "/kadinlar-2-ligi/grup-3"
 */
export function getLeagueRoute(leagueName?: string, city?: string): string {
  if (!leagueName) {
    if (city && city !== "Tüm İller") {
      return `/${slugify(city)}`;
    }
    return "/";
  }

  const cleanLeague = leagueName.trim();

  // TVF Kadınlar 2. Ligi kontrolü
  if (
    cleanLeague.includes("Kadınlar 2. Lig") ||
    cleanLeague.includes("Kadınlar 2.Lig") ||
    cleanLeague.includes("Kadınlar 2. Ligi") ||
    city === "TVF Kadınlar 2. Ligi"
  ) {
    const groupMatch = cleanLeague.match(/(?:Grup\s*|grup-?|g)(\d+)/i);
    if (groupMatch) {
      const gNo = parseInt(groupMatch[1], 10);
      if (gNo >= 1 && gNo <= 16) {
        return `/kadinlar-2-ligi/grup-${gNo}`;
      }
    }
    return "/kadinlar-2-ligi";
  }

  // Eğer lig isminde şehir prefix'i varsa ("İstanbul • Genç Kızlar Süper Lig" veya "İzmir - Yıldız Kızlar")
  let effectiveCity = city;
  let effectiveLeague = cleanLeague;

  if (cleanLeague.includes("•")) {
    const parts = cleanLeague.split("•").map((s) => s.trim());
    if (parts.length >= 2) {
      effectiveCity = parts[0];
      effectiveLeague = parts.slice(1).join(" - ");
    }
  }

  const citySlug = effectiveCity && effectiveCity !== "Tüm İller" && effectiveCity !== "all"
    ? slugify(effectiveCity)
    : "";

  let leagueSlug = slugify(effectiveLeague);

  // Eğer leagueSlug zaten citySlug ile başlıyorsa temizle (örn. "istanbul-genc-kizlar" -> "genc-kizlar")
  if (citySlug && leagueSlug.startsWith(`${citySlug}-`)) {
    leagueSlug = leagueSlug.slice(citySlug.length + 1);
  }

  if (citySlug && leagueSlug) {
    return `/lig/${citySlug}/${leagueSlug}`;
  }

  if (leagueSlug) {
    return `/lig/${leagueSlug}`;
  }

  if (citySlug) {
    return `/${citySlug}`;
  }

  return "/";
}

/**
 * Returns the URL to the league's standings tab or page.
 */
export function getLeagueStandingsRoute(leagueName?: string, city?: string): string {
  const base = getLeagueRoute(leagueName, city);
  if (base.startsWith("/kadinlar-2-ligi")) {
    const groupMatch = base.match(/grup-(\d+)/);
    if (groupMatch) {
      return `/kadinlar-2-ligi/puan-durumu/grup-${groupMatch[1]}`;
    }
    return "/kadinlar-2-ligi/puan-durumu";
  }

  if (base.startsWith("/lig/")) {
    return `${base}?tab=standings`;
  }

  if (city && city !== "Tüm İller") {
    return `/puan-durumu/${slugify(city)}`;
  }

  return "/puan-durumu";
}

/**
 * Returns the URL to the league's fixtures tab or page.
 */
export function getLeagueFixtureRoute(leagueName?: string, city?: string): string {
  const base = getLeagueRoute(leagueName, city);
  if (base.startsWith("/kadinlar-2-ligi")) {
    const groupMatch = base.match(/grup-(\d+)/);
    if (groupMatch) {
      return `/kadinlar-2-ligi/fikstur/grup-${groupMatch[1]}`;
    }
    return "/kadinlar-2-ligi/fikstur";
  }

  if (base.startsWith("/lig/")) {
    return `${base}?tab=fixtures`;
  }

  if (city && city !== "Tüm İller") {
    return `/fikstur/${slugify(city)}`;
  }

  return "/fikstur";
}
