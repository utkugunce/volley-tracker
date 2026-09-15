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

  it("retrieves all team slugs without duplicates", () => {
    const slugs = getAllTeamSlugs();
    expect(slugs.length).toBeGreaterThan(10);
    expect(slugs).toContain("fenerbahce");
    expect(slugs).toContain("eczacibasi");
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
