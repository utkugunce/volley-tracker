import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LeagueHubClient } from "../LeagueHubClient";
import { LeagueData } from "@/utils/leagueData";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockLeague: LeagueData = {
  leagueName: "İstanbul Genç Kızlar Süper Lig",
  leagueSlug: "genc-kizlar-super-lig",
  city: "İstanbul",
  citySlug: "istanbul",
  ageGroup: "U18",
  category: "Genç Kızlar Süper Lig",
  season: "2026-2027",
  updatedAt: "2026-09-26T12:00:00Z",
  groups: [
    {
      groupName: "A Grubu",
      rawGroup: "A Grubu",
      table: [
        {
          rank: 1,
          team: "Eczacıbaşı",
          played: 2,
          won: 2,
          lost: 0,
          sets_won: 6,
          sets_lost: 1,
          points: 6,
          set_ratio: "6.0",
          points_won: 150,
          points_lost: 100,
          point_ratio: "1.5",
          form: ["W", "W"],
        },
      ],
    },
  ],
  matches: [
    {
      id: "m-up-1",
      date: "2026-09-28",
      time: "14:00",
      hall: "50. Yıl",
      category: "Genç Kızlar Süper Lig",
      age_group: "Genç",
      gender: "Kız",
      group: "A Grubu",
      match_no: "101",
      home_team: "Eczacıbaşı",
      away_team: "VakıfBank",
      status: "upcoming",
      score: "- : -",
      city: "İstanbul",
    },
    {
      id: "m-fin-1",
      date: "2026-09-24",
      time: "16:00",
      hall: "Burhan Felek",
      category: "Genç Kızlar Süper Lig",
      age_group: "Genç",
      gender: "Kız",
      group: "A Grubu",
      match_no: "100",
      home_team: "Fenerbahçe",
      away_team: "Galatasaray",
      status: "finished",
      score: "3 - 1",
      home_score: 3,
      away_score: 1,
      set_scores: ["25-20", "22-25", "25-18", "25-21"],
      city: "İstanbul",
    },
  ],
  upcomingMatches: [
    {
      id: "m-up-1",
      date: "2026-09-28",
      time: "14:00",
      hall: "50. Yıl",
      category: "Genç Kızlar Süper Lig",
      age_group: "Genç",
      gender: "Kız",
      group: "A Grubu",
      match_no: "101",
      home_team: "Eczacıbaşı",
      away_team: "VakıfBank",
      status: "upcoming",
      score: "- : -",
      city: "İstanbul",
    },
  ],
  finishedMatches: [
    {
      id: "m-fin-1",
      date: "2026-09-24",
      time: "16:00",
      hall: "Burhan Felek",
      category: "Genç Kızlar Süper Lig",
      age_group: "Genç",
      gender: "Kız",
      group: "A Grubu",
      match_no: "100",
      home_team: "Fenerbahçe",
      away_team: "Galatasaray",
      status: "finished",
      score: "3 - 1",
      home_score: 3,
      away_score: 1,
      set_scores: ["25-20", "22-25", "25-18", "25-21"],
      city: "İstanbul",
    },
  ],
  teams: [
    {
      name: "Eczacıbaşı",
      slug: "eczacibasi",
      played: 2,
      won: 2,
      lost: 0,
      setsWon: 6,
      setsLost: 1,
      points: 6,
      group: "A Grubu",
    },
  ],
  stats: {
    totalMatches: 2,
    finishedMatches: 1,
    upcomingMatches: 1,
    forfeitMatches: 0,
    totalTeams: 2,
    totalSets: 4,
    avgSetsPerMatch: "4.0",
    undefeatedTeams: ["Eczacıbaşı"],
  },
  halls: ["50. Yıl", "Burhan Felek"],
};

describe("LeagueHubClient Fixtures & Results (Anasayfa ile aynı FixtureTable & DateRibbon gösterimi)", () => {
  it("Fikstür sekmesinde DateRibbon ve FixtureTable render eder", () => {
    render(<LeagueHubClient league={mockLeague} initialTab="fixtures" />);

    // Fikstür & Maç Programı başlığı
    expect(screen.getByText(/Fikstür & Maç Programı/i)).toBeInTheDocument();

    // FixtureTable bileşenindeki takım adları (Volleybox eşleşmesiyle U18 eki gelebilir)
    expect(screen.getByText(/Eczacıbaşı/i)).toBeInTheDocument();
    expect(screen.getByText(/VakıfBank/i)).toBeInTheDocument();

    // FixtureTable bileşenindeki salon bilgisi
    expect(screen.getByText("50. Yıl")).toBeInTheDocument();

    // Görünüm seçici düğmeleri (Liste / Grid)
    expect(screen.getByLabelText(/Liste Görünümü/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Yayın Kartı Görünümü/i)).toBeInTheDocument();
  });

  it("Sonuçlar sekmesinde DateRibbon, FixtureTable ve set skorlarını render eder", () => {
    render(<LeagueHubClient league={mockLeague} initialTab="results" />);

    // Oynanan Maç Sonuçları başlığı
    expect(screen.getByText(/Oynanan Maç Sonuçları/i)).toBeInTheDocument();

    // Takım adları ve maç skoru
    expect(screen.getByText(/Fenerbahçe/i)).toBeInTheDocument();
    expect(screen.getByText(/Galatasaray/i)).toBeInTheDocument();
    expect(screen.getByText(/3 - 1/)).toBeInTheDocument();

    // Set skorları
    expect(screen.getByText(/25-20/)).toBeInTheDocument();
  });
});
