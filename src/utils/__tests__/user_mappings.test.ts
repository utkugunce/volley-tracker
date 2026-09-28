import { describe, it, expect } from "vitest";
import { getVolleyboxMapping } from "../volleybox";

describe("User Provided Volleybox Team Mappings (Çanakkale & Eskişehir)", () => {
  const testCases = [
    { name: "Biga Ada Spor Kulübü", city: "Çanakkale", expectedId: "t44823" },
    { name: "Barbaros Spor Kulübü", city: "Çanakkale", expectedId: "t44830" },
    { name: "Çanakkale Belediyespor U16", city: "Çanakkale", expectedId: "t54646" },
    { name: "Biga Gelişim Spor Kulübü", city: "Çanakkale", expectedId: "t44828" },
    { name: "Biga Çiçeklidede Spor Kulübü", city: "Çanakkale", expectedId: "t44825" },
    { name: "Eskişehir Beyhan Rıfat Çıkılıoğlu A.L. Spor Kulübü", city: "Eskişehir", expectedId: "t43244" },
    { name: "Eskişehir Ata Spor Kulübü (B)", city: "Eskişehir", expectedId: "t54515" },
    { name: "Eskişehir Türktelekom Spor Kulübü (A)", city: "Eskişehir", expectedId: "t43239" },
    { name: "Esnova Spor Kulübü (A)", city: "Eskişehir", expectedId: "t54516" },
    { name: "Eskişehir Ata Spor Kulübü (A)", city: "Eskişehir", expectedId: "t54514" },
    { name: "Eskişehir Türktelekom Spor Kulübü (B)", city: "Eskişehir", expectedId: "t54517" },
    { name: "Meryem Boz Spor Kulübü (A)", city: "Eskişehir", expectedId: "t43242" },
    { name: "Çanakkale Belediye Spor Kulübü(A)", city: "Çanakkale", expectedId: "t48846" },
    { name: "Çanakkale Belediyespor", city: "Çanakkale", expectedId: "t48846" },
  ];

  for (const tc of testCases) {
    it(`correctly resolves ${tc.name} in ${tc.city} to ${tc.expectedId}`, () => {
      const mapping = getVolleyboxMapping(tc.name, "Yıldız Kızlar Süper Lig", undefined, tc.city);
      expect(mapping).toBeDefined();
      expect(mapping?.volleybox_url).toContain(tc.expectedId);
    });
  }
});
