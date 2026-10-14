import { Kadinlar2LigMatch, Kadinlar2LigVolleybox } from "@/types/kadinlar2Lig";
import { Match, VolleyboxMatchInfo } from "@/types/fixture";
import { getVolleyboxTeamName } from "@/utils/volleybox";
import { compareMatchTimes } from "@/utils/calendar";
import { kadinlar2LigMatchToUnified } from "./unifiedAdapters";
import type { UnifiedFixture } from "@/types/unified";

/** Altyapı eşleme dosyasındaki (volleybox-mappings.json) kategori adı. */
export const K2_CATEGORY = "Kadınlar 2. Ligi";

/**
 * Kadınlar 2. Ligi maçını standart UnifiedFixture şemasına dönüştürür.
 */
export function convertK2MatchToUnified(m: Kadinlar2LigMatch): UnifiedFixture {
  return kadinlar2LigMatchToUnified(m);
}

/**
 * Kadınlar 2. Ligi takım adını Altyapı ile aynı mekanizmayla (volleybox-mappings.json →
 * `getVolleyboxTeamName` → `matched_as`) Volleybox resmi adına çevirir.
 *
 * Öncelik: (1) scraper'ın JSON'a yazdığı `volleybox_name`, (2) eşleme dosyası (`matched_as`),
 * (3) güvenli geri dönüş: TVF'deki mevcut ad (eşleşmeyen takım için hata verilmez).
 */
export function getKadinlar2LigTeamName(
  takimAdi: string | null | undefined,
  volleyboxName?: string | null
): string {
  const vbName = volleyboxName?.trim();
  if (vbName) return vbName;
  return getVolleyboxTeamName(takimAdi || "", K2_CATEGORY);
}

/**
 * Favori / arama gibi karşılaştırmalarda kullanılacak ad varyantları (Volleybox adı + TVF adı).
 * Favoriler Volleybox adıyla saklandığı için ikisi de denenir.
 */
export function getKadinlar2LigTeamNameVariants(
  takimAdi: string | null | undefined,
  volleyboxName?: string | null
): string[] {
  const raw = (takimAdi || "").trim();
  const display = getKadinlar2LigTeamName(raw, volleyboxName);
  return display && display !== raw ? [display, raw] : [raw];
}

/** Bir maçın iki takımı için görüntülenecek (Volleybox) adlar. */
export function getKadinlar2LigMatchTeamNames(m: Kadinlar2LigMatch): { home: string; away: string } {
  return {
    home: getKadinlar2LigTeamName(m.takim_a, m.takim_a_volleybox_name),
    away: getKadinlar2LigTeamName(m.takim_b, m.takim_b_volleybox_name),
  };
}

/** Maçın iki takımından biri favoriyse true (Volleybox adı ve TVF adı birlikte denenir). */
export function isKadinlar2LigMatchFavorite(
  m: Kadinlar2LigMatch,
  isFavorite: (teamName: string) => boolean
): boolean {
  return [
    ...getKadinlar2LigTeamNameVariants(m.takim_a, m.takim_a_volleybox_name),
    ...getKadinlar2LigTeamNameVariants(m.takim_b, m.takim_b_volleybox_name),
  ].some((name) => isFavorite(name));
}

/** Takım adı araması: hem Volleybox adı hem TVF adı üzerinden eşleşir. `query` küçük harfli olmalı. */
export function kadinlar2LigMatchHasTeamQuery(m: Kadinlar2LigMatch, query: string): boolean {
  return [
    ...getKadinlar2LigTeamNameVariants(m.takim_a, m.takim_a_volleybox_name),
    ...getKadinlar2LigTeamNameVariants(m.takim_b, m.takim_b_volleybox_name),
  ].some((name) => name.toLowerCase().includes(query));
}

export function normalizeK2Date(date: string | undefined): string {
  if (!date) return "TBD";
  const parts = date.split(".");
  if (parts.length !== 3) return date;
  return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
}

/**
 * Kadınlar 2. Ligi maçının Volleybox ile eşleşip eşleşmediğini (kayıtlı olup olmadığını) kontrol eder.
 */
export function isKadinlar2LigMatchSynced(m: Kadinlar2LigMatch): boolean {
  if (typeof m.volleybox?.synced === "boolean") {
    return m.volleybox.synced;
  }
  return Boolean(
    m.volleybox?.match_id ||
    m.volleybox?.url ||
    (m.volleybox as { match_url?: string | null } | undefined)?.match_url ||
    m.volleybox_url ||
    m.discrepancy?.has_diff ||
    m.volleybox?.discrepancy?.has_diff
  );
}

/**
 * Kadınlar 2. Ligi maç nesnesini Altyapı FixtureTable ve MatchCenterDrawer ile
 * tam uyumlu standart Match tipine dönüştürür.
 */
export function convertK2MatchToMatch(m: Kadinlar2LigMatch): Match {
  const unified = kadinlar2LigMatchToUnified(m);
  const setScores = (unified.set_scores && unified.set_scores.length > 0)
    ? unified.set_scores
    : Array.from(
        m.set_sonuclari?.matchAll(/\d{1,2}\s*[-:]\s*\d{1,2}/g) || [],
        ([setScore]) => setScore.trim().replace(":", "-")
      );

  let homeScore: number | null = unified.home_score ?? null;
  let awayScore: number | null = unified.away_score ?? null;
  if (homeScore === null && awayScore === null && m.skor && m.skor.includes("-") && m.skor !== "- : -") {
    const parts = m.skor.split("-").map((s) => parseInt(s.trim(), 10));
    if (!isNaN(parts[0]) && !isNaN(parts[1])) {
      homeScore = parts[0];
      awayScore = parts[1];
    }
  }

  const { home: homeName, away: awayName } = getKadinlar2LigMatchTeamNames(m);

  const isFinished =
    m.durum === "BİTTİ" || (homeScore !== null && awayScore !== null);

  // Volleybox eşleşme ve tutarsızlık bilgisi
  const isVbSynced = isKadinlar2LigMatchSynced(m);
  const vbUrl = m.volleybox?.url ?? m.volleybox?.match_url ?? m.volleybox_url ?? null;
  const vbHasScore = typeof m.volleybox?.has_score === "boolean"
    ? m.volleybox.has_score
    : Boolean(m.volleybox?.score && m.volleybox.score !== "- : -");

  const volleyboxData: VolleyboxMatchInfo = {
    synced: isVbSynced,
    match_id: m.volleybox?.match_id ?? null,
    url: vbUrl,
    host_name: m.volleybox?.host_name ?? m.volleybox?.home_team_name ?? homeName,
    guest_name: m.volleybox?.guest_name ?? m.volleybox?.away_team_name ?? awayName,
    score: m.volleybox?.score ?? null,
    has_score: vbHasScore,
    vb_date: m.volleybox?.vb_date ?? (m.volleybox?.date ? normalizeK2Date(m.volleybox.date) : null),
    vb_time: m.volleybox?.vb_time ?? m.volleybox?.time ?? null,
    vb_hall: m.volleybox?.vb_hall ?? null,
    discrepancy: m.volleybox?.discrepancy || m.discrepancy || null,
  };

  // DD.MM.YYYY tarihini standart YYYY-MM-DD formatına çevir
  const isoDate = normalizeK2Date(m.tarih);

  return {
    id: m.id,
    match_no: m.mac_no || "",
    date: isoDate,
    time: m.saat || "",
    hall: m.salon || "",
    home_team: homeName,
    away_team: awayName,
    category: "Kadınlar 2. Ligi",
    age_group: "Genç",
    gender: "Kız",
    group: m.grup_adi || `Grup ${m.grup_no}`,
    city: m.sehir || "Türkiye",
    status: isFinished ? "finished" : "upcoming",
    score: m.skor && m.skor !== "- : -" ? m.skor : undefined,
    set_scores: setScores,
    home_score: homeScore,
    away_score: awayScore,
    volleybox: volleyboxData,
  };
}

/**
 * Kadınlar 2. Ligi maçlarını saatine göre yukarıdan aşağıya (erken saatten geç saate) sıralar.
 * Aynı saatteki maçlar için grup numarası ve maç numarası ikincil kriterdir.
 */
export function sortKadinlar2LigMatchesByTime(matches: Kadinlar2LigMatch[]): Kadinlar2LigMatch[] {
  return [...matches].sort((a, b) => {
    const timeDiff = compareMatchTimes(a.saat, b.saat);
    if (timeDiff !== 0) return timeDiff;

    const g1 = a.grup_no ?? 999;
    const g2 = b.grup_no ?? 999;
    if (g1 !== g2) return g1 - g2;

    return (a.mac_no || "").localeCompare(b.mac_no || "");
  });
}

export const sortMatchesByTime = sortKadinlar2LigMatchesByTime;

