export interface DiscrepancyInfo {
  has_diff: boolean;
  date_diff?: boolean;
  time_diff?: boolean;
  hall_diff?: boolean;
  vb_date?: string | null;
  vb_time?: string | null;
  vb_hall?: string | null;
  details?: string | null;
}

export interface VolleyboxMatchInfo {
  synced: boolean;
  match_id?: number | string | null;
  url?: string | null;
  host_name?: string | null;
  guest_name?: string | null;
  score?: string | null;
  has_score?: boolean;
  vb_date?: string | null;
  vb_time?: string | null;
  vb_hall?: string | null;
  discrepancy?: DiscrepancyInfo | null;
}

export interface Match {
  id: string;
  city?: string;
  date: string;
  time: string;
  hall: string;
  category: string;
  age_group: "Genç" | "Yıldız";
  gender: "Kız" | "Erkek";
  group: string;
  match_no: string;
  home_team: string;
  away_team: string;
  score?: string | null;
  home_score?: number | null;
  away_score?: number | null;
  set_scores?: string[];
  status: "upcoming" | "finished" | "postponed" | "live";
  volleybox?: VolleyboxMatchInfo | null;
}

export interface StandingItem {
  rank: number;
  team: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  sets_won: number;
  sets_lost: number;
  set_ratio: string;
  points_won: number;
  points_lost: number;
  point_ratio: string;
  form: ("W" | "L")[];
}

export interface FixturesData {
  updated_at: string;
  city?: string;
  title?: string;
  total_matches: number;
  unfiltered_total?: number;
  source: string;
  filters: {
    categories: string[];
    age_groups: string[];
    genders: string[];
    halls: string[];
  };
  matches: Match[];
  standings?: {
    [category: string]: StandingItem[];
  };
  sync?: {
    attempted?: boolean;
    success?: boolean;
    mode?: string;
    message?: string;
  };
}

export interface CityInfo {
  ilid: string;
  name: string;
  slug: string;
  url: string;
  status: string;
  matches_count: number;
  standings_count: number;
  data_file?: string | null;
}

export type VolleyboxConfidence = "verified" | "club_level_only" | "broken";

export interface VolleyboxMapping {
  internal_name: string;
  internal_category: string;
  city?: string;
  city_slug?: string;
  matched_as: string;
  volleybox_url: string;
  age_category: "U18" | "U16" | null;
  confidence: VolleyboxConfidence;
  aliases?: string[];
  synonyms?: string[];
  logo_url?: string | null;
  local_logo?: string | null;
  note?: string | null;
  verified_at?: string;
}

export interface VolleyboxLeagueMapping {
  internal_name: string;
  city?: string;
  city_slug?: string;
  matched_as: string;
  volleybox_url: string;
  age_category: "U18" | "U16" | null;
  confidence: VolleyboxConfidence;
  season?: string;
  note?: string | null;
  verified_at?: string;
}

export interface VolleyboxMappingsFile {
  mappings: VolleyboxMapping[];
  leagues?: VolleyboxLeagueMapping[];
}
