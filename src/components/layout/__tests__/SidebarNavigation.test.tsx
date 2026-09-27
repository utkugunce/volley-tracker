import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SidebarNavigation } from "../SidebarNavigation";
import { classifyAgeCategory, buildLeagueHierarchy } from "@/utils/leagueHierarchy";
import { Match, CityInfo } from "@/types/fixture";

const sampleMatches: Match[] = [
  {
    id: "m-1",
    match_no: "101",
    city: "İstanbul",
    date: "2026-10-01",
    time: "14:00",
    hall: "50. Yıl",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "A Grubu",
    home_team: "Eczacıbaşı",
    away_team: "Fenerbahçe",
    status: "upcoming",
  },
  {
    id: "m-2",
    match_no: "102",
    city: "İstanbul",
    date: "2026-10-01",
    time: "16:00",
    hall: "Burhan Felek",
    category: "Yıldız Kızlar Süper Lig",
    age_group: "Yıldız",
    gender: "Kız",
    group: "Klasman 1",
    home_team: "VakıfBank",
    away_team: "Galatasaray",
    status: "finished",
  },
  {
    id: "m-3",
    match_no: "103",
    city: "Ankara",
    date: "2026-10-02",
    time: "13:00",
    hall: "Başkent",
    category: "Küçük Kızlar 1. Lig",
    age_group: "Küçük",
    gender: "Kız",
    group: "Doğu Grubu",
    home_team: "İlbank",
    away_team: "Karayolları",
    status: "upcoming",
  },
  {
    id: "m-4",
    match_no: "104",
    city: "İzmir",
    date: "2026-10-03",
    time: "15:00",
    hall: "Atatürk",
    category: "Genç Erkekler Ligi",
    age_group: "Genç",
    gender: "Erkek",
    group: "Tek Grup",
    home_team: "Arkas",
    away_team: "Altekma",
    status: "upcoming",
  },
];

const sampleCities: CityInfo[] = [
  { ilid: "34", name: "İstanbul", slug: "istanbul", url: "", status: "Aktif", matches_count: 2, standings_count: 1 },
  { ilid: "06", name: "Ankara", slug: "ankara", url: "", status: "Aktif", matches_count: 1, standings_count: 1 },
  { ilid: "35", name: "İzmir", slug: "izmir", url: "", status: "Aktif", matches_count: 1, standings_count: 1 },
];

describe("SidebarNavigation & leagueHierarchy", () => {
  describe("classifyAgeCategory yardımcı fonksiyonu", () => {
    it("erkek liglerini tespit eder", () => {
      expect(classifyAgeCategory(sampleMatches[3])).toBe("erkek");
    });

    it("genç, yıldız ve küçük kategorilerini doğru tespit eder", () => {
      expect(classifyAgeCategory(sampleMatches[0])).toBe("genc");
      expect(classifyAgeCategory(sampleMatches[1])).toBe("yildiz");
      expect(classifyAgeCategory(sampleMatches[2])).toBe("kucuk");
    });
  });

  describe("buildLeagueHierarchy", () => {
    it("şehirlere ve plakalara göre hiyerarşik yapı kurar", () => {
      const hierarchy = buildLeagueHierarchy(sampleMatches, {
        İstanbul: "34",
        Ankara: "06",
        İzmir: "35",
      });

      expect(hierarchy.length).toBe(3);
      // Plakaya göre sıralı olmalı: 06 Ankara, 34 İstanbul, 35 İzmir
      expect(hierarchy[0].cityName).toBe("Ankara");
      expect(hierarchy[0].plate).toBe("06");
      expect(hierarchy[1].cityName).toBe("İstanbul");
      expect(hierarchy[1].plate).toBe("34");
      expect(hierarchy[2].cityName).toBe("İzmir");
      expect(hierarchy[2].plate).toBe("35");
    });
  });

  describe("SidebarNavigation UI Entegrasyonu", () => {
    it("Favorilerim ve İller & Altyapı Ligleri başlıklarını render eder", () => {
      render(
        <SidebarNavigation
          cities={sampleCities}
          currentCity="istanbul"
          matches={sampleMatches}
          favoritesCount={4}
          totalMatches={4}
        />
      );

      expect(screen.getByText("Lig Ağacı")).toBeDefined();
      expect(screen.getByText("Favorilerim")).toBeDefined();
      expect(screen.getByText("İller & Altyapı Ligleri")).toBeDefined();
      expect(screen.getByText("Tümünü Göster")).toBeDefined();
    });

    it("Tümünü Göster butonuna basıldığında filtreleri sıfırlar", () => {
      const onSelectCity = vi.fn();
      const onSelectCategory = vi.fn();

      render(
        <SidebarNavigation
          cities={sampleCities}
          currentCity="istanbul"
          onSelectCity={onSelectCity}
          selectedCategory="Genç Kızlar (U18)"
          onSelectCategory={onSelectCategory}
          matches={sampleMatches}
        />
      );

      fireEvent.click(screen.getByText("Tümünü Göster"));
      expect(onSelectCity).toHaveBeenCalledWith("all");
      expect(onSelectCategory).toHaveBeenCalledWith("Tümü");
    });

    it("kategori tıklandığında onSelectCategory çağrılır ve alt gruplar açılır", () => {
      const onSelectCategory = vi.fn();

      render(
        <SidebarNavigation
          cities={sampleCities}
          currentCity="istanbul"
          matches={sampleMatches}
          onSelectCategory={onSelectCategory}
        />
      );

      // İstanbul aktif olduğu için yaş kategorileri açık olmalı
      const gencBtn = screen.getByText("Genç Kızlar (U18)");
      expect(gencBtn).toBeDefined();

      fireEvent.click(gencBtn);
      expect(onSelectCategory).toHaveBeenCalledWith("Genç Kızlar (U18)");

      // Alt grup listelenmeli: A Grubu
      expect(screen.getByText("• A Grubu")).toBeDefined();
    });
  });
});
