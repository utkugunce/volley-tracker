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

  it("şehir / ana sekme sayfaları 86400 sn (24 saat)", () => {
    for (const f of cityAndMain) expectRevalidate(f, 86400);
  });

  it("lig sayfaları 86400 sn (24 saat)", () => {
    for (const f of league) expectRevalidate(f, 86400);
  });

  it("takım / istatistik / takvim 86400 sn (24 saat)", () => {
    for (const f of longLived) expectRevalidate(f, 86400);
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

// Kaynak ağacı bir kez taranır; dosya içerikleri önbelleğe alınır (yük altında zaman aşımını önler).
let sourceCache: Map<string, string> | null = null;
function sourceFiles(): Map<string, string> {
  if (!sourceCache) {
    sourceCache = new Map(listSourceFiles("src").map((f) => [f, read(f)]));
  }
  return sourceCache;
}

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      out.push(...listSourceFiles(rel));
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

describe("Vercel kota — Image Optimization dönüşümü üretilmez", () => {
  it("kaynak kodda next/image kullanılmaz", () => {
    const offenders = [...sourceFiles()]
      .filter(([, src]) => /from\s+["']next\/(legacy\/)?image["']/.test(src))
      .map(([f]) => f);
    expect(offenders).toEqual([]);
  }, 30_000);
});

describe("Vercel kota — Link prefetch kapalı", () => {
  // Görünüm alanına giren her <Link>, üretilmemiş ISR sayfasının (ör. 2400+ /takim/* sayfası)
  // arka planda üretilip ISR önbelleğine yazılmasına yol açar. Tüm Link'ler açıkça prefetch={false} kullanır.
  it("her next/link <Link> öğesi prefetch prop'u taşır", () => {
    const offenders: string[] = [];
    for (const [f, src] of sourceFiles()) {
      if (!f.endsWith(".tsx")) continue;
      const imp = src.match(/import\s+(\w+)\s+from\s+["']next\/link["']/);
      if (!imp) continue;
      const tag = imp[1];
      const re = new RegExp(`<${tag}(?![\\w.])([^>]*?)>`, "gs");
      for (const m of src.matchAll(re)) {
        if (!/\bprefetch=/.test(m[1]) && !/\{\s*\.\.\./.test(m[1])) {
          offenders.push(`${f}: ${m[0].slice(0, 80)}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  }, 30_000);
});

describe("Vercel kota — deploy ve önbellek çıktısı", () => {
  it("vercel.json uygulama dışı değişikliklerde derlemeyi atlar", () => {
    const cfg = JSON.parse(read("vercel.json"));
    expect(cfg.ignoreCommand).toBe("bash scripts/vercel-ignore-build.sh");
    expect(fs.existsSync(path.join(ROOT, "scripts/vercel-ignore-build.sh"))).toBe(true);
  });

  it("scrape workflow'u data commit'lerini (deploy'ları) seyreltir", () => {
    const wf = read(".github/workflows/scrape-sync.yml");
    expect(wf).toMatch(/DATA_COMMIT_MIN_INTERVAL_HOURS/);
  });

  it("Kadınlar 2. Ligi sayfaları sıkıştırılmış veri gönderir", () => {
    for (const f of ["src/app/kadinlar-2-ligi/page.tsx", "src/app/kadinlar-2-ligi/[...slug]/page.tsx"]) {
      expect(read(f), f).toMatch(/compactKadinlar2LigData\(getKadinlar2LigData\(\)\)/);
    }
  });

  it("sitemap lastModified derleme zamanı değil veri zamanıdır", () => {
    expect(read("src/app/sitemap.ts")).not.toMatch(/new Date\(\)/);
  });
});
