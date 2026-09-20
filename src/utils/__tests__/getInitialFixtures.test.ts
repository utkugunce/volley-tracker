import { describe, it, expect } from "vitest";
import { getInitialFixtures } from "../getInitialFixtures";

describe("getInitialFixtures Utility", () => {
  it("loads all-city data by default with valid structure", () => {
    const data = getInitialFixtures();
    expect(data).toBeDefined();
    expect(data.city).toBe("Tüm İller");
    expect(Array.isArray(data.matches)).toBe(true);
    expect(data.matches.length).toBeGreaterThan(0);
    expect(data.filters).toBeDefined();
    expect(data.standings).toBeDefined();
  });

  it("loads specific city data when citySlug is given", () => {
    const data = getInitialFixtures("istanbul");
    expect(data).toBeDefined();
    expect(data.city).toBe("İstanbul");
    expect(Array.isArray(data.matches)).toBe(true);
  });

  it("falls back gracefully for non-existent city slug", () => {
    const data = getInitialFixtures("hayali-sehir-99");
    expect(data).toBeDefined();
    // falls back to all cities or valid fixture data
    expect(Array.isArray(data.matches)).toBe(true);
  });
});
