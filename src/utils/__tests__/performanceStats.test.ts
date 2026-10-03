import { describe, it, expect } from "vitest";
import {
  computeRecentForm,
  computeStreaks,
  computeTeamStats,
  getDecidedMatches,
  parseSetScores,
  type StatsMatchInput,
} from "../performanceStats";

let seq = 0;
/** Takım bakış açısıyla maç üretir. setScores ev-deplasman sırasındadır. */
function m(p: Partial<StatsMatchInput> & { date: string; teamScore: number; opponentScore: number }): StatsMatchInput {
  seq++;
  return {
    id: `m${seq}`,
    status: "finished",
    isHome: true,
    opponent: `Rakip ${seq}`,
    ...p,
  };
}

describe("parseSetScores", () => {
  it("düz ve parantezli (Kadınlar 2. Ligi) biçimleri ayrıştırır", () => {
    expect(parseSetScores(["25-10", "20 - 25"])).toEqual([
      [25, 10],
      [20, 25],
    ]);
    expect(parseSetScores(["(11-25) (13-25) (12-25)"])).toEqual([
      [11, 25],
      [13, 25],
      [12, 25],
    ]);
  });
  it("boş/eksik veride boş dizi döner", () => {
    expect(parseSetScores(undefined)).toEqual([]);
    expect(parseSetScores([])).toEqual([]);
    expect(parseSetScores([""])).toEqual([]);
  });
});

describe("computeStreaks", () => {
  it("güncel seri ve en uzun serileri bulur", () => {
    const r = computeStreaks([true, true, true, false, false, true, true]);
    expect(r.current).toEqual({ type: "W", length: 2 });
    expect(r.longestWin).toBe(3);
    expect(r.longestLoss).toBe(2);
  });
  it("maç yoksa seri yok", () => {
    expect(computeStreaks([])).toEqual({ current: null, longestWin: 0, longestLoss: 0 });
  });
  it("mağlubiyet serisiyle biten dizi", () => {
    expect(computeStreaks([true, false, false, false]).current).toEqual({ type: "L", length: 3 });
  });
});

describe("computeTeamStats", () => {
  const matches: StatsMatchInput[] = [
    // Ev: 3-0 galibiyet, set skorları takım lehine
    m({ date: "2026-09-12", teamScore: 3, opponentScore: 0, isHome: true, set_scores: ["25-10", "25-12", "25-20"] }),
    // Deplasman: 3-1 galibiyet; skorlar ev-deplasman sırasında olduğundan takım ikinci sayıdır
    m({ date: "2026-09-19", teamScore: 3, opponentScore: 1, isHome: false, set_scores: ["20-25", "25-22", "18-25", "15-25"] }),
    // Ev: 2-3 mağlubiyet
    m({ date: "2026-09-26", teamScore: 2, opponentScore: 3, isHome: true, set_scores: ["25-20", "20-25", "25-23", "22-25", "13-15"] }),
    // Henüz oynanmadı
    m({ date: "2026-10-03", teamScore: 0, opponentScore: 0, status: "upcoming" }),
  ];

  it("galibiyet/mağlubiyet, set ve lig puanını doğru hesaplar", () => {
    const s = computeTeamStats(matches);
    expect(s.played).toBe(3);
    expect(s.wins).toBe(2);
    expect(s.losses).toBe(1);
    expect(s.winRate).toBeCloseTo(2 / 3);
    expect(s.setsFor).toBe(8);
    expect(s.setsAgainst).toBe(4);
    expect(s.setRatio).toBe(2);
    expect(s.avgSetsForPerMatch).toBeCloseTo(2.67, 2);
    // 3-0 → 3, 3-1 → 3, 2-3 → 1
    expect(s.leaguePoints).toBe(7);
    expect(s.avgLeaguePoints).toBeCloseTo(2.33, 2);
  });

  it("sayı ortalamasını takım bakış açısına çevirerek hesaplar", () => {
    const s = computeTeamStats(matches);
    expect(s.points).not.toBeNull();
    // Maç1: 75-42, Maç2 (deplasman): takım 25+22+25+25=97, rakip 20+25+18+15=78, Maç3: 105-108
    expect(s.points!.matches).toBe(3);
    expect(s.points!.sets).toBe(12);
    expect(s.points!.pointsFor).toBe(75 + 97 + 105);
    expect(s.points!.pointsAgainst).toBe(42 + 78 + 108);
  });

  it("ev/deplasman ve sonuç dağılımını ayırır", () => {
    const s = computeTeamStats(matches);
    expect(s.home).toEqual({ played: 2, wins: 1, losses: 1 });
    expect(s.away).toEqual({ played: 1, wins: 1, losses: 0 });
    expect(s.winBreakdown).toEqual({ "3-0": 1, "3-1": 1, "3-2": 0 });
    expect(s.lossBreakdown).toEqual({ "2-3": 1, "1-3": 0, "0-3": 0 });
    expect(s.otherResults).toBe(0);
  });

  it("seri: son maç mağlubiyetse güncel seri 1 M", () => {
    const s = computeTeamStats(matches);
    expect(s.streak).toEqual({ type: "L", length: 1 });
    expect(s.longestWinStreak).toBe(2);
    expect(s.longestLossStreak).toBe(1);
  });

  it("veri sırası karışık olsa da kronolojik hesaplar (gg.aa.yyyy tarih dahil)", () => {
    const shuffled = [
      m({ date: "03.10.2026", teamScore: 3, opponentScore: 0 }),
      m({ date: "26.09.2026", teamScore: 0, opponentScore: 3 }),
      m({ date: "27.09.2026", teamScore: 3, opponentScore: 2 }),
    ];
    const s = computeTeamStats(shuffled);
    // Kronolojik: 26.09 (M), 27.09 (G), 03.10 (G) → güncel seri 2 G
    expect(s.streak).toEqual({ type: "W", length: 2 });
    expect(getDecidedMatches(shuffled).map((d) => d.m.date)).toEqual(["26.09.2026", "27.09.2026", "03.10.2026"]);
  });

  it("set skoru eksik veya tutarsızsa sayı ortalamasına katmaz (uydurma yok)", () => {
    const noSets = computeTeamStats([m({ date: "2026-09-12", teamScore: 3, opponentScore: 0 })]);
    expect(noSets.played).toBe(1);
    expect(noSets.points).toBeNull();
    const mismatch = computeTeamStats([
      m({ date: "2026-09-12", teamScore: 3, opponentScore: 0, set_scores: ["25-10", "25-12"] }),
    ]);
    expect(mismatch.points).toBeNull();
  });

  it("hükmen maçlar sayı ortalamasından çıkar ama galibiyet olarak sayılır", () => {
    const s = computeTeamStats([
      m({ date: "2026-09-12", teamScore: 3, opponentScore: 0, set_scores: ["25-0", "25-0", "25-0"] }),
      m({ date: "2026-09-19", teamScore: 3, opponentScore: 0, set_scores: ["25-10", "25-12", "25-20"] }),
    ]);
    expect(s.wins).toBe(2);
    expect(s.forfeits).toBe(1);
    expect(s.points!.matches).toBe(1);
    expect(s.points!.pointsFor).toBe(75);
  });

  it("3 setlik standart biçime uymayan sonuçları 'diğer' sayar", () => {
    const s = computeTeamStats([m({ date: "2026-09-12", teamScore: 2, opponentScore: 0 })]);
    expect(s.otherResults).toBe(1);
    expect(s.winBreakdown).toEqual({ "3-0": 0, "3-1": 0, "3-2": 0 });
  });

  it("maç yoksa null/sıfır alanlar döner", () => {
    const s = computeTeamStats([]);
    expect(s.played).toBe(0);
    expect(s.winRate).toBeNull();
    expect(s.points).toBeNull();
    expect(s.home).toBeNull();
    expect(s.away).toBeNull();
    expect(s.streak).toBeNull();
    expect(s.avgSetsForPerMatch).toBeNull();
  });

  it("verilen set 0 ise set oranı null (sonsuz) döner", () => {
    const s = computeTeamStats([m({ date: "2026-09-12", teamScore: 3, opponentScore: 0 })]);
    expect(s.setRatio).toBeNull();
    expect(s.setsFor).toBe(3);
  });
});

describe("computeRecentForm", () => {
  it("son N maçı ve puanı verir", () => {
    const list = [
      m({ date: "2026-09-01", teamScore: 0, opponentScore: 3 }),
      m({ date: "2026-09-02", teamScore: 3, opponentScore: 0 }),
      m({ date: "2026-09-03", teamScore: 3, opponentScore: 2 }),
      m({ date: "2026-09-04", teamScore: 2, opponentScore: 3 }),
    ];
    const f = computeRecentForm(list, 3);
    expect(f.results).toEqual(["W", "W", "L"]);
    expect(f.matches).toBe(3);
    expect(f.wins).toBe(2);
    expect(f.points).toBe(3 + 2 + 1);
    expect(f.maxPoints).toBe(9);
  });
});
