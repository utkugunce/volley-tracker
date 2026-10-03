import { describe, it, expect } from "vitest";
import { analyzeSchedule, evaluatePlayoffRace } from "../playoffRace";

const rows = (pts: number[]) => pts.map((points, i) => ({ team: `T${i + 1}`, played: 3, points }));
const remaining = (n: number | number[], count: number) =>
  new Map(Array.from({ length: count }, (_, i) => [`T${i + 1}`, Array.isArray(n) ? n[i] : n]));
const statusOf = (res: ReturnType<typeof evaluatePlayoffRace>) => Object.fromEntries(res.map((r) => [r.team, r.status]));

describe("evaluatePlayoffRace", () => {
  it("garanti ve elenmiş takımları kesin olarak ayırır", () => {
    // Puanlar 30,25,20,10,6,0; herkesin 1 maçı kalmış (en çok +3)
    const res = evaluatePlayoffRace(rows([30, 25, 20, 10, 6, 0]), remaining(1, 6), 4, true);
    expect(statusOf(res)).toEqual({
      T1: "qualified",
      T2: "qualified",
      T3: "qualified",
      T4: "qualified",
      T5: "eliminated",
      T6: "eliminated",
    });
    expect(res[0].maxPoints).toBe(33);
  });

  it("yarış açıkken hiçbir takıma kesin durum vermez", () => {
    const res = evaluatePlayoffRace(rows([10, 9, 9, 8, 8, 7]), remaining(3, 6), 4, true);
    expect(res.every((r) => r.status === "open")).toBe(true);
  });

  it("eşit puan rakip lehine sayılır: eşitlik garanti vermez", () => {
    // T4 ve T5 aynı puanda, kalan maç yok → ikisi de ne garanti ne elenmiş (averaj belirler)
    const res = evaluatePlayoffRace(rows([12, 9, 6, 3, 3, 0]), remaining(0, 6), 4, true);
    const s = statusOf(res);
    expect(s.T1).toBe("qualified");
    expect(s.T2).toBe("qualified");
    expect(s.T3).toBe("qualified");
    expect(s.T4).toBe("open");
    expect(s.T5).toBe("open");
    expect(s.T6).toBe("eliminated");
  });

  it("kalan maçı olmayan ve 4 takımın kesin gerisinde kalan takım elenmiştir", () => {
    const res = evaluatePlayoffRace(rows([20, 18, 15, 12, 6]), remaining([2, 2, 2, 2, 0], 5), 4, true);
    expect(statusOf(res).T5).toBe("eliminated");
  });

  it("ilk 2 kesiti (Kadınlar 2. Ligi) için çalışır", () => {
    const res = evaluatePlayoffRace(rows([30, 20, 9, 3]), remaining(1, 4), 2, true);
    const s = statusOf(res);
    expect(s.T1).toBe("qualified");
    expect(s.T2).toBe("qualified");
    expect(s.T3).toBe("eliminated");
    expect(s.T4).toBe("eliminated");
  });

  it("fikstür tamamlanmadıysa tüm takımlar 'belirsiz' kalır", () => {
    const res = evaluatePlayoffRace(rows([30, 25, 20, 10, 6, 0]), remaining(1, 6), 4, false);
    expect(res.every((r) => r.status === "unknown")).toBe(true);
  });

  it("takım sayısı kesitten küçük/eşitse hesap yapılmaz", () => {
    const res = evaluatePlayoffRace(rows([9, 6, 3, 0]), remaining(0, 4), 4, true);
    expect(res.every((r) => r.status === "unknown")).toBe(true);
  });
});

describe("analyzeSchedule", () => {
  const teams = ["A", "B", "C", "D"].map((team) => ({ team, played: 0 }));
  const pairs: Array<[string, string]> = [
    ["A", "B"],
    ["A", "C"],
    ["A", "D"],
    ["B", "C"],
    ["B", "D"],
    ["C", "D"],
  ];

  it("tek devre tam fikstürü 'tam' sayar ve kalan maçları toplar", () => {
    const matches = pairs.map(([home, away]) => ({ home, away, status: "upcoming" }));
    const r = analyzeSchedule(teams, matches);
    expect(r.complete).toBe(true);
    expect(r.meetingsPerPair).toBe(1);
    expect(r.remaining.get("A")).toBe(3);
  });

  it("oynanmış maçlar puan durumundaki oynanan sayıyla uyuşmalı", () => {
    const matches = pairs.map(([home, away], i) => ({ home, away, status: i === 0 ? "finished" : "upcoming" }));
    // A ve B bir maç oynamış olmalı; puan durumu bunu yansıtmıyorsa tutarsız
    expect(analyzeSchedule(teams, matches).reason).toBe("played_mismatch");
    const ok = analyzeSchedule(
      [{ team: "A", played: 1 }, { team: "B", played: 1 }, { team: "C", played: 0 }, { team: "D", played: 0 }],
      matches
    );
    expect(ok.complete).toBe(true);
    expect(ok.remaining.get("A")).toBe(2);
  });

  it("kısmen açıklanmış fikstür tam sayılmaz", () => {
    const matches = pairs.slice(0, 4).map(([home, away]) => ({ home, away, status: "upcoming" }));
    const r = analyzeSchedule(teams, matches);
    expect(r.complete).toBe(false);
    expect(r.reason).toBe("uneven_pairs");
  });

  it("çift devre (her çift 2 kez) tam sayılır", () => {
    const matches = [...pairs, ...pairs].map(([home, away]) => ({ home, away, status: "upcoming" }));
    const r = analyzeSchedule(teams, matches);
    expect(r.complete).toBe(true);
    expect(r.meetingsPerPair).toBe(2);
  });

  it("tabloda olmayan takımlı maç varsa tam sayılmaz; ertelenen maç kalan sayılır", () => {
    const matches = [...pairs.map(([home, away]) => ({ home, away, status: "postponed" })), { home: "A", away: "Z", status: "upcoming" }];
    const r = analyzeSchedule(teams, matches);
    expect(r.complete).toBe(false);
    expect(r.reason).toBe("unknown_team");
    const r2 = analyzeSchedule(teams, pairs.map(([home, away]) => ({ home, away, status: "postponed" })));
    expect(r2.complete).toBe(true);
    expect(r2.remaining.get("B")).toBe(3);
  });
});
