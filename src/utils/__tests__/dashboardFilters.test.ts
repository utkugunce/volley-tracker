import { describe, it, expect } from "vitest";
import { filterResultMatches } from "../dashboardFilters";
import type { Match } from "@/types/fixture";

describe("filterResultMatches", () => {
  const yesterdayStr = "2026-10-12";
  const todayStr = "2026-10-13";
  const pastStr = "2026-10-10";

  const scoredYesterdayMatch: Match = {
    id: "m-1",
    match_no: "101",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "A Grubu",
    date: yesterdayStr,
    time: "14:00",
    hall: "TVF 50. Yıl",
    home_team: "Eczacıbaşı",
    away_team: "Fenerbahçe",
    home_score: 3,
    away_score: 1,
    status: "finished",
    set_scores: ["25-20", "23-25", "25-18", "25-22"],
  };

  const unscoredYesterdayMatch: Match = {
    id: "m-2",
    match_no: "102",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "A Grubu",
    date: yesterdayStr,
    time: "16:00",
    hall: "TVF 50. Yıl",
    home_team: "VakıfBank",
    away_team: "Galatasaray",
    home_score: null,
    away_score: null,
    status: "upcoming",
  };

  const scoredPastMatch: Match = {
    id: "m-3",
    match_no: "103",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "A Grubu",
    date: pastStr,
    time: "18:00",
    hall: "Burhan Felek",
    home_team: "Beşiktaş",
    away_team: "Sarıyer Bld.",
    home_score: 3,
    away_score: 0,
    status: "finished",
    set_scores: ["25-15", "25-18", "25-20"],
  };

  const unscoredPastMatch: Match = {
    id: "m-4",
    match_no: "104",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "A Grubu",
    date: pastStr,
    time: "12:00",
    hall: "Burhan Felek",
    home_team: "Türk Hava Yolları",
    away_team: "Kuzeyboru",
    home_score: null,
    away_score: null,
    status: "upcoming",
  };

  const matches = [scoredYesterdayMatch, unscoredYesterdayMatch, scoredPastMatch, unscoredPastMatch];

  const defaultOpts = {
    selectedResultDate: "all",
    resultsSubTab: "all" as const,
    yesterdayStr,
    showOnlyFavorites: false,
    favorites: [],
    selectedCategory: "Tümü",
    selectedHall: "Tümü",
    searchQuery: "",
    volleyboxFilter: "all" as const,
  };

  it("dünün sonuçları alt sekmesi seçildiğinde oynanmış ama skoru olmayan maçları da dahil eder", () => {
    const results = filterResultMatches(matches, {
      ...defaultOpts,
      resultsSubTab: "yesterday",
      selectedResultDate: yesterdayStr,
    });

    expect(results).toHaveLength(2);
    expect(results.map((m) => m.id)).toEqual(["m-1", "m-2"]);
    // Skorsuz maç m-2 başarıyla listede
    const unscored = results.find((m) => m.id === "m-2");
    expect(unscored).toBeDefined();
    expect(unscored?.home_score).toBeNull();
  });

  it("tarih şeridinden dün seçildiğinde (selectedResultDate === yesterdayStr) skorsuz maçları da dahil eder", () => {
    const results = filterResultMatches(matches, {
      ...defaultOpts,
      selectedResultDate: yesterdayStr,
      resultsSubTab: "all",
    });

    expect(results).toHaveLength(2);
    expect(results.map((m) => m.id)).toContain("m-2");
  });

  it("tüm sonuçlar sekmesinde (all) skoru olmayan maçları filtreler ve sadece bitenleri gösterir", () => {
    const results = filterResultMatches(matches, {
      ...defaultOpts,
      selectedResultDate: "all",
      resultsSubTab: "all",
    });

    expect(results).toHaveLength(2);
    expect(results.map((m) => m.id)).toEqual(["m-1", "m-3"]);
    expect(results.some((m) => m.id === "m-2")).toBe(false);
    expect(results.some((m) => m.id === "m-4")).toBe(false);
  });

  it("dün dışındaki geçmiş bir tarih seçildiğinde (selectedResultDate === pastStr) de skorsuz maçları dahil eder", () => {
    const results = filterResultMatches(matches, {
      ...defaultOpts,
      selectedResultDate: pastStr,
      resultsSubTab: "all",
    });

    expect(results).toHaveLength(2);
    expect(results.map((m) => m.id)).toEqual(["m-3", "m-4"]);
    expect(results.find((m) => m.id === "m-4")?.home_score).toBeNull();
  });
});
