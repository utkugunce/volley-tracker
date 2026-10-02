import { describe, it, expect } from "vitest";
import { getInitialFixtures, getInitialHomeFixtures } from "../getInitialFixtures";

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

  it("loads lightweight home data via getInitialHomeFixtures", () => {
    const homeData = getInitialHomeFixtures();
    expect(homeData).toBeDefined();
    expect(homeData.city).toBe("Tüm İller");
    expect(Array.isArray(homeData.matches)).toBe(true);
    // Home data should be bounded for performance: 16 son biten + 16 yaklaşan
    // + bugün/dünün maçları (günlük veriye göre değişir), bu yüzden esnek üst sınır.
    expect(homeData.matches.length).toBeLessThanOrEqual(150);
    expect(homeData.matches.length).toBeLessThan(getInitialFixtures().matches.length);
    expect(homeData.total_matches).toBeGreaterThan(0);
  });
});
