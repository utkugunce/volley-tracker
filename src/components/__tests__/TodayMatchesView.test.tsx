import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TodayMatchesView } from "../TodayMatchesView";
import { Match } from "@/types/fixture";

const mockMatches: Match[] = [
  {
    id: "m1",
    city: "İstanbul",
    date: "2026-09-14",
    time: "18:00",
    hall: "TVF 50. Yıl",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "A Grubu",
    match_no: "101",
    home_team: "Eczacıbaşı",
    away_team: "Fenerbahçe",
    score: "3 - 1",
    status: "finished",
    volleybox: {
      synced: true,
      has_score: true,
      score: "3 - 1",
    },
  },
  {
    id: "m2",
    city: "İzmir",
    date: "2026-09-16",
    time: "14:00",
    hall: "Atatürk Voleybol Salonu",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "B Grubu",
    match_no: "102",
    home_team: "Arkas Spor",
    away_team: "Göztepe",
    score: "- : -",
    status: "upcoming",
  },
];

describe("TodayMatchesView Component", () => {
  it("renders today's match when matches exist for today", () => {
    render(
      <TodayMatchesView
        matches={mockMatches}
        city="İstanbul"
        todayStr="2026-09-14"
        favorites={[]}
        onToggleFavorite={vi.fn()}
        onNavigateToFullFixtures={vi.fn()}
      />
    );

    expect(screen.getByText("Günün Maçları")).toBeInTheDocument();
    expect(screen.getByText(/Eczacıbaşı/i)).toBeInTheDocument();
    expect(screen.getByText(/Fenerbahçe/i)).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
  });

  it("renders next match day when no matches exist for today", () => {
    render(
      <TodayMatchesView
        matches={mockMatches}
        city="Tüm İller"
        todayStr="2026-09-15"
        favorites={[]}
        onToggleFavorite={vi.fn()}
        onNavigateToFullFixtures={vi.fn()}
      />
    );

    expect(screen.getByText(/Planlanmış Maç Bulunmuyor/)).toBeInTheDocument();
    expect(screen.getByText(/Sıradaki Maç Günü/)).toBeInTheDocument();
    expect(screen.getByText(/Arkas/)).toBeInTheDocument();
    expect(screen.getByText(/Göztepe/)).toBeInTheDocument();
  });

  it("dün oynanmış ama sonucu henüz girilmemiş maçları günün maçlarında skorsuz olarak gösterir", () => {
    const matchesWithYesterdayUnscored: Match[] = [
      {
        id: "m_yesterday_unscored",
        city: "Ankara",
        date: "2026-09-26",
        time: "15:00",
        hall: "Başkent Voleybol Salonu",
        category: "Genç Kızlar Süper Lig",
        age_group: "Genç",
        gender: "Kız",
        group: "A Grubu",
        match_no: "201",
        home_team: "Zeren Spor",
        away_team: "İlbank",
        score: "- : -",
        status: "upcoming",
      },
    ];

    render(
      <TodayMatchesView
        matches={matchesWithYesterdayUnscored}
        city="Ankara"
        todayStr="2026-09-27"
        yesterdayStr="2026-09-26"
        favorites={[]}
        onToggleFavorite={vi.fn()}
        onNavigateToFullFixtures={vi.fn()}
      />
    );

    // Günün Maçları listesinde yer almalı
    expect(screen.getByText("Günün Maçları")).toBeInTheDocument();
    expect(screen.getByText(/Zeren Spor/i)).toBeInTheDocument();
    expect(screen.getByText(/İlbank/i)).toBeInTheDocument();

    // Dün ve Skor Bekleniyor rozeti görünmeli
    expect(screen.getByText("Dün")).toBeInTheDocument();
    expect(screen.getByText("DÜN • SKOR BEKLENİYOR")).toBeInTheDocument();

    // Skorsuz olarak (--) gösterilmeli
    expect(screen.getAllByText("--").length).toBeGreaterThanOrEqual(2);
  });
});
