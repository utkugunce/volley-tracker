import type { DiscrepancyInfo, Match } from "@/types/fixture";
import { formatGroupName } from "@/utils/grouping";
import { getMatchForfeitInfo } from "@/utils/forfeit";

/** Tabloda bir seferde gösterilen maç sayısı (DOM yükünü hafifletir). */
export const PAGE_SIZE = 50;

/** "2026-03-15" → "15.03.2026"; tarih yoksa / TBD ise "Açıklanacak". */
export function formatRowDate(dateStr: string): string {
  if (!dateStr || dateStr === "TBD") return "Açıklanacak";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}.${m}.${y}`;
}

/** Set skoru ("25-20") ev sahibi lehine mi? Ayrıştırılamazsa false. */
export function isHomeSetWin(set: string): boolean {
  const parts = set.split("-").map((n) => parseInt(n.trim(), 10));
  return parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[0] > parts[1];
}

/** "Maç Detayını Kopyala" için panoya yazılacak metin. */
export function buildMatchCopyText(match: Match, fallbackCity: string | undefined): string {
  const forfeit = getMatchForfeitInfo(match);
  const dateText = match.date === "TBD" ? "Tarih Açıklanacak" : `${match.date} ${match.time}`;
  const forfeitSuffix = forfeit.isForfeit ? " [Hükmen]" : "";
  const scoreText = match.status === "finished" ? `\nSkor: ${match.score} (${(match.set_scores || []).join(", ")})${forfeitSuffix}` : "";
  const cityName = match.city || fallbackCity;
  const text = `TVF ${cityName} ${match.category} (${match.group}):\n${match.home_team} vs ${match.away_team}\n🗓 ${dateText}\n📍 ${match.hall}${scoreText}\nMaç No: #${match.match_no}`;
  return text;
}

/** Bir maç satırı / kartı için türetilen görüntüleme durumu. */
export interface FixtureRowState {
  isFav: boolean;
  isFinished: boolean;
  homeWon: boolean;
  awayWon: boolean;
  formattedDate: string;
  isCopied: boolean;
  disc: DiscrepancyInfo | null | undefined;
  hasDiff: boolean;
  forfeitInfo: ReturnType<typeof getMatchForfeitInfo>;
  currentGroup: string;
  isFirstOfGroup: boolean;
  matchesInGroupCount: number;
}

export function getFixtureRowState(
  match: Match,
  idx: number,
  matches: Match[],
  hasMultipleGroups: boolean,
  favorites: string[],
  copiedId: string | null
): FixtureRowState {
  const isFav = favorites.includes(match.id);
  const isFinished = match.status === "finished";
  const homeWon = isFinished && (match.home_score ?? 0) > (match.away_score ?? 0);
  const awayWon = isFinished && (match.away_score ?? 0) > (match.home_score ?? 0);
  const formattedDate = formatRowDate(match.date);
  const isCopied = copiedId === match.id;
  const disc = match.volleybox?.discrepancy;
  const hasDiff = Boolean(disc?.has_diff);
  const forfeitInfo = getMatchForfeitInfo(match);

  const currentGroup = formatGroupName(match.group);
  const prevGroup = idx > 0 ? formatGroupName(matches[idx - 1]?.group) : null;
  const isFirstOfGroup = hasMultipleGroups && currentGroup !== prevGroup;
  const matchesInGroupCount = hasMultipleGroups
    ? matches.filter((m) => formatGroupName(m.group) === currentGroup).length
    : 0;

  return {
    isFav,
    isFinished,
    homeWon,
    awayWon,
    formattedDate,
    isCopied,
    disc,
    hasDiff,
    forfeitInfo,
    currentGroup,
    isFirstOfGroup,
    matchesInGroupCount,
  };
}
