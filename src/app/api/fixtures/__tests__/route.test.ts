import { describe, it, expect } from "vitest";
import { GET } from "../route";

describe("Fixtures API Route", () => {
  it("should return Istanbul fixtures by default or when city=istanbul", async () => {
    const req = new Request("http://localhost:3000/api/fixtures?city=istanbul");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.city).toBe("İstanbul");
    expect(Array.isArray(data.matches)).toBe(true);
    expect(data.total_matches).toBeGreaterThan(0);
  });

  it("should support city=all to aggregate all provinces", async () => {
    const req = new Request("http://localhost:3000/api/fixtures?city=all");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.city).toBe("Tüm İller");
    expect(Array.isArray(data.matches)).toBe(true);
    // Across Istanbul, Izmir, Yalova, Nigde, we have at least 92 matches
    expect(data.total_matches).toBeGreaterThanOrEqual(92);
  });
});
