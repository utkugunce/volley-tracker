import { describe, it, expect } from "vitest";
import { getLeagueData } from "../leagueData";
import { getLeagueRoute, getLeagueStandingsRoute, getLeagueFixtureRoute } from "../leagueRoutes";

describe("leagueRoutes", () => {
  it("generates correct routes for altyapı leagues", () => {
    expect(getLeagueRoute("Genç Kızlar Süper Lig", "İstanbul")).toBe("/lig/istanbul/genc-kizlar-super-lig");
    expect(getLeagueStandingsRoute("Genç Kızlar Süper Lig", "İstanbul")).toBe("/lig/istanbul/genc-kizlar-super-lig?tab=standings");
    expect(getLeagueFixtureRoute("Genç Kızlar Süper Lig", "İstanbul")).toBe("/lig/istanbul/genc-kizlar-super-lig?tab=fixtures");
  });

  it("generates correct routes for Kadınlar 2. Ligi", () => {
    expect(getLeagueRoute("TVF Kadınlar 2. Ligi")).toBe("/kadinlar-2-ligi");
    expect(getLeagueRoute("TVF Kadınlar 2. Ligi - Grup 3")).toBe("/kadinlar-2-ligi/grup-3");
    expect(getLeagueStandingsRoute("TVF Kadınlar 2. Ligi - Grup 2")).toBe("/kadinlar-2-ligi/puan-durumu/grup-2");
    expect(getLeagueFixtureRoute("TVF Kadınlar 2. Ligi - Grup 5")).toBe("/kadinlar-2-ligi/fikstur/grup-5");
  });

  it("handles bullet separated league strings", () => {
    expect(getLeagueRoute("İstanbul • Genç Kızlar Süper Lig")).toBe("/lig/istanbul/genc-kizlar-super-lig");
  });
});

describe("leagueData", () => {
  it("loads Istanbul Genç Kızlar Süper Lig correctly", () => {
    const data = getLeagueData("istanbul", "genc-kizlar-super-lig");
    expect(data).not.toBeNull();
    if (data) {
      expect(data.city).toBe("İstanbul");
      expect(data.category).toContain("Genç");
      expect(data.matches.length).toBeGreaterThan(0);
      expect(data.groups.length).toBeGreaterThan(0);
      expect(data.teams.length).toBeGreaterThan(0);
      expect(data.stats.totalMatches).toBeGreaterThan(0);
      expect(data.stats.leaderTeam).toBeDefined();
    }
  });

  it("loads Kadınlar 2. Ligi correctly", () => {
    const data = getLeagueData("turkiye", "kadinlar-2-ligi");
    expect(data).not.toBeNull();
    if (data) {
      expect(data.leagueName).toBe("TVF Kadınlar 2. Ligi");
      expect(data.groups.length).toBe(16);
      expect(data.teams.length).toBeGreaterThan(100);
      expect(data.matches.length).toBeGreaterThan(100);
    }
  });
});
