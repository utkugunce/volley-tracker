import { describe, it, expect } from "vitest";
import { DICTIONARIES, LANGUAGES, parseLanguage, translate } from "../dictionary";

describe("i18n sözlüğü", () => {
  it("Türkçe varsayılandır; bilinmeyen değer Türkçe olur", () => {
    expect(parseLanguage(undefined)).toBe("tr");
    expect(parseLanguage("de")).toBe("tr");
    expect(parseLanguage("en")).toBe("en");
  });

  it("her dilde aynı anahtarlar bulunur ve boş değer yoktur", () => {
    const trKeys = Object.keys(DICTIONARIES.tr).sort();
    for (const lang of LANGUAGES) {
      expect(Object.keys(DICTIONARIES[lang]).sort()).toEqual(trKeys);
      for (const value of Object.values(DICTIONARIES[lang])) expect(value.trim().length).toBeGreaterThan(0);
    }
  });

  it("translate mevcut metni döndürür, eksik anahtarda Türkçeye/anahtara düşer", () => {
    expect(translate("tr", "nav.home")).toBe("ANASAYFA");
    expect(translate("en", "nav.home")).toBe("HOME");
    expect(translate("en", "olmayan.anahtar")).toBe("olmayan.anahtar");
  });

  it("mevcut Türkçe gezinme metinleri değişmemiştir", () => {
    expect(translate("tr", "nav.today")).toBe("GÜNÜN MAÇLARI");
    expect(translate("tr", "mobile.favorites")).toBe("Favorilerim");
    expect(translate("tr", "header.k2")).toBe("Kadınlar 2. Ligi");
  });
});
