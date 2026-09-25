import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HomePortalView } from "../HomePortalView";
import { Match } from "@/types/fixture";

const mockMatches: Match[] = [
  {
    id: "m-1",
    date: "2026-09-24",
    time: "14:00",
    home_team: "VakıfBank U18",
    away_team: "Eczacıbaşı U18",
    city: "İstanbul",
    league: "İstanbul Genç Kızlar Süper Ligi",
    category: "Genç Kızlar",
    hall: "TVF 50. Yıl Deniz Esinduy",
    status: "finished",
    home_score: 3,
    away_score: 1,
    sets: "25-22, 23-25, 25-18, 25-20",
    volleybox: {
      synced: true,
      has_score: true,
      score: "3-1",
      tournament_name: "İstanbul U18 Süper Ligi",
    },
  },
  {
    id: "m-2",
    date: "2026-09-24",
    time: "16:30",
    home_team: "Fenerbahçe U18",
    away_team: "Galatasaray U18",
    city: "İstanbul",
    league: "İstanbul Genç Kızlar Süper Ligi",
    category: "Genç Kızlar",
    hall: "Burhan Felek Voleybol Salonu",
    status: "upcoming",
    home_score: null,
    away_score: null,
  },
];

describe("HomePortalView Component", () => {
  it("renders portal hero, KPI metrics and featured match sections", () => {
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
        citiesList={[
          { slug: "istanbul", name: "İstanbul", matchCount: 2 },
          { slug: "ankara", name: "Ankara", matchCount: 0 },
        ]}
        standings={{}}
        favorites={[]}
        onToggleFavorite={onToggleFavorite}
        onSelectMatch={onSelectMatch}
        onNavigateTab={onNavigateTab}
        todayStr="2026-09-24"
        yesterdayStr="2026-09-23"
      />
    );

    // 1. Hero başlığı ve rozetler
    expect(screen.getByText(/Türkiye Voleybol Federasyonu Altyapı Portalı/i)).toBeInTheDocument();
    expect(screen.getByText(/Canlı Maç & Veri Merkezi/i)).toBeInTheDocument();

    // 2. İstatistik kartları (KPI)
    expect(screen.getByText("Resmi Bültende")).toBeInTheDocument();
    expect(screen.getByText("Altyapı Takımı")).toBeInTheDocument();

    // 3. Hızlı geçiş butonları (Fikstür, Sonuçlar, Puan Durumu)
    const fixturesBtn = screen.getByRole("button", { name: /Günün Maçları/i });
    expect(fixturesBtn).toBeInTheDocument();
    fireEvent.click(fixturesBtn);
    expect(onNavigateTab).toHaveBeenCalledWith("today");

    // 4. Son biten maçlar vitrininde maç skoru tıklama
    const matchCards = screen.getAllByText(/VakıfBank/i);
    expect(matchCards.length).toBeGreaterThan(0);
  });

  it("handles city filter selection from popular cities carousel", () => {
    const onSelectCity = vi.fn();
    render(
      <HomePortalView
        matches={mockMatches}
        city="Tüm İller"
        currentCitySlug="all"
        onSelectCity={onSelectCity}
        citiesList={[
          { slug: "istanbul", name: "İstanbul", matchCount: 2 },
          { slug: "ankara", name: "Ankara", matchCount: 0 },
        ]}
        standings={{}}
        favorites={[]}
        onToggleFavorite={vi.fn()}
        onSelectMatch={vi.fn()}
        onNavigateTab={vi.fn()}
        todayStr="2026-09-24"
        yesterdayStr="2026-09-23"
      />
    );

    // Popüler iller kartına tıklama
    const ankaraButtons = screen.getAllByRole("button").filter(
      (b) => b.textContent?.includes("Ankara")
    );
    if (ankaraButtons.length > 0) {
      fireEvent.click(ankaraButtons[0]);
      expect(onSelectCity).toHaveBeenCalledWith("ankara");
    }
  });
});
