import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Vercel ücretsiz plan ISR / Image Optimization kotası için sabitler.
 * Bu testler kaynak dosyalardaki export değerlerini doğrular; yanlışlıkla
 * eski kısa revalidate veya dolu generateStaticParams geri gelmesin.
 */

const ROOT = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf-8");
}

function expectRevalidate(rel: string, value: number) {
  const src = read(rel);
  const m = src.match(/export const revalidate = (\d+)/);
  expect(m, `${rel} revalidate export eksik`).not.toBeNull();
  expect(Number(m![1]), rel).toBe(value);
}

function expectEmptyStaticParams(rel: string) {
  const src = read(rel);
  const m = src.match(
    /export function generateStaticParams\(\)\s*\{([\s\S]*?)\}/,
  );
  expect(m, `${rel} generateStaticParams eksik`).not.toBeNull();
  const body = m![1];
  expect(body, rel).toMatch(/return\s*\[\s*\]/);
  // Eski şehir/lig ön-üretim listesi geri gelmesin
  expect(body).not.toMatch(/getAllCitiesList/);
  expect(body).not.toMatch(/readdirSync/);
}

describe("Vercel kota — ISR revalidate süreleri", () => {
  const cityAndMain = [
    "src/app/page.tsx",
    "src/app/[city]/page.tsx",
    "src/app/fikstur/page.tsx",
    "src/app/fikstur/[city]/page.tsx",
    "src/app/puan-durumu/page.tsx",
    "src/app/puan-durumu/[city]/page.tsx",
    "src/app/sonuclar/page.tsx",
    "src/app/sonuclar/[city]/page.tsx",
    "src/app/gunun-maclari/page.tsx",
    "src/app/gunun-maclari/[city]/page.tsx",
    "src/app/grup-durumu/page.tsx",
    "src/app/grup-durumu/[city]/page.tsx",
  ];

  const league = [
    "src/app/lig/[...slug]/page.tsx",
    "src/app/kadinlar-2-ligi/page.tsx",
    "src/app/kadinlar-2-ligi/[...slug]/page.tsx",
  ];

  const longLived = [
    "src/app/takim/[slug]/page.tsx",
    "src/app/takim/[slug]/[city]/page.tsx",
    "src/app/istatistikler/page.tsx",
    "src/app/istatistikler/[kategori]/page.tsx",
    "src/app/takvim/page.tsx",
  ];

  it("şehir / ana sekme sayfaları 3600 sn (1 saat)", () => {
    for (const f of cityAndMain) expectRevalidate(f, 3600);
  });

  it("lig sayfaları 1800 sn (30 dk)", () => {
    for (const f of league) expectRevalidate(f, 1800);
  });

  it("takım / istatistik / takvim 3600 sn (1 saat)", () => {
    for (const f of longLived) expectRevalidate(f, 3600);
  });
});

describe("Vercel kota — on-demand ISR (boş generateStaticParams)", () => {
  const onDemand = [
    "src/app/[city]/page.tsx",
    "src/app/fikstur/[city]/page.tsx",
    "src/app/puan-durumu/[city]/page.tsx",
    "src/app/sonuclar/[city]/page.tsx",
    "src/app/gunun-maclari/[city]/page.tsx",
    "src/app/grup-durumu/[city]/page.tsx",
    "src/app/lig/[...slug]/page.tsx",
    "src/app/takim/[slug]/page.tsx",
    "src/app/takim/[slug]/[city]/page.tsx",
  ];

  it("yüksek kardinaliteli rotalar derlemede ön-üretilmez", () => {
    for (const f of onDemand) expectEmptyStaticParams(f);
  });
});

describe("Vercel kota — Image Optimization kapalı", () => {
  it("next.config images.unoptimized true", () => {
    const src = read("next.config.mjs");
    expect(src).toMatch(/images:\s*\{[\s\S]*?unoptimized:\s*true/);
  });
});
