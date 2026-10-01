import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CompactMatchRow } from "@/components/match/CompactMatchRow";
import { SetScoreMatrix } from "@/components/match/SetScoreMatrix";
import { StandingsTable } from "@/components/StandingsTable";
import { Match, StandingItem } from "@/types/fixture";

vi.mock("@/utils/volleybox", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/utils/volleybox")>();
  return {
    ...actual,
    getVolleyboxMapping: (teamName: string) => ({
      matched_as: teamName,
      volleybox_url: `https://women.volleybox.net/${teamName.toLowerCase().replace(/\s+/g, "-")}-t1`,
      logo_url: "/logos/test.png",
    }),
    getVolleyboxLeagueMapping: () => null,
    normalizeCitySlug: (city: string) => city.toLowerCase(),
  };
});

describe("Scoreboard & Tabular Numbers Typography (GÖREV 8)", () => {
  const sampleMatch = {
    id: "m-score-1",
    home_team: "Eczacıbaşı",
    away_team: "VakıfBank",
    home_score: 3,
    away_score: 2,
    date: "2026-10-15",
    time: "17:30",
    status: "finished",
    set_scores: ["25-21", "22-25", "25-18", "19-25", "15-12"],
  } as unknown as Match;

  it("CompactMatchRow renders set scores and total scores with font-scoreboard and tabular-nums", () => {
    const { container } = render(<CompactMatchRow match={sampleMatch} />);

    // Total score container
    const totalScoreContainer = container.querySelector(".w-\\[32px\\]");
    expect(totalScoreContainer).toHaveClass("font-scoreboard");
    expect(totalScoreContainer).toHaveClass("tabular-nums");

    // Set scores container
    const setScoresContainer = container.querySelector(".hidden.sm\\:flex");
    expect(setScoresContainer).toHaveClass("font-scoreboard");
    expect(setScoresContainer).toHaveClass("tabular-nums");
  });

  it("SetScoreMatrix renders headers and table score cells with font-scoreboard and tabular-nums", () => {
    render(<SetScoreMatrix match={sampleMatch} />);

    const setHeader = screen.getByText("S1");
    expect(setHeader).toHaveClass("font-scoreboard");
    expect(setHeader).toHaveClass("tabular-nums");

    const totalHeader = screen.getByText("Toplam");
    expect(totalHeader).toHaveClass("font-scoreboard");
    expect(totalHeader).toHaveClass("tabular-nums");
  });

  it("StandingsTable renders ranks and numerical stats cells with font-scoreboard and tabular-nums", () => {
    const sampleStandings: Record<string, StandingItem[]> = {
      "İstanbul - Genç Kızlar Süper Lig - A Grubu": [
        {
          rank: 1,
          team: "VakıfBank",
          played: 10,
          won: 9,
          lost: 1,
          points: 27,
          sets_won: 29,
          sets_lost: 5,
          set_ratio: "5.80",
          point_ratio: "1.32",
          points_won: 800,
          points_lost: 600,
          form: ["W", "W", "W"],
        } as unknown as StandingItem,
      ],
    };

    render(<StandingsTable standingsData={sampleStandings} city="İstanbul" />);

    // Rank and stats cells with '1'
    const ones = screen.getAllByText("1");
    expect(ones.length).toBeGreaterThan(0);
    ones.forEach((el) => {
      expect(el).toHaveClass("font-scoreboard");
      expect(el).toHaveClass("tabular-nums");
    });

    // Points cell
    const pointsCell = screen.getByText("27");
    expect(pointsCell).toHaveClass("font-scoreboard");
    expect(pointsCell).toHaveClass("tabular-nums");
  });
});
