import { describe, it, expect } from "vitest";
import { parseStandingKey, CITY_SLUG_TO_NAME } from "@/utils/standingsParsing";

describe("parseStandingKey", () => {
  it("şablon: slug ile başlayan puan durumu anahtarlarını doğru il ve lige ayrıştırır", () => {
    const resAfyon = parseStandingKey("afyon - Genç Kızlar Süper Lig - Genç Kız Süper Lig A");
    expect(resAfyon.city).toBe("Afyonkarahisar");
    expect(resAfyon.ageGroup).toBe("Genç (U18)");
    expect(resAfyon.leagueTier).toBe("Süper Lig");
    expect(resAfyon.leagueFullName).toBe("Genç Kızlar Süper Lig");
    expect(resAfyon.displayGroup).toBe("A Grubu");

    const resAnkara = parseStandingKey("ankara - Genç Kızlar Süper Lig - Genç Kız Süper Lig 1. Grup");
    expect(resAnkara.city).toBe("Ankara");
    expect(resAnkara.ageGroup).toBe("Genç (U18)");
    expect(resAnkara.leagueTier).toBe("Süper Lig");
    expect(resAnkara.displayGroup).toBe("1. Grup");

    const resCanakkale = parseStandingKey("canakkale - Yıldız Kızlar Süper Lig - B Grubu");
    expect(resCanakkale.city).toBe("Çanakkale");
    expect(resCanakkale.ageGroup).toBe("Yıldız (U16)");
    expect(resCanakkale.leagueTier).toBe("Süper Lig");
    expect(resCanakkale.displayGroup).toBe("B Grubu");
  });

  it("resmi Türkçe il isimleriyle başlayan anahtarları doğru ayrıştırır", () => {
    const res = parseStandingKey("İstanbul - Genç Kızlar Süper Lig - A Grubu");
    expect(res.city).toBe("İstanbul");
    expect(res.leagueTier).toBe("Süper Lig");
    expect(res.displayGroup).toBe("A Grubu");

    const resAnk = parseStandingKey("Ankara - Genç Kızlar 1. Ligi - 2. Grup");
    expect(resAnk.city).toBe("Ankara");
    expect(resAnk.leagueTier).toBe("1. Lig");
    expect(resAnk.displayGroup).toBe("2. Grup");
  });

  it("şehir ön eki olmayan anahtarlarda defaultCity değerini kullanır", () => {
    const res = parseStandingKey("Genç Kızlar Süper Lig - A Grubu", "İzmir");
    expect(res.city).toBe("İzmir");
    expect(res.leagueTier).toBe("Süper Lig");
    expect(res.displayGroup).toBe("A Grubu");
  });

  it("asla il ismini veya slug'ını leagueTier olarak atamaz", () => {
    const res = parseStandingKey("afyon - A Grubu");
    expect(res.city).toBe("Afyonkarahisar");
    expect(res.leagueTier).not.toBe("afyon");
    expect(res.leagueTier).toBe("Süper Lig");
  });

  it("CITY_SLUG_TO_NAME 81 il için geçerli eşleşmeleri içerir", () => {
    expect(CITY_SLUG_TO_NAME["istanbul"]).toBe("İstanbul");
    expect(CITY_SLUG_TO_NAME["ankara"]).toBe("Ankara");
    expect(CITY_SLUG_TO_NAME["izmir"]).toBe("İzmir");
    expect(CITY_SLUG_TO_NAME["afyon"]).toBe("Afyonkarahisar");
    expect(CITY_SLUG_TO_NAME["duzce"]).toBe("Düzce");
  });
});
