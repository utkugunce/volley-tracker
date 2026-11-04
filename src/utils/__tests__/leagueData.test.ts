import { describe, it, expect } from "vitest";
import { getLeagueData } from "../leagueData";
import { getLeagueRoute, getLeagueStandingsRoute, getLeagueFixtureRoute } from "../leagueRoutes";

describe("leagueRoutes", () => {
  it("generates correct routes for altyapı leagues", () => {
    expect(getLeagueRoute("Genç Kızlar Süper Lig", "İstanbul")).toBe("/lig/istanbul/genc-kizlar-super-lig");
    expect(getLeagueStandingsRoute("Genç Kızlar Süper Lig", "İstanbul")).toBe("/lig/istanbul/genc-kizlar-super-lig?tab=standings");
    expect(getLeagueFixtureRoute("Genç Kızlar Süper Lig", "İstanbul")).toBe("/lig/istanbul/genc-kizlar-super-lig?tab=fixtures");
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
});
