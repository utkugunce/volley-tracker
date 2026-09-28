import { Match } from "@/types/fixture";
import { formatGroupName, formatLeagueCategoryTitle } from "./grouping";
import { trLower } from "./turkishLocale";

export type AgeCategoryKey = "genc" | "yildiz" | "kucuk" | "midi" | "erkek" | "diger";

export interface AgeCategoryDef {
  key: AgeCategoryKey;
  label: string;
  shortLabel: string;
  order: number;
}

export const AGE_CATEGORIES: AgeCategoryDef[] = [
  { key: "genc", label: "Genç Kızlar (U18)", shortLabel: "U18", order: 1 },
  { key: "yildiz", label: "Yıldız Kızlar (U16)", shortLabel: "U16", order: 2 },
  { key: "kucuk", label: "Küçük Kızlar (U14)", shortLabel: "U14", order: 3 },
  { key: "midi", label: "Midi / Minik", shortLabel: "U12", order: 4 },
  { key: "erkek", label: "Erkek Altyapı Ligleri", shortLabel: "Erkek", order: 5 },
  { key: "diger", label: "Diğer Ligler", shortLabel: "Diğer", order: 6 },
];

export interface LeagueGroupNode {
  name: string; // Örn: "A Grubu", "Klasman 1"
  rawGroup: string;
  matchesCount: number;
  filterValue: string; // Filtreleme için kullanılacak değer
}

export interface AgeCategoryNode {
  key: AgeCategoryKey;
  label: string;
  shortLabel: string;
  matchesCount: number;
  groups: LeagueGroupNode[];
}

export interface CityLeagueHierarchy {
  cityName: string;
  citySlug: string;
  plate: string; // Örn: "34", "06", "35"
  totalMatches: number;
  categories: AgeCategoryNode[];
}

/**
 * Maçın kategori ve yaş grubuna göre hangi ana kategoriye girdiğini tespit eder.
 */
export function classifyAgeCategory(m: Match): AgeCategoryKey {
  const text = trLower(`${m.category || ""} ${m.age_group || ""} ${m.gender || ""}`);
  
  if (text.includes("erkek")) {
    return "erkek";
  }
  if (text.includes("genç") || text.includes("genc") || text.includes("u18") || text.includes("u-18")) {
    return "genc";
  }
  if (text.includes("yıldız") || text.includes("yildiz") || text.includes("u16") || text.includes("u-16")) {
    return "yildiz";
  }
  if (text.includes("küçük") || text.includes("kucuk") || text.includes("u14") || text.includes("u-14")) {
    return "kucuk";
  }
  if (text.includes("midi") || text.includes("mini") || text.includes("u12") || text.includes("u-12") || text.includes("u13") || text.includes("u-13")) {
    return "midi";
  }
  return "diger";
}

/**
 * Verilen maç listesini İl -> Yaş Kategorisi -> Grup hiyerarşisine dönüştürür.
 */
export function buildLeagueHierarchy(
  matches: Match[],
  plateLookup: Record<string, string> = {}
): CityLeagueHierarchy[] {
  // 1. Şehirlere göre topla
  const cityMap = new Map<string, Match[]>();

  for (const m of matches) {
    const city = m.city || "Genel";
    if (!cityMap.has(city)) {
      cityMap.set(city, []);
    }
    cityMap.get(city)!.push(m);
  }

  const hierarchies: CityLeagueHierarchy[] = [];

  for (const [cityName, cityMatches] of cityMap.entries()) {
    const citySlug = (cityMatches[0]?.city ? cityName.toLocaleLowerCase("tr-TR") : "all")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const plate = plateLookup[cityName] || plateLookup[citySlug] || "";

    // 2. Yaş kategorilerine göre grupla
    const catMap = new Map<AgeCategoryKey, Map<string, { rawGroup: string; count: number }>>();

    for (const m of cityMatches) {
      const catKey = classifyAgeCategory(m);
      if (!catMap.has(catKey)) {
        catMap.set(catKey, new Map());
      }
      const groupMap = catMap.get(catKey)!;
      const cleanGroup = formatGroupName(m.group);
      
      const prev = groupMap.get(cleanGroup) || { rawGroup: m.group, count: 0 };
      prev.count += 1;
      groupMap.set(cleanGroup, prev);
    }

    const categories: AgeCategoryNode[] = [];

    for (const def of AGE_CATEGORIES) {
      if (!catMap.has(def.key)) continue;
      const groupMap = catMap.get(def.key)!;
      
      let categoryMatchesCount = 0;
      const groups: LeagueGroupNode[] = [];

      for (const [groupName, data] of groupMap.entries()) {
        categoryMatchesCount += data.count;
        groups.push({
          name: groupName,
          rawGroup: data.rawGroup,
          matchesCount: data.count,
          filterValue: groupName === "Tek Grup" ? def.label : `${def.label} ${groupName}`,
        });
      }

      // Grupları sırala: A Grubu, B Grubu...
      groups.sort((a, b) => a.name.localeCompare(b.name, "tr", { numeric: true }));

      if (groups.length > 0) {
        categories.push({
          key: def.key,
          label: def.label,
          shortLabel: def.shortLabel,
          matchesCount: categoryMatchesCount,
          groups,
        });
      }
    }

    hierarchies.push({
      cityName,
      citySlug,
      plate,
      totalMatches: cityMatches.length,
      categories,
    });
  }

  // Şehirleri sırala: Plaka varsa plakaya göre, yoksa Türkçe alfabetik
  hierarchies.sort((a, b) => {
    if (a.plate && b.plate) {
      return Number(a.plate) - Number(b.plate);
    }
    if (a.plate) return -1;
    if (b.plate) return 1;
    return a.cityName.localeCompare(b.cityName, "tr");
  });

  return hierarchies;
}
