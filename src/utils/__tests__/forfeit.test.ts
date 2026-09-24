import { describe, it, expect } from "vitest";
import { getMatchForfeitInfo, isForfeitMatch } from "../forfeit";

describe("Forfeit (Hükmen) Maç Tespiti", () => {
  it("25-0, 25-0, 25-0 set skorlarında ev sahibi hükmen galip sayılmalıdır", () => {
    const match = {
      home_team: "Takım A",
      away_team: "Takım B",
      score: "3 - 0",
      home_score: 3,
      away_score: 0,
      set_scores: ["25-0", "25-0", "25-0"],
      status: "finished",
    };

    const info = getMatchForfeitInfo(match);
    expect(info.isForfeit).toBe(true);
    expect(info.winner).toBe("home");
    expect(info.forfeitedBy).toBe("away");
    expect(info.label).toBe("Hükmen");
    expect(isForfeitMatch(match)).toBe(true);
  });

  it("0-25, 0-25, 0-25 set skorlarında deplasman hükmen galip sayılmalıdır", () => {
    const match = {
      home_team: "Takım A",
      away_team: "Takım B",
      score: "0 - 3",
      home_score: 0,
      away_score: 3,
      set_scores: ["0-25", "0-25", "0-25"],
      status: "finished",
    };

    const info = getMatchForfeitInfo(match);
    expect(info.isForfeit).toBe(true);
    expect(info.winner).toBe("away");
    expect(info.forfeitedBy).toBe("home");
    expect(isForfeitMatch(match)).toBe(true);
  });

  it("Boşluklu set skorlarını ('25 - 0') doğru temizleyip hükmen tespit etmelidir", () => {
    const match = {
      set_scores: ["25 - 0", "25- 0", " 25 - 0 "],
      status: "finished",
    };

    expect(isForfeitMatch(match)).toBe(true);
  });

  it("Takım adında TVF (H) ibaresi olan bitmiş maçları hükmen tespit etmelidir", () => {
    const match = {
      home_team: "Başakşehir Belediyesi SK",
      away_team: "(H) - Yıldızlar Arena",
      status: "finished",
      score: "3 - 0",
    };

    const info = getMatchForfeitInfo(match);
    expect(info.isForfeit).toBe(true);
    expect(info.winner).toBe("home");
    expect(info.forfeitedBy).toBe("away");
  });

  it("Normal biten maçları hükmen saymamalıdır", () => {
    const match = {
      home_team: "VakıfBank",
      away_team: "Eczacıbaşı",
      score: "3 - 1",
      set_scores: ["25-20", "23-25", "25-18", "25-22"],
      status: "finished",
    };

    const info = getMatchForfeitInfo(match);
    expect(info.isForfeit).toBe(false);
    expect(isForfeitMatch(match)).toBe(false);
  });

  it("Tek bir sette 25-0 olsa dahi 3 set tamamı 25-0 değilse hükmen saymamalıdır", () => {
    const match = {
      set_scores: ["25-0", "25-18", "25-20"],
      status: "finished",
    };

    expect(isForfeitMatch(match)).toBe(false);
  });

  it("Geçersiz veya boş maç objelerinde hata vermeden false dönmelidir", () => {
    expect(isForfeitMatch(null)).toBe(false);
    expect(isForfeitMatch(undefined)).toBe(false);
    expect(isForfeitMatch({})).toBe(false);
  });
});
