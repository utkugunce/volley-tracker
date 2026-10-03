import { Kadinlar2LigMatch, Kadinlar2LigVolleybox } from "@/types/kadinlar2Lig";
import { Match } from "@/types/fixture";
import { getVolleyboxTeamName } from "@/utils/volleybox";

/** Altyapı eşleme dosyasındaki (volleybox-mappings.json) kategori adı. */
export const K2_CATEGORY = "Kadınlar 2. Ligi";

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
 * Kadınlar 2. Ligi maç nesnesini Altyapı FixtureTable ve MatchCenterDrawer ile
 * tam uyumlu standart Match tipine dönüştürür.
 */
export function convertK2MatchToMatch(m: Kadinlar2LigMatch): Match {
  const setScores = Array.from(
    m.set_sonuclari?.matchAll(/\d{1,2}\s*[-:]\s*\d{1,2}/g) || [],
    ([setScore]) => setScore.trim().replace(":", "-")
  );

  let homeScore: number | null = null;
  let awayScore: number | null = null;
  if (m.skor && m.skor.includes("-") && m.skor !== "- : -") {
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
  const volleyboxData: Kadinlar2LigVolleybox = m.volleybox || {
    match_url: m.volleybox_url || null,
    home_team_name: homeName,
    away_team_name: awayName,
    home_team_url: m.takim_a_volleybox_url || null,
    away_team_url: m.takim_b_volleybox_url || null,
    score: m.skor || null,
    status: isFinished ? "finished" : "upcoming",
    tournament_name: "TVF Uzman Posta Kadınlar 2. Ligi",
    date: m.tarih || null,
    time: m.saat || null,
    discrepancy: m.discrepancy || null,
  };
  if (m.discrepancy?.has_diff && !volleyboxData.discrepancy?.has_diff) {
    volleyboxData.discrepancy = m.discrepancy;
  }

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
    volleybox: volleyboxData as unknown as Match["volleybox"],
  };
}
