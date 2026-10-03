import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamFormChart } from "../TeamFormChart";
import { TeamHallsCard } from "../TeamHallsCard";
import { TeamOpponentRecords } from "../TeamOpponentRecords";

describe("takım sayfası bölümleri", () => {
  it("TeamFormChart: 2'den az maçta hiçbir şey çizmez", () => {
    const { container } = render(
      <TeamFormChart series={[{ id: "1", date: "01.01.2026", opponent: "X", result: "W", score: "3 - 0", points: 3 }]} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("TeamFormChart: her maç için bir nokta çizer ve erişilebilir özet verir", () => {
    const { container } = render(
      <TeamFormChart
        series={[
          { id: "1", date: "01.01.2026", opponent: "X", result: "W", score: "3 - 0", points: 3 },
          { id: "2", date: "08.01.2026", opponent: "Y", result: "L", score: "1 - 3", points: 0 },
        ]}
      />
    );
    expect(container.querySelectorAll("circle")).toHaveLength(2);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", expect.stringContaining("1 galibiyet"));
  });

  it("TeamHallsCard: salon yoksa gizlenir, varsa yol tarifi bağlantısı gösterir", () => {
    const { container, rerender } = render(<TeamHallsCard halls={[]} />);
    expect(container).toBeEmptyDOMElement();
    rerender(
      <TeamHallsCard
        halls={[{ name: "Test Salonu", matchCount: 3, city: "Ankara", navigationUrl: "https://www.google.com/maps/search/?api=1&query=x", details: null }]}
      />
    );
    expect(screen.getByText("Test Salonu")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Yol Tarifi/ })).toHaveAttribute("href", expect.stringContaining("google.com/maps"));
  });

  it("TeamOpponentRecords: kayıt yoksa gizlenir", () => {
    const { container } = render(<TeamOpponentRecords records={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
