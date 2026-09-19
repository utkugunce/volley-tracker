import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrimaryTeamWidget } from "../PrimaryTeamWidget";
import { Match } from "@/types/fixture";

describe("PrimaryTeamWidget Component", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockMatches: Match[] = [
    {
      id: "m-prim-1",
      date: "2026-10-20",
      time: "15:00",
      hall: "50. Yıl",
      category: "Genç Kızlar Süper Lig",
      age_group: "Genç",
      gender: "Kız",
      group: "A Grubu",
      match_no: "201",
      home_team: "VakıfBank",
      away_team: "Eczacıbaşı",
      status: "upcoming",
    },
  ];

  it("kulüp seçili değilken 'Kulübünüzü Takip Edin' davetini gösterir", () => {
    render(
      <PrimaryTeamWidget
        matches={mockMatches}
        availableTeams={["VakıfBank", "Eczacıbaşı"]}
      />
    );

    expect(screen.getByText("Kulübünüzü Takip Edin")).toBeInTheDocument();
    expect(screen.getByText("Kulüp Seç")).toBeInTheDocument();
  });

  it("kulüp seçildiğinde VIP takip kartını ve sonraki maçı gösterir", () => {
    localStorage.setItem("tvf_primary_team", "VakıfBank");

    render(
      <PrimaryTeamWidget
        matches={mockMatches}
        availableTeams={["VakıfBank", "Eczacıbaşı"]}
      />
    );

    expect(screen.getByText("VakıfBank")).toBeInTheDocument();
    expect(screen.getByText("Kulübüm")).toBeInTheDocument();
    expect(screen.getByText(/vs Eczacıbaşı/i)).toBeInTheDocument();
  });
});
