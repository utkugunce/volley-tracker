import type { Match, StandingItem } from "@/types/fixture";
import { getMatchForfeitInfo } from "@/utils/forfeit";
import { isMatchScored } from "@/utils/matchScoring";
import { sameGroup } from "@/utils/standingsForm";
import { parseStandingKey } from "@/utils/standingsParsing";
import { trIncludes, trLower } from "@/utils/turkishLocale";
import { getVolleyboxLeagueMapping, getVolleyboxMapping } from "@/utils/volleybox";

export type VolleyboxQueueTab =
  | "missing_scores"
  | "discrepancies"
  | "unsynced"
  | "unmapped_teams"
  | "standings_anomalies";

export interface UnmappedTeamItem {
  key: string;
  teamName: string;
  city: string;
  category: string;
  matchCount: number;
  volleyboxSearchUrl: string;
  leagueVolleyboxUrl: string | null;
}

export interface StandingsAnomalyTeamDiff {
  team: string;
  tvfPlayed: number;
  calcPlayed: number;
  tvfWon: number;
  calcWon: number;
  tvfPoints: number;
  calcPoints: number;
}

export interface StandingsAnomalyItem {
  groupKey: string;
  city: string;
  category: string;
  forfeitMatchCount: number;
  discrepancyTeams: StandingsAnomalyTeamDiff[];
}

export interface VolleyboxWorkbenchCounts {
  missingScores: number;
  discrepancies: number;
  unsynced: number;
  unmappedTeams: number;
  standingsAnomalies: number;
  totalActionable: number;
  totalValidMatches: number;
  syncedMatches: number;
  syncPercent: number;
}

export interface VolleyboxWorkbenchData {
  missingScores: Match[];
  discrepancies: Match[];
  unsynced: Match[];
  unmappedTeams: UnmappedTeamItem[];
  standingsAnomalies: StandingsAnomalyItem[];
  counts: VolleyboxWorkbenchCounts;
}

const VALID_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Converts a Volleybox tournament URL to its editable `/tr/<slug>/matches` tab URL. */
export function toVolleyboxMatchesUrl(url?: string | null): string | null {
  if (!url || !url.trim()) return null;
  let clean = url.trim().replace(/\/+$/, "");
  if (clean.startsWith("https://women.volleybox.net/") && !clean.includes("/tr/")) {
    clean = clean.replace("https://women.volleybox.net/", "https://women.volleybox.net/tr/");
  }
  if (!clean.endsWith("/matches")) {
    clean = `${clean}/matches`;
  }
  return clean;
}

/** Resolves the editable Volleybox tournament `/matches` tab URL for a TVF league/city pair. */
export function getVolleyboxTournamentMatchesUrl(category?: string, city?: string): string | null {
  if (!category || !category.trim()) return null;
  const mapping = getVolleyboxLeagueMapping(category, city);
  return toVolleyboxMatchesUrl(mapping?.volleybox_url);
}

const HALL_NOISE_WORDS = [
  "spor kompleksi",
  "voleybol salonu",
  "spor salonu",
  "kapalı spor salonu",
  "kapali spor salonu",
  "çok amaçlı",
  "cok amacli",
  "gençlik merkezi",
  "genclik merkezi",
  "voleybol",
  "salonu",
  "kompleksi",
  "tesisi",
  "tesisleri",
  "lisesi",
  "belediyesi",
  "tvf",
  "gençlik",
  "genclik",
  "spor",
  "saha",
  "vestel",
];

const CURATED_VOLLEYBOX_HALLS: Array<{ city?: string; keywords: string[]; vbName: string }> = [
  { city: "istanbul", keywords: ["50. yıl", "50.yıl", "50 yıl", "deniz esinduy"], vbName: "50. Yıl Deniz Esinduy Voleybol Salonu" },
  { city: "istanbul", keywords: ["hasan doğan", "hasan dogan"], vbName: "Hasan Doğan Spor Kompleksi" },
  { city: "istanbul", keywords: ["mimar sinan"], vbName: "Mimar Sinan Spor Salonu" },
  { city: "istanbul", keywords: ["bahçelievler engelliler", "bahcelievler engelliler", "engelliler"], vbName: "Bahçelievler Engelliler Spor Salonu" },
  { city: "istanbul", keywords: ["gazanfer bilge"], vbName: "Gazanfer Bilge Spor Salonu" },
  { city: "istanbul", keywords: ["kurtköy", "kurtkoy"], vbName: "Kurtköy Spor Salonu" },
  { city: "istanbul", keywords: ["mehmet beyazıt", "mehmet beyazit"], vbName: "Mehmet Beyazıt Lisesi Spor Salonu" },
  { city: "istanbul", keywords: ["osman altınkuyu", "osman altinkuyu"], vbName: "Şehit Osman Altınkuyu Spor Salonu" },
  { city: "istanbul", keywords: ["es voleybol"], vbName: "ES Voleybol Salonu" },
  { city: "istanbul", keywords: ["burhan felek"], vbName: "TVF Burhan Felek Vestel Voleybol Salonu" },
  { city: "istanbul", keywords: ["hidayet türkoğlu", "hidayet turkoglu"], vbName: "Hidayet Türkoğlu Spor Kompleksi" },
  { city: "istanbul", keywords: ["tozkoparan"], vbName: "Tozkoparan Spor Salonu" },
  { city: "istanbul", keywords: ["caferağa", "caferaga"], vbName: "Caferağa Spor Salonu" },
  { city: "istanbul", keywords: ["sarıyer", "sariyer"], vbName: "Sarıyer Spor Salonu" },
  { city: "istanbul", keywords: ["müzahir sille", "muzahir sille"], vbName: "Müzahir Sille Spor Salonu" },
  { city: "istanbul", keywords: ["beylikdüzü", "beylikduzu"], vbName: "Beylikdüzü Spor Kompleksi" },
  { city: "istanbul", keywords: ["bağcılar çok amaçlı", "bagcilar cok amacli"], vbName: "Bağcılar Çok Amaçlı Spor Salonu" },
  { city: "ankara", keywords: ["beştepe", "bestepe"], vbName: "Beştepe Voleybol Salonu" },
  { city: "ankara", keywords: ["selim sırrı", "selim sirri"], vbName: "Selim Sırrı Tarcan Zeren Voleybol Salonu" },
  { city: "ankara", keywords: ["başkent", "baskent"], vbName: "TVF Başkent Voleybol Salonu" },
  { city: "ankara", keywords: ["yenimahalle"], vbName: "Yenimahalle Spor Kompleksi" },
  { city: "izmir", keywords: ["fuar izmir", "gaziemir"], vbName: "Fuar İzmir Spor Salonu" },
  { city: "izmir", keywords: ["alsancak", "atatürk voleybol"], vbName: "Atatürk Voleybol Salonu Vestel Spor Kompleksi" },
  { city: "izmir", keywords: ["balçova", "balcova"], vbName: "Balçova Spor Salonu" },
  { city: "izmir", keywords: ["serdar yereli"], vbName: "Serdar Yereli Spor Salonu" },
  { city: "izmir", keywords: ["celal atik"], vbName: "Celal Atik Spor Salonu" },
  { city: "izmir", keywords: ["kınık", "kinik"], vbName: "Kınık Spor Salonu" },
  { city: "bursa", keywords: ["cengiz göllü", "cengiz gollu"], vbName: "TVF Cengiz Göllü Voleybol Salonu" },
  { city: "bursa", keywords: ["çekirge", "cekirge"], vbName: "Çekirge Spor Salonu" },
];

function asciiFoldTr(text: string): string {
  return text
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .replace(/Ş/g, "s")
    .replace(/ş/g, "s")
    .replace(/Ğ/g, "g")
    .replace(/ğ/g, "g")
    .replace(/Ü/g, "u")
    .replace(/ü/g, "u")
    .replace(/Ö/g, "o")
    .replace(/ö/g, "o")
    .replace(/Ç/g, "c")
    .replace(/ç/g, "c")
    .toLowerCase();
}

function normalizeHallForComparison(hall: string): string {
  let h = asciiFoldTr(hall).replace(/[.,\-_/()']/g, " ").replace(/\s+/g, " ").trim();
  for (const noise of HALL_NOISE_WORDS) {
    h = h.replace(new RegExp(`\\b${asciiFoldTr(noise)}\\b`, "gi"), " ");
  }
  return h.replace(/\s+/g, " ").trim();
}

export function doHallsMatch(tvfHall: string, vbHall: string): boolean {
  if (!tvfHall || !vbHall) return false;
  const h1 = normalizeHallForComparison(tvfHall);
  const h2 = normalizeHallForComparison(vbHall);
  if (!h1 || !h2) return false;
  if (h1 === h2) return true;
  if (h1.length >= 4 && h2.includes(h1)) return true;
  if (h2.length >= 4 && h1.includes(h2)) return true;

  const w1 = new Set(h1.split(" ").filter((w) => w.length >= 3));
  const w2 = new Set(h2.split(" ").filter((w) => w.length >= 3));
  if (w1.size === 0 || w2.size === 0) return false;

  let commonCount = 0;
  for (const word of w1) {
    if (w2.has(word)) commonCount += 1;
  }
  const minLen = Math.min(w1.size, w2.size);
  return minLen > 0 && commonCount / minLen >= 0.6;
}

/** Resolves a TVF hall string to its official Volleybox arena name when known. */
export function getResolvedVolleyboxHallName(
  tvfHall?: string | null,
  city?: string,
  allMatches?: Match[],
  matchVbHall?: string | null
): string {
  const cleanHall = (tvfHall || "").trim();
  if (!cleanHall || cleanHall === "TBD") return "";

  if (matchVbHall && matchVbHall.trim() && doHallsMatch(cleanHall, matchVbHall.trim())) {
    return matchVbHall.trim();
  }

  const cityNorm = city && city !== "Tüm İller" ? asciiFoldTr(city.trim()) : "";

  if (allMatches && allMatches.length > 0) {
    for (const m of allMatches) {
      const candidateVbHall = m.volleybox?.vb_hall?.trim();
      if (!candidateVbHall) continue;
      if (cityNorm && m.city && asciiFoldTr(m.city.trim()) !== cityNorm) continue;
      if (doHallsMatch(cleanHall, candidateVbHall)) {
        return candidateVbHall;
      }
    }
    for (const m of allMatches) {
      const candidateVbHall = m.volleybox?.vb_hall?.trim();
      if (!candidateVbHall) continue;
      if (doHallsMatch(cleanHall, candidateVbHall)) {
        return candidateVbHall;
      }
    }
  }

  const hallFolded = asciiFoldTr(cleanHall);
  for (const entry of CURATED_VOLLEYBOX_HALLS) {
    if (entry.city && cityNorm && entry.city !== cityNorm) continue;
    if (entry.keywords.some((kw) => hallFolded.includes(asciiFoldTr(kw)))) {
      return entry.vbName;
    }
  }

  return cleanHall;
}

/** Resolves official Volleybox team name (`matched_as`) with TVF name fallback. */
export function getResolvedVolleyboxTeamName(
  teamName: string,
  category?: string,
  city?: string
): string {
  if (!teamName || !teamName.trim()) return "";
  const mapping = getVolleyboxMapping(teamName, category, undefined, city);
  return mapping?.matched_as?.trim() || teamName.trim();
}

/** Formats TVF set scores into clean comma-separated Volleybox entry text. */
export function formatSetScoresForVolleybox(setScores?: string[] | null): string {
  if (!Array.isArray(setScores) || setScores.length === 0) return "";
  return setScores
    .map((s) =>
      String(s || "")
        .replace(/[()]/g, "")
        .replace(/\s+/g, "")
        .replace(/[:–]/g, "-")
        .trim()
    )
    .filter(Boolean)
    .join(", ");
}

/** Builds a concise single-line Volleybox operator entry summary for a match. */
export function formatMatchForVolleyboxCopy(
  match: Match,
  defaultCity?: string,
  allMatches?: Match[]
): string {
  const effectiveCity = match.city || (defaultCity && defaultCity !== "Tüm İller" ? defaultCity : undefined);
  const home = getResolvedVolleyboxTeamName(match.home_team, match.category, effectiveCity);
  const away = getResolvedVolleyboxTeamName(match.away_team, match.category, effectiveCity);
  const datePart = [match.date && match.date !== "TBD" ? match.date : "TBD", match.time && match.time !== "--:--" ? match.time : ""]
    .filter(Boolean)
    .join(" ");

  const scored = isMatchScored(match);
  const scorePart = scored
    ? `${match.home_score ?? ""}-${match.away_score ?? ""}`.replace(/^-|-$/g, "") || match.score || ""
    : "";
  const setsText = scored ? formatSetScoresForVolleybox(match.set_scores) : "";
  const resultPart = scorePart ? (setsText ? `${scorePart} (${setsText})` : scorePart) : "";
  const hallPart = getResolvedVolleyboxHallName(match.hall, effectiveCity, allMatches, match.volleybox?.vb_hall);

  return [datePart, `${home} - ${away}`, resultPart, hallPart].filter(Boolean).join(" | ");
}

/** Returns true when a match belongs to the parsed standing group context. */
function matchBelongsToStandingContext(
  m: Match,
  ctx: ReturnType<typeof parseStandingKey>
): boolean {
  const ctxCity = ctx.city || "";
  if (ctxCity && m.city && trLower(m.city) !== trLower(ctxCity)) return false;
  const league = trLower(ctx.leagueFullName || "");
  if (league && m.category) {
    const cat = trLower(m.category);
    if (!trIncludes(cat, league) && !trIncludes(league, cat)) return false;
  }
  if (ctx.displayGroup && ctx.displayGroup !== "Genel" && m.group && !sameGroup(m.group, ctx.displayGroup)) {
    return false;
  }
  return true;
}

/** Computes volleyball standings points (3-0/3-1 -> 3/0, 3-2 -> 2/1). */
function computeVolleyballMatchPoints(homeScore: number, awayScore: number): { homePts: number; awayPts: number } {
  if (homeScore > awayScore) {
    return awayScore >= 2 ? { homePts: 2, awayPts: 1 } : { homePts: 3, awayPts: 0 };
  }
  return homeScore >= 2 ? { homePts: 1, awayPts: 2 } : { homePts: 0, awayPts: 3 };
}

/**
 * Detects groups with forfeit (`25-0`) matches or discrepancies between official TVF
 * standings and calculated results from finished matches.
 */
export function detectStandingsAnomalies(
  matches: Match[],
  standings?: Record<string, StandingItem[]>,
  defaultCity?: string
): StandingsAnomalyItem[] {
  const anomalies: StandingsAnomalyItem[] = [];
  const coveredGroupSignatures = new Set<string>();

  if (standings && Object.keys(standings).length > 0) {
    for (const [groupKey, items] of Object.entries(standings)) {
      if (!Array.isArray(items) || items.length === 0) continue;

      const ctx = parseStandingKey(groupKey, defaultCity);
      const groupMatches = matches.filter((m) => matchBelongsToStandingContext(m, ctx) && isMatchScored(m));
      if (groupMatches.length === 0) continue;

      const forfeitMatchCount = groupMatches.filter((m) => getMatchForfeitInfo(m).isForfeit).length;

      // Calculate played/won/points per normalized team name
      const calcByTeam = new Map<string, { played: number; won: number; points: number }>();
      const addResult = (team: string, wonMatch: boolean, pts: number) => {
        const key = trLower(team.trim());
        const prev = calcByTeam.get(key) || { played: 0, won: 0, points: 0 };
        calcByTeam.set(key, {
          played: prev.played + 1,
          won: prev.won + (wonMatch ? 1 : 0),
          points: prev.points + pts,
        });
      };

      for (const m of groupMatches) {
        const h = m.home_score ?? Number(m.score?.split("-")[0]?.trim());
        const a = m.away_score ?? Number(m.score?.split("-")[1]?.trim());
        if (Number.isNaN(h) || Number.isNaN(a) || h === a) continue;
        const { homePts, awayPts } = computeVolleyballMatchPoints(h, a);
        addResult(m.home_team, h > a, homePts);
        addResult(m.away_team, a > h, awayPts);
      }

      const discrepancyTeams: StandingsAnomalyTeamDiff[] = [];
      for (const row of items) {
        if (!row.team) continue;
        const key = trLower(row.team.trim());
        const calc = calcByTeam.get(key);
        if (!calc) continue;

        const tvfPlayed = row.played ?? 0;
        const tvfWon = row.won ?? 0;
        const tvfPoints = row.points ?? 0;

        if (tvfPlayed !== calc.played || tvfWon !== calc.won) {
          discrepancyTeams.push({
            team: row.team,
            tvfPlayed,
            calcPlayed: calc.played,
            tvfWon,
            calcWon: calc.won,
            tvfPoints,
            calcPoints: calc.points,
          });
        }
      }

      if (forfeitMatchCount > 0 || discrepancyTeams.length > 0) {
        const effCity = ctx.city || (defaultCity && defaultCity !== "Tüm İller" ? defaultCity : "Genel");
        coveredGroupSignatures.add(`${trLower(effCity)}::${trLower(ctx.leagueFullName)}`);
        anomalies.push({
          groupKey,
          city: effCity,
          category: ctx.leagueFullName,
          forfeitMatchCount,
          discrepancyTeams,
        });
      }
    }
  }

  // Also capture forfeit groups from matches if standings data wasn't present for that group
  const forfeitGroups = new Map<string, { city: string; category: string; count: number }>();
  for (const m of matches) {
    if (!isMatchScored(m) || !getMatchForfeitInfo(m).isForfeit) continue;
    const effCity = m.city || (defaultCity && defaultCity !== "Tüm İller" ? defaultCity : "Genel");
    const sig = `${trLower(effCity)}::${trLower(m.category || "")}`;
    if (coveredGroupSignatures.has(sig)) continue;
    const groupSuffix = m.group ? ` - ${m.group}` : "";
    const key = `${effCity} - ${m.category || "Voleybol Ligi"}${groupSuffix}`;
    const existing = forfeitGroups.get(key) || {
      city: effCity,
      category: `${m.category || "Voleybol Ligi"}${groupSuffix}`,
      count: 0,
    };
    existing.count += 1;
    forfeitGroups.set(key, existing);
  }

  for (const [groupKey, info] of forfeitGroups.entries()) {
    anomalies.push({
      groupKey,
      city: info.city,
      category: info.category,
      forfeitMatchCount: info.count,
      discrepancyTeams: [],
    });
  }

  return anomalies.sort(
    (a, b) => b.forfeitMatchCount + b.discrepancyTeams.length - (a.forfeitMatchCount + a.discrepancyTeams.length)
  );
}

/**
 * Classifies all TVF matches & standings into operator queues for Volleybox data entry.
 */
export function buildVolleyboxWorkbenchData(
  matches: Match[],
  standings?: Record<string, StandingItem[]>,
  defaultCity?: string
): VolleyboxWorkbenchData {
  const missingScores: Match[] = [];
  const discrepancies: Match[] = [];
  const unsynced: Match[] = [];
  const unmappedMap = new Map<string, UnmappedTeamItem>();

  let validMatchesCount = 0;
  let syncedMatchesCount = 0;

  const trackUnmappedTeam = (teamName: string, category: string, city: string) => {
    const clean = teamName?.trim();
    if (!clean || clean === "TBD" || trLower(clean) === "bay") return;
    const mapping = getVolleyboxMapping(clean, category, undefined, city);
    if (mapping?.volleybox_url) return;

    const dedupeKey = `${trLower(city)}::${trLower(category)}::${trLower(clean)}`;
    const existing = unmappedMap.get(dedupeKey);
    if (existing) {
      existing.matchCount += 1;
      return;
    }

    const leagueMapping = getVolleyboxLeagueMapping(category, city);
    unmappedMap.set(dedupeKey, {
      key: dedupeKey,
      teamName: clean,
      city,
      category,
      matchCount: 1,
      volleyboxSearchUrl: `https://women.volleybox.net/tr/search?q=${encodeURIComponent(clean)}`,
      leagueVolleyboxUrl: leagueMapping?.volleybox_url ?? null,
    });
  };

  for (const m of matches) {
    const effectiveCity = m.city || (defaultCity && defaultCity !== "Tüm İller" ? defaultCity : "Genel");
    const effectiveCategory = m.category || m.age_group || "Voleybol Ligi";
    const hasValidDate = Boolean(m.date && VALID_DATE_RE.test(m.date));
    const scored = isMatchScored(m);

    if (hasValidDate) {
      validMatchesCount += 1;
      if (m.volleybox?.synced) {
        syncedMatchesCount += 1;
      }
    }

    // Queue 1: TVF has score, Volleybox is synced but missing score
    if (scored && m.volleybox?.synced && !m.volleybox?.has_score) {
      missingScores.push(m);
    }

    // Queue 2: Bulletin discrepancy between TVF and Volleybox (schedule changed)
    if (m.volleybox?.synced && m.volleybox?.discrepancy?.has_diff) {
      discrepancies.push(m);
    }

    // Queue 3: Dated TVF matches not yet entered on Volleybox
    if (hasValidDate && !m.volleybox?.synced) {
      unsynced.push(m);
    }

    // Queue 4: Unmapped teams across matches
    trackUnmappedTeam(m.home_team, effectiveCategory, effectiveCity);
    trackUnmappedTeam(m.away_team, effectiveCategory, effectiveCity);
  }

  missingScores.sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.time || "").localeCompare(a.time || ""));
  discrepancies.sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.time || "").localeCompare(b.time || ""));
  unsynced.sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.time || "").localeCompare(b.time || ""));

  const unmappedTeams = Array.from(unmappedMap.values()).sort(
    (a, b) => b.matchCount - a.matchCount || a.city.localeCompare(b.city, "tr") || a.teamName.localeCompare(b.teamName, "tr")
  );

  const standingsAnomalies = detectStandingsAnomalies(matches, standings, defaultCity);

  const counts: VolleyboxWorkbenchCounts = {
    missingScores: missingScores.length,
    discrepancies: discrepancies.length,
    unsynced: unsynced.length,
    unmappedTeams: unmappedTeams.length,
    standingsAnomalies: standingsAnomalies.length,
    totalActionable:
      missingScores.length + discrepancies.length + unsynced.length + unmappedTeams.length + standingsAnomalies.length,
    totalValidMatches: validMatchesCount,
    syncedMatches: syncedMatchesCount,
    syncPercent: validMatchesCount > 0 ? Math.round((syncedMatchesCount / validMatchesCount) * 100) : 0,
  };

  return {
    missingScores,
    discrepancies,
    unsynced,
    unmappedTeams,
    standingsAnomalies,
    counts,
  };
}
