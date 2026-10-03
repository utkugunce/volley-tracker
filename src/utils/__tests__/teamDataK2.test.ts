import { describe, it, expect } from "vitest";
import { getTeamDetailsBySlug } from "../teamData";
import { getTeamStatsBundle } from "../teamStatsBundle";

describe("Kadınlar 2. Ligi verisinin takım sayfasına aktarımı", () => {
  const team = getTeamDetailsBySlug("turk-hava-yollari");

  it("puan durumu satırlarında set/sayı alanları sayısal ve form dizisi var", () => {
    expect(team).not.toBeNull();
    const ctx = team!.standingsContexts.find((c) => c.groupName.startsWith("TVF Kadınlar 2. Ligi"));
    expect(ctx).toBeDefined();
    const r = ctx!.standingRow;
    expect(typeof r.sets_won).toBe("number");
    expect(typeof r.sets_lost).toBe("number");
    expect(typeof r.points_won).toBe("number");
    expect(typeof r.set_ratio).toBe("string");
    expect(Array.isArray(r.form)).toBe(true);
  });

  it("maç tarihleri ISO (yyyy-aa-gg) biçimindedir; böylece kronolojik sıralama doğrudur", () => {
    const k2 = team!.matches.filter((m) => m.category === "Kadınlar 2. Ligi");
    expect(k2.length).toBeGreaterThan(0);
    for (const m of k2) expect(m.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const dates = k2.map((m) => m.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it("takım istatistik paketi hesaplanır ve play-off özeti kesit içerir", () => {
    const bundle = getTeamStatsBundle(team!);
    expect(bundle.stats.played).toBeGreaterThanOrEqual(0);
    for (const p of bundle.playoff) {
      expect(p.groupSize).toBeGreaterThan(p.cutoff);
      expect(["qualified", "eliminated", "open", "unknown"]).toContain(p.status);
      // Fikstür tam değilse kesin durum üretilmemeli
      if (!p.scheduleComplete) expect(p.status).toBe("unknown");
    }
  });
});
