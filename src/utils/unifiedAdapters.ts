import type { Match, StandingItem } from "@/types/fixture";
import type { Kadinlar2LigMatch, Kadinlar2LigTeam } from "@/types/kadinlar2Lig";
import type { UnifiedFixture, UnifiedStanding, TeamAliasMapping } from "@/types/unified";

/**
 * Altyapı Match nesnesini standart UnifiedFixture formatına dönüştürür.
 */
export function matchToUnified(m: Match): UnifiedFixture {
  return {
    id: m.id,
    league: "altyapi",
    home_team: m.home_team,
    away_team: m.away_team,
    date: m.date,
    time: m.time,
    hall: m.hall,
    city: m.city,
    category: m.category,
    age_group: m.age_group,
    gender: m.gender,
    group: m.group,
    match_no: m.match_no,
    score: m.score,
    home_score: m.home_score,
    away_score: m.away_score,
    set_scores: m.set_scores,
    status: m.status,
    volleybox: m.volleybox,
  };
}

/**
 * Kadınlar 2. Ligi maçını standart UnifiedFixture formatına dönüştürür.
 */
export function kadinlar2LigMatchToUnified(m: Kadinlar2LigMatch): UnifiedFixture {
  const status: UnifiedFixture["status"] = m.durum === "BİTTİ" ? "finished" : "upcoming";

  let home_score: number | null = null;
  let away_score: number | null = null;
  if (m.set_a && m.set_b) {
    const parsedA = parseInt(m.set_a, 10);
    const parsedB = parseInt(m.set_b, 10);
    if (!isNaN(parsedA) && !isNaN(parsedB)) {
      home_score = parsedA;
      away_score = parsedB;
    }
  } else if (m.skor && m.skor.includes("-")) {
    const parts = m.skor.split("-").map((s) => parseInt(s.trim(), 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      home_score = parts[0];
      away_score = parts[1];
    }
  }

  const set_scores = m.set_sonuclari
    ? m.set_sonuclari.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    id: m.id || (m.mac_no ? `k2-${m.mac_no}` : `k2-${m.tarih}-${m.takim_a}-${m.takim_b}`),
    league: "kadinlar_2_lig",
    home_team: m.takim_a,
    away_team: m.takim_b,
    date: m.tarih,
    time: m.saat,
    hall: m.salon,
    city: m.sehir,
    category: "Kadınlar 2. Lig",
    gender: "Kadın",
    group: m.grup_adi,
    match_no: m.mac_no,
    score: m.skor,
    home_score,
    away_score,
    set_scores,
    status,
    volleybox: m.volleybox
      ? {
          synced: Boolean(m.volleybox.synced),
          match_id: m.volleybox.match_id,
          url: m.volleybox.url || m.volleybox.match_url,
          score: m.volleybox.score,
        }
      : null,
  };
}

/**
 * Altyapı StandingItem nesnesini standart UnifiedStanding formatına dönüştürür.
 */
export function standingItemToUnified(s: StandingItem): UnifiedStanding {
  return {
    rank: s.rank,
    team_name: s.team,
    played: s.played,
    won: s.won,
    lost: s.lost,
    points: s.points,
    sets_won: s.sets_won,
    sets_lost: s.sets_lost,
    set_ratio: s.set_ratio,
    points_won: s.points_won,
    points_lost: s.points_lost,
    point_ratio: s.point_ratio,
  };
}

/**
 * Kadınlar 2. Ligi takım puan durumu satırını standart UnifiedStanding formatına dönüştürür.
 */
export function kadinlar2LigTeamToUnified(t: Kadinlar2LigTeam): UnifiedStanding {
  return {
    rank: t.sira,
    team_name: t.takim_adi,
    played: t.o,
    won: t.g,
    lost: t.m,
    points: t.p,
    sets_won: t.as,
    sets_lost: t.vs,
    set_ratio: t.sav,
    points_won: t.asp,
    points_lost: t.vsp,
    point_ratio: t.spav,
    volleybox_url: t.volleybox_url,
    logo: t.logo,
  };
}

/**
 * TVF resmi adı ile Volleybox eşleştirmesinden TeamAliasMapping nesnesi oluşturur.
 */
export function createTeamAliasMapping(
  alias: string,
  official_name: string,
  volleybox_name?: string | null,
  volleybox_url?: string | null
): TeamAliasMapping {
  let volleybox_slug: string | null = null;
  if (volleybox_url) {
    const match = volleybox_url.match(/\/(?:team|club)s?\/([^/?#]+)/i);
    if (match) volleybox_slug = match[1];
  }

  return {
    alias,
    official_name,
    volleybox_name: volleybox_name ?? null,
    volleybox_url: volleybox_url ?? null,
    volleybox_slug,
  };
}
