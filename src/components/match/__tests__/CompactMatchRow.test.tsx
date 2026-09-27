import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CompactMatchRow } from "../CompactMatchRow";
import { Match } from "@/types/fixture";

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
});