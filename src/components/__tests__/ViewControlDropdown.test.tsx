import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ViewControlDropdown } from "../ViewControlDropdown";

describe("ViewControlDropdown", () => {
  it("renders null if neither cities nor leagues exist", () => {
    const { container } = render(
      <ViewControlDropdown
        hasCities={false}
        hasLeagues={false}
        areCitiesCollapsed={false}
        areLeaguesCollapsed={false}
        onExpandCities={vi.fn()}
        onCollapseCities={vi.fn()}
        onExpandLeagues={vi.fn()}
        onCollapseLeagues={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders Görünüm button with options when cities and leagues are present", () => {
    const onExpandCities = vi.fn();
    const onCollapseCities = vi.fn();
    const onExpandLeagues = vi.fn();
    const onCollapseLeagues = vi.fn();

    render(
      <ViewControlDropdown
        hasCities={true}
        hasLeagues={true}
        areCitiesCollapsed={false}
        areLeaguesCollapsed={true}
        onExpandCities={onExpandCities}
        onCollapseCities={onCollapseCities}
        onExpandLeagues={onExpandLeagues}
        onCollapseLeagues={onCollapseLeagues}
        themeColor="emerald"
      />
    );

    const summary = screen.getByText("Görünüm");
    expect(summary).toBeInTheDocument();

    // Ligler veya iller gizli olduğunda amber gösterge noktası bulunmalı
    const dot = summary.parentElement?.querySelector(".bg-amber-400");
    expect(dot).toBeInTheDocument();

    // İl butonları
    const expandCitiesBtn = screen.getByRole("button", { name: /Tümünü Göster/i });
    const collapseCitiesBtn = screen.getByRole("button", { name: /Tümünü Gizle/i });
    fireEvent.click(expandCitiesBtn);
    expect(onExpandCities).toHaveBeenCalled();
    fireEvent.click(collapseCitiesBtn);
    expect(onCollapseCities).toHaveBeenCalled();

    // Lig butonları
    const expandLeaguesBtn = screen.getByRole("button", { name: /Ligleri Aç/i });
    const collapseLeaguesBtn = screen.getByRole("button", { name: /Ligleri Gizle/i });
    fireEvent.click(expandLeaguesBtn);
    expect(onExpandLeagues).toHaveBeenCalled();
    fireEvent.click(collapseLeaguesBtn);
    expect(onCollapseLeagues).toHaveBeenCalled();
  });
});
