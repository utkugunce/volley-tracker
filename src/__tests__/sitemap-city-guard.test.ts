import { describe, it, expect } from "vitest";
import sitemap from "../app/sitemap";
import { HIDDEN_CITY_SLUGS } from "../utils/hiddenCities";
import { isAllowedCitySlug } from "../utils/cityRouteGuard";

describe("Sitemap & Şehir Allowlist Tutarlılığı (Görev 5c)", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("sitemap çıktısında hiçbir gizli il (nigde, usak, kirikkale) yer almamalıdır", () => {
    for (const hidden of HIDDEN_CITY_SLUGS) {
      const matchingUrls = urls.filter((url) => {
        const pathSegments = new URL(url).pathname.split("/").filter(Boolean);
        return pathSegments.includes(hidden);
      });
      expect(
        matchingUrls,
        `Sitemap içinde gizli şehir '${hidden}' bulundu: ${matchingUrls.join(", ")}`
      ).toEqual([]);
    }
  });

  it("sitemap içindeki tüm şehir sayfaları isAllowedCitySlug allowlist'inde geçerli olmalıdır", () => {
    const tabPrefixes = ["puan-durumu", "grup-durumu", "fikstur", "sonuclar", "gunun-maclari"];
    for (const url of urls) {
      const pathname = new URL(url).pathname;
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length === 2 && tabPrefixes.includes(segments[0])) {
        const citySlug = segments[1];
        expect(isAllowedCitySlug(citySlug), `Geçersiz şehir slug'ı sitemap'te: ${citySlug}`).toBe(true);
      }
    }
  });
});
