import { describe, it, expect } from "vitest";
import {
  matchToUnified,
  standingItemToUnified,
  createTeamAliasMapping,
} from "../unifiedAdapters";
import type { Match, StandingItem } from "@/types/fixture";

describe("Ortak Lig Şeması ve TVF Alias Adaptörleri", () => {
  it("Altyapı Match nesnesini eksiksiz ve veri kaybı olmadan UnifiedFixture'a dönüştürür", () => {
    const rawMatch: Match = {
      id: "ist-12345",
      city: "istanbul",
      date: "2026-10-18",
      time: "14:00",
      hall: "50. Yıl Deniz Esinduy",
      category: "Genç Kızlar",
      age_group: "Genç",
      gender: "Kız",
      group: "A Grubu",
      match_no: "42",
      home_team: "VakıfBank U18",
      away_team: "Eczacıbaşı U18",
      score: "3-1",
      home_score: 3,
      away_score: 1,
      set_scores: ["25-18", "22-25", "25-20", "25-19"],
      status: "finished",
      volleybox: {
        synced: true,
        match_id: 999888,
        url: "https://women.volleybox.net/matches/999888",
        score: "3-1",
      },
    };

    const unified = matchToUnified(rawMatch);

    expect(unified.id).toBe("ist-12345");
    expect(unified.league).toBe("altyapi");
    expect(unified.home_team).toBe("VakıfBank U18");
    expect(unified.away_team).toBe("Eczacıbaşı U18");
    expect(unified.home_score).toBe(3);
    expect(unified.away_score).toBe(1);
    expect(unified.set_scores).toEqual(["25-18", "22-25", "25-20", "25-19"]);
    expect(unified.volleybox?.match_id).toBe(999888);
  });

  it("Puan durumu satırlarını UnifiedStanding formatına uyarlar", () => {
    const altyapiStanding: StandingItem = {
      rank: 1,
      team: "Fenerbahçe",
      played: 5,
      won: 5,
      lost: 0,
      points: 15,
      sets_won: 15,
      sets_lost: 2,
      set_ratio: "7.5",
      points_won: 410,
      points_lost: 300,
      point_ratio: "1.36",
      form: ["W", "W", "W", "W", "W"],
    };

    const unifiedAltyapi = standingItemToUnified(altyapiStanding);
    expect(unifiedAltyapi.team_name).toBe("Fenerbahçe");
    expect(unifiedAltyapi.points).toBe(15);
  });

  it("TVF Takma Adı (Alias) ve Volleybox slug ayrıştırmasını doğru yapar", () => {
    const mapping = createTeamAliasMapping(
      "07 Anka SK",
      "07 Anka Spor Kulübü",
      "07 Anka SK U18",
      "https://women.volleybox.net/teams/07-anka-sk-t41868"
    );

    expect(mapping.alias).toBe("07 Anka SK");
    expect(mapping.official_name).toBe("07 Anka Spor Kulübü");
    expect(mapping.volleybox_slug).toBe("07-anka-sk-t41868");
  });
});
