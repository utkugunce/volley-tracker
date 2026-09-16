import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FixtureTable } from "../FixtureTable";
import { Match } from "@/types/fixture";

describe("FixtureTable Component", () => {
  const mockMatchMapped: Match = {
    id: "m-1",
    date: "2026-10-15",
    time: "14:00",
    hall: "TVF 50. Yıl Deniz Esinduy",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "A Grubu",
    match_no: "101",
    home_team: "VakıfBank",
    away_team: "Fenerbahçe",
    status: "upcoming",
  };

  const mockMatchUnmapped: Match = {
    id: "m-2",
    date: "2026-10-16",
    time: "16:00",
    hall: "Burhan Felek",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "B Grubu",
    match_no: "102",
    home_team: "Bilinmeyen Spor Kulübü A",
    away_team: "Bilinmeyen Spor Kulübü B",
    status: "upcoming",
  };

  it("render ederken eşleşen takımlar için Volleybox profil bağlantılarını gösterir", () => {
    render(
      <FixtureTable
        title="Genç Kızlar Fikstür"
        matches={[mockMatchMapped]}
        favorites={[]}
        onToggleFavorite={vi.fn()}
      />
    );

    expect(screen.getByText("VakıfBank")).toBeInTheDocument();
    expect(screen.getByText("Fenerbahçe")).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(2);

    const vakifLink = links.find((l) => l.getAttribute("href")?.includes("vakfbank-u18"));
    const fbLink = links.find((l) => l.getAttribute("href")?.includes("fenerbahce-u18"));

    expect(vakifLink).toBeDefined();
    expect(vakifLink).toHaveAttribute("target", "_blank");
    expect(vakifLink).toHaveAttribute("rel", "noopener noreferrer");

    expect(fbLink).toBeDefined();
    expect(fbLink).toHaveAttribute("target", "_blank");

    const vakifImg = screen.getByAltText("VakıfBank logosu");
    expect(vakifImg).toBeInTheDocument();
    expect(vakifImg).toHaveAttribute("src", expect.stringContaining("vakfbank-u18"));
  });

  it("eşleşmeyen takımlar için hiçbir Volleybox linki render etmez ama takım sayfasına yönlendirir", () => {
    render(
      <FixtureTable
        title="Genç Kızlar Fikstür"
        matches={[mockMatchUnmapped]}
        favorites={[]}
        onToggleFavorite={vi.fn()}
      />
    );

    expect(screen.getByText("Bilinmeyen Spor Kulübü A")).toBeInTheDocument();
    expect(screen.getByText("Bilinmeyen Spor Kulübü B")).toBeInTheDocument();

    // Volleybox harici linki render edilmemeli
    expect(screen.queryByRole("link", { name: /volleybox/i })).not.toBeInTheDocument();

    // Takım detay sayfası iç linkleri bulunmalı
    expect(
      screen.getByRole("link", { name: "Bilinmeyen Spor Kulübü A" }).getAttribute("href")
    ).toContain("/takim/bilinmeyen-spor-kulubu-a");
    expect(
      screen.getByRole("link", { name: "Bilinmeyen Spor Kulübü B" }).getAttribute("href")
    ).toContain("/takim/bilinmeyen-spor-kulubu-b");
  });

  it("lig başlığı için Volleybox turnuva linki render eder", () => {
    render(
      <FixtureTable
        title="Genç Kızlar Süper Lig"
        matches={[mockMatchMapped]}
        favorites={[]}
        onToggleFavorite={vi.fn()}
        city="İstanbul"
      />
    );

    const leagueLink = screen.getByRole("link", { name: "Genç Kızlar Süper Lig" });
    expect(leagueLink).toBeInTheDocument();
    expect(leagueLink).toHaveAttribute("href", expect.stringContaining("women-stanbul-super-ligi-u18-2026-27-o50864"));
  });

  it("takım adının sonundaki A ve B harflerini her zaman tam olarak korur", () => {
    const mockABMatch: Match = {
      id: "m-ab",
      date: "2026-10-17",
      time: "15:00",
      hall: "TVF 50. Yıl",
      category: "Genç Kızlar Süper Lig",
      age_group: "Genç",
      gender: "Kız",
      group: "A Grubu",
      match_no: "103",
      home_team: "Eczacıbaşı A",
      away_team: "VakıfBank B",
      status: "upcoming",
    };

    render(
      <FixtureTable
        title="Genç Kızlar Fikstür"
        matches={[mockABMatch]}
        favorites={[]}
        onToggleFavorite={vi.fn()}
      />
    );

    expect(screen.getByText("Eczacıbaşı A")).toBeInTheDocument();
    expect(screen.getByText("VakıfBank B")).toBeInTheDocument();
  });
});

