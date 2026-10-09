import { describe, it, expect } from "vitest";
import { calculateVolleyCategory, getAvailableBirthYears } from "../categoryCalculator";

describe("categoryCalculator", () => {
  it("calculates Mini Voleybol for 2016-2017 birth years", () => {
    const girl = calculateVolleyCategory(2016, "Kız");
    expect(girl.code).toBe("U10-U11");
    expect(girl.name).toBe("Mini Kızlar");
    expect(girl.netHeight).toBe("2.00 m (Ortak)");
    expect(girl.liberoRule).toContain("Libero kuralı uygulanmaz");

    const boy = calculateVolleyCategory(2017, "Erkek");
    expect(boy.name).toBe("Mini Erkekler");
  });

  it("calculates Midi Voleybol with proper gender net heights", () => {
    const girl = calculateVolleyCategory(2014, "Kız");
    expect(girl.name).toBe("Midi Kızlar");
    expect(girl.netHeight).toBe("2.10 m");

    const boy = calculateVolleyCategory(2015, "Erkek");
    expect(boy.name).toBe("Midi Erkekler");
    expect(boy.netHeight).toBe("2.15 m");
  });

  it("calculates Küçükler with libero enabled and official ball", () => {
    const girl = calculateVolleyCategory(2012, "Kız");
    expect(girl.name).toBe("Küçük Kızlar");
    expect(girl.netHeight).toBe("2.15 m");
    expect(girl.ballType).toContain("5 numara");
    expect(girl.liberoRule).toContain("Libero kuralı uygulanır");

    const boy = calculateVolleyCategory(2013, "Erkek");
    expect(boy.netHeight).toBe("2.24 m");
  });

  it("calculates Yıldızlar and Gençler correctly", () => {
    const yildiz = calculateVolleyCategory(2011, "Kız");
    expect(yildiz.name).toBe("Yıldız Kızlar");
    expect(yildiz.netHeight).toBe("2.24 m");

    const genc = calculateVolleyCategory(2008, "Erkek");
    expect(genc.name).toBe("Genç Erkekler");
    expect(genc.netHeight).toBe("2.43 m");
  });

  it("provides available birth years list", () => {
    const years = getAvailableBirthYears();
    expect(years.length).toBeGreaterThan(10);
    expect(years).toContain(2010);
    expect(years).toContain(2016);
  });
});
