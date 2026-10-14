import { describe, it, expect } from "vitest";
import {
  getScorePointsAndSets,
  compareStandingsFivb,
  simulateAltyapiStandings,
  simulateK2Standings,
} from "../standingsSimulator";
import type { StandingItem, Match } from "@/types/fixture";
import type { Kadinlar2LigTeam, Kadinlar2LigMatch } from "@/types/kadinlar2Lig";

describe("standingsSimulator", () => {
  it("FIVB puan ve set kuralını doğru hesaplar", () => {
    expect(getScorePointsAndSets("3-0")).toEqual({ homePoints: 3, awayPoints: 0, homeSets: 3, awaySets: 0 });
    expect(getScorePointsAndSets("3-1")).toEqual({ homePoints: 3, awayPoints: 0, homeSets: 3, awaySets: 1 });
    expect(getScorePointsAndSets("3-2")).toEqual({ homePoints: 2, awayPoints: 1, homeSets: 3, awaySets: 2 });
    expect(getScorePointsAndSets("2-3")).toEqual({ homePoints: 1, awayPoints: 2, homeSets: 2, awaySets: 3 });
    expect(getScorePointsAndSets("1-3")).toEqual({ homePoints: 0, awayPoints: 3, homeSets: 1, awaySets: 3 });
    expect(getScorePointsAndSets("0-3")).toEqual({ homePoints: 0, awayPoints: 3, homeSets: 0, awaySets: 3 });
  });

  it("önce galibiyet sayısına, sonra puana ve set averajına göre sıralar", () => {
    const a = { won: 5, points: 14, setRatio: 2.5, pointRatio: 1.2, team: "Takım A" };
    const b = { won: 4, points: 15, setRatio: 3.0, pointRatio: 1.3, team: "Takım B" };
    // Takım A daha çok galibiyet aldığı için puanı az olsa bile önce gelir
    expect(compareStandingsFivb(a, b)).toBeLessThan(0);

    // Eşit galibiyette çok puan alan önce gelir
    const c = { won: 4, points: 12, setRatio: 1.5, pointRatio: 1.0, team: "Takım C" };
    expect(compareStandingsFivb(b, c)).toBeLessThan(0);
  });

  it("altyapı maç simülasyonunda sıralama ve puan değişimlerini doğru yansıtır", () => {
    const initialRows: StandingItem[] = [
      {
        rank: 1,
        team: "Fenerbahçe",
        played: 2,
        won: 2,
        lost: 0,
        points: 6,
        sets_won: 6,
        sets_lost: 0,
        set_ratio: "MAX",
        points_won: 150,
        points_lost: 100,
        point_ratio: "1.500",
        form: ["W", "W"],
      },
      {
        rank: 2,
        team: "VakıfBank",
        played: 2,
        won: 1,
        lost: 1,
        points: 4,
        sets_won: 5,
        sets_lost: 3,
        set_ratio: "1.667",
        points_won: 180,
        points_lost: 160,
        point_ratio: "1.125",
        form: ["W", "L"],
      },
      {
        rank: 3,
        team: "Eczacıbaşı",
        played: 2,
        won: 1,
        lost: 1,
        points: 3,
        sets_won: 3,
        sets_lost: 3,
        set_ratio: "1.000",
        points_won: 140,
        points_lost: 140,
        point_ratio: "1.000",
        form: ["L", "W"],
      },
    ];

    const upcomingMatches: Match[] = [
      {
        id: "m1",
        home_team: "Eczacıbaşı",
        away_team: "Fenerbahçe",
        date: "2026-10-20",
        time: "14:00",
        hall: "Burhan Felek",
        category: "Genç Kızlar Süper Lig",
        age_group: "Genç",
        gender: "Kız",
        group: "A Grubu",
        match_no: "10",
        status: "upcoming",
      },
      {
        id: "m2",
        home_team: "VakıfBank",
        away_team: "Eczacıbaşı",
        date: "2026-10-25",
        time: "16:00",
        hall: "VakıfBank Spor Sarayı",
        category: "Genç Kızlar Süper Lig",
        age_group: "Genç",
        gender: "Kız",
        group: "A Grubu",
        match_no: "11",
        status: "upcoming",
      },
    ];

    // Eczacıbaşı Fenerbahçe'yi 3-0 yenerse
    const sim = simulateAltyapiStandings(initialRows, { m1: "3-0" }, upcomingMatches);
    const ecza = sim.find((r) => r.team === "Eczacıbaşı")!;
    expect(ecza.played).toBe(3);
    expect(ecza.won).toBe(2);
    expect(ecza.points).toBe(6);
    expect(ecza.diffPoints).toBe(3);

    // Eczacıbaşı VakıfBank'ı da 3-0 yenerse 3 galibiyet 9 puanla 1. sıraya çıkmalı
    const sim2 = simulateAltyapiStandings(initialRows, { m1: "3-0", m2: "0-3" }, upcomingMatches);
    const leader = sim2[0];
    expect(leader.team).toBe("Eczacıbaşı");
    expect(leader.rank).toBe(1);
    expect(leader.diffRank).toBe(2); // 3. sıradan 1. sıraya yükseldi
  });

  it("Kadınlar 2. Ligi için simülasyonu doğru çalıştırır", () => {
    const k2Rows: Kadinlar2LigTeam[] = [
      {
        sira: 1,
        takim_id: "1",
        takim_adi: "Takım 1",
        o: 1,
        g: 1,
        m: 0,
        p: 3,
        as: 3,
        vs: 0,
        sav: "MAX",
        asp: 75,
        vsp: 50,
        spav: "1.5",
        a3_0: 1,
        a3_1: 0,
        a3_2: 0,
        v2_3: 0,
        v1_3: 0,
        v0_3: 0,
        logo: "",
        sezon: "2026-2027",
        grup_no: 1,
      },
      {
        sira: 2,
        takim_id: "2",
        takim_adi: "Takım 2",
        o: 1,
        g: 0,
        m: 1,
        p: 0,
        as: 0,
        vs: 3,
        sav: "0",
        asp: 50,
        vsp: 75,
        spav: "0.66",
        a3_0: 0,
        a3_1: 0,
        a3_2: 0,
        v2_3: 0,
        v1_3: 0,
        v0_3: 1,
        logo: "",
        sezon: "2026-2027",
        grup_no: 1,
      },
    ];

    const k2Matches: Kadinlar2LigMatch[] = [
      {
        id: "k2-1",
        mac_no: "101",
        grup_no: 1,
        grup_adi: "Grup 1",
        hafta: 2,
        devre: 1,
        tarih: "2026-10-25",
        gun: "Pazar",
        saat: "14:00",
        sehir: "İstanbul",
        salon: "50. Yıl",
        takim_a: "Takım 2",
        takim_b: "Takım 1",
        takim_a_id: "2",
        takim_b_id: "1",
        takim_a_logo: "",
        takim_b_logo: "",
        set_a: "",
        set_b: "",
        skor: "- : -",
        set_sonuclari: "",
        durum: "OYNANACAK",
        mac_durumu_kod: "0",
      },
    ];

    // Takım 2, Takım 1'i 3-0 yenerse: Takım 2 (1G, 3P, set 3:3), Takım 1 (1G, 3P, set 3:3)
    const res = simulateK2Standings(k2Rows, { "k2-1": "3-0" }, k2Matches);
    expect(res.length).toBe(2);
    expect(res[0].won).toBe(1);
    expect(res[0].points).toBe(3);
  });
});
