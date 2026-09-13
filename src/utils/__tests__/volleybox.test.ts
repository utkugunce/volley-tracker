import { describe, it, expect } from "vitest";
import {
  getVolleyboxMapping,
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
});
