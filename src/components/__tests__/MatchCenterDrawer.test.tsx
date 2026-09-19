import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MatchCenterDrawer } from "../MatchCenterDrawer";
import { Match } from "@/types/fixture";

describe("MatchCenterDrawer Component", () => {
  const mockMatch: Match = {
    id: "m-center-1",
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
    score: "3 - 1",
    home_score: 3,
    away_score: 1,
    set_scores: ["25-20", "23-25", "25-18", "25-22"],
    status: "finished",
  };

  it("render ederken maç skorunu, takımları ve set skorları dökümünü eksiksiz gösterir", () => {
    const onClose = vi.fn();
    render(
      <MatchCenterDrawer
        match={mockMatch}
        onClose={onClose}
        city="İstanbul"
      />
    );

    // Takım isimleri ve başlıklar
    expect(screen.getAllByText(/VakıfBank/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Fenerbahçe/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("3 : 1")).toBeInTheDocument();
    expect(screen.getByText("Maç Tamamlandı")).toBeInTheDocument();

    // Set skorları dökümü
    expect(screen.getByText("25-20")).toBeInTheDocument();
    expect(screen.getByText("23-25")).toBeInTheDocument();
    expect(screen.getByText("25-18")).toBeInTheDocument();
    expect(screen.getByText("25-22")).toBeInTheDocument();

    // Salon ve yol tarifi
    expect(screen.getByText("TVF 50. Yıl Deniz Esinduy")).toBeInTheDocument();
    expect(screen.getByText("Yol Tarifi")).toBeInTheDocument();
  });

  it("Kapat butonuna tıklandığında onClose tetiklenir", () => {
    const onClose = vi.fn();
    render(
      <MatchCenterDrawer
        match={mockMatch}
        onClose={onClose}
        city="İstanbul"
      />
    );

    const closeBtn = screen.getByTitle(/Kapat/i);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("Hikaye Kartı butonuna basıldığında SocialStoryModal açılır", () => {
    render(
      <MatchCenterDrawer
        match={mockMatch}
        onClose={vi.fn()}
        city="İstanbul"
      />
    );

    const storyBtn = screen.getByText("Hikaye Kartı");
    fireEvent.click(storyBtn);

    expect(screen.getByText("Instagram & WhatsApp Hikaye Kartı")).toBeInTheDocument();
  });
});
