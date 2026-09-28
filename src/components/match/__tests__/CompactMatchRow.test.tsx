import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CompactMatchRow } from "../CompactMatchRow";
import { Match } from "@/types/fixture";

vi.mock("@/utils/volleybox", () => ({
  getVolleyboxMapping: (teamName: string) => ({
    matched_as: teamName,
    volleybox_url: `https://women.volleybox.net/${teamName.toLowerCase().replace(/\s+/g, "-")}-t1`,
    logo_url: "/logos/test-team.png",
  }),
  normalizeCitySlug: (city: string) => city.toLowerCase(),
}));

describe("CompactMatchRow", () => {
  it("keeps the favorite control visible on touch-sized layouts", () => {
    const match = {
      id: "match-1",
      home_team: "Eczacıbaşı",
      away_team: "Fenerbahçe",
      date: "2026-09-27",
      time: "14:00",
      status: "upcoming",
    } as Match;

    render(<CompactMatchRow match={match} onToggleFavorite={vi.fn()} />);

    const favoriteButton = screen.getByRole("button", { name: "Favoriye Ekle" });
    expect(favoriteButton.className).toContain("opacity-100");
    expect(favoriteButton.className).not.toContain("opacity-0");
  });

  it("links team names to their pages and Volleybox profiles and shows logos", () => {
    const match = {
      id: "match-links",
      home_team: "Test Ev",
      away_team: "Test Deplasman",
      date: "2026-09-27",
      time: "14:00",
      city: "Ankara",
      category: "Genç Kızlar",
      status: "upcoming",
    } as Match;

    render(<CompactMatchRow match={match} />);

    expect(screen.getByRole("link", { name: "Test Ev" })).toHaveAttribute(
      "href",
      "/takim/test-ev?sehir=ankara"
    );
    expect(screen.getByTitle("Test Ev — Volleybox Takım Profili")).toHaveAttribute(
      "href",
      "https://women.volleybox.net/test-ev-t1"
    );
    expect(screen.getByAltText("Test Ev logosu")).toBeInTheDocument();
  });

  it("boxes changed date, time, and hall values with the previous Volleybox values", () => {
    const match = {
      id: "match-changed",
      home_team: "Test Ev",
      away_team: "Test Deplasman",
      date: "2026-09-27",
      time: "14:00",
      hall: "Yeni Salon",
      status: "finished",
      volleybox: {
        discrepancy: {
          has_diff: true,
          date_diff: true,
          time_diff: true,
          hall_diff: true,
          vb_date: "2026-09-26",
          vb_time: "13:00",
          vb_hall: "Eski Salon",
        },
      },
    } as Match;

    const { container } = render(<CompactMatchRow match={match} mode="fixtures" />);

    expect(screen.getByText("VB 09-26")).toBeInTheDocument();
    expect(screen.getByText("09-27 / VB 09-26")).toBeInTheDocument();
    expect(screen.getByText("VB 13:00")).toBeInTheDocument();
    expect(screen.getByText("VB: Eski Salon")).toBeInTheDocument();
    expect(container.querySelector("[data-match-row]")?.className).toContain("bg-amber-950/30");
  });
});