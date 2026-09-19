/**
 * Roster and player types for Volleybox team squads.
 */

export interface RosterPlayer {
  id: string | null;
  name: string;
  number: string | null;
  position: string;
  position_original?: string | null;
  height_cm: number | null;
  birth_year: number | null;
  age: number | null;
  nationality: string;
  flag_url: string;
  profile_url: string | null;
  is_coach: boolean;
}

export interface TeamRosterSeason {
  season: string;
  total_players: number;
  total_staff: number;
  avg_height_cm: number | null;
  avg_age: number | null;
  position_counts: Record<string, number>;
  players: RosterPlayer[];
  staff: RosterPlayer[];
}

export interface TeamRosterRecord {
  team_id?: string;
  team_name: string;
  matched_as?: string;
  internal_name?: string;
  city?: string;
  volleybox_url: string;
  updated_at: string;
  seasons: Record<string, TeamRosterSeason>;
}

export type TeamRostersDatabase = Record<string, TeamRosterRecord>;
