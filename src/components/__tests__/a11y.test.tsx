import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CityTabBar } from "../CityTabBar";
import { FilterBar } from "../FilterBar";
import { DateRibbon } from "../DateRibbon";
import { TodayMatchesView } from "../TodayMatchesView";
import { Match } from "@/types/fixture";

describe("Erişilebilirlik (a11y) Standartları (GÖREV 3)", () => {
  describe("CityTabBar a11y", () => {
    it("tablist rolü, tab rolleri, aria-selected ve aria-expanded niteliklerini içerir", () => {
      const mockCities = [
        { ilid: "34", name: "İstanbul", slug: "istanbul", matches_count: 5 },
        { ilid: "35", name: "İzmir", slug: "izmir", matches_count: 3 },
      ];

      render(
        <CityTabBar
          currentCitySlug="istanbul"
          onSelectCity={vi.fn()}
          cities={mockCities as any}
          totalMatchesAcrossAll={8}
        />
      );

      const tablist = screen.getByRole("tablist", { name: "Şehir sekmeleri" });
      expect(tablist).toBeDefined();

      const tabs = screen.getAllByRole("tab");
      expect(tabs.length).toBeGreaterThan(0);

      // İstanbul sekmesinin aria-selected=true olduğunu doğrula
      const istanbulTab = tabs.find((t) => t.textContent?.includes("İstanbul"));
      expect(istanbulTab).toBeDefined();
      expect(istanbulTab?.getAttribute("aria-selected")).toBe("true");

      // Dropdown butonunda aria-expanded ve aria-haspopup olmalı
      const dropdownButton = screen.getByLabelText("Tüm 81 ili listele ve seç");
      expect(dropdownButton).toBeDefined();
      expect(dropdownButton.getAttribute("aria-expanded")).toBe("false");
      expect(dropdownButton.getAttribute("aria-haspopup")).toBe("listbox");
    });
  });

  describe("FilterBar a11y", () => {
    it("durum ve lig sekmelerinde role=tablist ve role=tab bulunur, arama inputunda aria-label vardır", () => {
      render(
        <FilterBar
          categories={["Genç Kızlar Süper Lig", "Yıldız Kızlar Süper Lig"]}
          selectedCategory="Genç Kızlar Süper Lig"
          onSelectCategory={vi.fn()}
          statusFilter="upcoming"
          onSelectStatusFilter={vi.fn()}
          counts={{ all: 10, upcoming: 4, finished: 6 }}
          halls={["TVF 50. Yıl"]}
          selectedHall="Tümü"
          onSelectHall={vi.fn()}
          searchQuery=""
          onSearchChange={vi.fn()}
          onReset={vi.fn()}
          isFiltered={false}
        />
      );

      const statusTablist = screen.getByRole("tablist", { name: "Maç durum sekmeleri" });
      expect(statusTablist).toBeDefined();

      const upcomingTab = screen.getByRole("tab", { name: /OYNANACAK/i });
      expect(upcomingTab.getAttribute("aria-selected")).toBe("true");

      const allTab = screen.getByRole("tab", { name: /HEPSİ/i });
      expect(allTab.getAttribute("aria-selected")).toBe("false");

      const searchInput = screen.getByLabelText("Kulüp veya salon ara");
      expect(searchInput).toBeDefined();
    });
  });

  describe("DateRibbon a11y", () => {
    it("tarih şeridinde role=tablist ve butonlarda aria-selected ile aria-label bulunur", () => {
      render(
        <DateRibbon
          dates={["2026-09-20", "2026-09-21"]}
          selectedDate="2026-09-20"
          onSelectDate={vi.fn()}
          dateCounts={{ "2026-09-20": 2, "2026-09-21": 3 }}
          todayStr="2026-09-20"
        />
      );

      const tablist = screen.getByRole("tablist", { name: "Tarih sekmeleri" });
      expect(tablist).toBeDefined();

      const todayTab = screen.getAllByRole("tab").find((t) => t.getAttribute("aria-selected") === "true");
      expect(todayTab).toBeDefined();

      const prevButton = screen.getByLabelText("Önceki günler");
      const nextButton = screen.getByLabelText("Sonraki günler");
      expect(prevButton).toBeDefined();
      expect(nextButton).toBeDefined();
    });
  });

  describe("TodayMatchesView a11y", () => {
    it("favori yıldız butonuna ve görünüm seçiciye ekran okuyucu dostu aria etiketleri sağlar", () => {
      const mockMatch: Match = {
        id: "ist-20260920-001",
        city: "İstanbul",
        date: "2026-09-20",
        time: "14:00",
        hall: "TVF 50. Yıl",
        category: "Genç Kızlar Süper Lig",
        home_team: "Eczacıbaşı",
        away_team: "Fenerbahçe",
        status: "upcoming",
      } as any;

      render(
        <TodayMatchesView
          matches={[mockMatch]}
          todayStr="2026-09-20"
          favorites={["ist-20260920-001"]}
          onToggleFavorite={vi.fn()}
        />
      );

      // Favori butonunda durum bazlı aria-label olmalı
      const favBtn = screen.getByLabelText(/maçını favorilerden çıkar/i);
      expect(favBtn).toBeDefined();

      // Görünüm biçimi tablist'i
      const viewTablist = screen.getByRole("tablist", { name: "Görünüm biçimi" });
      expect(viewTablist).toBeDefined();

      const cardsTab = screen.getByRole("tab", { name: "Kartlar görünümü" });
      expect(cardsTab.getAttribute("aria-selected")).toBe("true");
    });
  });
});
