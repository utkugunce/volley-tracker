import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CityTabBar } from "../CityTabBar";
import { CityInfo } from "@/types/fixture";

const mockCities: CityInfo[] = [
  {
    ilid: "34",
    name: "İstanbul",
    slug: "istanbul",
    url: "https://istanbul.voleyboliltemsilciligi.com",
    status: "Aktif",
    matches_count: 24,
    standings_count: 5,
  },
  {
    ilid: "35",
    name: "İzmir",
    slug: "izmir",
    url: "https://izmir.voleyboliltemsilciligi.com",
    status: "Aktif",
    matches_count: 44,
    standings_count: 9,
  },
  {
    ilid: "51",
    name: "Niğde",
    slug: "nigde",
    url: "https://nigde.voleyboliltemsilciligi.com",
    status: "Aktif",
    matches_count: 4,
    standings_count: 1,
  },
];

describe("CityTabBar Component", () => {
  it("renders All Cities and primary cities correctly", () => {
    const onSelectCity = vi.fn();
    render(
      <CityTabBar
        currentCitySlug="istanbul"
        onSelectCity={onSelectCity}
        cities={mockCities}
        totalMatchesAcrossAll={72}
      />
    );

    expect(screen.getByText("Tüm İller")).toBeInTheDocument();
    expect(screen.getByText("İstanbul")).toBeInTheDocument();
    expect(screen.getByText("İzmir")).toBeInTheDocument();
    expect(screen.getByText("Niğde")).toBeInTheDocument();
  });

  it("calls onSelectCity when a tab is clicked", () => {
    const onSelectCity = vi.fn();
    render(
      <CityTabBar
        currentCitySlug="istanbul"
        onSelectCity={onSelectCity}
        cities={mockCities}
        totalMatchesAcrossAll={72}
      />
    );

    const izmirTab = screen.getByText("İzmir");
    fireEvent.click(izmirTab);
    expect(onSelectCity).toHaveBeenCalledWith("izmir");

    const allCitiesTab = screen.getByText("Tüm İller");
    fireEvent.click(allCitiesTab);
    expect(onSelectCity).toHaveBeenCalledWith("all");
  });

  it("displays the correct match counts on badges", () => {
    render(
      <CityTabBar
        currentCitySlug="all"
        onSelectCity={vi.fn()}
        cities={mockCities}
        totalMatchesAcrossAll={72}
      />
    );

    // 72 total matches badge on 'Tüm İller'
    expect(screen.getByText("72")).toBeInTheDocument();
    // 24 on Istanbul
    expect(screen.getByText("24")).toBeInTheDocument();
    // 44 on Izmir
    expect(screen.getByText("44")).toBeInTheDocument();
  });
});
