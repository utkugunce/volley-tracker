import { Match } from "@/types/fixture";
import { getVolleyboxLeagueMapping } from "@/utils/volleybox";
import { slugify } from "@/utils/slugify";
import { getCategoryCombinedScore, formatGroupName } from "@/utils/grouping";

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
  /** Fileönü temasındaki ekran rengi (zemin #0E2033'e karşı ≥ 4.5:1, durumlar arası ayırt edilebilir). */
  hex: string;
  /** `hex` zemininin üstündeki metin rengi (≥ 4.5:1). */
  textColor: string;
  /** Resmî TVF/Volleybox tablosundaki özgün renk. Yalnız referans/eşleştirme içindir, arayüzde çizilmez. */
  officialHex: string;
  badgeBg: string;
  badgeText: string;
  order: number;
}

export const GROUP_STATUS_CONFIGS: Record<GroupStatusKey, GroupStatusConfig> = {
  all_dated_entered: {
    key: "all_dated_entered",
    label: "Tarihi belli tüm maçlar girildi",
    hex: "#9BE15D", // 🟢 Yeşil
    textColor: "#0B2A05",
    officialHex: "#00b050",
    badgeBg: "bg-done",
    badgeText: "text-done-fg",
    order: 1,
  },
  partial: {
    key: "partial",
    label: "Kısmen girildi",
    hex: "#FFC24D", // 🟡 Sarı
    textColor: "#2B1D00",
    officialHex: "#ffff00",
    badgeBg: "bg-warn",
    badgeText: "text-[#2B1D00]",
    order: 2,
  },
  not_entered: {
    key: "not_entered",
    label: "Maçlar girilmedi",
    hex: "#FF6E82", // 🔴 Kırmızı
    textColor: "#2B0A10",
    officialHex: "#ff0000",
    badgeBg: "bg-live",
    badgeText: "text-live-fg",
    order: 3,
  },
  no_matches: {
    key: "no_matches",
    label: "Maç Yok",
    hex: "#8CA8B8", // ⚫ Koyu Gri
    textColor: "#07131F",
    officialHex: "#404040",
    badgeBg: "bg-ink-3",
    badgeText: "text-canvas",
    order: 4,
  },
  teams_only: {
    key: "teams_only",
    label: "Takımlar belli fikstür yok",
    hex: "#E8743B", // 🟠 Turuncu
    textColor: "#1F0D00",
    officialHex: "#f79646",
    badgeBg: "bg-[#E8743B]",
    badgeText: "text-[#1F0D00]",
    order: 5,
  },
  all_program_entered: {
    key: "all_program_entered",
    label: "Programdaki tüm maçlar girildi",
    hex: "#5B9DFF", // 🔵 Koyu Lacivert
    textColor: "#06142B",
    officialHex: "#1f497d",
    badgeBg: "bg-selected",
    badgeText: "text-[#06142B]",
    order: 6,
  },
  finished: {
    key: "finished",
    label: "Lig Bitti",
    hex: "#B79BFF", // 🟣 Mor
    textColor: "#1B1033",
    officialHex: "#7030a0",
    badgeBg: "bg-[#B79BFF]",
    badgeText: "text-[#1B1033]",
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

  // Fikstürde/programda yer alan tüm maçlar Volleybox'a girilmişse
  // "Lig Bitti" yerine daima "Programdaki tüm maçlar girildi" denir.
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
  return formatGroupName(trimmed);
}

/**
 * Builds the complete list of groups and their Volleybox entry status
 * from a list of matches and optional standings/city records.
 */
/** Puan durumu satırından yalnızca takım adı okunur; farklı kaynaklar farklı alan adı kullanır. */
export interface StandingRowLike {
  team?: string;
  team_name?: string;
  name?: string;
}

export function getGroupStageRank(groupName: string): number {
  const g = groupName.toLowerCase();
  if (g.includes("final") && !g.includes("yarı") && !g.includes("yari") && !g.includes("semi")) return 3;
  if (g.includes("yarı") || g.includes("yari") || g.includes("semi") || g.includes("play-off") || g.includes("playoff")) return 2;
  return 1;
}

export function computeGroupStatusList(
  matches: Match[] = [],
  standings?: Record<string, StandingRowLike[]>,
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
        const firstPart = parts[0]?.trim() || "";
        const isCity = [
          "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin",
          "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale",
          "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum",
          "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta", "Mersin",
          "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli",
          "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş",
          "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas",
          "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat",
          "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak",
          "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
        ].some((c) => c.toLocaleLowerCase("tr-TR") === firstPart.toLocaleLowerCase("tr-TR"));

        if (isCity) {
          city = firstPart;
          category = parts[1]?.trim() || category;
          group = normalizeGroupName(parts.slice(2).join(" - "));
        } else {
          category = firstPart;
          group = normalizeGroupName(parts.slice(1).join(" - "));
          for (const row of teamRows) {
            const teamName = (row.team || row.team_name || row.name || "").trim().toLowerCase();
            if (!teamName) continue;
            const matchWithTeam = matches.find(
              (m) =>
                m.home_team.toLowerCase().includes(teamName) ||
                m.away_team.toLowerCase().includes(teamName) ||
                teamName.includes(m.home_team.toLowerCase()) ||
                teamName.includes(m.away_team.toLowerCase())
            );
            if (matchWithTeam?.city) {
              city = matchWithTeam.city;
              break;
            }
          }
        }
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
    const accounted = Math.min(
      total,
      synced +
        item.matches.filter(
          (m) =>
            m.volleybox?.synced !== true &&
            (m.forfeit || /^\s*\(H\)/i.test(m.home_team) || /^\s*\(H\)/i.test(m.away_team))
        ).length
    );
    const finished = item.matches.filter(
      (m) =>
        m.status === "finished" ||
        (m.home_score !== null && m.home_score !== undefined && m.away_score !== null && m.away_score !== undefined) ||
        (m.score && m.score.trim() !== "" && m.score.trim() !== "- : -" && m.score.toLowerCase() !== "vs")
    ).length;
    const teamsCount = item.teamsSet.size;

    const computedStatusKey = evaluateGroupStatus({
      total,
      dated,
      synced: accounted,
      finished,
      teamsCount,
    });

    const mapping = getVolleyboxLeagueMapping(item.category, item.city);
    let statusKey = computedStatusKey;
    if (
      (mapping?.status_override === "teams_only" ||
        (item.citySlug === "kirklareli" && (mapping?.volleybox_url || "").includes("krklareli"))) &&
      synced === 0
    ) {
      statusKey = "teams_only";
    }

    const cfg = GROUP_STATUS_CONFIGS[statusKey];

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


  // Sıralama: Şehir alfabetik -> Kategori Hiyerarşisi (Süper Lig > 1. Lig) -> Grup Aşaması (Ön Eleme > Yarı Final > Final) -> Grup Adı
  return results.sort((a, b) => {
    const cityCmp = a.city.localeCompare(b.city, "tr");
    if (cityCmp !== 0) return cityCmp;

    const scoreA = getCategoryCombinedScore(a.category);
    const scoreB = getCategoryCombinedScore(b.category);
    if (scoreA !== scoreB) return scoreA - scoreB;

    const catCmp = a.category.localeCompare(b.category, "tr", { numeric: true });
    if (catCmp !== 0) return catCmp;

    const stageA = getGroupStageRank(a.group);
    const stageB = getGroupStageRank(b.group);
    if (stageA !== stageB) return stageA - stageB;

    return a.group.localeCompare(b.group, "tr", { numeric: true });
  });
}
