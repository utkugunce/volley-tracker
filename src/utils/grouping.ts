import { Match } from "@/types/fixture";

/**
 * Normalizes raw group strings (e.g. "Genç Kız - A Gr", "Yıldız Kızlar B Grubu")
 * to clean, readable group titles (e.g. "A Grubu", "B Grubu", "Doğu Grubu").
 */
export function formatGroupName(rawGroup?: string): string {
  if (!rawGroup || rawGroup.trim() === "" || rawGroup === "Tek Grup") {
    return "Tek Grup";
  }
  let g = rawGroup.trim();

  // Pattern: "... - A Gr" or "... - A Grubu"
  const dashMatch = g.match(/[-–]\s*([A-Za-zÇĞİÖŞÜçğiöşü0-9]+)\s*(?:Gr\.?|Grubu)?$/i);
  if (dashMatch && dashMatch[1]) {
    return dashMatch[1].toLocaleUpperCase("tr-TR") + " Grubu";
  }

  // If starts with "Genç Kızlar", "Yıldız Kızlar", etc., strip league prefix
  g = g.replace(/^(?:Genç|Yıldız|Küçük|Midi|Mini)\s*(?:Kızlar?|Erkekler?)?\s*/i, "").trim();
  if (/grubu?$/i.test(g)) {
    return g.replace(/grup$/i, "Grubu");
  }
  return g + " Grubu";
}

/**
 * Normalizes league category titles to include age group code (U18, U16, etc.)
 * e.g. "Genç Kızlar Süper Lig" -> "Genç Kızlar Süper Lig (U18)"
 */
export function formatLeagueCategoryTitle(category?: string, ageGroup?: string): string {
  if (!category) return "";
  let cat = category.trim();
  const lower = cat.toLowerCase();

  // If it already has an age code (U18, U16, etc.), return as is
  if (/\bu\d{2}\b/i.test(lower)) {
    return cat;
  }

  let ageCode = "";
  if (lower.includes("genç") || ageGroup?.toLowerCase().includes("genç")) {
    ageCode = "U18";
  } else if (lower.includes("yıldız") || ageGroup?.toLowerCase().includes("yıldız")) {
    ageCode = "U16";
  } else if (lower.includes("küçük") || ageGroup?.toLowerCase().includes("küçük")) {
    ageCode = "U14";
  } else if (lower.includes("midi") || ageGroup?.toLowerCase().includes("midi")) {
    ageCode = "U13";
  } else if (lower.includes("mini") || ageGroup?.toLowerCase().includes("mini")) {
    ageCode = "U12";
  }

  if (ageCode) {
    return `${cat} (${ageCode})`;
  }
  return cat;
}

export interface CityResultGroup {
  city: string;
  totalMatches: number;
  leagues: {
    categoryKey: string;
    title: string;
    subTitle: string;
    rawCategory: string;
    ageGroup?: string;
    city: string;
    matches: Match[];
  }[];
}

/**
 * Groups matches first by City, then by League (unifying all groups of the same league).
 * Inside each league, matches are sorted by group name, then by match datetime.
 */
export function groupResultsByCityAndLeague(
  matches: Match[],
  defaultCity = "Tüm İller"
): CityResultGroup[] {
  const cityMap = new Map<
    string,
    Map<string, { title: string; rawCategory: string; ageGroup?: string; matches: Match[] }>
  >();

  for (const m of matches) {
    const city = m.city || defaultCity || "Genel";
    if (!cityMap.has(city)) {
      cityMap.set(city, new Map());
    }
    const leagueMap = cityMap.get(city)!;

    const rawCategory = m.category || m.age_group || "Genel Lig";
    const leagueTitle = formatLeagueCategoryTitle(rawCategory, m.age_group);

    if (!leagueMap.has(rawCategory)) {
      leagueMap.set(rawCategory, {
        title: leagueTitle,
        rawCategory,
        ageGroup: m.age_group,
        matches: [],
      });
    }
    leagueMap.get(rawCategory)!.matches.push(m);
  }

  const result: CityResultGroup[] = [];

  for (const [cityName, leagueMap] of cityMap.entries()) {
    let totalCityMatches = 0;
    const leagues: CityResultGroup["leagues"] = [];

    for (const [rawCategory, data] of leagueMap.entries()) {
      totalCityMatches += data.matches.length;

      // Sort matches in this league: by group name first (A Grubu, B Grubu...), then by datetime desc
      const sortedMatches = [...data.matches].sort((m1, m2) => {
        const g1 = formatGroupName(m1.group);
        const g2 = formatGroupName(m2.group);
        const groupComp = g1.localeCompare(g2, "tr", { numeric: true });
        if (groupComp !== 0) return groupComp;

        // Same group: sort by date (descending for results) then time (ascending)
        if (m1.date !== m2.date) {
          return m2.date.localeCompare(m1.date);
        }
        return m1.time.localeCompare(m2.time);
      });

      const uniqueGroups = Array.from(new Set(sortedMatches.map((m) => formatGroupName(m.group)).filter(Boolean)));
      const subTitle = uniqueGroups.length > 0 ? uniqueGroups.join(" • ") : "";

      leagues.push({
        categoryKey: rawCategory,
        title: data.title,
        subTitle,
        rawCategory,
        ageGroup: data.ageGroup,
        city: cityName,
        matches: sortedMatches,
      });
    }

    // Sort leagues within city: Genç (U18) first, then Yıldız (U16), etc.
    leagues.sort((a, b) => a.title.localeCompare(b.title, "tr", { numeric: true }));

    result.push({
      city: cityName,
      totalMatches: totalCityMatches,
      leagues,
    });
  }

  // Sort cities alphabetically
  result.sort((a, b) => a.city.localeCompare(b.city, "tr"));

  return result;
}
