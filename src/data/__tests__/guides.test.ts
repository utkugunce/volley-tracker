import { describe, expect, it } from "vitest";
import {
  getAllGuides,
  getGuideBySlug,
  getFeaturedGuides,
  getGuidesByCategory,
  getRelatedGuides,
} from "../guides";

describe("Guide Data & Utility Tests", () => {
  const guides = getAllGuides();

  it("tüm rehber makaleleri tanımlıdır ve en az 5 rehber bulunur", () => {
    expect(guides.length).toBeGreaterThanOrEqual(5);
  });

  it("tüm rehber slug'ları benzersizdir, küçük harf ve URL güvenlidir", () => {
    const slugs = guides.map((g) => g.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);

    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("her rehberin başlığı, özeti, kategorisi ve en az 2 bölümü bulunur", () => {
    for (const guide of guides) {
      expect(guide.title.length).toBeGreaterThan(10);
      expect(guide.shortTitle.length).toBeGreaterThan(3);
      expect(guide.summary.length).toBeGreaterThan(20);
      expect(guide.sections.length).toBeGreaterThanOrEqual(2);
      expect(guide.keywords.length).toBeGreaterThanOrEqual(3);
      expect(guide.readTime).toMatch(/dk okuma/);
    }
  });

  it("getGuideBySlug geçerli slug için rehberi, geçersiz için undefined döner", () => {
    const valid = getGuideBySlug("puan-durumu-ve-averaj-hesaplama");
    expect(valid).toBeDefined();
    expect(valid?.slug).toBe("puan-durumu-ve-averaj-hesaplama");

    const invalid = getGuideBySlug("gecersiz-slug-12345");
    expect(invalid).toBeUndefined();
  });

  it("getFeaturedGuides yalnızca öne çıkan kılavuzları filtreler", () => {
    const featured = getFeaturedGuides();
    expect(featured.length).toBeGreaterThan(0);
    for (const f of featured) {
      expect(f.featured).toBe(true);
    }
  });

  it("getGuidesByCategory ilgili kategoriye ait kılavuzları listeler", () => {
    const rules = getGuidesByCategory("kurallar-statuler");
    expect(rules.length).toBeGreaterThan(0);
    for (const r of rules) {
      expect(r.categorySlug).toBe("kurallar-statuler");
    }
  });

  it("getRelatedGuides tanımlı ilişkili rehberleri getirir", () => {
    const related = getRelatedGuides("puan-durumu-ve-averaj-hesaplama");
    expect(related.length).toBeGreaterThan(0);
    for (const r of related) {
      expect(r.slug).not.toBe("puan-durumu-ve-averaj-hesaplama");
    }
  });

  it("geçersiz rehber slug'ı için getRelatedGuides boş dizi döner", () => {
    const related = getRelatedGuides("olmayan-makale");
    expect(related).toEqual([]);
  });
});
