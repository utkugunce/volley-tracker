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

    // 1. Maç Merkezi başlığı ve filtre butonları
    expect(screen.getByRole("button", { name: /Maç Merkezi/i })).toBeInTheDocument();
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

  it("renders quick date pills and navigates to today tab when a date is clicked", () => {
    const onNavigateTab = vi.fn();
    const onSelectDate = vi.fn();

    render(
      <HomePortalView
        matches={mockMatches}
        city="Tüm İller"
        currentCitySlug="all"
        onSelectCity={vi.fn()}
        citiesList={mockCitiesList}
        standings={{}}
        favorites={[]}
        onToggleFavorite={vi.fn()}
        onSelectMatch={vi.fn()}
        onNavigateTab={onNavigateTab}
        todayStr="2026-09-24"
        yesterdayStr="2026-09-23"
        onSelectDate={onSelectDate}
      />
    );

    expect(screen.getByText(/Tarihler:/i)).toBeInTheDocument();
    const todayBtn = screen.getByTitle(/2026-09-24 maçlarını görüntüle/i);
    expect(todayBtn).toBeInTheDocument();
    fireEvent.click(todayBtn);
    expect(onSelectDate).toHaveBeenCalledWith("2026-09-24");
    expect(onNavigateTab).toHaveBeenCalledWith("today");
  });

  it("renders Volleybox Operatör İş Kuyruğu tabs, copies set scores, and triggers full data load", () => {
    const onEnsureFullData = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const workbenchMatches: Match[] = [
      ...mockMatches,
      {
        id: "m-vb-missing",
        city: "Ankara",
        date: "2026-09-24",
        time: "18:00",
        hall: "TVF Başkent",
        category: "Genç Kızlar Süper Lig",
        age_group: "Genç",
        gender: "Kız",
        group: "A Grubu",
        match_no: "501",
        home_team: "Bilinmeyen SK A",
        away_team: "Bilinmeyen SK B",
        status: "finished",
        home_score: 3,
        away_score: 0,
        score: "3 - 0",
        set_scores: ["25-18", "25-19", "25-14"],
        volleybox: {
          synced: true,
          match_id: 777,
          url: "https://women.volleybox.net/m777",
          has_score: false,
        },
      },
    ];

    render(
      <HomePortalView
        matches={workbenchMatches}
        city="Tüm İller"
        currentCitySlug="all"
        onSelectCity={vi.fn()}
        citiesList={mockCitiesList}
        standings={{}}
        favorites={[]}
        onToggleFavorite={vi.fn()}
        onSelectMatch={vi.fn()}
        onNavigateTab={vi.fn()}
        todayStr="2026-09-24"
        yesterdayStr="2026-09-23"
        isPartialData={true}
        onEnsureFullData={onEnsureFullData}
      />
    );

    expect(screen.getByText(/Volleybox Operatör İş Kuyruğu/i)).toBeInTheDocument();
    const copySetsBtn = screen.getByRole("button", { name: /Setleri Kopyala/i });
    fireEvent.click(copySetsBtn);
    expect(writeText).toHaveBeenCalledWith("25-18, 25-19, 25-14");

    const unmappedTab = screen.getByRole("tab", { name: /Eşleşmeyen Takımlar/i });
    fireEvent.click(unmappedTab);
    expect(onEnsureFullData).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText(/Volleybox'ta Ara/i).length).toBeGreaterThan(0);

    vi.unstubAllGlobals();
  });
});
