import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { isMatchScored } from "../DashboardClient";
import { FilterBar } from "../FilterBar";
import { Match } from "@/types/fixture";

describe("Results and City Header enhancements", () => {
  it("isMatchScored correctly identifies matches with scores or finished status", () => {
    const finishedMatch: Match = {
      id: "m-1",
      date: "2026-09-15",
      time: "14:00",
      hall: "50. Yıl",
      category: "Genç Kızlar Süper Lig",
      age_group: "Genç",
      gender: "Kız",
      group: "A Grubu",
      match_no: "1",
      home_team: "Eczacıbaşı",
      away_team: "Ümraniye Bld",
      status: "finished",
      score: "3 - 0",
    };
    expect(isMatchScored(finishedMatch)).toBe(true);

    const upcomingWithScoreMatch: Match = {
      id: "m-2",
      date: "2026-09-16",
      time: "14:00",
      hall: "50. Yıl",
      category: "Genç Kızlar Süper Lig",
      age_group: "Genç",
      gender: "Kız",
      group: "A Grubu",
      match_no: "2",
      home_team: "Fenerbahçe",
      away_team: "VakıfBank",
      status: "upcoming",
      home_score: 3,
      away_score: 1,
    };
    expect(isMatchScored(upcomingWithScoreMatch)).toBe(true);

    const vbScoredMatch: Match = {
      id: "m-3",
      date: "2026-09-17",
      time: "14:00",
      hall: "50. Yıl",
      category: "Genç Kızlar Süper Lig",
      age_group: "Genç",
      gender: "Kız",
      group: "A Grubu",
      match_no: "3",
      home_team: "Takım A",
      away_team: "Takım B",
      status: "upcoming",
      volleybox: {
        synced: true,
        has_score: true,
        score: "3 - 2",
      },
    };
    expect(isMatchScored(vbScoredMatch)).toBe(true);

    const unplayedMatch: Match = {
      id: "m-4",
      date: "2026-09-25",
      time: "18:00",
      hall: "Batıkent",
      category: "Genç Kızlar Süper Lig",
      age_group: "Genç",
      gender: "Kız",
      group: "A Grubu",
      match_no: "4",
      home_team: "Zeren Spor",
      away_team: "Başkent Arma",
      status: "upcoming",
      score: "- : -",
    };
    expect(isMatchScored(unplayedMatch)).toBe(false);
  });

  it("FilterBar renders green SONUÇLAR badge instead of HEPSİ/OYNANACAK/BİTENLER when isResultsTab is true", () => {
    render(
      <FilterBar
        categories={["Genç Kızlar Süper Lig", "Yıldız Kızlar Süper Lig"]}
        selectedCategory="Tümü"
        onSelectCategory={vi.fn()}
        statusFilter="finished"
        onSelectStatusFilter={vi.fn()}
        counts={{ all: 29, upcoming: 0, finished: 29 }}
        halls={["50. Yıl"]}
        selectedHall="Tümü"
        onSelectHall={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        onReset={vi.fn()}
        isFiltered={false}
        isResultsTab={true}
      />
    );

    // BİTENLER veya HEPSİ durum butonları görünmemeli
    expect(screen.queryByRole("button", { name: /oynanacak/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /hepsi/i })).not.toBeInTheDocument();

    // SONUÇLAR rozeti ve 29 sayısı bulunmalı
    expect(screen.getByText("SONUÇLAR")).toBeInTheDocument();
    expect(screen.getByText("29")).toBeInTheDocument();
  });
});
