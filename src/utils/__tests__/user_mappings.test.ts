import { describe, it, expect } from "vitest";
import { getVolleyboxMapping } from "../volleybox";

describe("User Provided Volleybox Team Mappings", () => {
  const testCases: Array<{ name: string; city: string; expectedId: string; category?: string }> = [
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
    { name: "ANADOLU ZİRVE", city: "Konya", category: "Genç Kızlar Süper Lig", expectedId: "t54782" },
    { name: "BALLAS SPOR", city: "Konya", category: "Genç Kızlar Süper Lig", expectedId: "t42724" },
    { name: "DİLTAŞ SPOR", city: "Konya", category: "Genç Kızlar Süper Lig", expectedId: "t42731" },
    { name: "EREĞLİ AREL", city: "Konya", category: "Genç Kızlar Süper Lig", expectedId: "t54781" },
    { name: "EREĞLİ SÜMER", city: "Konya", category: "Genç Kızlar Süper Lig", expectedId: "t42732" },
    { name: "FALCON ATLETİK", city: "Konya", category: "Genç Kızlar Süper Lig", expectedId: "t42726" },
    { name: "KADINHANI GMSK", city: "Konya", category: "Genç Kızlar Süper Lig", expectedId: "t54784" },
    { name: "KARAPINAR ALBA", city: "Konya", category: "Genç Kızlar Süper Lig", expectedId: "t42733" },
    { name: "KONYA ANADOLU YILDIZLARI", city: "Konya", category: "Genç Kızlar Süper Lig", expectedId: "t54785" },
    { name: "KONYA ANKA", city: "Konya", category: "Genç Kızlar Süper Lig", expectedId: "t42722" },
    { name: "KONYA ARMADA", city: "Konya", category: "Genç Kızlar Süper Lig", expectedId: "t42734" },
    { name: "SELÇUKLU BELEDİYE", city: "Konya", category: "Genç Kızlar Süper Lig", expectedId: "t54783" },
    { name: "SEYDİŞEHİR CİMNASTİK", city: "Konya", category: "Genç Kızlar Süper Lig", expectedId: "t42727" },
    { name: "TÜRMAK SPOR", city: "Konya", category: "Genç Kızlar Süper Lig", expectedId: "t48579" },
    { name: "VAKIF AKADEMİ", city: "Konya", category: "Genç Kızlar Süper Lig", expectedId: "t42729" },
  ];

  for (const tc of testCases) {
    it(`correctly resolves ${tc.name} in ${tc.city} to ${tc.expectedId}`, () => {
      const mapping = getVolleyboxMapping(
        tc.name,
        tc.category || "Yıldız Kızlar Süper Lig",
        undefined,
        tc.city
      );
      expect(mapping).toBeDefined();
      expect(mapping?.volleybox_url).toContain(tc.expectedId);
    });
  }
});
