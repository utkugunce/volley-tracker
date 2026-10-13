import { describe, it, expect } from "vitest";
import {
  matchToUnified,
  kadinlar2LigMatchToUnified,
  standingItemToUnified,
  kadinlar2LigTeamToUnified,
  createTeamAliasMapping,
} from "../unifiedAdapters";
import type { Match, StandingItem } from "@/types/fixture";
import type { Kadinlar2LigMatch, Kadinlar2LigTeam } from "@/types/kadinlar2Lig";

describe("Ortak Lig Şeması ve TVF Alias Adaptörleri (Görev 9)", () => {
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

  it("Kadınlar 2. Ligi maçını ve TVF skor formatını doğru UnifiedFixture'a çevirir", () => {
    const k2Match: Kadinlar2LigMatch = {
      id: "k2-K2-G2-101",
      mac_no: "K2-G2-101",
      grup_no: 2,
      grup_adi: "2. Grup",
      hafta: 1,
      devre: 1,
      tarih: "2026-10-12",
      gun: "Pazar",
      saat: "16:00",
      sehir: "Bursa",
      salon: "TVF Cengiz Göllü",
      takim_a: "Nilüfer Bld.",
      takim_b: "Bursa B.Şehir Bld.",
      takim_a_id: "t-1",
      takim_b_id: "t-2",
      takim_a_logo: "",
      takim_b_logo: "",
      set_a: "3",
      set_b: "2",
      skor: "3-2",
      set_sonuclari: "25-20, 23-25, 25-21, 20-25, 15-12",
      durum: "BİTTİ",
      mac_durumu_kod: "1",
      volleybox: {
        synced: true,
        match_id: 777666,
        url: "https://women.volleybox.net/matches/777666",
        score: "3-2",
      },
    };

    const unified = kadinlar2LigMatchToUnified(k2Match);

    expect(unified.id).toBe("k2-K2-G2-101");
    expect(unified.league).toBe("kadinlar_2_lig");
    expect(unified.home_team).toBe("Nilüfer Bld.");
    expect(unified.away_team).toBe("Bursa B.Şehir Bld.");
    expect(unified.status).toBe("finished");
    expect(unified.home_score).toBe(3);
    expect(unified.away_score).toBe(2);
    expect(unified.set_scores).toHaveLength(5);
    expect(unified.volleybox?.url).toBe("https://women.volleybox.net/matches/777666");
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

    const k2Team: Kadinlar2LigTeam = {
      sira: 1,
      takim_id: "t-101",
      takim_adi: "Göztepe SK",
      o: 6,
      g: 5,
      m: 1,
      p: 16,
      as: 17,
      vs: 5,
      sav: "3.4",
      asp: 520,
      vsp: 410,
      spav: "1.26",
      a3_0: 3,
      a3_1: 2,
      a3_2: 0,
      v2_3: 1,
      v1_3: 0,
      v0_3: 0,
      logo: "/logos/goztepe.png",
      sezon: "2026-2027",
      grup_no: 3,
      volleybox_url: "https://women.volleybox.net/goztepe-sk-t4284",
    };

    const unifiedK2 = kadinlar2LigTeamToUnified(k2Team);
    expect(unifiedK2.team_name).toBe("Göztepe SK");
    expect(unifiedK2.points).toBe(16);
    expect(unifiedK2.volleybox_url).toBe("https://women.volleybox.net/goztepe-sk-t4284");
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
