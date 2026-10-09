import { Match } from "@/types/fixture";

/**
 * Normalizes raw group strings (e.g. "Genç Kız - A Gr", "Yıldız Kızlar B Grubu", "1. Grup")
 * to clean, readable group titles (e.g. "A Grubu", "B Grubu", "1. Grup", "Doğu Grubu").
 */
export function formatGroupName(rawGroup?: string): string {
  if (!rawGroup || rawGroup.trim() === "" || rawGroup.trim() === "Tek Grup") {
    return "Tek Grup";
  }
  let g = rawGroup.trim();

  // Strip region if present at start (e.g. "1. Bölge A Grubu" -> "A Grubu")
  g = g.replace(/^\d+\.\s*B[öo]lge\s*/i, "").trim();
  if (!g || g.toLowerCase() === "bölge" || g.toLowerCase() === "tek grup") {
    return "Tek Grup";
  }

  // Normalization for "2.Grup" -> "2. Grup"
  g = g.replace(/^(\d+)\.\s*Grup/i, "$1. Grup");
  if (/^\d+\.\s*Grup$/i.test(g)) {
    return g;
  }

  // Pattern: "Grup A", "Grup B", "Grup 1"
  const mGrupPrefix = g.match(/^Grup\s+([A-Za-zÇĞİÖŞÜçğiöşü0-9]+)$/i);
  if (mGrupPrefix) {
    const val = mGrupPrefix[1].toLocaleUpperCase("tr-TR");
    return /^\d+$/.test(val) ? `${val}. Grup` : `${val} Grubu`;
  }

  // Pattern: "- A", "- A Gr", "... - A Gr", "... - A"
  const dashMatch = g.match(/[-–]\s*([A-Za-zÇĞİÖŞÜçğiöşü0-9]+)\s*(?:Gr\.?|Grubu?|Gurubu)?$/i);
  if (dashMatch && dashMatch[1]) {
    const val = dashMatch[1].toLocaleUpperCase("tr-TR");
    return /^\d+$/.test(val) ? `${val}. Grup` : `${val} Grubu`;
  }

  // Strip prefixes like "Genç Kızlar", "Yıldız Kız İl Birinciliği", "Samsun Genç Kadınlar İl Birinciliği"
  g = g.replace(/^(?:(?:Genç|Yıldız|Küçük|Midi|Mini)\s+(?:Kız(?:lar)?|Kadın(?:lar)?|Erkek(?:ler)?)?\s*(?:Süper\s+Lig[iıİI]?|1\.\s*Lig[iıİI]?|İl\s+Birinciliği)?|[A-Za-zÇĞİÖŞÜçğiöşü\s]+İl\s+Birinciliği)\s*/i, "").trim();
  g = g.replace(/^(?:Süper\s+Lig|1\.\s*Lig)\s*/i, "").trim();

  // Single letter or letter + Gr/Grb/Grubu/Gurubu (with optional parenthetical like (Merkez))
  const mLetter = g.match(/^([A-Za-zÇĞİÖŞÜçğiöşü])(?:\s*(?:Gr\.?|Grubu?|Gurubu|Grb\.?))?(\s*\(.*\))?$/i);
  if (mLetter) {
    const letter = mLetter[1].toLocaleUpperCase("tr-TR");
    let suffix = mLetter[2] ? mLetter[2].trim() : "";
    if (suffix) {
      suffix = suffix.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
      return `${letter} Grubu ${suffix}`;
    }
    return `${letter} Grubu`;
  }

  // Clean parentheses spacing: "( Merkez )" -> "(Merkez)"
  g = g.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");

  // Fix typo "Gurubu" or abbreviation "Grb." or "Gr."
  if (/\b(?:Grubu|Gurubu|Grb\.?)$/i.test(g)) {
    return g.replace(/\s*(?:Grubu|Gurubu|Grb\.?)$/i, " Grubu");
  }
  if (/\bGrup$/i.test(g)) {
    return g;
  }

  // Named groups like "Doğu Grubu", "Gebze Grubu", "Final Grubu"
  if (/Grubu$/i.test(g)) {
    return g;
  }

  // If nothing matched and looks like league title without group (e.g. "Yıldız Kız Süper Lig")
  if (!g || /(?:lig[iıİI]?|turnuva(?:sı)?|şampiyona(?:sı)?)$/i.test(g)) {
    return "Tek Grup";
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

function getCategoryRank(cat: string, ageGroup?: string): number {
  const s = `${cat} ${ageGroup || ""}`.toLowerCase();
  if (s.includes("genç") || s.includes("u18")) return 1;
  if (s.includes("yıldız") || s.includes("u16")) return 2;
  if (s.includes("küçük") || s.includes("u14")) return 3;
  if (s.includes("midi") || s.includes("u13")) return 4;
  if (s.includes("mini") || s.includes("u12")) return 5;
  if (s.includes("erkek")) return 6;
  return 7;
}

function getTierRank(cat: string): number {
  const s = cat.toLowerCase();
  if (s.includes("süper")) return 1;
  if (s.includes("1. lig") || s.includes("1.lig")) return 2;
  if (s.includes("2. lig") || s.includes("2.lig")) return 3;
  return 4;
}

/**
 * Groups matches first by City, then by League & Group.
 * Every group (A Grubu, B Grubu, 1. Grup, etc.) across all leagues and cities
 * is separated into its own distinct LeagueSection accordion.
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
        categoryKey: string;
        title: string;
        subTitle: string;
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
    const cleanedRawGroup = region && m.group
      ? m.group.replace(/(\d+\.\s*B[öo]lge\s*)/i, "").trim()
      : (m.group || "");
    const cleanGroup = formatGroupName(cleanedRawGroup);
    const hasSpecificGroup = cleanGroup !== "Tek Grup" && cleanGroup !== "";

    const baseTitle = formatLeagueCategoryTitle(rawCategory, m.age_group);
    const leagueTitle = region ? `${baseTitle} - ${region}` : baseTitle;
    const subTitle = hasSpecificGroup ? cleanGroup : "";

    // Benzersiz anahtar: Lig kategorisi, bölge ve grup kırılımı
    let categoryKey = rawCategory;
    if (region && hasSpecificGroup) {
      categoryKey = `${rawCategory}::${region}::${cleanGroup}`;
    } else if (region) {
      categoryKey = `${rawCategory}::${region}`;
    } else if (hasSpecificGroup) {
      categoryKey = `${rawCategory}::${cleanGroup}`;
    }

    if (!leagueMap.has(categoryKey)) {
      leagueMap.set(categoryKey, {
        categoryKey,
        title: leagueTitle,
        subTitle,
        rawCategory,
        ageGroup: m.age_group,
        region: region || undefined,
        matches: [],
      });
    }
    leagueMap.get(categoryKey)!.matches.push(m);
  }

  const result: CityResultGroup[] = [];

  for (const [cityName, leagueMap] of cityMap.entries()) {
    let totalCityMatches = 0;
    const leagues: CityResultGroup["leagues"] = [];

    for (const [, data] of leagueMap.entries()) {
      totalCityMatches += data.matches.length;

      // Maçları tarihe göre azalan (en son bitenler önce), saate göre artan sırala
      const sortedMatches = [...data.matches].sort((m1, m2) => {
        if (m1.date !== m2.date) {
          return m2.date.localeCompare(m1.date);
        }
        return m1.time.localeCompare(m2.time);
      });

      leagues.push({
        categoryKey: data.categoryKey,
        title: data.title,
        subTitle: data.subTitle,
        rawCategory: data.rawCategory,
        ageGroup: data.ageGroup,
        city: cityName,
        matches: sortedMatches,
      });
    }

    // Ligleri ve grupları şehir içinde mantıksal hiyerarşiyle sırala:
    // 1. Yaş kategorisi (Genç U18 -> Yıldız U16 -> Küçük U14 -> Midi U13 -> Mini U12 -> Erkek -> Diğer)
    // 2. Lig seviyesi (Süper Lig -> 1. Lig -> 2. Lig)
    // 3. Başlık / Bölge (1. Bölge -> 4. Bölge)
    // 4. Grup adı (A Grubu -> B Grubu -> C Grubu -> 1. Grup -> 2. Grup)
    leagues.sort((a, b) => {
      const rankA = getCategoryRank(a.rawCategory, a.ageGroup);
      const rankB = getCategoryRank(b.rawCategory, b.ageGroup);
      if (rankA !== rankB) return rankA - rankB;

      const tierA = getTierRank(a.rawCategory);
      const tierB = getTierRank(b.rawCategory);
      if (tierA !== tierB) return tierA - tierB;

      const titleComp = a.title.localeCompare(b.title, "tr", { numeric: true });
      if (titleComp !== 0) return titleComp;

      return a.subTitle.localeCompare(b.subTitle, "tr", { numeric: true });
    });

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
  if (!subTitle || !subTitle.trim() || subTitle.trim() === "Tek Grup") return title.trim();
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
    if (strippedNorm === titleNorm || (strippedNorm.length >= 6 && (titleNorm.includes(strippedNorm) || strippedNorm.includes(titleNorm)))) {
      return cleanTitle;
    }
    return `${cleanTitle} · ${stripped}`;
  }

  // Alt başlıktaki grup adını formatla ve standartlaştır (örn. "- A" -> "A Grubu", "Yıldız Kızlar B Grubu" -> "B Grubu")
  const formattedSub = formatGroupName(cleanSub);
  if (!formattedSub || formattedSub === "Tek Grup") {
    return cleanTitle;
  }

  // Başlığın kendisini tekrarlayan alt başlıklar (örn. "Genç Kızlar Süper Lig" vs "Genç Kızlar Süper Ligi")
  const titleBase = toBaseNorm(cleanTitle);
  const subBase = toBaseNorm(formattedSub);
  if (titleBase === subBase || (subBase.length >= 6 && (titleBase.includes(subBase) || subBase.includes(titleBase)))) {
    return cleanTitle;
  }

  return `${cleanTitle} · ${formattedSub}`;
}

