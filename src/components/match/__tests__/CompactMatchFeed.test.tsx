import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Match } from "@/types/fixture";
import { CompactMatchFeed } from "../CompactMatchFeed";

describe("CompactMatchFeed keyboard navigation", () => {
  const matches: Match[] = [
    {
      id: "match-1",
      date: "2026-10-15",
      time: "10:00",
      hall: "Salon A",
      category: "Genç Kızlar",
      age_group: "Genç",
      gender: "Kız",
      group: "A Grubu",
      match_no: "101",
      home_team: "Takım A",
      away_team: "Takım B",
      home_score: null,
      away_score: null,
      status: "upcoming",
    },
    {
      id: "match-2",
      date: "2026-10-15",
      time: "11:00",
      hall: "Salon A",
      category: "Genç Kızlar",
      age_group: "Genç",
      gender: "Kız",
      group: "A Grubu",
      match_no: "102",
      home_team: "Takım C",
      away_team: "Takım D",
      home_score: null,
      away_score: null,
      status: "upcoming",
    },
  ];

  it("maç satırında aşağı ok ile sonraki maçı seçer ve odağı taşır", () => {
    const onSelectMatch = vi.fn();
    const { container } = render(
      <CompactMatchFeed
        matches={matches}
        selectedMatchId="match-1"
        onSelectMatch={onSelectMatch}
        todayStr="2026-10-15"
        yesterdayStr="2026-10-14"
      />
    );

    const firstRow = container.querySelector<HTMLElement>('[data-match-id="match-1"]');
    const secondRow = container.querySelector<HTMLElement>('[data-match-id="match-2"]');
    expect(firstRow).toBeInTheDocument();
    expect(secondRow).toBeInTheDocument();

    if (!firstRow || !secondRow) return;
    firstRow.focus();
    fireEvent.keyDown(firstRow, { key: "ArrowDown" });

    expect(onSelectMatch).toHaveBeenCalledWith(matches[1]);
    expect(secondRow).toHaveFocus();
  });

  it("fikstür modunda salon bilgisini ve takvime ekleme aksiyonunu gösterir", () => {
    const { getAllByText, getAllByRole } = render(
      <CompactMatchFeed
        matches={matches}
        todayStr="2026-10-15"
        yesterdayStr="2026-10-14"
        viewMode="fixtures"
      />
    );

    expect(getAllByText("Salon A")).toHaveLength(2);
    expect(getAllByRole("button", { name: "Takvime ekle" })).toHaveLength(2);
  });

  it("sonuç modunda sadece skorlu maçları listeler", () => {
    const scoredMatch: Match = {
      ...matches[0],
      home_score: 3,
      away_score: 0,
      status: "finished",
      set_scores: ["25-20", "25-18", "25-22"],
    };
    const { container } = render(
      <CompactMatchFeed
        matches={[scoredMatch, matches[1]]}
        todayStr="2026-10-15"
        yesterdayStr="2026-10-14"
        viewMode="results"
        availableDates={["2026-10-15"]}
      />
    );

    expect(container.querySelectorAll("[data-match-row]")).toHaveLength(1);
  });
});