import type {
  ClubSisterTeam,
  Player,
  TeamDetails,
  PyramidTierKey,
  PyramidTier,
  CrossoverPlayer,
  ClubPyramidData,
} from "./types";
import { loadTeamRosters } from "./loaders";
import { extractClubRoot } from "./sisters";
import { slugify } from "../slugify";

export type { PyramidTierKey, PyramidTier, CrossoverPlayer, ClubPyramidData };

function categorizeTeamTier(team: ClubSisterTeam): PyramidTierKey {
  const name = (team.teamName || "").toLowerCase();
  const cat = (team.leagueName || "").toLowerCase();
  const age = (team.ageCategory || "").toLowerCase();

  // 1. U18 (Genç)
  if (
    age.includes("18") ||
    cat.includes("genç") ||
    cat.includes("genc") ||
    name.includes("u18") ||
    name.includes("genç") ||
    name.includes("genc")
  ) {
    return "u18";
  }

  // 2. U16 (Yıldız)
  if (
    age.includes("16") ||
    cat.includes("yıldız") ||
    cat.includes("yildiz") ||
    name.includes("u16") ||
    name.includes("yıldız") ||
    name.includes("yildiz")
  ) {
    return "u16";
  }

  // 3. U14 / U12 (Küçük / Midi / Mini)
  if (
    age.includes("14") ||
    age.includes("12") ||
    cat.includes("küçük") ||
    cat.includes("kucuk") ||
    cat.includes("midi") ||
    cat.includes("mini") ||
    name.includes("u14") ||
    name.includes("u12") ||
    name.includes("küçük") ||
    name.includes("kucuk") ||
    name.includes("midi") ||
    name.includes("mini")
  ) {
    return "u14_u12";
  }

  // 4. A Takım / Kıdemli Ligler (Sultanlar, Efeler, 1. Lig, 2. Lig, A Takımı)
  if (
    cat.includes("sultanlar") ||
    cat.includes("efeler") ||
    cat.includes("kadınlar 2") ||
    cat.includes("kadinlar 2") ||
    cat.includes("erkekler 2") ||
    cat.includes("kadınlar 1") ||
    cat.includes("kadinlar 1") ||
    cat.includes("erkekler 1") ||
    cat.includes("1. lig") ||
    cat.includes("2. lig") ||
    name.includes("a takımı") ||
    name.includes("a takım")
  ) {
    return "senior";
  }

  return "other";
}

/**
 * Bir kulübün kardeş takımlarını ve kadro geçişlerini piramit modeli olarak derler.
 */
export function buildClubPyramid(
  team: Pick<TeamDetails, "teamName"> & Partial<Pick<TeamDetails, "clubTeams">>
): ClubPyramidData | null {
  const clubTeams = team.clubTeams || [];
  if (clubTeams.length <= 1) {
    return null;
  }

  const root = extractClubRoot(team.teamName);
  const clubName = root.rootName || team.teamName;

  const tierMap: Record<PyramidTierKey, ClubSisterTeam[]> = {
    senior: [],
    u18: [],
    u16: [],
    u14_u12: [],
    other: [],
  };

  for (const ct of clubTeams) {
    const tier = categorizeTeamTier(ct);
    tierMap[tier].push(ct);
  }

  const tiers: PyramidTier[] = [
    {
      key: "senior" as const,
      title: "A Takım / Ulusal Lig",
      badge: "🏛️ A Takım",
      badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      order: 1,
      teams: tierMap.senior,
    },
    {
      key: "u18" as const,
      title: "Genç Takım (U18)",
      badge: "🥇 U18",
      badgeColor: "bg-sky-500/15 text-sky-300 border-sky-500/30",
      order: 2,
      teams: tierMap.u18,
    },
    {
      key: "u16" as const,
      title: "Yıldız Takım (U16)",
      badge: "🥈 U16",
      badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      order: 3,
      teams: tierMap.u16,
    },
    {
      key: "u14_u12" as const,
      title: "Küçük & Midi (U14 / U12)",
      badge: "🥉 U14 / U12",
      badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      order: 4,
      teams: tierMap.u14_u12,
    },
  ].filter((t) => t.teams.length > 0);

  if (tierMap.other.length > 0) {
    tiers.push({
      key: "other" as const,
      title: "Diğer Takımlar & Şubeler",
      badge: "🏐 Gelişim",
      badgeColor: "bg-slate-700/50 text-slate-300 border-slate-600",
      order: 5,
      teams: tierMap.other,
    });
  }

  // Çifte Kategori / Kadro Geçişleri Tespiti
  const crossoverPlayers: CrossoverPlayer[] = [];
  try {
    const allRosters = loadTeamRosters();
    const teamSlugs = new Set(clubTeams.map((ct) => ct.slug));
    const targetRoot = slugify(clubName);

    // Kulübe ait kadroları filtrele
    const matchingRosterRecords = Object.values(allRosters).filter((rec) => {
      const recRoot = slugify(rec.internal_name || rec.team_name);
      return recRoot.includes(targetRoot) || targetRoot.includes(recRoot) || teamSlugs.has(slugify(rec.team_name));
    });

    if (matchingRosterRecords.length >= 2) {
      // Oyuncu bazında eşleşme haritası
      const playerOccurrences = new Map<
        string,
        { name: string; profileUrl?: string | null; position?: string; teams: Set<string>; seasons: Set<string> }
      >();

      for (const rec of matchingRosterRecords) {
        for (const [seasonKey, seasonObj] of Object.entries(rec.seasons || {})) {
          for (const p of seasonObj.players || []) {
            const key = p.profile_url || p.name.trim().toLowerCase();
            const existing = playerOccurrences.get(key) || {
              name: p.name,
              profileUrl: p.profile_url,
              position: p.position,
              teams: new Set<string>(),
              seasons: new Set<string>(),
            };
            existing.teams.add(rec.team_name);
            existing.seasons.add(seasonKey);
            playerOccurrences.set(key, existing);
          }
        }
      }

      for (const item of playerOccurrences.values()) {
        if (item.teams.size >= 2) {
          crossoverPlayers.push({
            name: item.name,
            profileUrl: item.profileUrl,
            position: item.position,
            teams: Array.from(item.teams),
            seasons: Array.from(item.seasons).slice(-2),
          });
        }
      }
    }
  } catch {
    // kadro verisi yoksa veya hata verirse boş liste döner
  }

  return {
    clubName,
    tiers,
    totalTeams: clubTeams.length,
    crossoverPlayers: crossoverPlayers.slice(0, 10),
  };
}
