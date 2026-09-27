import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MainLayout } from "../MainLayout";
import { LeftSidebarPlaceholder } from "../LeftSidebarPlaceholder";
import { RightSidebarPlaceholder } from "../RightSidebarPlaceholder";
import { MatchSelectionProvider, findDefaultSelectedMatch, isMatchScored } from "@/context/MatchSelectionContext";
import { Match } from "@/types/fixture";

const mockMatches: Match[] = [
  {
    id: "match-1",
    match_no: "101",
    city: "İstanbul",
    date: "2026-10-01",
    time: "14:00",
    hall: "TVF 50. Yıl Deniz Esinduy",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "Grup A",
    home_team: "Eczacıbaşı",
    away_team: "Fenerbahçe",
    status: "upcoming",
  },
  {
    id: "match-2",
    match_no: "102",
    city: "İstanbul",
    date: "2026-10-01",
    time: "16:00",
    hall: "Burhan Felek",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "Grup A",
    home_team: "VakıfBank",
    away_team: "Galatasaray",
    score: "3 - 1",
    home_score: 3,
    away_score: 1,
    set_scores: ["25-20", "23-25", "25-18", "25-22"],
    status: "finished",
  },
  {
    id: "match-3",
    match_no: "103",
    city: "İstanbul",
    date: "2026-10-01",
    time: "18:00",
    hall: "50. Yıl",
    category: "Yıldız Kızlar Süper Lig",
    age_group: "Yıldız",
    gender: "Kız",
    group: "Grup B",
    home_team: "Beşiktaş",
    away_team: "THY",
    home_score: 1,
    away_score: 1,
    status: "live",
  },
];

describe("Sofascore 3-Kolonlu MainLayout ve MatchSelection Mimarisi", () => {
  describe("findDefaultSelectedMatch mantığı", () => {
    it("canlı maç varsa öncelikli olarak o günün ilk canlı maçını seçer", () => {
      const selected = findDefaultSelectedMatch(mockMatches);
      expect(selected?.id).toBe("match-3");
      expect(selected?.status).toBe("live");
    });

    it("canlı maç yoksa ilk biten (skorlu) maçı seçer", () => {
      const nonLiveMatches = mockMatches.filter((m) => m.status !== "live");
      const selected = findDefaultSelectedMatch(nonLiveMatches);
      expect(selected?.id).toBe("match-2");
      expect(selected?.status).toBe("finished");
    });

    it("ne canlı ne de biten maç yoksa listenin ilk maçını seçer", () => {
      const onlyUpcoming = [mockMatches[0]];
      const selected = findDefaultSelectedMatch(onlyUpcoming);
      expect(selected?.id).toBe("match-1");
    });

    it("URL veya tercih edilen ID belirtilmişse ve listede mevcutsa o maçı seçer", () => {
      const selected = findDefaultSelectedMatch(mockMatches, "match-1");
      expect(selected?.id).toBe("match-1");
    });

    it("boş maç listesinde null döner", () => {
      const selected = findDefaultSelectedMatch([]);
      expect(selected).toBeNull();
    });
  });

  describe("MainLayout 3-Kolonlu Render Testleri", () => {
    it("Header, Sol Kolon, Orta Kolon (Children) ve Sağ Kolon bileşenlerini eksiksiz render eder", () => {
      render(
        <MainLayout
          header={<div data-testid="header-slot">Header Bar</div>}
          leftSidebar={<div data-testid="left-slot">Sol Navigasyon</div>}
          rightSidebar={<div data-testid="right-slot">Sağ Detay Paneli</div>}
          footer={<div data-testid="footer-slot">Altbilgi</div>}
        >
          <div data-testid="center-slot">Ana Maç Akışı</div>
        </MainLayout>
      );

      expect(screen.getByTestId("header-slot")).toBeDefined();
      expect(screen.getByTestId("left-slot")).toBeDefined();
      expect(screen.getByTestId("center-slot")).toBeDefined();
      expect(screen.getByTestId("right-slot")).toBeDefined();
      expect(screen.getByTestId("footer-slot")).toBeDefined();
    });

    it("Sofascore koyu tema renk sınıflarını (bg-[#121212], border-[#2A2E3D], bg-[#1E222D]) içerir", () => {
      const { container } = render(
        <MainLayout
          header={<div>Header</div>}
          leftSidebar={<div>Sol</div>}
          rightSidebar={<div>Sağ</div>}
        >
          <div>Orta</div>
        </MainLayout>
      );

      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toContain("bg-[#121212]");
      expect(rootDiv.className).toContain("text-[#F1F5F9]");

      // Sol ve sağ panellerin aside elementleri
      const asides = container.querySelectorAll("aside");
      expect(asides.length).toBe(2);
      asides.forEach((aside) => {
        expect(aside.className).toContain("bg-[#1E222D]");
        expect(aside.className).toContain("border-[#2A2E3D]");
        expect(aside.className).toContain("hidden lg:block");
      });
    });
  });

  describe("LeftSidebarPlaceholder ve RightSidebarPlaceholder", () => {
    it("LeftSidebarPlaceholder başlığı, lig ağacı iskeletini ve popüler illeri render eder", () => {
      const onSelectCity = vi.fn();
      render(
        <LeftSidebarPlaceholder
          cities={[{ name: "İstanbul", slug: "istanbul", matches_count: 24, last_updated: "" }]}
          currentCity="istanbul"
          onSelectCity={onSelectCity}
          favoritesCount={3}
          totalMatches={24}
        />
      );

      expect(screen.getByText("Lig Navigasyonu")).toBeDefined();
      expect(screen.getByText("TVF Altyapı & Lig Ağacı")).toBeDefined();
      expect(screen.getByText("Genç (U18)")).toBeDefined();
      expect(screen.getByText("Yıldız (U16)")).toBeDefined();
      expect(screen.getByText(/Aşama 1/i)).toBeDefined();
    });

    it("RightSidebarPlaceholder seçili maç yokken boş durum yer tutucusunu gösterir", () => {
      render(<RightSidebarPlaceholder selectedMatch={null} />);
      expect(screen.getByText("Maç Detayı")).toBeDefined();
      expect(screen.getByText(/Detaylı set analizi/i)).toBeDefined();
    });

    it("RightSidebarPlaceholder seçili maç varken takımları, skoru ve aşama 3 alanlarını render eder", () => {
      const match = mockMatches[1]; // VakıfBank vs Galatasaray
      render(<RightSidebarPlaceholder selectedMatch={match} />);

      expect(screen.getByText("VakıfBank")).toBeDefined();
      expect(screen.getByText("Galatasaray")).toBeDefined();
      expect(screen.getAllByText("Burhan Felek").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Set-by-Set Skor Matrisi")).toBeDefined();
      expect(screen.getByText("Salon & Yol Tarifi")).toBeDefined();
      expect(screen.getByText("Mini Puan Durumu")).toBeDefined();
    });
  });
});
