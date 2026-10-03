import { describe, it, expect } from "vitest";
import { getTeamDetailsBySlug, getAllTeamSlugs, type TeamMatchDetail } from "../teamData";
import { slugify } from "../slugify";
import {
  getVolleyballPoints,
  buildFormSeries,
  computeOpponentRecords,
  getTeamHalls,
} from "../teamStats";

function mk(overrides: Partial<TeamMatchDetail> & { id: string }): TeamMatchDetail {
  return {
    date: "01.01.2026",
    time: "10:00",
    hall: "",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "A",
    match_no: "1",
    home_team: "Biz",
    away_team: "Rakip",
    status: "finished",
    isHome: true,
    opponent: "Rakip",
    teamScore: 3,
    opponentScore: 0,
    result: "win",
    ...overrides,
  } as TeamMatchDetail;
}

const loss = (id: string, extra: Partial<TeamMatchDetail> = {}) =>
  mk({ id, teamScore: 1, opponentScore: 3, result: "loss", ...extra });

describe("slug kararlılığı ve çakışma", () => {
  it("Türkçe karakterleri ve büyük/küçük harf farklarını aynı slug'a indirger", () => {
    expect(slugify("İstanbul Büyükşehir Bld. S.K.")).toBe("istanbul-buyuksehir-bld-sk");
    expect(slugify("ISPARTA  Çağdaş   Spor")).toBe("isparta-cagdas-spor");
    expect(slugify("  Şişli  Belediyespor ")).toBe("sisli-belediyespor");
    expect(slugify("")).toBe("");
  });

  it("slugify idempotent (slug'ı tekrar slugify etmek değiştirmez)", () => {
    const s = slugify("Eczacıbaşı Dynavit / Ankara (B)");
    expect(slugify(s)).toBe(s);
  });

  it("tüm takım slug'ları URL güvenli, tekrarsız ve boş değil", () => {
    const slugs = getAllTeamSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it("çok şehirli takımlar için şehir önekli slug çakışmayı çözer ve doğru ile döner", () => {
    const slugs = getAllTeamSlugs();
    expect(slugs).toContain("izmir-vakifbank");
    const izmir = getTeamDetailsBySlug("izmir-vakifbank");
    const ist = getTeamDetailsBySlug("vakifbank", "istanbul");
    expect(izmir?.city).toMatch(/İzmir|Izmir/i);
    expect(ist?.city).toMatch(/İstanbul|Istanbul/i);
  });
});

describe("getVolleyballPoints", () => {
  it("set farkına göre 3/2/1/0 puan verir", () => {
    expect(getVolleyballPoints(3, 0)).toBe(3);
    expect(getVolleyballPoints(3, 1)).toBe(3);
    expect(getVolleyballPoints(3, 2)).toBe(2);
    expect(getVolleyballPoints(2, 3)).toBe(1);
    expect(getVolleyballPoints(1, 3)).toBe(0);
    expect(getVolleyballPoints(0, 3)).toBe(0);
  });
});

describe("buildFormSeries", () => {
  it("yalnızca biten ve sonucu belli maçları alır, son N tanesini kronolojik sırada döndürür", () => {
    const matches = [
      mk({ id: "1" }),
      mk({ id: "up", status: "upcoming", result: "upcoming", teamScore: null, opponentScore: null }),
      loss("2"),
      mk({ id: "3", teamScore: 3, opponentScore: 2 }),
    ];
    const series = buildFormSeries(matches, 2);
    expect(series.map((p) => p.id)).toEqual(["2", "3"]);
    expect(series.map((p) => p.points)).toEqual([0, 2]);
    expect(series.map((p) => p.result)).toEqual(["L", "W"]);
    expect(series[1].score).toBe("3 - 2");
  });

  it("skor yoksa galibiyet 3, mağlubiyet 0 puan sayılır", () => {
    const series = buildFormSeries([
      mk({ id: "a", teamScore: null, opponentScore: null, score: undefined }),
      loss("b", { teamScore: null, opponentScore: null }),
    ]);
    expect(series.map((p) => p.points)).toEqual([3, 0]);
  });

  it("maç yoksa boş döner", () => {
    expect(buildFormSeries([])).toEqual([]);
  });
});

describe("computeOpponentRecords (head-to-head)", () => {
  it("rakip bazında G/M, set toplamı ve kalan maçı hesaplar; aynı rakibi yazım farkına rağmen birleştirir", () => {
    const matches = [
      mk({ id: "1", opponent: "Çağdaş SK" }),
      loss("2", { opponent: "CAGDAS SK", isHome: false }),
      mk({ id: "3", opponent: "Çağdaş SK", status: "upcoming", result: "upcoming", teamScore: null, opponentScore: null }),
      mk({ id: "4", opponent: "Diğer", teamScore: 3, opponentScore: 2 }),
    ];
    const recs = computeOpponentRecords(matches);
    expect(recs).toHaveLength(2);
    const c = recs[0];
    expect(c.slug).toBe("cagdas-sk");
    expect(c).toMatchObject({ played: 2, wins: 1, losses: 1, upcoming: 1, setsFor: 4, setsAgainst: 3 });
    expect(c.meetings.map((m) => m.result)).toEqual(["W", "L"]);
    expect(recs[1]).toMatchObject({ opponent: "Diğer", played: 1, wins: 1 });
  });

  it("hiç oynanmamış rakipler listede yer almaz", () => {
    const recs = computeOpponentRecords([
      mk({ id: "u", status: "upcoming", result: "upcoming", teamScore: null, opponentScore: null }),
    ]);
    expect(recs).toEqual([]);
  });

  it("çok oynanan rakip önce, eşitlikte ada göre Türkçe sıralanır", () => {
    const recs = computeOpponentRecords([
      mk({ id: "1", opponent: "Zeren" }),
      mk({ id: "2", opponent: "Çankaya" }),
      mk({ id: "3", opponent: "Çankaya" }),
      mk({ id: "4", opponent: "Arma" }),
    ]);
    expect(recs.map((r) => r.opponent)).toEqual(["Çankaya", "Arma", "Zeren"]);
  });

  it("gerçek veride toplamlar takımın istatistikleriyle tutarlıdır", () => {
    const team = getTeamDetailsBySlug("fenerbahce");
    expect(team).not.toBeNull();
    const recs = computeOpponentRecords(team!.matches);
    const played = recs.reduce((n, r) => n + r.played, 0);
    const wins = recs.reduce((n, r) => n + r.wins, 0);
    expect(played).toBeLessThanOrEqual(team!.stats.played);
    expect(wins).toBeLessThanOrEqual(team!.stats.wins);
    expect(played).toBeGreaterThan(0);
  });
});

describe("getTeamHalls", () => {
  it("salonları sıklığa göre sıralar, boş/TBD salonları yok sayar", () => {
    const halls = getTeamHalls([
      mk({ id: "1", hall: "Burhan Felek Voleybol Salonu", city: "İstanbul" }),
      mk({ id: "2", hall: "burhan felek voleybol salonu", city: "İstanbul" }),
      mk({ id: "3", hall: "Küçük Salon", city: "İstanbul" }),
      mk({ id: "4", hall: "TBD" }),
      mk({ id: "5", hall: "" }),
    ]);
    expect(halls.map((h) => h.name)).toEqual(["Burhan Felek Voleybol Salonu", "Küçük Salon"]);
    expect(halls[0].matchCount).toBe(2);
    expect(halls[0].details?.district).toContain("Üsküdar");
    expect(halls[0].navigationUrl).toContain("google.com/maps");
    expect(halls[1].details).toBeNull();
  });

  it("salon bilgisi yoksa boş döner", () => {
    expect(getTeamHalls([mk({ id: "1", hall: "" })])).toEqual([]);
  });
});
