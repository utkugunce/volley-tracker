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
