export interface Officials {
  referee_1?: string;
  referee_2?: string;
  scorer?: string;
  assistant_scorer?: string;
  line_judge_1?: string;
  line_judge_2?: string;
  supervisor?: string;
  commissioner?: string;
}

export interface Match {
  id: string;
  city: "İstanbul" | "Ankara" | string;
  date: string;            // '2026-09-14'
  date_formatted: string;  // '14 Eylül 2026, Pazartesi'
  day: string;             // 'Pazartesi'
  time: string;            // '18:00'
  venue: string;           // 'TVF 50. Yıl Deniz Esinduy Spor Salonu'
  league_code: string;     // 'YKSL', 'GKSL'
  league_name: string;     // 'Yıldız Kız Süper Lig'
  category: "Genç" | "Yıldız" | string;
  gender: "Kız" | string;
  tier: "Süper Lig" | "1. Lig" | string;
  group?: string;          // 'A', 'B'
  home_team: string;
  away_team: string;
  status: "upcoming" | "finished" | "live";
  officials: Officials;
  source_title?: string;
  source_file?: string;
}

export interface FixtureMetadata {
  last_updated: string;
  last_updated_formatted: string;
  total_matches: number;
  target_gender: string;
  target_categories: string[];
  cities: string[];
  stats: {
    by_city: Record<string, number>;
    by_category: Record<string, number>;
    by_tier: Record<string, number>;
    total_venues: number;
  };
}

export interface FixturePayload {
  metadata: FixtureMetadata;
  fixtures: Match[];
}

export interface StandingsRow {
  rank: number;
  team: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  sets_won: number;
  sets_lost: number;
  form: ("W" | "L")[];
}

export interface LeagueStandings {
  id: string;
  title: string;
  city: string;
  category: string;
  group: string;
  table: StandingsRow[];
}

export interface VenueInfo {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  capacity: string;
  transit_info: string;
  maps_query: string;
}

export type ActiveTab = "matches" | "standings" | "venues";
export type ViewMode = "cards" | "compact";
