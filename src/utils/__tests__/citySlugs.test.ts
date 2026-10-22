import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import {
  CITY_ALIAS_SLUGS,
  CITY_SLUGS,
  CITY_SLUG_SET,
  CITY_TAB_SEGMENTS,
  STATIC_ROOT_SEGMENTS,
} from "@/utils/citySlugs";
import { HIDDEN_CITY_SLUGS } from "@/utils/hiddenCities";

/**
 * citySlugs.ts OTOMATİK ÜRETİLEN bir allowlist'tir (scripts/generate_city_slugs.py).
 * Bu testler, data/cities.json veya src/app rota yapısı değiştiğinde listenin
 * sessizce bayatlamasını engeller — bayatlarsa ya geçerli bir il 404 yer ya da
 * geçersiz bir adres 200 döner.
 *
 * Yeniden üretmek için: python scripts/generate_city_slugs.py
 */

const ROOT = process.cwd();

function readCitiesJson(): { slug: string }[] {
  const raw = fs.readFileSync(path.join(ROOT, "data", "cities.json"), "utf-8");
  const parsed = JSON.parse(raw) as { cities?: { slug?: string }[] };
  expect(Array.isArray(parsed.cities), "data/cities.json içinde 'cities' dizisi yok").toBe(true);
  return parsed.cities!.filter((c): c is { slug: string } => typeof c.slug === "string");
}

/**
 * src/app altındaki statik rota dizinleri.
 *
 * `routableOnly: true` ise yalnızca kökünde page.tsx/route.ts olanlar sayılır.
 * Bu ayrım önemli: örn. `src/app/takim/` sadece `[slug]/` içerir, yani `/takim`
 * aslında `/[city]`'e düşer ve bir şehir slug'ı gibi doğrulanmalıdır.
 */
function readDirNames(rel: string, routableOnly = false): string[] {
  const base = path.join(ROOT, rel);
  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("[") && !e.name.startsWith("__"))
    .filter(
      (e) =>
        !routableOnly ||
        fs.existsSync(path.join(base, e.name, "page.tsx")) ||
        fs.existsSync(path.join(base, e.name, "route.ts")),
    )
    .map((e) => e.name);
}

describe("citySlugs — data/cities.json senkronizasyonu", () => {
  const cities = readCitiesJson();
  const expected = cities
    .map((c) => c.slug.toLowerCase())
    .filter((slug) => !HIDDEN_CITY_SLUGS.has(slug))
    .sort();

  it("81 ilin tamamı data/cities.json'da mevcut", () => {
    expect(cities.length).toBe(81);
  });

  it("allowlist, gizli iller hariç tüm illeri birebir içerir (bayat değil)", () => {
    expect([...CITY_SLUGS].sort()).toEqual(expected);
    expect([...CITY_SLUGS].sort()).toEqual([...CITY_SLUG_SET].sort());
  });

  it("gizli iller allowlist'te YOK — /usak, /kirikkale gerçek 404 dönmeli", () => {
    for (const hidden of HIDDEN_CITY_SLUGS) {
      expect(CITY_SLUG_SET.has(hidden), `${hidden} allowlist'e sızmış`).toBe(false);
    }
    expect(CITY_SLUG_SET.has("istanbul")).toBe(true);
  });

  it("tüm slug'lar URL-güvenli ([a-z0-9-]) ve benzersiz", () => {
    for (const slug of CITY_SLUGS) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
    expect(new Set(CITY_SLUGS).size).toBe(CITY_SLUGS.length);
  });

  it("hiddenCities.ts ile citySlugs üreticisi çelişmiyor", () => {
    // generate_city_slugs.py içindeki HIDDEN_CITY_SLUGS sabiti bu modülle aynı olmalı.
    const generator = fs.readFileSync(
      path.join(ROOT, "scripts", "generate_city_slugs.py"),
      "utf-8",
    );
    for (const hidden of HIDDEN_CITY_SLUGS) {
      expect(generator, `generate_city_slugs.py '${hidden}' içermiyor`).toContain(`"${hidden}"`);
    }
  });

  it("'all' takma adı geçerli kabul ediliyor", () => {
    expect(CITY_ALIAS_SLUGS).toContain("all");
  });
});

describe("citySlugs — rota yapısı senkronizasyonu", () => {
  it("STATIC_ROOT_SEGMENTS, src/app altındaki yönlendirilebilir statik rotalarla birebir aynı", () => {
    const dirs = readDirNames("src/app", true);
    expect([...STATIC_ROOT_SEGMENTS].sort()).toEqual(dirs.sort());
  });

  it("kökünde page.tsx olmayan dizinler statik rota sayılmaz (/[city]'e düşerler)", () => {
    // /takim ve /lig kökünde page.tsx yok; bunlar şehir slug'ı gibi 404'lenmeli.
    const allDirs = readDirNames("src/app");
    const routable = new Set(readDirNames("src/app", true));
    const nonRoutable = allDirs.filter((d) => !routable.has(d));
    expect(nonRoutable.length).toBeGreaterThan(0);
    for (const dir of nonRoutable) {
      expect(STATIC_ROOT_SEGMENTS.has(dir), `/${dir} statik rota DEĞİL ama listeye girmiş`).toBe(false);
    }
  });

  it("proxy.ts'in rewrite hedefi olan /404 statik segment olarak kayıtlı", () => {
    expect(STATIC_ROOT_SEGMENTS.has("404")).toBe(true);
    expect(fs.existsSync(path.join(ROOT, "src/app/404/page.tsx"))).toBe(true);
  });

  it("CITY_TAB_SEGMENTS, gerçekten [city] alt rotası olan sekmelerle birebir aynı", () => {
    const tabs = readDirNames("src/app").filter((dir) =>
      fs.existsSync(path.join(ROOT, "src/app", dir, "[city]")),
    );
    expect([...CITY_TAB_SEGMENTS].sort()).toEqual(tabs.sort());
  });

  it("üretilen dosya uyarı başlığını ve üretici script referansını korur", () => {
    const source = fs.readFileSync(path.join(ROOT, "src/utils/citySlugs.ts"), "utf-8");
    expect(source).toContain("OTOMATİK ÜRETİLİR");
    expect(source).toContain("scripts/generate_city_slugs.py");
  });
});
