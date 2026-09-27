import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MatchInspectorPanel } from "../MatchInspectorPanel";
import { Match, StandingItem } from "@/types/fixture";

describe("MatchInspectorPanel Component", () => {
  const mockMatch: Match = {
    id: "m-insp-1",
    date: "2026-10-20",
    time: "15:30",
    hall: "TVF 50. Yıl Deniz Esinduy",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "A Grubu",
    match_no: "204",
    home_team: "Eczacıbaşı",
    away_team: "Galatasaray",
    score: "3 - 1",
    home_score: 3,
    away_score: 1,
    set_scores: ["25-18", "22-25", "25-20", "25-19"],
    status: "finished",
    referee_1: "Ahmet Yılmaz",
    referee_2: "Mehmet Demir",
  };

  const mockAllMatches: Match[] = [
    mockMatch,
    {
      id: "m-prev-1",
      date: "2026-09-10",
      time: "13:00",
      hall: "Burhan Felek",
      category: "Genç Kızlar Süper Lig",
      age_group: "Genç",
      gender: "Kız",
      group: "A Grubu",
      match_no: "102",
      home_team: "Galatasaray",
      away_team: "Eczacıbaşı",
      score: "0 - 3",
      home_score: 0,
      away_score: 3,
      status: "finished",
    },
  ];

  const mockStandings: Record<string, StandingItem[]> = {
    "İstanbul - Genç Kızlar Süper Lig - A Grubu": [
      {
        rank: 1,
        team: "Eczacıbaşı",
        played: 5,
        won: 5,
        lost: 0,
        points: 15,
        sets_won: 15,
        sets_lost: 2,
        set_ratio: "7.5",
        points_won: 412,
        points_lost: 320,
        point_ratio: "1.28",
        form: ["W", "W", "W", "W", "W"],
      },
      {
        rank: 2,
        team: "Galatasaray",
        played: 5,
        won: 3,
        lost: 2,
        points: 9,
        sets_won: 11,
        sets_lost: 8,
        set_ratio: "1.37",
        points_won: 390,
        points_lost: 370,
        point_ratio: "1.05",
        form: ["W", "L", "W", "L", "W"],
      },
    ],
  };

  it("seçili maç olmadığında boş durum mesajını ve ikonunu gösterir", () => {
    render(<MatchInspectorPanel match={null} />);
    expect(
      screen.getByText("Detayları görüntülemek için bir maç seçin")
    ).toBeInTheDocument();
    expect(screen.getByText("Sofascore Maç Merkezi")).toBeInTheDocument();
  });

  it("seçili maç olduğunda üst başlık, skorboard ve set matrisini render eder", () => {
    const onClose = vi.fn();
    const onToggleFavorite = vi.fn();

    render(
      <MatchInspectorPanel
        match={mockMatch}
        allMatches={mockAllMatches}
        standings={mockStandings}
        onClose={onClose}
        onToggleFavorite={onToggleFavorite}
        isFavorite={false}
      />
    );

    // Üst Başlık (Lig, Tarih, Salon)
    expect(screen.getAllByText(/Genç Kızlar Süper Lig/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/TVF 50\. Yıl Deniz Esinduy/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("2026-10-20")).toBeInTheDocument();

    // Skorboard Başlığı
    expect(screen.getAllByText("Eczacıbaşı").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Galatasaray").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("3 : 1")).toBeInTheDocument();
    expect(screen.getByText("Maç Tamamlandı")).toBeInTheDocument();

    // Set Skor Matrisi (S1, S2, S3, S4 & Toplam Sayı)
    expect(screen.getByText("S1")).toBeInTheDocument();
    expect(screen.getByText("S2")).toBeInTheDocument();
    expect(screen.getByText("S3")).toBeInTheDocument();
    expect(screen.getByText("S4")).toBeInTheDocument();
    // Toplam sayılar (Eczacıbaşı: 25+22+25+25 = 97, Galatasaray: 18+25+20+19 = 82)
    expect(screen.getByText("97")).toBeInTheDocument();
    expect(screen.getByText("82")).toBeInTheDocument();
  });

  it("Genel Bakış sekmesinde salon harita butonu ve hakem bilgileri görüntülenir", () => {
    render(
      <MatchInspectorPanel
        match={mockMatch}
        allMatches={mockAllMatches}
        standings={mockStandings}
      />
    );

    // Genel Bakış varsayılan aktif sekmedir
    expect(screen.getByText("Google Haritalarda Aç")).toBeInTheDocument();
    expect(screen.getByText("Ahmet Yılmaz")).toBeInTheDocument();
    expect(screen.getByText("Mehmet Demir")).toBeInTheDocument();
  });

  it("H2H & Form sekmesine tıklandığında form rozetleri ve geçmiş karşılaşmalar listelenir", () => {
    render(
      <MatchInspectorPanel
        match={mockMatch}
        allMatches={mockAllMatches}
        standings={mockStandings}
      />
    );

    const h2hTab = screen.getByRole("button", { name: "H2H & Form" });
    fireEvent.click(h2hTab);

    expect(screen.getByText("Son 5 Maç Formu")).toBeInTheDocument();
    expect(screen.getByText("Önceki Karşılaşmalar")).toBeInTheDocument();
    expect(screen.getByText("0 : 3")).toBeInTheDocument(); // Önceki maç skoru
  });

  it("Grup Durumu sekmesine tıklandığında mini puan durumu tablosu gösterilir", () => {
    render(
      <MatchInspectorPanel
        match={mockMatch}
        allMatches={mockAllMatches}
        standings={mockStandings}
      />
    );

    const standingsTab = screen.getByRole("button", { name: "Grup Durumu" });
    fireEvent.click(standingsTab);

    expect(screen.getByText("A Grubu")).toBeInTheDocument();
    expect(screen.getByTitle("Puan")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument(); // Eczacıbaşı puanı
    expect(screen.getByText("9")).toBeInTheDocument(); // Galatasaray puanı
  });

  it("kapatma butonuna basıldığında onClose fonksiyonu tetiklenir", () => {
    const onClose = vi.fn();
    render(<MatchInspectorPanel match={mockMatch} onClose={onClose} />);

    const closeBtn = screen.getByRole("button", { name: "Kapat" });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
