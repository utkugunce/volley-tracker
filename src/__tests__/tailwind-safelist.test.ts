import { describe, it, expect } from "vitest";
import tailwindConfig from "../../tailwind.config";
import teamColors from "../data/team-colors.json";

describe("Tailwind Safelist & Takım Renkleri Bekçisi (Görev 4)", () => {
  it("tailwind.config.ts safelist içinde team-colors.json paletindeki tüm sınıflar yer almalıdır", () => {
    const safelist = (tailwindConfig.safelist as string[]) || [];
    expect(Array.isArray(safelist)).toBe(true);

    const paletteClasses = new Set<string>();
    for (const [, borderClass, bgClass] of teamColors.p as [string, string, string][]) {
      if (borderClass) paletteClasses.add(borderClass);
      if (bgClass) paletteClasses.add(bgClass);
    }

    expect(paletteClasses.size).toBeGreaterThan(0);

    for (const cls of paletteClasses) {
      expect(safelist).toContain(cls);
    }
  });

  it("canlıda eksik olan border-emerald-400 ve border-pink-400 safelist içinde bulunmalıdır", () => {
    const safelist = (tailwindConfig.safelist as string[]) || [];
    expect(safelist).toContain("border-emerald-400");
    expect(safelist).toContain("border-pink-400");
  });
});
