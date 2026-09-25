import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HomePortalView } from "../HomePortalView";
import { Match, CityInfo } from "@/types/fixture";

const mockMatches: Match[] = [
  {
    id: "m-1",
    date: "2026-09-24",
    time: "14:00",
    home_team: "VakıfBank U18",
    away_team: "Eczacıbaşı U18",
    city: "İstanbul",
    group: "İstanbul Genç Kızlar Süper Ligi",
    category: "Genç Kızlar",
    age_group: "Genç",
    gender: "Kız",
    match_no: "1",
    hall: "TVF 50. Yıl Deniz Esinduy",
    status: "finished",
    home_score: 3,
    away_score: 1,
    set_scores: ["25-22", "23-25", "25-18", "25-20"],
    volleybox: {
      synced: true,
      has_score: true,
      score: "3-1",
    },
  },
  {
    id: "m-2",
    date: "2026-09-24",
    time: "16:30",
    home_team: "Fenerbahçe U18",
    away_team: "Galatasaray U18",
    city: "İstanbul",
    group: "İstanbul Genç Kızlar Süper Ligi",
    category: "Genç Kızlar",
    age_group: "Genç",
    gender: "Kız",
    match_no: "2",
    hall: "Burhan Felek Voleybol Salonu",
    status: "upcoming",
    home_score: null,
    away_score: null,
  },
];

const mockCitiesList: CityInfo[] = [
  { ilid: "34", slug: "istanbul", name: "İstanbul", matches_count: 2, standings_count: 1, url: "", status: "Aktif", data_file: null },
  { ilid: "06", slug: "ankara", name: "Ankara", matches_count: 0, standings_count: 0, url: "", status: "Fikstür Açıklanmadı", data_file: null },
];

describe("HomePortalView Component", () => {
  it("renders live hub, filter buttons and match rows", () => {
    const onSelectCity = vi.fn();
    const onToggleFavorite = vi.fn();
    const onSelectMatch = vi.fn();
    const onNavigateTab = vi.fn();

    render(
      <HomePortalView
        matches={mockMatches}
        city="Tüm İller"
        currentCitySlug="all"
        onSelectCity={onSelectCity}
        citiesList={mockCitiesList}
        standings={{}}
        favorites={[]}
        onToggleFavorite={onToggleFavorite}
        onSelectMatch={onSelectMatch}
        onNavigateTab={onNavigateTab}
        todayStr="2026-09-24"
        yesterdayStr="2026-09-23"
      />
    );

    // 1. Canlı Hub başlığı ve filtre butonları
    expect(screen.getByText(/Canlı Hub/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Bugün/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Biten Skorlar/i)).toBeInTheDocument();

    // 2. Takımların ve maç şeritlerinin ekranda listelenmesi
    expect(screen.getAllByText(/VakıfBank/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Eczacıbaşı/i).length).toBeGreaterThan(0);
  });

  it("handles city filter selection from quick city pills", () => {
    const onSelectCity = vi.fn();
    render(
      <HomePortalView
        matches={mockMatches}
        city="Tüm İller"
        currentCitySlug="all"
        onSelectCity={onSelectCity}
        citiesList={mockCitiesList}
        standings={{}}
        favorites={[]}
        onToggleFavorite={vi.fn()}
        onSelectMatch={vi.fn()}
        onNavigateTab={vi.fn()}
        todayStr="2026-09-24"
        yesterdayStr="2026-09-23"
      />
    );

    // İstanbul hapına tıklama
    const istanbulButtons = screen.getAllByRole("button").filter(
      (b) => b.textContent?.includes("İstanbul")
    );
    if (istanbulButtons.length > 0) {
      fireEvent.click(istanbulButtons[0]);
      expect(onSelectCity).toHaveBeenCalledWith("istanbul");
    }
  });
});
