import { describe, expect, it } from "vitest";
import { evaluateCityRoute, isAllowedCitySlug, splitPathname } from "@/utils/cityRouteGuard";
import { CITY_SLUGS, STATIC_ROOT_SEGMENTS } from "@/utils/citySlugs";
import { HIDDEN_CITY_SLUGS } from "@/utils/hiddenCities";

/**
 * P0-1 regresyon testleri: geçersiz/gizli il adresleri gerçek HTTP 404 almalı.
 *
 * Canlıda ölçülen eski davranış (proxy bekçisinden önce):
 *   /definitely-not-a-page-xyz -> 200  (X-Matched-Path: /[city], ISR'a yazılıyordu)
 *   /nigde, /usak, /kirikkale   -> 200  (HIDDEN_CITY_SLUGS'ta olmalarına rağmen)
 *   /sonuclar/xyz-gecersiz      -> 200
 * Sayfa içindeki notFound() doğru çalışıyordu ama loading.tsx kabuğu 200 ile
 * flush edildiği için status düzeltilemiyordu. Bekçi bu yüzden proxy.ts'te.
 */

const blocked = (pathname: string) => evaluateCityRoute(pathname);
const pass = (pathname: string) => evaluateCityRoute(pathname);

describe("splitPathname", () => {
  it("boş segmentleri eler", () => {
    expect(splitPathname("/")).toEqual([]);
    expect(splitPathname("/fikstur/istanbul")).toEqual(["fikstur", "istanbul"]);
    expect(splitPathname("//istanbul//")).toEqual(["istanbul"]);
  });
});

describe("isAllowedCitySlug", () => {
  it("tüm geçerli illeri kabul eder", () => {
    for (const slug of CITY_SLUGS) {
      expect(isAllowedCitySlug(slug), `${slug} reddedildi`).toBe(true);
    }
  });

  it("'all' takma adını kabul eder", () => {
    expect(isAllowedCitySlug("all")).toBe(true);
  });

  it("gizli illeri reddeder", () => {
    for (const hidden of HIDDEN_CITY_SLUGS) {
      expect(isAllowedCitySlug(hidden), `${hidden} kabul edildi`).toBe(false);
    }
  });

  it("uydurma slug'ları reddeder", () => {
    for (const bad of ["foobar", "definitely-not-a-page-xyz", "takim", "xyz-gecersiz", "istanbull"]) {
      expect(isAllowedCitySlug(bad), `${bad} kabul edildi`).toBe(false);
    }
  });

  it("Türkçe karakterli girdiyi slug'a indirger", () => {
    expect(isAllowedCitySlug("İstanbul")).toBe(true);
    expect(isAllowedCitySlug("ISTANBUL")).toBe(true);
    expect(isAllowedCitySlug("Şanlıurfa")).toBe(true);
  });

  it("boş girdi ve bozuk percent-encoding ile çökmez (fail-closed)", () => {
    expect(isAllowedCitySlug("")).toBe(false);
    expect(isAllowedCitySlug("%zz")).toBe(false);
    expect(isAllowedCitySlug("%C4%B0stanbul")).toBe(true); // encode edilmiş "İstanbul"
  });
});

describe("evaluateCityRoute — ENGELLENMELİ (gerçek 404)", () => {
  const cases: [string, string][] = [
    ["/definitely-not-a-page-xyz", "unknown-city"],
    ["/foobar-invalid-city", "unknown-city"],
    ["/takim", "unknown-city"], // kökünde page.tsx yok -> /[city]'e düşüyordu ("Takim Voleybol Fikstür...")
    ["/lig", "unknown-city"], // aynı gerekçe
    ["/api", "unknown-city"],
    ["/auth", "unknown-city"],
    ["/bayburt", "unknown-city"],
    ["/usak", "unknown-city"],
    ["/kirikkale", "unknown-city"],
    ["/sonuclar/xyz-gecersiz", "unknown-tab-city"],
    ["/fikstur/foobar", "unknown-tab-city"],
    ["/puan-durumu/bayburt", "unknown-tab-city"],
    ["/gunun-maclari/olmayan-il", "unknown-tab-city"],
    ["/grup-durumu/xyz", "unknown-tab-city"],
    ["/kulupler/olmayan-sehir-xyz", "unknown-tab-city"],
    ["/kulupler/olmayan-sehir/kadikoy", "unknown-tab-city"],
  ];

  it.each(cases)("%s -> blocked (%s)", (pathname, reason) => {
    const decision = blocked(pathname);
    expect(decision.blocked, `${pathname} engellenmedi`).toBe(true);
    expect(decision.reason).toBe(reason);
    expect(typeof decision.segment).toBe("string");
    expect(decision.segment!.length).toBeGreaterThan(0);
  });
});

describe("evaluateCityRoute — GEÇMELİ (dokunulmaz)", () => {
  const allowed = [
    "/",
    "/istanbul",
    "/ankara",
    "/izmir",
    "/all",
    "/404",
    // statik rotalar
    ...[...STATIC_ROOT_SEGMENTS].map((s) => `/${s}`),
    // dosyalar (nokta içeren tek segment)
    "/favicon.ico",
    "/icon.svg",
    "/apple-icon.svg",
    "/sw.js",
    "/manifest.json",
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
    "/offline.html",
    "/logo.png",
    // Next iç yolları
    "/_next/data/abc.json",
    "/_vercel/insights/view",
    // sekmelerin kök adresleri (şehirsiz)
    "/fikstur",
    "/sonuclar",
    "/puan-durumu",
    "/gunun-maclari",
    "/grup-durumu",
    "/kulupler",
    // geçerli {sekme}/{il}
    "/fikstur/istanbul",
    "/sonuclar/izmir",
    "/puan-durumu/ankara",
    "/gunun-maclari/bursa",
    "/grup-durumu/istanbul",
    "/nigde",
    "/fikstur/nigde",
    "/puan-durumu/nigde",
    "/kulupler/istanbul",
    "/kulupler/istanbul/kadikoy",
    "/kulupler/all",
    // kapsam dışı dinamik rotalar (kendi notFound()/noindex akışlarında bırakıldı)
    "/takim/vakifbank-u18-t19499",
    "/takim/vakifbank-u18-t19499/istanbul",
    "/lig/istanbul/genc-kizlar",
    "/kadinlar-2-ligi/puan-durumu",
    "/istatistikler/genc-kizlar",
    "/api/health",
    "/api/fixtures",
    "/api/nonexistent",
    "/panel",
    "/panel/basvurular",
    "/giris",
    "/auth/callback",
    "/a/b/c/d/e",
  ];

  it.each(allowed.map((p) => [p] as [string]))("%s -> geçer", (pathname) => {
    const decision = pass(pathname);
    expect(decision.blocked, `${pathname} yanlışlıkla engellendi (${decision.reason})`).toBe(false);
    expect(decision.reason).toBeUndefined();
  });

  it("Türkçe karakterli ve encode edilmiş il adresleri geçer", () => {
    expect(evaluateCityRoute("/%C4%B0stanbul").blocked).toBe(false);
    expect(evaluateCityRoute("/fikstur/%C4%B0stanbul").blocked).toBe(false);
  });
});

describe("evaluateCityRoute — kararlılık", () => {
  it("aynı girdi her zaman aynı kararı verir (saf fonksiyon)", () => {
    for (const p of ["/nigde", "/istanbul", "/sonuclar/xyz"]) {
      expect(evaluateCityRoute(p)).toEqual(evaluateCityRoute(p));
    }
  });

  it("uzun/bozuk girdilerde çökmez", () => {
    expect(() => evaluateCityRoute("/" + "a".repeat(5000))).not.toThrow();
    expect(() => evaluateCityRoute("/%E0%A4%A")).not.toThrow();
    expect(evaluateCityRoute("/" + "a".repeat(5000)).blocked).toBe(true);
  });
});
