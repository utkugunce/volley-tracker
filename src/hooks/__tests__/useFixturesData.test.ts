import { describe, it, expect } from "vitest";
import { preserveScoredMatches } from "../useFixturesData";
import type { FixturesData } from "@/types/fixture";

function makeFixtures(matches: FixturesData["matches"]): FixturesData {
  return {
    city: "Aksaray",
    title: "TVF Aksaray",
    updated_at: "2026-11-04T12:00:00Z",
    total_matches: matches.length,
    source: "test",
    filters: {
      categories: ["Tümü"],
      age_groups: ["Tümü"],
      genders: ["Kız"],
      halls: ["Tümü"],
    },
    matches,
    standings: {},
  };
}

describe("preserveScoredMatches", () => {
  it("SSR'da skoru olan bitmiş bir maçı, gecikmeli skorsuz API yanıtı geldiğinde 'Skor Bekleniyor'a düşürmez", () => {
    const ssrData = makeFixtures([
      {
        id: "aksaray-20261103-011",
        city: "Aksaray",
        date: "2026-11-03",
        time: "18:30",
        hall: "Dağılgan S.S.",
        category: "Genç Kızlar Süper Lig",
        age_group: "Genç",
        gender: "Kız",
        group: "1. Grup",
        match_no: "11",
        home_team: "Eskil Tuzgölü Spor Kulübü U18",
        away_team: "MBA Aksaray Anka Spor Kulübü - C U18",
        score: "0 - 3",
        home_score: 0,
        away_score: 3,
        set_scores: ["16-25", "17-25", "24-26"],
        status: "finished",
      },
    ]);

    const staleApiData = makeFixtures([
      {
        id: "aksaray-20261103-011",
        city: "Aksaray",
        date: "2026-11-03",
        time: "18:30",
        hall: "Dağılgan S.S.",
        category: "Genç Kızlar Süper Lig",
        age_group: "Genç",
        gender: "Kız",
        group: "1. Grup",
        match_no: "11",
        home_team: "Eskil Tuzgölü Spor Kulübü U18",
        away_team: "MBA Aksaray Anka Spor Kulübü - C U18",
        score: "- : -",
        home_score: null,
        away_score: null,
        set_scores: [],
        status: "upcoming",
      },
    ]);

    const result = preserveScoredMatches(staleApiData, ssrData);
    expect(result.matches[0].status).toBe("finished");
    expect(result.matches[0].score).toBe("0 - 3");
    expect(result.matches[0].home_score).toBe(0);
    expect(result.matches[0].away_score).toBe(3);
    expect(result.matches[0].set_scores).toEqual(["16-25", "17-25", "24-26"]);
  });

  it("is_overridden bayrağı olan manuel yönetici düzeltmelerine dokunmaz", () => {
    const ssrData = makeFixtures([
      {
        id: "aksaray-20261103-011",
        city: "Aksaray",
        date: "2026-11-03",
        time: "18:30",
        hall: "Dağılgan S.S.",
        category: "Genç Kızlar Süper Lig",
        age_group: "Genç",
        gender: "Kız",
        group: "1. Grup",
        match_no: "11",
        home_team: "Eskil Tuzgölü Spor Kulübü U18",
        away_team: "MBA Aksaray Anka Spor Kulübü - C U18",
        score: "0 - 3",
        home_score: 0,
        away_score: 3,
        set_scores: ["16-25", "17-25", "24-26"],
        status: "finished",
      },
    ]);

    const overriddenApiData = makeFixtures([
      {
        id: "aksaray-20261103-011",
        city: "Aksaray",
        date: "2026-11-03",
        time: "18:30",
        hall: "Dağılgan S.S.",
        category: "Genç Kızlar Süper Lig",
        age_group: "Genç",
        gender: "Kız",
        group: "1. Grup",
        match_no: "11",
        home_team: "Eskil Tuzgölü Spor Kulübü U18",
        away_team: "MBA Aksaray Anka Spor Kulübü - C U18",
        score: null,
        home_score: null,
        away_score: null,
        set_scores: [],
        status: "upcoming",
        is_overridden: true,
      },
    ]);

    const result = preserveScoredMatches(overriddenApiData, ssrData);
    expect(result.matches[0].status).toBe("upcoming");
    expect(result.matches[0].home_score).toBeNull();
  });
});
