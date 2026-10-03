import { describe, it, expect } from "vitest";
import type { Match, StandingItem } from "@/types/fixture";
import {
  buildLeagueAnalytics,
  findTeamAnalysis,
  normalizeTeamName,
  teamKey,
  K2_STANDINGS_CITY,
} from "../leagueAnalytics";
import { getLeagueAnalytics } from "../leagueAnalyticsData";

const row = (team: string, rank: number, played: number, points: number): StandingItem => ({
  rank,
  team,
  played,
  won: 0,
  lost: 0,
  points,
  sets_won: 0,
  sets_lost: 0,
  set_ratio: "0",
  points_won: 0,
  points_lost: 0,
  point_ratio: "0",
  form: [],
});

let n = 0;
function match(home: string, away: string, hs: number | null, as: number | null, extra: Partial<Match> = {}): Match {
  n++;
  const finished = hs !== null && as !== null;
  return {
    id: `x${n}`,
    city: "İzmir",
    date: `2026-09-${String(10 + n).padStart(2, "0")}`,
    time: "12:00",
    hall: "Salon",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "A Grubu",
    match_no: String(n),
    home_team: home,
    away_team: away,
    status: finished ? "finished" : "upcoming",
    home_score: hs,
    away_score: as,
    set_scores: finished ? Array.from({ length: hs! + as! }, () => "25-20") : undefined,
    ...extra,
  };
}

describe("takım adı normalizasyonu", () => {
  it("(H) önekini atar", () => {
    expect(normalizeTeamName("(H) - Uvm Akademi")).toBe("Uvm Akademi");
    expect(teamKey("(H) - Uvm Akademi")).toBe(teamKey("Uvm Akademi"));
  });
});

describe("buildLeagueAnalytics (sentetik veri)", () => {
  // 3 takımlı tek devre grup: A>B 3-0, A>C 3-1, B>C 3-2 (tam fikstür)
  const names = ["Alfa", "Beta", "Gama"];
  const matches = [match("Alfa", "Beta", 3, 0), match("Alfa", "Gama", 3, 1), match("Beta", "Gama", 3, 2)];
  const standings = [
    {
      city: "İzmir",
      groupName: "Genç Kızlar Süper Lig - A Grubu",
      rows: [row("Alfa", 1, 2, 6), row("Beta", 2, 2, 3), row("Gama", 3, 2, 1)],
    },
  ];
  const a = buildLeagueAnalytics({ matches, standings });

  it("grup, takım ve kategori çıkarır", () => {
    expect(a.categories).toEqual(["Genç Kızlar Süper Lig"]);
    expect(a.groups).toHaveLength(1);
    expect(a.groups[0].teams.map((t) => t.team)).toEqual(names);
    expect(a.groups[0].cutoff).toBe(4);
  });

  it("takım istatistiklerini grup maçlarından hesaplar", () => {
    const alfa = a.groups[0].teams.find((t) => t.team === "Alfa")!;
    expect(alfa.stats.wins).toBe(2);
    expect(alfa.stats.setsFor).toBe(6);
    expect(alfa.stats.longestWinStreak).toBe(2);
    expect(alfa.href).toBe("/takim/alfa/izmir");
  });

  it("listeler: seri, set oranı, form; yetersiz maçlı takımlar elenir", () => {
    const l = a.lists.all;
    expect(l.longestWinStreaks.map((e) => e.team)).toEqual(["Alfa"]);
    // Alfa: 7 set / 1 → oran 6/1 (verilen 1)=6; Beta 3-0 kazanıp 2-3... set oranı sıralaması en yüksek Alfa
    expect(l.bestSetRatio[0].team).toBe("Alfa");
    // Form için en az 3 maç gerekir: kimse oynamadı
    expect(l.bestForm).toHaveLength(0);
    expect(l.totals).toEqual({ teams: 3, groups: 1, finishedMatches: 3 });
  });

  it("3 takımlı grupta (≤ kesit) play-off hesabı yapılmaz", () => {
    expect(a.groups[0].schedule.complete).toBe(true);
    expect(a.groups[0].race.every((r) => r.status === "unknown")).toBe(true);
    expect(a.lists.all.playoff.groups).toHaveLength(0);
  });

  it("findTeamAnalysis takımı grup ve slug ile bulur", () => {
    const found = findTeamAnalysis(a, { teamKeys: ["Beta"], city: "İzmir", groupName: "Genç Kızlar Süper Lig - A Grubu" });
    expect(found?.entry.team).toBe("Beta");
    expect(findTeamAnalysis(a, { teamKeys: ["yok"], city: "İzmir", groupName: "Genç Kızlar Süper Lig - A Grubu" })).toBeNull();
  });
});

describe("play-off özeti: tam fikstürlü 6 takımlı grup", () => {
  const t = ["T1", "T2", "T3", "T4", "T5", "T6"];
  // Her takım çifti bir kez karşılaşmış ve hepsi bitmiş (lig tamamlandı).
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) pairs.push([t[i], t[j]]);
  // Düşük numaralı takım hep 3-0 kazanır.
  const matches = pairs.map(([h, a]) => match(h, a, 3, 0, { group: "B Grubu" }));
  // Puanlar: T1 5 galibiyet=15, T2 12, T3 9, T4 6, T5 3, T6 0
  const rows = t.map((name, i) => row(name, i + 1, 5, (5 - i) * 3));
  const analytics = buildLeagueAnalytics({
    matches,
    standings: [{ city: "İzmir", groupName: "Genç Kızlar Süper Lig - B Grubu", rows }],
  });

  it("biten lig: ilk 4 garanti, kalan 2 elenmiş (eşitlik yok)", () => {
    const g = analytics.groups[0];
    expect(g.schedule.complete).toBe(true);
    const status = Object.fromEntries(g.race.map((r) => [r.team, r.status]));
    expect(status).toEqual({ t1: "qualified", t2: "qualified", t3: "qualified", t4: "qualified", t5: "eliminated", t6: "eliminated" });
    const summary = analytics.lists.all.playoff;
    expect(summary.groupsCalculated).toBe(1);
    expect(summary.groups[0].qualified).toHaveLength(4);
    expect(summary.groups[0].eliminated).toHaveLength(2);
  });

  it("puan durumu ile maçlar uyuşmazsa hesap yapılmaz", () => {
    const bad = buildLeagueAnalytics({
      matches,
      standings: [
        {
          city: "İzmir",
          groupName: "Genç Kızlar Süper Lig - B Grubu",
          rows: t.map((name, i) => row(name, i + 1, 4, (5 - i) * 3)),
        },
      ],
    });
    expect(bad.groups[0].schedule.complete).toBe(false);
    expect(bad.groups[0].race.every((r) => r.status === "unknown")).toBe(true);
  });
});

describe("Kadınlar 2. Ligi kesiti", () => {
  it("ilk 2 kullanılır", () => {
    const a = buildLeagueAnalytics({
      matches: [],
      standings: [
        {
          city: K2_STANDINGS_CITY,
          groupName: "Grup 1",
          rows: [row("A", 1, 0, 0), row("B", 2, 0, 0), row("C", 3, 0, 0)],
        },
      ],
    });
    expect(a.groups[0].cutoff).toBe(2);
    expect(a.groups[0].category).toBe("Kadınlar 2. Ligi");
  });
});

describe("gerçek veri (data/cities + Kadınlar 2. Ligi)", () => {
  const a = getLeagueAnalytics();

  it("kategorileri ve grupları üretir", () => {
    expect(a.groups.length).toBeGreaterThan(50);
    expect(a.categories).toEqual(expect.arrayContaining(["Genç Kızlar Süper Lig", "Yıldız Kızlar Süper Lig", "Kadınlar 2. Ligi"]));
  });

  it("listelerde NaN/Infinity veya negatif değer yok", () => {
    for (const lists of Object.values(a.lists)) {
      for (const e of [...lists.bestForm, ...lists.topScoring, ...lists.topConceding, ...lists.longestWinStreaks]) {
        expect(Number.isFinite(e.value as number)).toBe(true);
        expect(e.value as number).toBeGreaterThanOrEqual(0);
      }
      expect(lists.bestSetRatio.every((e) => e.value === null || Number.isFinite(e.value))).toBe(true);
      expect(lists.longestWinStreaks.every((e) => (e.value as number) >= 2)).toBe(true);
    }
  });

  it("takım bağlantıları /takim/ ile başlar ve kategoriler listelerle tutarlı", () => {
    const all = a.lists.all;
    for (const e of all.bestForm) expect(e.href.startsWith("/takim/")).toBe(true);
    const sumCats = a.categories.reduce((s, c) => s + a.lists[c].totals.teams, 0);
    expect(sumCats).toBe(all.totals.teams);
  });
});
