import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamBadge, getTeamColor } from "../TeamBadge";

// Fileönü: rozet metni her zaman text-ink; zemin koyu yüzey tonu (marka rengi yalnız halka).
const lin = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
const cr = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// tailwind.config.ts ile aynı değerler
const BG: Record<string, string> = {
  "bg-surface-raised": "#13293F",
  "bg-blue-950": "#132335",
  "bg-teal-950": "#0B262F",
  "bg-purple-950": "#192135",
};
const INK = "#EAF6FA";

describe("TeamBadge marka renkleri (Fileönü)", () => {
  const names = ["Galatasaray", "Eczacıbaşı", "Fenerbahçe", "VakıfBank", "Beşiktaş", "THY", "Rastgele Spor Kulübü", "Ankara BŞB", "İzmir Bld", "Bursa X"];

  it.each(names)("%s: metin text-ink ve zemin kontrastı ≥ 4.5", (n) => {
    const p = getTeamColor(n);
    expect(p.text).toBe("text-ink");
    expect(BG[p.bg]).toBeDefined();
    expect(cr(INK, BG[p.bg])).toBeGreaterThanOrEqual(4.5);
  });

  it("kırmızı ve kehribar genel (hash) paletlerde kullanılmaz (anlam kuralı)", () => {
    for (let i = 0; i < 200; i++) {
      const p = getTeamColor(`Takım ${i} xq`);
      expect(p.border).not.toMatch(/red|rose|amber|yellow|orange/);
      expect(p.bg).not.toMatch(/red|rose|amber|yellow|orange/);
    }
  });

  it("marka takımlarının logosu kontrastlı açık plaka üzerinde çizilir", () => {
    render(<TeamBadge name="Galatasaray" logoUrl="/x.png" size="md" />);
    const img = screen.getByAltText("Galatasaray logosu");
    expect(img.parentElement!.className).toContain("bg-ink");
  });

  it("logosuz rozet kısaltmayı gösterir", () => {
    render(<TeamBadge name="Eczacıbaşı Spor" />);
    expect(screen.getByLabelText("Eczacıbaşı Spor rozeti")).toBeInTheDocument();
  });
});
