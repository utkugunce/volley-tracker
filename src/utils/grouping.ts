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
 * Extracts regional subdivision from group name if present (e.g. "1. Bölge A Grubu" -> "1. Bölge").
 */
export function extractRegionFromGroup(groupName?: string): string | null {
  if (!groupName) return null;
  const match = groupName.match(/(\d+\.\s*B[öo]lge)/i);
  return match ? match[1].replace(/\s+/g, " ").trim() : null;
}

/**
 * Groups matches first by City, then by League (unifying all groups of the same league/region).
 * Inside each league, matches are sorted by group name, then by match datetime.
 */
export function groupResultsByCityAndLeague(
  matches: Match[],
  defaultCity = "Tüm İller"
): CityResultGroup[] {
  const cityMap = new Map<
    string,
    Map<
      string,
      {
        title: string;
        rawCategory: string;
        ageGroup?: string;
        region?: string;
        matches: Match[];
      }
    >
  >();

  for (const m of matches) {
    const city = m.city || defaultCity || "Genel";
    if (!cityMap.has(city)) {
      cityMap.set(city, new Map());
    }
    const leagueMap = cityMap.get(city)!;

    const rawCategory = m.category || m.age_group || "Genel Lig";
    const region = extractRegionFromGroup(m.group);
    const leagueKey = region ? `${rawCategory} - ${region}` : rawCategory;
    const baseTitle = formatLeagueCategoryTitle(rawCategory, m.age_group);
    const leagueTitle = region ? `${baseTitle} - ${region}` : baseTitle;

    if (!leagueMap.has(leagueKey)) {
      leagueMap.set(leagueKey, {
        title: leagueTitle,
        rawCategory,
        ageGroup: m.age_group,
        region: region || undefined,
        matches: [],
      });
    }
    leagueMap.get(leagueKey)!.matches.push(m);
  }

  const result: CityResultGroup[] = [];

  for (const [cityName, leagueMap] of cityMap.entries()) {
    let totalCityMatches = 0;
    const leagues: CityResultGroup["leagues"] = [];

    for (const [leagueKey, data] of leagueMap.entries()) {
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

      const uniqueGroups = Array.from(
        new Set(
          sortedMatches
            .map((m) => {
              if (data.region) {
                // Bölge önekini temizle: "1. Bölge A Grubu" -> "A Grubu"
                const cleaned = m.group ? m.group.replace(/(\d+\.\s*B[öo]lge\s*)/i, "").trim() : "";
                if (!cleaned || cleaned.toLowerCase() === "bölge" || cleaned.toLowerCase() === "tek grup") return "";
                return formatGroupName(cleaned);
              }
              return formatGroupName(m.group);
            })
            .filter((g) => Boolean(g) && g !== "Tek Grup")
        )
      );
      const subTitle = uniqueGroups.length > 0 ? uniqueGroups.join(" • ") : "";

      leagues.push({
        categoryKey: leagueKey,
        title: data.title,
        subTitle,
        rawCategory: data.rawCategory,
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

/**
 * Lig ve grup başlığını formatlar.
 * Eğer alt başlık sezon kalıntısı içeriyorsa (örn: "2026 - 2027 Voleybol Sezonu ...")
 * veya kategori adını tekrar ediyorsa (örn: "Genç Kızlar Süper Lig" vs "Genç Kızlar Süper Ligi"),
 * temizler ve sadece lig adını ya da temiz grup adını döner.
 */
export function getLeagueDisplayTitle(title: string, subTitle?: string): string {
  if (!subTitle || !subTitle.trim()) return title.trim();
  const cleanTitle = title.trim();
  const cleanSub = subTitle.trim();

  // Boşluk, noktalama ve sayıları temizleyerek temel harfleri karşılaştır
  const toBaseNorm = (s: string) => s.toLowerCase().replace(/[^a-zğüşıöç]/g, "");

  // Sezon kalıntısı içeren alt başlıkları temizle (örn. "2026 - 2027 Voleybol Sezonu ...")
  if (/^\d{4}\s*[-/]\s*\d{4}/.test(cleanSub)) {
    const stripped = cleanSub.replace(/^\d{4}\s*[-/]\s*\d{4}(?:\s*voleybol)?(?:\s*sezonu)?\s*/i, "").trim();
    if (!stripped) return cleanTitle;

    // Eğer stripped bir grup ismi içermiyorsa (sadece "Genç Kızlar Ligi" gibi ligin kendisiyse)
    if (!/(?:grup|gr\b|bölge|final|yarı\s*final)/i.test(stripped)) {
      return cleanTitle;
    }

    const strippedNorm = toBaseNorm(stripped);
    const titleNorm = toBaseNorm(cleanTitle);
    if (strippedNorm === titleNorm || titleNorm.includes(strippedNorm) || strippedNorm.includes(titleNorm)) {
      return cleanTitle;
    }
    return `${cleanTitle} · ${stripped}`;
  }

  // Başlığın kendisini tekrarlayan alt başlıklar (örn. "Genç Kızlar Süper Lig" vs "Genç Kızlar Süper Ligi")
  const titleBase = toBaseNorm(cleanTitle);
  const subBase = toBaseNorm(cleanSub);
  if (titleBase === subBase || subBase.includes(titleBase) || titleBase.includes(subBase)) {
    return cleanTitle;
  }

  // Alt başlıktaki gereksiz lig / kategori öneklerini temizle (örn. "Yıldız Kızlar B Grubu ( Merkez )" -> "B Grubu (Merkez)")
  const stripPrefixRegex = /^(?:(?:Genç|Yıldız|Küçük|Midi|Mini)\s+(?:Kız(?:lar)?|Erkek(?:ler)?|Kadın(?:lar)?)?\s*(?:Süper\s+Lig[iıİI]?|1\.\s*Lig[iıİI]?)?|(?:Süper\s+Lig|1\.\s*Lig)\s*(?:Genç|Yıldız)?\s*(?:Kız(?:lar)?)?)\s*[-–—:\s]*(?=(?:[A-Z0-9]\.?\s*Gr(?:up|ubu)?|Grup\s+[A-Z0-9]|[A-Z]\s*(?:\(|$|\s*Gr)))/i;
  let formattedSub = cleanSub.replace(stripPrefixRegex, "").trim();
  formattedSub = formattedSub.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").replace(/^[-–—\s]+/, "");
  if (/^[A-Z]$/i.test(formattedSub)) {
    formattedSub = `${formattedSub.toUpperCase()} Grubu`;
  } else if (/^[A-Z]\s+Gr$/i.test(formattedSub) || /\b[A-Z]\s+Gr\b/i.test(formattedSub)) {
    formattedSub = formattedSub.replace(/\b([A-Z])\s+Gr\b/i, "$1 Grubu");
  } else if (/^Grup\s+([A-Z0-9]+)/i.test(formattedSub)) {
    formattedSub = formattedSub.replace(/^Grup\s+([A-Z0-9]+)/i, "$1 Grubu");
  }

  return `${cleanTitle} · ${formattedSub}`;
}

