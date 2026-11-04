import { describe, it, expect } from "vitest";
import {
  getScorePointsAndSets,
  compareStandingsFivb,
  simulateAltyapiStandings,
} from "../standingsSimulator";
import type { StandingItem, Match } from "@/types/fixture";

describe("standingsSimulator", () => {
  it("FIVB puan ve set kuralını doğru hesaplar", () => {
    expect(getScorePointsAndSets("3-0")).toEqual({ homePoints: 3, awayPoints: 0, homeSets: 3, awaySets: 0 });
    expect(getScorePointsAndSets("3-1")).toEqual({ homePoints: 3, awayPoints: 0, homeSets: 3, awaySets: 1 });
    expect(getScorePointsAndSets("3-2")).toEqual({ homePoints: 2, awayPoints: 1, homeSets: 3, awaySets: 2 });
    expect(getScorePointsAndSets("2-3")).toEqual({ homePoints: 1, awayPoints: 2, homeSets: 2, awaySets: 3 });
    expect(getScorePointsAndSets("1-3")).toEqual({ homePoints: 0, awayPoints: 3, homeSets: 1, awaySets: 3 });
    expect(getScorePointsAndSets("0-3")).toEqual({ homePoints: 0, awayPoints: 3, homeSets: 0, awaySets: 3 });
  });

  it("FIVB sıralama kriterlerine göre doğru sıralar (puan > galibiyet > set oranı > sayı oranı)", () => {
    const rows = [
      { team: "Takım B", points: 9, won: 3, setRatio: 3.0, pointRatio: 1.2 },
      { team: "Takım A", points: 10, won: 3, setRatio: 2.5, pointRatio: 1.1 },
      { team: "Takım C", points: 9, won: 3, setRatio: 4.0, pointRatio: 1.0 }, // Takım B ile aynı puan ve galibiyet, daha iyi set oranı
    ];

    rows.sort(compareStandingsFivb);

    expect(rows[0].team).toBe("Takım A"); // 10 puan
    expect(rows[1].team).toBe("Takım C"); // 9 puan, 4.0 set oranı
    expect(rows[2].team).toBe("Takım B"); // 9 puan, 3.0 set oranı
  });

  it("Altyapı maç simülasyonunu doğru uygular ve sıralamayı günceller", () => {
    const initialRows: StandingItem[] = [
      {
        rank: 1,
        team: "VakıfBank",
        played: 2,
        won: 2,
        lost: 0,
        points: 6,
        sets_won: 6,
        sets_lost: 0,
        set_ratio: "999999",
        points_won: 150,
        points_lost: 100,
        point_ratio: "1.5",
        form: [],
      },
      {
        rank: 2,
        team: "Fenerbahçe",
        played: 2,
        won: 1,
        lost: 1,
        points: 3,
        sets_won: 3,
        sets_lost: 3,
        set_ratio: "1.0",
        points_won: 130,
        points_lost: 130,
        point_ratio: "1.0",
        form: [],
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
        set_ratio: "1.0",
        points_won: 120,
        points_lost: 130,
        point_ratio: "0.923",
        form: [],
      },
    ];

    const upcomingMatches: Match[] = [
      {
        id: "m1",
        match_no: "1",
        age_group: "Genç",
        gender: "Kız",
        home_team: "Eczacıbaşı",
        away_team: "Fenerbahçe",
        category: "Genç Kızlar",
        group: "A Grubu",
        city: "İstanbul",
        status: "upcoming",
        date: "2026-10-30",
        time: "15:00",
        hall: "Burhan Felek",
      },
      {
        id: "m2",
        match_no: "2",
        age_group: "Genç",
        gender: "Kız",
        home_team: "VakıfBank",
        away_team: "Eczacıbaşı",
        category: "Genç Kızlar",
        group: "A Grubu",
        city: "İstanbul",
        status: "upcoming",
        date: "2026-11-05",
        time: "15:00",
        hall: "VakıfBank Spor Sarayı",
      },
    ];

    // Simülasyon 1: Eczacıbaşı Fenerbahçe'yi 3-1 yensin
    const sim1 = simulateAltyapiStandings(initialRows, { m1: "3-1" }, upcomingMatches);

    // Eczacıbaşı 3 puan aldı, 6 puana çıktı ve Fenerbahçe'yi geçti
    const ecza = sim1.find((r) => r.team === "Eczacıbaşı")!;
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
});
