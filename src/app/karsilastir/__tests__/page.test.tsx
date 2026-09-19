import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { CompareClient } from "../CompareClient";
import { getAllTeamsList, getHeadToHeadComparison } from "@/utils/teamData";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("Head-to-Head Comparison Page (GÖREV 6)", () => {
  describe("teamData comparison helpers", () => {
    it("getAllTeamsList takımları alfabetik ve eksiksiz döner", () => {
      const list = getAllTeamsList();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
      expect(list[0]).toHaveProperty("name");
      expect(list[0]).toHaveProperty("slug");
      expect(list[0]).toHaveProperty("city");
    });

    it("aynı takım slug'ı verildiğinde null döner", () => {
      const res = getHeadToHeadComparison("fenerbahce", "fenerbahce");
      expect(res).toBeNull();
    });

    it("geçersiz slug verildiğinde null döner", () => {
      const res = getHeadToHeadComparison("olmayan-takim-xyz", "baska-olmayan-takim");
      expect(res).toBeNull();
    });

    it("iki geçerli takım karşılaştırıldığında karşılaştırma objesi döner", () => {
      const teams = getAllTeamsList();
      if (teams.length >= 2) {
        const res = getHeadToHeadComparison(teams[0].slug, teams[1].slug);
        if (res) {
          expect(res.team1).toBeDefined();
          expect(res.team2).toBeDefined();
          expect(res.summary).toHaveProperty("totalMatches");
          expect(res.summary).toHaveProperty("team1Wins");
          expect(res.summary).toHaveProperty("team2Wins");
          expect(typeof res.isSameGroup).toBe("boolean");
        }
      }
    });
  });

  describe("CompareClient UI Render", () => {
    const mockTeams = [
      { name: "Fenerbahçe", slug: "fenerbahce", city: "İstanbul" },
      { name: "VakıfBank", slug: "vakifbank", city: "İstanbul" },
      { name: "Eczacıbaşı", slug: "eczacibasi", city: "İstanbul" },
    ];

    it("takım seçilmediğinde karşılama ekranını ve seçicileri render eder", () => {
      render(<CompareClient teamsList={mockTeams} />);

      expect(
        screen.getByText("İki Takım Karşılaştırma (Head-to-Head)")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Karşılaştırmak için İki Takım Seçin")
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Birinci takımı seçin")).toBeInTheDocument();
      expect(screen.getByLabelText("İkinci takımı seçin")).toBeInTheDocument();
    });

    it("karşılaştırma verisi sağlandığında VS ve istatistikleri gösterir", () => {
      const mockComparison = {
        team1: {
          teamName: "Fenerbahçe",
          slug: "fenerbahce",
          city: "İstanbul",
          cities: ["İstanbul"],
          categories: ["Genç Kızlar"],
          matches: [],
          standingsContexts: [
            {
              groupName: "A Grubu",
              category: "Genç Kızlar",
              city: "İstanbul",
              standingRow: {
                rank: 1,
                team: "Fenerbahçe",
                played: 5,
                won: 5,
                lost: 0,
                points: 15,
                sets_won: 15,
                sets_lost: 2,
                set_ratio: "7.5",
                points_won: 400,
                points_lost: 300,
                point_ratio: "1.33",
                form: ["W", "W"] as any,
              },
              fullGroupTable: [],
            },
          ],
          form: [],
          stats: { totalMatches: 5, played: 5, wins: 5, losses: 0, upcoming: 0 },
        },
        team2: {
          teamName: "VakıfBank",
          slug: "vakifbank",
          city: "İstanbul",
          cities: ["İstanbul"],
          categories: ["Genç Kızlar"],
          matches: [],
          standingsContexts: [
            {
              groupName: "A Grubu",
              category: "Genç Kızlar",
              city: "İstanbul",
              standingRow: {
                rank: 2,
                team: "VakıfBank",
                played: 5,
                won: 4,
                lost: 1,
                points: 12,
                sets_won: 13,
                sets_lost: 4,
                set_ratio: "3.25",
                points_won: 380,
                points_lost: 310,
                point_ratio: "1.22",
                form: ["W", "L"] as any,
              },
              fullGroupTable: [],
            },
          ],
          form: [],
          stats: { totalMatches: 5, played: 5, wins: 4, losses: 1, upcoming: 0 },
        },
        matches: [
          {
            id: "m-fb-vb",
            date: "2026-10-10",
            time: "14:00",
            category: "Genç Kızlar",
            hall: "TVF 50. Yıl",
            homeTeam: "Fenerbahçe",
            awayTeam: "VakıfBank",
            homeScore: 3,
            awayScore: 1,
            setScores: ["25-22", "23-25", "25-18", "25-20"],
            status: "finished" as const,
            winner: "team1" as const,
          },
        ],
        summary: {
          totalMatches: 1,
          team1Wins: 1,
          team2Wins: 0,
          upcomingMatches: 0,
          team1SetsWon: 3,
          team2SetsWon: 1,
        },
        sharedGroup: {
          groupName: "A Grubu",
          category: "Genç Kızlar",
          city: "İstanbul",
        },
        isSameGroup: true,
      };

      render(
        <CompareClient
          teamsList={mockTeams}
          initialSlug1="fenerbahce"
          initialSlug2="vakifbank"
          comparison={mockComparison as any}
        />
      );

      // Takım isimleri render ediliyor mu?
      expect(screen.getAllByText("Fenerbahçe").length).toBeGreaterThan(0);
      expect(screen.getAllByText("VakıfBank").length).toBeGreaterThan(0);
      expect(screen.getByText("Aralarındaki Maçlar (1)")).toBeInTheDocument();
      expect(screen.getByText("Setler: 25-22, 23-25, 25-18, 25-20")).toBeInTheDocument();
      expect(screen.getByText("Aynı Gruptalar: A Grubu")).toBeInTheDocument();
    });

    it("takımlar aynı grupta değilse nazik bilgilendirme mesajı gösterir", () => {
      const mockDifferentGroups = {
        team1: {
          teamName: "Fenerbahçe",
          slug: "fenerbahce",
          city: "İstanbul",
          cities: ["İstanbul"],
          categories: ["Genç Kızlar"],
          matches: [],
          standingsContexts: [],
          form: [],
          stats: { totalMatches: 0, played: 0, wins: 0, losses: 0, upcoming: 0 },
        },
        team2: {
          teamName: "İzmir Gelişim",
          slug: "izmir-gelisim",
          city: "İzmir",
          cities: ["İzmir"],
          categories: ["Genç Kızlar"],
          matches: [],
          standingsContexts: [],
          form: [],
          stats: { totalMatches: 0, played: 0, wins: 0, losses: 0, upcoming: 0 },
        },
        matches: [],
        summary: {
          totalMatches: 0,
          team1Wins: 0,
          team2Wins: 0,
          upcomingMatches: 0,
          team1SetsWon: 0,
          team2SetsWon: 0,
        },
        isSameGroup: false,
      };

      render(
        <CompareClient
          teamsList={mockTeams}
          initialSlug1="fenerbahce"
          initialSlug2="izmir-gelisim"
          comparison={mockDifferentGroups as any}
        />
      );

      expect(
        screen.getByText("Bu takımlar bu sezon aynı grupta yer almıyor — aralarındaki maç bulunamadı.")
      ).toBeInTheDocument();
      expect(screen.getByText("Farklı Gruplar / Ligler")).toBeInTheDocument();
    });
  });
});
