import { describe, expect, it } from "vitest";
import { GET } from "../route";

describe("GET /api/health", () => {
  it("veri snapshot ve entegrasyon durumunu döner", async () => {
    const response = await GET();
    const body = await response.json();

    expect([200, 503]).toContain(response.status);
    expect(body.status).toMatch(/^(ok|degraded)$/);
    expect(body.dataSource).toMatch(/^(supabase|json-fallback)$/);
    expect(body.data.cityFiles).toBeGreaterThan(0);
    expect(body.data.activeCityFiles).toBeGreaterThan(0);
    expect(body.data.totalAllowedCities).toBeGreaterThan(70);
    expect(body.data.snapshots).toHaveLength(2);
    expect(body.integrations).toHaveProperty("githubActions");
  });
});