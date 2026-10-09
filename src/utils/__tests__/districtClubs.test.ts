import { describe, it, expect } from "vitest";
import { getAllClubs, getClubsByCity, getClubsByDistrict, getDistrictSummaries } from "../districtClubs";

describe("districtClubs", () => {
  it("loads clubs across cities", () => {
    const clubs = getAllClubs();
    expect(clubs.length).toBeGreaterThan(0);
    const first = clubs[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("name");
    expect(first).toHaveProperty("city");
    expect(first).toHaveProperty("district");
    expect(first).toHaveProperty("districtSlug");
  });

  it("filters clubs by city correctly", () => {
    const istanbulClubs = getClubsByCity("istanbul");
    expect(istanbulClubs.length).toBeGreaterThan(0);
    expect(istanbulClubs.every((c) => c.citySlug === "istanbul")).toBe(true);
  });

  it("retrieves clubs by district", () => {
    const kadikoyClubs = getClubsByDistrict("istanbul", "kadikoy");
    expect(kadikoyClubs.length).toBeGreaterThan(0);
    expect(kadikoyClubs.some((c) => c.name.toLowerCase().includes("fenerbahçe"))).toBe(true);
  });

  it("summarizes districts with club and match counts", () => {
    const summaries = getDistrictSummaries("istanbul");
    expect(summaries.length).toBeGreaterThan(0);
    const kadikoy = summaries.find((s) => s.slug === "kadikoy");
    expect(kadikoy).toBeDefined();
    expect(kadikoy!.clubCount).toBeGreaterThan(0);
  });
});
