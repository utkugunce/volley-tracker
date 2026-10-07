/** Takım verisi tipleri (takım detayı, kadro, kardeş takımlar, karşılaştırma). */
import { Match, StandingItem, VolleyboxMapping } from "@/types/fixture";
import { TeamRosterRecord } from "@/types/roster";

/** Bir grubun puan durumu: doğrudan satır listesi ya da `{ table }` sarmalayıcısı. */
type StandingsGroup = StandingItem[] | { table?: StandingItem[] };
export type StandingsCityEntry = { city: string; standings: Record<string, StandingsGroup> };

export interface TeamStandingContext {
  groupName: string;
  category: string;
  city: string;
  standingRow: StandingItem;
  fullGroupTable: StandingItem[];
}

export interface TeamMatchDetail extends Match {
  isHome: boolean;
  opponent: string;
  teamScore?: number | null;
  opponentScore?: number | null;
  result?: "win" | "loss" | "upcoming";
}

export interface OtherCityTeam {
  city: string;
  citySlug: string;
  path: string;
}

export interface ClubSisterTeam {
  teamName: string;
  slug: string;
  city: string;
  citySlug: string;
  path: string;
  ageCategory?: string; // "U18", "U16", "U14", vb.
  teamBranch?: string; // "A Takımı", "B Takımı", "C Takımı", vb.
  leagueName?: string; // "Genç Kızlar Süper Lig", vb.
  isCurrent: boolean;
  matchesCount?: number;
}

export interface Player {
  number: number;
  name: string;
  position: string;
  birthYear?: number;
  isCaptain?: boolean;
  isLibero?: boolean;
}

export interface TeamDetails {
  teamName: string;
  slug: string;
  city: string;
  cities: string[];
  categories: string[];
  mapping?: VolleyboxMapping;
  matches: TeamMatchDetail[];
  standingsContexts: TeamStandingContext[];
  form: Array<{ matchId: string; result: "W" | "L"; score: string; opponent: string; date: string }>;
  stats: {
    totalMatches: number;
    played: number;
    wins: number;
    losses: number;
    upcoming: number;
  };
  otherCities?: OtherCityTeam[];
  clubTeams?: ClubSisterTeam[];
  roster?: Player[];
  volleyboxRoster?: TeamRosterRecord;
}

export interface TeamListItem {
  name: string;
  slug: string;
  city: string;
}

export interface HeadToHeadMatch {
  id: string;
  date: string;
  time?: string;
  category?: string;
  hall?: string;
  city?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number | null;
  awayScore?: number | null;
  setScores?: string[];
  status: "upcoming" | "finished" | "postponed" | "live";
  winner?: "team1" | "team2" | "draw" | null;
}

export interface HeadToHeadComparison {
  team1: TeamDetails;
  team2: TeamDetails;
  matches: HeadToHeadMatch[];
  summary: {
    totalMatches: number;
    team1Wins: number;
    team2Wins: number;
    upcomingMatches: number;
    team1SetsWon: number;
    team2SetsWon: number;
  };
  sharedGroup?: {
    groupName: string;
    category: string;
    city: string;
    team1Row?: StandingItem;
    team2Row?: StandingItem;
  };
  isSameGroup: boolean;
}
