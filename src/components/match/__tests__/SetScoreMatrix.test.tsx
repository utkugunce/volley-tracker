import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SetScoreMatrix } from "../SetScoreMatrix";
import { Match } from "@/types/fixture";

describe("SetScoreMatrix Component", () => {
  const finishedMatch: Match = {
    id: "m-matrix-1",
    date: "2026-10-15",
    time: "18:00",
    hall: "50. Yıl",
    category: "Genç Kızlar",
    age_group: "Genç",
    gender: "Kız",
    group: "A Grubu",
    match_no: "101",
    home_team: "VakıfBank",
    away_team: "Fenerbahçe",
    home_score: 3,
    away_score: 1,
    set_scores: ["25-20", "23-25", "25-18", "25-22"],
    set_durations: ["24 dk", "28 dk", "22 dk", "26 dk"],
    status: "finished",
  };

  it("her set için kazanılan sayıları ve toplam sayıları doğru listeler", () => {
    render(<SetScoreMatrix match={finishedMatch} />);

    // Başlıklar
    expect(screen.getByText("S1")).toBeInTheDocument();
    expect(screen.getByText("S2")).toBeInTheDocument();
    expect(screen.getByText("S3")).toBeInTheDocument();
    expect(screen.getByText("S4")).toBeInTheDocument();
    expect(screen.getByText("Toplam")).toBeInTheDocument();

    // Toplam sayılar (Vakıf: 25+23+25+25 = 98, Fener: 20+25+18+22 = 85)
    expect(screen.getByText("98")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();

    // Set süreleri
    expect(screen.getByText("24 dk")).toBeInTheDocument();
    expect(screen.getByText("28 dk")).toBeInTheDocument();
    expect(screen.getByText("100 dk")).toBeInTheDocument(); // 24+28+22+26
    expect(screen.getAllByText("25").some((score) => score.className.includes("text-emerald-400"))).toBe(true);
    expect(screen.getByText("20")).toHaveClass("text-slate-500");
  });

  it("canlı maçın son set skorlarını mavi vurguyla gösterir", () => {
    const liveMatch: Match = {
      ...finishedMatch,
      status: "live",
      home_score: 1,
      away_score: 1,
      set_scores: ["25-20", "23-25", "12-10"],
    };

    render(<SetScoreMatrix match={liveMatch} />);

    expect(screen.getByText("12")).toHaveClass("text-blue-300");
    expect(screen.getByText("10")).toHaveClass("text-blue-300");
    expect(screen.getAllByText("25").some((score) => score.className.includes("text-emerald-400"))).toBe(true);
  });

  it("skor verisi olmayan maçlarda yer tutucu bilgi mesajı gösterir", () => {
    const upcomingMatch: Match = {
      ...finishedMatch,
      status: "upcoming",
      home_score: null,
      away_score: null,
      set_scores: [],
      set_durations: undefined,
    };

    render(<SetScoreMatrix match={upcomingMatch} />);
    expect(screen.getByText("Set Skor Matrisi")).toBeInTheDocument();
    expect(
      screen.getByText(/Karşılaşma başladığında set dökümü burada canlı listelenecektir/i)
    ).toBeInTheDocument();
  });
});
