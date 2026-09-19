import { describe, it, expect } from "vitest";
import { getTeamDetailsBySlug, getAllTeamSlugs } from "../teamData";

describe("teamData utility", () => {
  it("retrieves details for an existing team with matches and standings", () => {
    // Fenerbahçe exists in Istanbul fixtures
    const data = getTeamDetailsBySlug("fenerbahce");
    expect(data).not.toBeNull();
    expect(data?.teamName.toLowerCase()).toContain("fenerbahçe");
    expect(data?.slug).toBe("fenerbahce");
    expect(data?.cities.length).toBeGreaterThan(0);
    expect(data?.matches.length).toBeGreaterThan(0);
  });

  it("retrieves details for a team with only standings (e.g. Zeren in Ankara)", () => {
    const data = getTeamDetailsBySlug("zeren");
    expect(data).not.toBeNull();
    expect(data?.slug).toBe("zeren");
    expect(data?.standingsContexts.length).toBeGreaterThan(0);
  });

  it("returns null for non-existent team slug", () => {
    const data = getTeamDetailsBySlug("non-existent-team-xyz-999");
    expect(data).toBeNull();
  });

  it("retrieves all team slugs without duplicates and includes multi-city prefixed slugs", () => {
    const slugs = getAllTeamSlugs();
    expect(slugs.length).toBeGreaterThan(10);
    expect(slugs).toContain("fenerbahce");
    expect(slugs).toContain("eczacibasi");
    expect(slugs).toContain("izmir-vakifbank");
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("strictly isolates city profiles: İzmir Vakıfbank shows only İzmir matches and matches Vakıfbank İzmir U16", () => {
    const izmirVakif = getTeamDetailsBySlug("vakifbank", "izmir");
    expect(izmirVakif).not.toBeNull();
    expect(izmirVakif?.city).toBe("İzmir");
    expect(izmirVakif?.mapping?.matched_as).toBe("Vakıfbank İzmir U16");

    // All matches must belong ONLY to İzmir
    for (const m of izmirVakif?.matches || []) {
      expect(m.city).toBe("İzmir");
    }

    // All standings contexts must belong ONLY to İzmir
    for (const sc of izmirVakif?.standingsContexts || []) {
      expect(sc.city).toBe("İzmir");
    }

    // otherCities should link to İstanbul
    expect(izmirVakif?.otherCities?.some((c) => c.city === "İstanbul")).toBe(true);
  });

  it("strictly isolates city profiles: İstanbul VakıfBank shows only İstanbul matches without İzmir matches", () => {
    const istVakif = getTeamDetailsBySlug("vakifbank", "istanbul");
    expect(istVakif).not.toBeNull();
    expect(istVakif?.city).toBe("İstanbul");
    expect(istVakif?.mapping?.matched_as).not.toBe("Vakıfbank İzmir U16");

    // No match may be from İzmir
    for (const m of istVakif?.matches || []) {
      expect(m.city).not.toBe("İzmir");
    }

    // otherCities should link to İzmir
    expect(istVakif?.otherCities?.some((c) => c.city === "İzmir")).toBe(true);
  });

  it("resolves city-prefixed slug izmir-vakifbank directly to İzmir", () => {
    const izmirSlugTeam = getTeamDetailsBySlug("izmir-vakifbank");
    expect(izmirSlugTeam).not.toBeNull();
    expect(izmirSlugTeam?.city).toBe("İzmir");
    expect(izmirSlugTeam?.mapping?.matched_as).toBe("Vakıfbank İzmir U16");
  });

  it("finds sister club teams across U18 and U16 categories (e.g. Eryaman Gelişim)", () => {
    const eryamanU18 = getTeamDetailsBySlug("eryaman-gelisim-sk-u18", "ankara");
    expect(eryamanU18).not.toBeNull();
    expect(eryamanU18?.clubTeams).toBeDefined();
    expect(eryamanU18?.clubTeams?.length).toBeGreaterThanOrEqual(2);

    // Should include both U18 and U16
    const hasU18 = eryamanU18?.clubTeams?.some((t) => t.teamName.includes("U18"));
    const hasU16 = eryamanU18?.clubTeams?.some((t) => t.teamName.includes("U16"));
    expect(hasU18).toBe(true);
    expect(hasU16).toBe(true);

    // The current team should be marked as isCurrent: true
    const currentTeam = eryamanU18?.clubTeams?.find((t) => t.isCurrent);
    expect(currentTeam).toBeDefined();
    expect(currentTeam?.teamName).toContain("U18");
  });

  it("finds sister club teams with B team variations (e.g. Başkent Arma Spor)", () => {
    const armaTeam = getTeamDetailsBySlug("baskent-arma-spor-b", "ankara");
    expect(armaTeam).not.toBeNull();
    expect(armaTeam?.clubTeams).toBeDefined();
    expect(armaTeam?.clubTeams?.length).toBeGreaterThanOrEqual(2);

    // Should contain B Takımı
    const hasBTeam = armaTeam?.clubTeams?.some((t) => t.teamBranch?.includes("B") || t.teamName.includes("B"));
    expect(hasBTeam).toBe(true);
  });
});
