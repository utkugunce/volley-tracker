import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamInspectorPanel } from "../TeamInspectorPanel";
import { Match, StandingItem } from "@/types/fixture";

const team: StandingItem = {
  rank: 2,
  team: "Eczacıbaşı",
  played: 3,
  won: 2,
  lost: 1,
  points: 6,
  sets_won: 7,
  sets_lost: 4,
  set_ratio: "1.75",
  points_won: 240,
  points_lost: 210,
  point_ratio: "1.14",
  form: ["W", "L", "W"],
};

const matches: Match[] = [
  {
    id: "home-win",
    date: "2026-09-20",
    time: "15:00",
    hall: "Salon A",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "A Grubu",
    match_no: "1",
    home_team: "Eczacıbaşı",
    away_team: "Takım B",
    home_score: 3,
    away_score: 1,
    status: "finished",
  },
  {
    id: "away-win",
    date: "2026-09-22",
    time: "16:00",
    hall: "Salon B",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "A Grubu",
    match_no: "2",
    home_team: "Takım C",
    away_team: "Eczacıbaşı",
    home_score: 1,
    away_score: 3,
    status: "finished",
  },
  {
    id: "upcoming",
    date: "2026-10-01",
    time: "18:00",
    hall: "Salon C",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "A Grubu",
    match_no: "3",
    home_team: "Eczacıbaşı",
    away_team: "Takım D",
    status: "upcoming",
  },
];

describe("TeamInspectorPanel", () => {
  it("seçilen takımın performansını ve kalan maçlarını gösterir", () => {
    render(
      <TeamInspectorPanel
        team={team}
        context={{
          rawKey: "İstanbul - Genç Kızlar Süper Lig - A Grubu",
          city: "İstanbul",
          leagueName: "Genç Kızlar Süper Lig",
          groupName: "A Grubu",
        }}
        matches={matches}
      />
    );

    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getAllByText("1 / 1")).toHaveLength(2);
    expect(screen.getByText("vs Takım D")).toBeInTheDocument();
    expect(screen.getByText("Salon C")).toBeInTheDocument();
  });
});