import { Match } from "@/types/fixture";
import { getVolleyboxLeagueMapping } from "@/utils/volleybox";
import { slugify } from "@/utils/slugify";

export type GroupStatusKey =
  | "all_dated_entered"
  | "partial"
  | "not_entered"
  | "no_matches"
  | "teams_only"
  | "all_program_entered"
  | "finished";

export interface GroupStatusConfig {
  key: GroupStatusKey;
  label: string;
  hex: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  order: number;
}

export const GROUP_STATUS_CONFIGS: Record<GroupStatusKey, GroupStatusConfig> = {
  all_dated_entered: {
    key: "all_dated_entered",
    label: "Tarihi belli tüm maçlar girildi",
    hex: "#00b050", // 🟢 Yeşil
    textColor: "#ffffff",
    badgeBg: "bg-[#00b050]",
    badgeText: "text-white",
    order: 1,
  },
  partial: {
    key: "partial",
    label: "Kısmen girildi",
    hex: "#ffff00", // 🟡 Sarı
    textColor: "#000000",
    badgeBg: "bg-[#ffff00]",
    badgeText: "text-black",
    order: 2,
  },
  not_entered: {
    key: "not_entered",
    label: "Maçlar girilmedi",
    hex: "#ff0000", // 🔴 Kırmızı
    textColor: "#ffffff",
    badgeBg: "bg-[#ff0000]",
    badgeText: "text-white",
    order: 3,
  },
  no_matches: {
    key: "no_matches",
    label: "Maç Yok",
    hex: "#404040", // ⚫ Koyu Gri
    textColor: "#ffffff",
    badgeBg: "bg-[#404040]",
    badgeText: "text-white",
    order: 4,
  },
  teams_only: {
    key: "teams_only",
    label: "Takımlar belli fikstür yok",
    hex: "#f79646", // 🟠 Turuncu
    textColor: "#000000",
    badgeBg: "bg-[#f79646]",
    badgeText: "text-black",
    order: 5,
  },
  all_program_entered: {
    key: "all_program_entered",
    label: "Programdaki tüm maçlar girildi",
    hex: "#1f497d", // 🔵 Koyu Lacivert
    textColor: "#ffffff",
    badgeBg: "bg-[#1f497d]",
    badgeText: "text-white",
    order: 6,
  },
  finished: {
    key: "finished",
    label: "Lig Bitti",
    hex: "#7030a0", // 🟣 Mor
    textColor: "#ffffff",
    badgeBg: "bg-[#7030a0]",
    badgeText: "text-white",
    order: 7,
  },
};

export const GROUP_STATUS_LIST = Object.values(GROUP_STATUS_CONFIGS).sort(
  (a, b) => a.order - b.order
);

export interface GroupStatusItem {
  id: string;
  city: string;
  citySlug: string;
  category: string;
  group: string;
  statusKey: GroupStatusKey;
  statusLabel: string;
  statusHex: string;
  statusTextColor: string;
  totalMatches: number;
  datedMatches: number;
  syncedMatches: number;
  finishedMatches: number;
  teamsCount: number;
  teams: string[];
  tournamentUrl?: string;
  tournamentName?: string;
}

export function evaluateGroupStatus(params: {
  total: number;
  dated: number;
  synced: number;
  finished: number;
  teamsCount: number;
}): GroupStatusKey {
  const { total, dated, synced, finished, teamsCount } = params;

  // "Lig Bitti" demek için il temsilciliği sitesindeki ilgili ligin tüm maçlarının
  // oynanmış bitmiş (finished === total) ve Volleybox'a girilmiş olması (synced === total) gerekir.
  if (total > 0 && finished === total && synced === total) {
    return "finished";
  }
  if (total > 0 && synced === total) {
    return "all_program_entered";
  }
  if (dated > 0 && synced >= dated && synced > 0) {
    return "all_dated_entered";
  }
  if (synced > 0) {
    return "partial";
  }
  if (total > 0 && synced === 0) {
    return "not_entered";
  }
  if (teamsCount > 0 && (total === 0 || dated === 0)) {
    return "teams_only";
  }
  return "no_matches";
}

/**
 * Normalizes group name for clean grouping and display
 */
export function normalizeGroupName(rawGroup?: string): string {
  if (!rawGroup || !rawGroup.trim()) return "1. Grup";
  const trimmed = rawGroup.trim();
  // Standardize common group variants
  if (/^[a-z]$/i.test(trimmed)) return `${trimmed.toUpperCase()} Grubu`;
  return trimmed;
}

/**
 * Builds the complete list of groups and their Volleybox entry status
 * from a list of matches and optional standings/city records.
 */
export function computeGroupStatusList(
  matches: Match[] = [],
  standings?: Record<string, any[]>,
  citiesInfo?: Array<{ name: string; slug: string; status?: string }>
): GroupStatusItem[] {
  // Key: `${citySlug}:::${category}:::${group}`
  const groupMap = new Map<
    string,
    {
      city: string;
      citySlug: string;
      category: string;
      group: string;
      matches: Match[];
      teamsSet: Set<string>;
    }
  >();

  // 1. Maçlardan grupları oluştur
  for (const m of matches) {
    const city = m.city || "İstanbul";
    const citySlug = slugify(city);
    const category = m.category || "Genç Kızlar Süper Lig";
    const group = normalizeGroupName(m.group);
    const key = `${citySlug}:::${category}:::${group}`;

    let entry = groupMap.get(key);
    if (!entry) {
      entry = {
        city,
        citySlug,
        category,
        group,
        matches: [],
        teamsSet: new Set<string>(),
      };
      groupMap.set(key, entry);
    }

    entry.matches.push(m);
    if (m.home_team) entry.teamsSet.add(m.home_team.trim());
    if (m.away_team) entry.teamsSet.add(m.away_team.trim());
  }

  // 2. Standings tablosundan takımları ve ek grupları ekle
  if (standings) {
    for (const [standingsKey, teamRows] of Object.entries(standings)) {
      if (!Array.isArray(teamRows)) continue;

      // standingsKey might look like "İstanbul - Genç Kızlar Süper Lig" or "A Grubu"
      let city = "İstanbul";
      let category = standingsKey;
      let group = "1. Grup";

      if (standingsKey.includes(" - ")) {
        const parts = standingsKey.split(" - ");
        city = parts[0]?.trim() || city;
        category = parts[1]?.trim() || category;
        if (parts[2]) group = normalizeGroupName(parts[2]);
      }

      const citySlug = slugify(city);
      const key = `${citySlug}:::${category}:::${group}`;

      let entry = groupMap.get(key);
      if (!entry) {
        entry = {
          city,
          citySlug,
          category,
          group,
          matches: [],
          teamsSet: new Set<string>(),
        };
        groupMap.set(key, entry);
      }

      for (const row of teamRows) {
        const teamName = row.team || row.team_name || row.name;
        if (teamName) entry.teamsSet.add(teamName.trim());
      }
    }
  }

  // 3. Fikstürü hiç olmayan iller (citiesInfo verilmişse ve grupta yoksa)
  if (citiesInfo) {
    for (const c of citiesInfo) {
      const citySlug = slugify(c.name || c.slug);
      const hasAny = Array.from(groupMap.values()).some(
        (g) => g.citySlug === citySlug
      );
      if (!hasAny) {
        const key = `${citySlug}:::Genç & Yıldız Kızlar:::Lig`;
        groupMap.set(key, {
          city: c.name,
          citySlug,
          category: "Genç & Yıldız Kızlar",
          group: "Fikstür Yok",
          matches: [],
          teamsSet: new Set<string>(),
        });
      }
    }
  }

  // 4. Her grup için durum hesapla
  const results: GroupStatusItem[] = [];

  for (const [key, item] of groupMap.entries()) {
    const total = item.matches.length;
    const dated = item.matches.filter(
      (m) => m.date && m.date !== "TBD" && m.date.trim() !== ""
    ).length;
    const synced = item.matches.filter(
      (m) => m.volleybox?.synced === true
    ).length;
    const finished = item.matches.filter(
      (m) =>
        m.status === "finished" ||
        (m.home_score !== null && m.home_score !== undefined && m.away_score !== null && m.away_score !== undefined) ||
        (m.score && m.score.trim() !== "" && m.score.trim() !== "- : -" && m.score.toLowerCase() !== "vs")
    ).length;
    const teamsCount = item.teamsSet.size;

    const statusKey = evaluateGroupStatus({
      total,
      dated,
      synced,
      finished,
      teamsCount,
    });

    const cfg = GROUP_STATUS_CONFIGS[statusKey];
    const mapping = getVolleyboxLeagueMapping(item.category, item.city);

    results.push({
      id: key,
      city: item.city,
      citySlug: item.citySlug,
      category: item.category,
      group: item.group,
      statusKey,
      statusLabel: cfg.label,
      statusHex: cfg.hex,
      statusTextColor: cfg.textColor,
      totalMatches: total,
      datedMatches: dated,
      syncedMatches: synced,
      finishedMatches: finished,
      teamsCount,
      teams: Array.from(item.teamsSet).sort((a, b) => a.localeCompare(b, "tr")),
      tournamentUrl: mapping?.volleybox_url,
      tournamentName: mapping?.matched_as,
    });
  }

  // Sıralama: Şehir alfabetik -> Kategori -> Grup
  return results.sort((a, b) => {
    const cityCmp = a.city.localeCompare(b.city, "tr");
    if (cityCmp !== 0) return cityCmp;
    const catCmp = a.category.localeCompare(b.category, "tr");
    if (catCmp !== 0) return catCmp;
    return a.group.localeCompare(b.group, "tr");
  });
}
