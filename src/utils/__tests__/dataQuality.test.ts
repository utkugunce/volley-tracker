// @vitest-environment node
import { describe, it, expect } from "vitest";
import { validateCityIndex } from "@/utils/dataQuality";

describe("dataQuality", () => {
  it("accepts a valid city index payload", () => {
    const payload = {
      updated_at: "2026-09-29T11:00:00+03:00",
      total_cities: 1,
      active_cities: 1,
      total_matches: 588,
      cities: [
        {
          ilid: "1",
          name: "Adana",
          slug: "adana",
          url: "https://adana.voleyboliltemsilciligi.com/PuanDurumu",
          status: "Aktif (588 Maç Mevcut)",
          matches_count: 588,
          standings_count: 0,
          data_file: null,
        },
      ],
    };

    const result = validateCityIndex(payload);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects mismatched city totals", () => {
    const payload = {
      updated_at: "2026-09-29T11:00:00+03:00",
      total_cities: 100,
      active_cities: 18,
      total_matches: 588,
      cities: [
        {
          ilid: "1",
          name: "Adana",
          slug: "adana",
          url: "https://adana.voleyboliltemsilciligi.com/PuanDurumu",
          status: "Fikstür Açıklanmadı",
          matches_count: 0,
          standings_count: 0,
          data_file: null,
        },
      ],
    };

    const result = validateCityIndex(payload);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("total_cities"))).toBe(true);
  });
});
