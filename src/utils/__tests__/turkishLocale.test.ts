import { describe, it, expect } from "vitest";
import { trLower, trNormalize, trIncludes } from "../turkishLocale";

describe("turkishLocale utilities", () => {
  describe("trLower", () => {
    it("correctly handles Turkish capital İ to lowercase i", () => {
      expect(trLower("İBB Spor Kulübü")).toBe("ibb spor kulübü");
      expect(trLower("İstanbul")).toBe("istanbul");
      expect(trLower("İzmir")).toBe("izmir");
      expect(trLower("İTÜ")).toBe("itü");
      expect(trLower("İnsped Spor Kulübü")).toBe("insped spor kulübü");
      expect(trLower("İl Temsilciliği")).toBe("il temsilciliği");
    });

    it("correctly handles Turkish capital I to lowercase dotless ı", () => {
      expect(trLower("IĞDIR")).toBe("ığdır");
      expect(trLower("Isparta")).toBe("ısparta");
      expect(trLower("ILGAZ")).toBe("ılgaz");
    });

    it("handles null or undefined safely", () => {
      expect(trLower("")).toBe("");
      expect(trLower(null as unknown as string)).toBe("");
      expect(trLower(undefined as unknown as string)).toBe("");
    });

    it("matches substring with ASCII query when lowercased with tr locale", () => {
      expect(trLower("İBB Spor Kulübü").includes("ibb")).toBe(true);
      expect(trLower("İstanbul").includes("istanbul")).toBe(true);
      expect(trLower("İzmir Büyükşehir Bld.").includes("izmir")).toBe(true);
      expect(trLower("İTÜ Geliştirme Vakfı").includes("itü")).toBe(true);
    });
  });

  describe("trNormalize", () => {
    it("converts Turkish special characters to ASCII equivalents", () => {
      expect(trNormalize("İTÜ")).toBe("itu");
      expect(trNormalize("Iğdır")).toBe("igdir");
      expect(trNormalize("Eczacıbaşı")).toBe("eczacibasi");
      expect(trNormalize("Şahinbey")).toBe("sahinbey");
      expect(trNormalize("Göztepe")).toBe("goztepe");
      expect(trNormalize("Çankaya")).toBe("cankaya");
    });
  });

  describe("trIncludes", () => {
    it("finds matches for Turkish letters with direct Turkish lowercase", () => {
      expect(trIncludes("İBB Spor Kulübü", "ibb")).toBe(true);
      expect(trIncludes("İstanbul", "istanbul")).toBe(true);
      expect(trIncludes("İzmir", "izmir")).toBe(true);
      expect(trIncludes("İTÜ Geliştirme Vakfı", "itü")).toBe(true);
      expect(trIncludes("Iğdır", "ığdır")).toBe(true);
    });

    it("finds matches for ASCII queries without Turkish special characters", () => {
      // User types "itu" for "İTÜ"
      expect(trIncludes("İTÜ Geliştirme Vakfı", "itu")).toBe(true);
      // User types "igdir" for "Iğdır"
      expect(trIncludes("Iğdır", "igdir")).toBe(true);
      // User types "eczacibasi" for "Eczacıbaşı"
      expect(trIncludes("Eczacıbaşı", "eczacibasi")).toBe(true);
      // User types "vakifbank" for "VakıfBank"
      expect(trIncludes("VakıfBank", "vakifbank")).toBe(true);
      // User types "goztepe" for "Göztepe"
      expect(trIncludes("Göztepe", "goztepe")).toBe(true);
    });

    it("returns false for non-matching strings", () => {
      expect(trIncludes("Fenerbahçe", "galatasaray")).toBe(false);
      expect(trIncludes("İBB", "bursa")).toBe(false);
    });

    it("handles empty query or string", () => {
      expect(trIncludes("İstanbul", "")).toBe(true);
      expect(trIncludes("", "istanbul")).toBe(false);
    });
  });
});
