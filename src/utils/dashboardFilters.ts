import type { Match, FixturesData } from "@/types/fixture";
import { isMatchOverdueForScore, compareMatchDateTime } from "@/utils/calendar";
import { formatGroupName } from "@/utils/grouping";
import { AGE_CATEGORIES, classifyAgeCategory } from "@/utils/leagueHierarchy";
import { trLower, trIncludes } from "@/utils/turkishLocale";
import { isMatchScored } from "@/utils/matchScoring";

export type VolleyboxFilter = "all" | "synced" | "scored" | "unscored" | "unsynced" | "discrepancy";

export type FixtureSection = {
  title: string;
  subTitle: string;
  city?: string;
  matches: Match[];
};

export type FixtureCityGroup = {
  city: string;
  totalMatches: number;
  sections: FixtureSection[];
};

export type VolleyboxStats = {
  total: number;
  synced: number;
  scored: number;
  unscored: number;
  unsynced: number;
  discrepancy: number;
  percent: number;
};

export function matchesLeagueFilter(match: Match, filter: string): boolean {
  if (filter === "Tümü") return true;
  const category = AGE_CATEGORIES.find((item) => filter.startsWith(item.label));
  if (category) {
    if (classifyAgeCategory(match) !== category.key) return false;
    const groupFilter = filter.slice(category.label.length).trim();
    return !groupFilter || trIncludes(formatGroupName(match.group), groupFilter);
  }

  return [match.category || "", match.age_group || "", match.group || ""].some((value) => trIncludes(value, filter));
}

/** Yerel takvim gününü `YYYY-MM-DD` olarak döndürür (offsetDays gün öncesi). */
export function computeLocalDateString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Volleybox senkronizasyon ve skor istatistikleri. */
export function computeVolleyboxStats(matches: Match[], todayStr: string): VolleyboxStats {
  const validMatches = matches.filter((m) => m.date && m.date !== "TBD");
  const total = validMatches.length;
  const syncedMatches = validMatches.filter((m) => m.volleybox?.synced);
  const synced = syncedMatches.length;
  const scored = syncedMatches.filter((m) => m.volleybox?.has_score).length;
  // Skorsuz: SADECE maç günü geçmiş (dün veya daha eski) ve Volleybox'a skoru henüz girilmemiş olanlar!
  // Kullanıcı skorları genelde maçtan bir gün sonra girdiği için maç günü (o gün) olan maçlar skorsuz sayılmaz.
  const unscored = syncedMatches.filter(
    (m) => !m.volleybox?.has_score && isMatchOverdueForScore(m.volleybox?.vb_date || m.date, todayStr)
  ).length;
  // Değişenler: İl bülteninde tarihi, saati veya salonu değişen maçlar
  const discrepancy = syncedMatches.filter(
    (m) => m.volleybox?.discrepancy?.has_diff
  ).length;
  const unsynced = total - synced;
  const percent = total > 0 ? Math.round((synced / total) * 100) : 0;
  return { total, synced, scored, unscored, unsynced, discrepancy, percent };
}

export interface FixtureFilterOptions {
  showOnlyFavorites: boolean;
  favorites: string[];
  selectedCategory: string;
  selectedDate: string;
  statusFilter: string;
  selectedHall: string;
  searchQuery: string;
  volleyboxFilter: VolleyboxFilter;
  todayStr: string;
}

/** Fikstür sekmesi için filtrelenmiş maç listesi. */
export function filterFixtureMatches(matches: Match[], opts: FixtureFilterOptions): Match[] {
  const {
    showOnlyFavorites,
    favorites,
    selectedCategory,
    selectedDate,
    statusFilter,
    selectedHall,
    searchQuery,
    volleyboxFilter,
    todayStr,
  } = opts;

  return matches.filter((m) => {
    // 1. Favoriler
    if (showOnlyFavorites && !favorites.includes(m.id)) {
      return false;
    }

    // 2. Kategori / Lig
    if (!matchesLeagueFilter(m, selectedCategory)) return false;

    // 3. Tarih
    if (selectedDate !== "all" && m.date !== selectedDate) {
      return false;
    }

    // 4. Durum (HEPSİ / OYNANACAK / BİTENLER)
    if (statusFilter === "upcoming" && m.status === "finished") return false;
    if (statusFilter === "finished" && m.status !== "finished") return false;

    // 5. Salon
    if (selectedHall !== "Tümü" && m.hall !== selectedHall) {
      return false;
    }

    // 6. Arama
    if (searchQuery.trim()) {
      const q = trLower(searchQuery).trim();
      const matchText = `${m.home_team} ${m.away_team} ${m.hall} ${m.category} ${m.match_no} ${m.city || ""}`;
      if (!trIncludes(matchText, q)) {
        return false;
      }
    }

    // 7. Volleybox Senkronizasyon ve Skor Filtresi
    if (volleyboxFilter === "synced" && !m.volleybox?.synced) {
      return false;
    }
    if (volleyboxFilter === "scored" && (!m.volleybox?.synced || !m.volleybox?.has_score)) {
      return false;
    }
    // Skorsuz: Maç günü geçmiş olmasına rağmen Volleybox'a skor girilmemiş olanlar (O gün olan maçlar hariç)
    if (
      volleyboxFilter === "unscored" &&
      (!m.volleybox?.synced || m.volleybox?.has_score || !isMatchOverdueForScore(m.volleybox?.vb_date || m.date, todayStr))
    ) {
      return false;
    }
    // Değişenler: İl temsilciliği bülteninde tarih, saat veya salonu değişenler
    if (
      volleyboxFilter === "discrepancy" &&
      (!m.volleybox?.synced || !m.volleybox?.discrepancy?.has_diff)
    ) {
      return false;
    }
    if (volleyboxFilter === "unsynced" && m.volleybox?.synced) {
      return false;
    }

    return true;
  });
}

export interface ResultFilterOptions {
  selectedResultDate: string;
  resultsSubTab: "all" | "yesterday";
  yesterdayStr: string;
  showOnlyFavorites: boolean;
  favorites: string[];
  selectedCategory: string;
  selectedHall: string;
  searchQuery: string;
  volleyboxFilter: VolleyboxFilter;
}

/** Sadece skoru/sonucu olan maçlar için filtrelenmiş liste. */
export function filterResultMatches(matches: Match[], opts: ResultFilterOptions): Match[] {
  const {
    selectedResultDate,
    resultsSubTab,
    yesterdayStr,
    showOnlyFavorites,
    favorites,
    selectedCategory,
    selectedHall,
    searchQuery,
    volleyboxFilter,
  } = opts;

  return matches.filter((m) => {
    if (!isMatchScored(m)) return false;

    // Sonuçlar seçilen tarih filtresi
    if (selectedResultDate !== "all" && m.date !== selectedResultDate) {
      return false;
    }

    // Sonuçlar alt sekme filtresi: "yesterday" seçildiyse sadece dünün maçlarını göster
    if (resultsSubTab === "yesterday" && m.date !== yesterdayStr) {
      return false;
    }

    if (showOnlyFavorites && !favorites.includes(m.id)) {
      return false;
    }

    if (!matchesLeagueFilter(m, selectedCategory)) return false;

    if (selectedHall !== "Tümü" && m.hall !== selectedHall) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = trLower(searchQuery).trim();
      const matchText = `${m.home_team} ${m.away_team} ${m.hall} ${m.category} ${m.match_no} ${m.city || ""}`;
      if (!trIncludes(matchText, q)) {
        return false;
      }
    }

    if (volleyboxFilter === "synced" && !m.volleybox?.synced) {
      return false;
    }
    if (volleyboxFilter === "scored" && (!m.volleybox?.synced || !m.volleybox?.has_score)) {
      return false;
    }
    if (volleyboxFilter === "unsynced" && m.volleybox?.synced) {
      return false;
    }
    if (volleyboxFilter === "discrepancy" && (!m.volleybox?.synced || !m.volleybox?.discrepancy?.has_diff)) {
      return false;
    }

    return true;
  });
}

/**
 * Lig & Gruba göre grupla (Genç Kızlar Süper Lig - A Grubu, B Grubu vb.)
 * Tüm İller seçildiğinde il adı yazılır ve iller ayrılır.
 */
export function groupMatchesIntoSections(
  filteredMatches: Match[],
  isAllCities: boolean,
  dataCity: string | undefined
): FixtureSection[] {
  const sections: { [key: string]: FixtureSection } = {};

  filteredMatches.forEach((m) => {
    const matchCity = m.city || dataCity || "Genel";
    const formattedGroup = formatGroupName(m.group);
    const hasGroup = formattedGroup !== "Tek Grup" && formattedGroup !== "";
    const groupKey = isAllCities
      ? `${matchCity}::${m.category}${hasGroup ? ` - ${formattedGroup}` : ""}`
      : `${m.category}${hasGroup ? ` - ${formattedGroup}` : ""}`;

    if (!sections[groupKey]) {
      sections[groupKey] = {
        title: m.category,
        subTitle: hasGroup ? formattedGroup : "",
        city: matchCity,
        matches: [],
      };
    }
    sections[groupKey].matches.push(m);
  });

  // Her bölümün maçlarını tarih ve saat sırasına göre diz (Erken saatteki maç her zaman ilk)
  Object.values(sections).forEach((sec) => {
    sec.matches.sort((m1, m2) => compareMatchDateTime(m1, m2, "asc"));
  });

  // Grupları her zaman kesin sırala: Tüm iller modunda önce Şehir, sonra Kategori ve Grup
  return Object.values(sections).sort((a, b) => {
    if (isAllCities) {
      const cityComp = (a.city || "").localeCompare(b.city || "", "tr");
      if (cityComp !== 0) return cityComp;
    }
    // 1. Kategori / Lig sıralaması
    const catComp = (a.title || "").localeCompare(b.title || "", "tr", { numeric: true });
    if (catComp !== 0) return catComp;

    // 2. Grup adı sıralaması: A Grubu, B Grubu, C Grubu... (Türkçe ve nümerik duyarlı)
    return (a.subTitle || "").localeCompare(b.subTitle || "", "tr", { numeric: true });
  });
}

/** Fikstür bölümlerini illere göre grupla (Her ilin altında lig ve grup tabloları). */
export function groupSectionsByCity(
  groupedSections: FixtureSection[],
  dataCity: string | undefined
): FixtureCityGroup[] {
  const map = new Map<string, FixtureCityGroup>();

  groupedSections.forEach((sec) => {
    const cityName = sec.city || dataCity || "Genel";
    if (!map.has(cityName)) {
      map.set(cityName, {
        city: cityName,
        totalMatches: 0,
        sections: [],
      });
    }
    const group = map.get(cityName)!;
    group.totalMatches += sec.matches.length;
    group.sections.push(sec);
  });

  return Array.from(map.values()).sort((a, b) => a.city.localeCompare(b.city, "tr"));
}

/** Seçili kategoriye göre puan durumu tablolarını süz. */
export function filterStandingsByCategory(
  standings: FixturesData["standings"],
  selectedCategory: string
) {
  const entries = Object.entries(standings || {});
  if (selectedCategory === "Tümü") return Object.fromEntries(entries);
  const category = AGE_CATEGORIES.find((item) => selectedCategory.startsWith(item.label));
  return Object.fromEntries(entries.filter(([key]) => {
    if (!category) return trIncludes(key, selectedCategory);
    const categoryTerms: Record<string, string> = {
      genc: "genç",
      yildiz: "yıldız",
      kucuk: "küçük",
      midi: "midi",
      erkek: "erkek",
      diger: "",
    };
    if (category.key === "diger" && ["genç", "yıldız", "küçük", "midi", "erkek"].some((term) => trIncludes(key, term))) {
      return false;
    }
    if (categoryTerms[category.key] && !trIncludes(key, categoryTerms[category.key])) return false;
    const groupFilter = selectedCategory.slice(category.label.length).trim();
    return !groupFilter || trIncludes(key, groupFilter);
  }));
}
