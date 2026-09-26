import { Kadinlar2LigMatch } from "@/types/kadinlar2Lig";
import { Match } from "@/types/fixture";

/**
 * Kadınlar 2. Ligi maç nesnesini Altyapı FixtureTable ve MatchCenterDrawer ile
 * tam uyumlu standart Match tipine dönüştürür.
 */
export function convertK2MatchToMatch(m: Kadinlar2LigMatch): Match {
  const setScores = m.set_sonuclari
    ? m.set_sonuclari.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  let homeScore: number | null = null;
  let awayScore: number | null = null;
  if (m.skor && m.skor.includes("-") && m.skor !== "- : -") {
    const parts = m.skor.split("-").map((s) => parseInt(s.trim(), 10));
    if (!isNaN(parts[0]) && !isNaN(parts[1])) {
      homeScore = parts[0];
      awayScore = parts[1];
    }
  }

  const isFinished =
    m.durum === "BİTTİ" || (homeScore !== null && awayScore !== null);

  // Volleybox eşleşme ve tutarsızlık bilgisi
  const rawAny = m as any;
  const volleyboxData = rawAny.volleybox || {
    match_url: rawAny.volleybox_url || null,
    home_team_name: rawAny.takim_a_volleybox_name || m.takim_a,
    away_team_name: rawAny.takim_b_volleybox_name || m.takim_b,
    home_team_url: m.takim_a_volleybox_url || null,
    away_team_url: m.takim_b_volleybox_url || null,
    score: m.skor || null,
    status: isFinished ? "finished" : "upcoming",
    tournament_name: "TVF Uzman Posta Kadınlar 2. Ligi",
    date: m.tarih || null,
    time: m.saat || null,
    discrepancy: rawAny.discrepancy || null,
  };

  // DD.MM.YYYY tarihini standart YYYY-MM-DD formatına çevir
  let isoDate = m.tarih || "TBD";
  if (m.tarih && m.tarih.includes(".")) {
    const parts = m.tarih.split(".");
    if (parts.length === 3) {
      isoDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
  }

  return {
    id: m.id,
    match_no: m.mac_no || "",
    date: isoDate,
    time: m.saat || "",
    hall: m.salon || "",
    home_team: rawAny.takim_a_volleybox_name || m.takim_a,
    away_team: rawAny.takim_b_volleybox_name || m.takim_b,
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
