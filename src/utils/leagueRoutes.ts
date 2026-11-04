import { slugify } from "./slugify";

/**
 * Normalizes a league name and city to return the canonical URL for that league.
 * 
 * Examples:
 * - ("Genç Kızlar Süper Lig", "İstanbul") -> "/lig/istanbul/genc-kizlar-super-lig"
 */
export function getLeagueRoute(leagueName?: string, city?: string): string {
  if (!leagueName) {
    if (city && city !== "Tüm İller") {
      return `/${slugify(city)}`;
    }
    return "/";
  }

  const cleanLeague = leagueName.trim();

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

  if (base.startsWith("/lig/")) {
    return `${base}?tab=fixtures`;
  }

  if (city && city !== "Tüm İller") {
    return `/fikstur/${slugify(city)}`;
  }

  return "/fikstur";
}
