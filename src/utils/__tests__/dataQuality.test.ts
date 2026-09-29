import { describe, it, expect } from "vitest";
import {
  validateCityIndex,
  validateKadinlar2LigData,
} from "@/utils/dataQuality";

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

  it("accepts a valid second-division payload", () => {
    const payload = {
      metadata: {
        lig_adi: "Uzman Posta Kadınlar Voleybol 2. Ligi",
        sezon: "2026-2027",
        toplam_grup_sayisi: 1,
        toplam_takim_sayisi: 1,
        toplam_mac_sayisi: 1,
      },
      gruplar: [
        {
          grup_no: 1,
          grup_adi: "Grup 1",
          takim_sayisi: 1,
          mac_sayisi: 1,
          puan_durumu: [
            {
              sira: 1,
              takim_adi: "Takım A",
              o: 0,
              g: 0,
              m: 0,
              p: 0,
              as: 0,
              vs: 0,
              sav: "0",
              asp: 0,
              vsp: 0,
              spav: "0",
              a3_0: 0,
              a3_1: 0,
              a3_2: 0,
              v2_3: 0,
              v1_3: 0,
              v0_3: 0,
              logo: "/logos/test.png",
              sezon: "2026-2027",
              grup_no: 1,
            },
          ],
          fikstur: [
            {
              id: "m1",
              takim_a: "Takım A",
              takim_b: "Takım B",
              durum: "OYNANACAK",
            },
          ],
        },
      ],
      tum_maclar: [
        {
          id: "m1",
          takim_a: "Takım A",
          takim_b: "Takım B",
          durum: "OYNANACAK",
        },
      ],
    };

    const result = validateKadinlar2LigData(payload);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects second-division data with missing metadata", () => {
    const result = validateKadinlar2LigData({ gruplar: [] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("metadata"))).toBe(true);
  });
});
