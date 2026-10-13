import type { VolleyboxMatchInfo } from "./fixture";

/**
 * Ortak Lig Türü
 */
export type LeagueType = "altyapi" | "kadinlar_2_lig" | "sultanlar_ligi";

/**
 * Tüm lig modülleri (Altyapı, Kadınlar 2. Ligi, Sultanlar Ligi) için standart maç modeli.
 * TVF resmi takım adlarını ve Volleybox eşleşmelerini veri kaybı olmadan taşır.
 */
export interface UnifiedFixture {
  id: string;
  league: LeagueType;
  home_team: string;
  away_team: string;
  date: string;
  time: string;
  hall: string;
  city?: string;
  category?: string;
  age_group?: string;
  gender?: string;
  group?: string;
  match_no?: string;
  score?: string | null;
  home_score?: number | null;
  away_score?: number | null;
  set_scores?: string[];
  status: "upcoming" | "finished" | "postponed" | "live";
  volleybox?: VolleyboxMatchInfo | null;
}

/**
 * Tüm lig modülleri için standart puan durumu satırı modeli.
 */
export interface UnifiedStanding {
  rank: number;
  team_name: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  sets_won: number;
  sets_lost: number;
  set_ratio?: string;
  points_won?: number;
  points_lost?: number;
  point_ratio?: string;
  volleybox_slug?: string | null;
  volleybox_url?: string | null;
  logo?: string | null;
}

/**
 * TVF Takma Adı (Alias) ↔ Volleybox Profil / Slug Eşleştirmesi
 */
export interface TeamAliasMapping {
  alias: string;
  official_name: string;
  volleybox_name?: string | null;
  volleybox_url?: string | null;
  volleybox_slug?: string | null;
  category?: string;
}
