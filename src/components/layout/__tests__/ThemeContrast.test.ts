import { describe, it, expect } from "vitest";

const lin = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("Fileönü palet kontrastı (WCAG)", () => {
  const surface = "#0E2033";
  const textPairs: [string, string, string][] = [
    ["ink", "#EAF6FA", "#07131F"],
    ["ink-2/surface", "#A9C3D1", surface],
    ["ink-3/surface", "#8CA8B8", surface],
    ["primary/surface", "#2DD4C0", surface],
    ["live/surface", "#FF6E82", surface],
    ["done/surface", "#9BE15D", surface],
    ["selected-text/surface", "#7FB4FF", surface],
    ["warn/surface", "#FFC24D", surface],
    ["orchid/surface", "#D98BFF", surface],
    ["form-loss/surface", "#FF8FA0", surface],
    ["primary-fg/primary", "#032320", "#2DD4C0"],
    ["orchid fg/orchid", "#2A0B3A", "#D98BFF"],
    ["white/selected-strong", "#FFFFFF", "#2A63BD"],
  ];
  it.each(textPairs)("%s ≥ 4.5", (_n, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
