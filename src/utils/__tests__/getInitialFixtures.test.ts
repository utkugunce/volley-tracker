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

  it("does not include pre-2026/27 past-season matches or unannounced cities (e.g. Adana)", () => {
    const data = getInitialFixtures();
    // Tüm maçlar 2026-2027 sezonuna ait olmalı (>= 2026-08-01)
    const pastSeasonMatches = data.matches.filter((m) => m.date && m.date < "2026-08-01");
    expect(pastSeasonMatches).toHaveLength(0);

    // Fikstürü henüz açıklanmamış Adana ili maçları bulunmamalı
    const adanaMatches = data.matches.filter((m) => m.city?.toLowerCase() === "adana");
    expect(adanaMatches).toHaveLength(0);

    // Adana puan durumları da genel akışta olmamalı
    const standingsKeys = Object.keys(data.standings || {});
    const adanaStandings = standingsKeys.filter((k) => k.toLowerCase().startsWith("adana"));
    expect(adanaStandings).toHaveLength(0);
  });
});
