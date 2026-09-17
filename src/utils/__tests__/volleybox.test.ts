import { describe, it, expect } from "vitest";
import {
  getVolleyboxMapping,
  getVolleyboxLeagueMapping,
  buildVolleyboxMap,
  normalizeKey,
} from "../volleybox";
import { VolleyboxMappingsFile } from "@/types/fixture";

describe("volleybox utility", () => {
  describe("normalizeKey", () => {
    it("should trim and lower-case keys", () => {
      expect(normalizeKey("  VakıfBank  ")).toBe("vakıfbank");
      expect(normalizeKey("Fenerbahçe ")).toBe("fenerbahçe");
    });
  });

  describe("getVolleyboxMapping with live mappings", () => {
    it("returns correct mapping for verified team (Pegasus U18)", () => {
      const mapping = getVolleyboxMapping("Pegasus", "Genç Kızlar Süper Lig");
      expect(mapping).toBeDefined();
      expect(mapping?.volleybox_url).toContain("pegasus-spor-kulubu-u18-t54139");
      expect(mapping?.confidence).toBe("verified");
      expect(mapping?.age_category).toBe("U18");
      expect(mapping?.local_logo).toBeDefined();
      expect(mapping?.local_logo).toContain("/logos/");
    });

    it("returns correct mapping for verified team (Pegasus U16)", () => {
      const mapping = getVolleyboxMapping("Pegasus", "Yıldız Kızlar Süper Lig");
      expect(mapping).toBeDefined();
      expect(mapping?.volleybox_url).toContain("pegasus-spor-kulubu-u16-t54150");
      expect(mapping?.confidence).toBe("verified");
      expect(mapping?.age_category).toBe("U16");
    });

    it("correctly resolves category with group suffix (e.g. 'Genç Kızlar Süper Lig - A Grubu')", () => {
      const mapping = getVolleyboxMapping("Fenerbahçe", "Genç Kızlar Süper Lig - A Grubu");
      expect(mapping).toBeDefined();
      expect(mapping?.volleybox_url).toContain("fenerbahce-u18-t27716");
    });

    it("returns correct mapping for other cities (Bursa, İzmir, Antalya, Yalova, Düzce, Niğde)", () => {
      // Bursa
      const bursa23Nisan = getVolleyboxMapping("Bursa 23 Nisan Spor Kulübü", "Genç Kızlar Süper Lig");
      expect(bursa23Nisan).toBeDefined();
      expect(bursa23Nisan?.volleybox_url).toContain("23-nisan-spor-kulubu-u18-t42339");

      // İzmir (case insensitivity with Turkish İ)
      const izmirArkas = getVolleyboxMapping("ARKAS", "Genç Kızlar Süper Lig");
      expect(izmirArkas).toBeDefined();
      expect(izmirArkas?.volleybox_url).toContain("arkas-spor-kadn-altyap-takmlar-u18-t31879");

      const izmirspor = getVolleyboxMapping("İZMİRSPOR", "Genç Kızlar Süper Lig");
      expect(izmirspor).toBeDefined();
      expect(izmirspor?.volleybox_url).toContain("zmirspor-u18-t41248");

      // İzmir Dost Kulübü (1. Lig ve Süper Lig özel eşleşmeleri)
      const dost1LigA = getVolleyboxMapping("Dost - A", "Genç Kızlar 1. Ligi", undefined, "İzmir");
      expect(dost1LigA).toBeDefined();
      expect(dost1LigA?.matched_as).toBe("Dost Spor - B U18");
      expect(dost1LigA?.volleybox_url).toContain("dost-spor-u18-t53583");

      const dost1LigB = getVolleyboxMapping("Dost - B", "Genç Kızlar 1. Ligi", undefined, "İzmir");
      expect(dost1LigB).toBeDefined();
      expect(dost1LigB?.matched_as).toBe("Dost Spor - C U18");
      expect(dost1LigB?.volleybox_url).toContain("dost-spor-u18-t53584");

      const dostSuperLig = getVolleyboxMapping("DOST", "Genç Kızlar Süper Lig", undefined, "İzmir");
      expect(dostSuperLig).toBeDefined();
      expect(dostSuperLig?.matched_as).toBe("Dost Spor U18");
      expect(dostSuperLig?.volleybox_url).toContain("dost-spor-u18-t53574");

      const dostU16 = getVolleyboxMapping("DOST", "Yıldız Kızlar Süper Lig", undefined, "İzmir");
      expect(dostU16).toBeDefined();
      expect(dostU16?.matched_as).toBe("Dost Spor U16");
      expect(dostU16?.volleybox_url).toContain("dost-spor-u16-t41415");

      // Antalya
      const zenit = getVolleyboxMapping("07 Zenit S.K.", "Genç Kızlar Süper Lig");
      expect(zenit).toBeDefined();
      expect(zenit?.volleybox_url).toContain("07-zenit-spor-kulubu-u18-t54208");

      // Yalova
      const atakent = getVolleyboxMapping("Atakent Spor Kulübü (A)", "Genç Kızlar Süper Lig");
      expect(atakent).toBeDefined();
      expect(atakent?.volleybox_url).toContain("yalova-atakent-spor-kulubu-u18-t41959");

      // Düzce
      const duzce1907 = getVolleyboxMapping("Düzce 1907 Spor Kulübü", "Genç Kızlar Süper Lig");
      expect(duzce1907).toBeDefined();
      expect(duzce1907?.volleybox_url).toContain("duzce-1907-spor-kulubu-u18-t48245");

      // Niğde
      const bor = getVolleyboxMapping("Bor Belediye Spor Kulübü", "Genç Kızlar Süper Lig");
      expect(bor).toBeDefined();
      expect(bor?.volleybox_url).toContain("bor-belediyespor-u18-t48235");
    });

    it("returns undefined for an unknown/unmapped team", () => {
      const mapping = getVolleyboxMapping("Bilinmeyen Mahalle Spor Kulübü");
      expect(mapping).toBeUndefined();
    });

    it("returns undefined for empty or whitespace team name", () => {
      expect(getVolleyboxMapping("")).toBeUndefined();
      expect(getVolleyboxMapping("   ")).toBeUndefined();
    });
  });

  describe("buildVolleyboxMap with custom dataset", () => {
    const mockData: VolleyboxMappingsFile = {
      mappings: [
        {
          internal_name: "Test Kulübü",
          internal_category: "Genç Kızlar Süper Lig",
          matched_as: "Test Kulübü U18",
          volleybox_url: "https://women.volleybox.net/test-u18-t99991",
          age_category: "U18",
          confidence: "verified",
          note: null,
          verified_at: "2026-09-14",
        },
        {
          internal_name: "Kulüp Düzeyi Takım",
          internal_category: "Yıldız Kızlar Süper Lig",
          matched_as: "Kulüp Düzeyi Profesyonel Takımı",
          volleybox_url: "https://women.volleybox.net/kulup-pro-t99992",
          age_category: null,
          confidence: "club_level_only",
          note: "Bu bağlantı kulübün profesyonel takımına gider, bu genç takımın kendi profili değildir",
          verified_at: "2026-09-14",
        },
        {
          internal_name: "Kırık Link Takımı",
          internal_category: "Genç Kızlar Süper Lig",
          matched_as: "Kırık Link U18",
          volleybox_url: "https://women.volleybox.net/broken-t99993",
          age_category: "U18",
          confidence: "broken",
          note: "404 Not Found",
          verified_at: "2026-09-14",
        },
      ],
    };

    const customMap = buildVolleyboxMap(mockData);

    it("returns verified mapping for test club", () => {
      const res = getVolleyboxMapping("Test Kulübü", "Genç Kızlar Süper Lig", customMap);
      expect(res).toBeDefined();
      expect(res?.confidence).toBe("verified");
      expect(res?.volleybox_url).toBe("https://women.volleybox.net/test-u18-t99991");
    });

    it("returns club_level_only mapping with correct note", () => {
      const res = getVolleyboxMapping("Kulüp Düzeyi Takım", "Yıldız Kızlar Süper Lig", customMap);
      expect(res).toBeDefined();
      expect(res?.confidence).toBe("club_level_only");
      expect(res?.note).toBe(
        "Bu bağlantı kulübün profesyonel takımına gider, bu genç takımın kendi profili değildir"
      );
    });

    it("excludes broken links from lookup map", () => {
      const res = getVolleyboxMapping("Kırık Link Takımı", "Genç Kızlar Süper Lig", customMap);
      expect(res).toBeUndefined();
    });
  });

  describe("getVolleyboxLeagueMapping with live league mappings", () => {
    it("returns correct tournament mapping for Istanbul U18", () => {
      const mapping = getVolleyboxLeagueMapping("Genç Kızlar Süper Lig", "İstanbul");
      expect(mapping).toBeDefined();
      expect(mapping?.volleybox_url).toContain("women-stanbul-super-ligi-u18-2026-27-o50864");
      expect(mapping?.age_category).toBe("U18");
    });

    it("returns correct tournament mapping for Istanbul U16", () => {
      const mapping = getVolleyboxLeagueMapping("Yıldız Kızlar Süper Lig", "istanbul");
      expect(mapping).toBeDefined();
      expect(mapping?.volleybox_url).toContain("women-stanbul-super-ligi-u16-2026-27-o50865");
      expect(mapping?.age_category).toBe("U16");
    });

    it("resolves city-specific leagues such as İzmir U18", () => {
      const mapping = getVolleyboxLeagueMapping("Genç Kızlar Süper Lig", "İzmir");
      expect(mapping).toBeDefined();
      expect(mapping?.volleybox_url).toContain("women-zmir-super-ligi-u18-2026-27-o49401");
    });

    it("returns correct tournament mapping for Istanbul Genç Kızlar 1. Ligi (U18 1. Lig)", () => {
      const mapping = getVolleyboxLeagueMapping("Genç Kızlar 1. Ligi", "İstanbul");
      expect(mapping).toBeDefined();
      expect(mapping?.volleybox_url).toContain("women-stanbul-1-ligi-u18-2026-27-o50866");
      expect(mapping?.age_category).toBe("U18");
    });

    it("returns correct tournament mapping for İzmir Genç Kızlar 1. Ligi (U18 1. Lig)", () => {
      const mapping = getVolleyboxLeagueMapping("Genç Kızlar 1. Ligi", "İzmir");
      expect(mapping).toBeDefined();
      expect(mapping?.volleybox_url).toContain("women-zmir-1-ligi-u18-2026-27-o49400");
      expect(mapping?.age_category).toBe("U18");
    });

    it("resolves city-specific leagues such as Bursa U18", () => {
      const mapping = getVolleyboxLeagueMapping("Genç Kızlar Süper Lig", "Bursa");
      expect(mapping).toBeDefined();
      expect(mapping?.volleybox_url).toContain("women-bursa-super-ligi-u18-2026-27-o50939");
    });

    it("resolves category with group suffix (e.g. 'Genç Kızlar Süper Lig - A Grubu')", () => {
      const mapping = getVolleyboxLeagueMapping("Genç Kızlar Süper Lig - A Grubu", "İstanbul");
      expect(mapping).toBeDefined();
      expect(mapping?.volleybox_url).toContain("women-stanbul-super-ligi-u18-2026-27-o50864");
    });

    it("falls back to default Istanbul tournament if city is not specified", () => {
      const mapping = getVolleyboxLeagueMapping("Genç Kızlar Süper Lig");
      expect(mapping).toBeDefined();
      expect(mapping?.volleybox_url).toContain("women-stanbul-super-ligi-u18-2026-27-o50864");
    });

    it("returns undefined for an unknown/empty league name", () => {
      expect(getVolleyboxLeagueMapping("")).toBeUndefined();
      expect(getVolleyboxLeagueMapping("Bilinmeyen Bölgesel Turnuva")).toBeUndefined();
    });

    it("never returns past season (2025/26) tournament links for current season tracker (e.g. Ankara)", () => {
      // Ankara in volleybox-mappings.json has only 2025/26 tournament entries, which must NOT be returned for 2026/27
      const ankaraU18 = getVolleyboxLeagueMapping("Genç Kızlar Süper Lig", "Ankara");
      expect(ankaraU18).toBeUndefined();

      const ankaraU18Lig1 = getVolleyboxLeagueMapping("Genç Kızlar 1. Ligi", "Ankara");
      expect(ankaraU18Lig1).toBeUndefined();

      const ankaraU16 = getVolleyboxLeagueMapping("Yıldız Kızlar Süper Lig", "Ankara");
      expect(ankaraU16).toBeUndefined();
    });

    it("does not silently fall back to Istanbul if a specified city has no active 2026/27 tournament", () => {
      // Eskişehir U18 only has a 2025/26 entry in mappings, so it must be undefined
      const eskisehirU18 = getVolleyboxLeagueMapping("Genç Kızlar Süper Lig", "Eskişehir");
      expect(eskisehirU18).toBeUndefined();
    });
  });
});

