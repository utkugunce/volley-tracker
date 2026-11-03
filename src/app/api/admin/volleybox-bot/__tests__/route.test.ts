import { describe, it, expect } from "vitest";
import { PRO_LEAGUES_CONFIG } from "../route";

describe("Volleybox Bot Route Pro Leagues Config", () => {
  it("3 profesyonel ligin de doğru konfigürasyonunu ve Volleybox URL'lerini içerir", () => {
    expect(PRO_LEAGUES_CONFIG).toHaveLength(3);

    const k2 = PRO_LEAGUES_CONFIG.find((p) => p.slug === "kadinlar-2-ligi");
    expect(k2).toBeDefined();
    expect(k2?.name).toBe("TVF Kadınlar 2. Ligi");
    expect(k2?.url).toContain("o45047");
    expect(k2?.aliases).toContain("2-lig");

    const k1 = PRO_LEAGUES_CONFIG.find((p) => p.slug === "kadinlar-1-ligi");
    expect(k1).toBeDefined();
    expect(k1?.name).toBe("KFC Kadınlar 1. Ligi");
    expect(k1?.url).toContain("o45210");
    expect(k1?.aliases).toContain("1-lig");

    const sultanlar = PRO_LEAGUES_CONFIG.find((p) => p.slug === "sultanlar-ligi");
    expect(sultanlar).toBeDefined();
    expect(sultanlar?.name).toBe("Vodafone Sultanlar Ligi");
    expect(sultanlar?.url).toContain("o45086");
    expect(sultanlar?.aliases).toContain("sultanlar");
  });
});
