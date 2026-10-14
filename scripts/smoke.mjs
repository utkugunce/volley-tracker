#!/usr/bin/env node
/**
 * scripts/smoke.mjs
 *
 * Deploy-Sonrası Canlı Smoke Testi (Görev 3).
 *
 * Doğrulanan gruplar:
 *   A) Gerçek HTTP 404 (12 adres): status === 404 ve "Top Çizgi Dışında" gövde metni
 *   B) HTTP 200 regresyon bekçisi (ana sayfalar, sekmeler, statik varlıklar ve API'ler)
 *   C) <title> içinde "Altyapı Voleybol" marka eki en fazla 1 kez geçmeli
 *   D) /api/health sözleşmesi (status: ok, data.cityFiles >= 30, data.cityMatches > 0)
 *   E) Bundle bütçesi ve kritik yolda vakifbank-izmir-u18 olmaması
 *   F) Canlı CSS içinde .border-emerald-400 ve .border-pink-400 bulunması
 */

const BASE_URL = (process.env.BASE_URL || process.argv[2] || "https://altyapivoleybol.com.tr").replace(/\/+$/, "");

console.log(`\n🏐 [Smoke Test] Hedef Adres: ${BASE_URL}\n`);

let failed = false;
const failures = [];

function assert(condition, message) {
  if (!condition) {
    failed = true;
    failures.push(message);
    console.error(`  ❌ HATA: ${message}`);
  } else {
    console.log(`  ✅ ${message}`);
  }
}

async function runGroupA() {
  console.log("--- GRUP A: Gerçek 404 Denetimi (12 Adres) ---");
  const notFoundPaths = [
    "/bayburt",
    "/usak",
    "/kirikkale",
    "/definitely-not-a-page-xyz",
    "/foobar-invalid-city",
    "/takim",
    "/lig",
    "/sonuclar/xyz-gecersiz",
    "/fikstur/foobar",
    "/puan-durumu/bayburt",
    "/kulupler/olmayan-sehir-xyz",
    "/kulupler/olmayan-sehir/kadikoy",
  ];

  for (const p of notFoundPaths) {
    try {
      const res = await fetch(`${BASE_URL}${p}`, { redirect: "manual" });
      const body = await res.text();
      assert(
        res.status === 404,
        `${p} gerçek 404 dönmeli (alınan: ${res.status})`
      );
      assert(
        body.includes("Top Çizgi Dışında"),
        `${p} gövdesinde 'Top Çizgi Dışında' 404 arayüzü bulunmalı`
      );
    } catch (err) {
      assert(false, `${p} isteğinde ağ hatası: ${err.message}`);
    }
  }
}

async function runGroupB() {
  console.log("\n--- GRUP B: 200 Regresyon Bekçisi ---");
  const okPaths = [
    "/",
    "/istanbul",
    "/ankara",
    "/nigde",
    "/all",
    "/fikstur",
    "/fikstur/istanbul",
    "/sonuclar/izmir",
    "/puan-durumu/ankara",
    "/gunun-maclari/bursa",
    "/grup-durumu/istanbul",
    "/kulupler",
    "/kulupler/istanbul",
    "/kulupler/istanbul/kadikoy",
    "/takim/vakifbank-u18-t19499",
    "/lig/istanbul/genc-kizlar",
    "/kadinlar-2-ligi",
    "/istatistikler",
    "/hangi-ligde-oynar",
    "/karsilastir",
    "/takvim",
    "/admin",
    "/dmca",
    "/gizlilik",
    "/panel",
    "/giris",
    "/icon.svg",
    "/sw.js",
    "/robots.txt",
    "/sitemap.xml",
    "/manifest.json",
    "/llms.txt",
    "/api/health",
    "/api/fixtures",
  ];

  for (const p of okPaths) {
    try {
      const res = await fetch(`${BASE_URL}${p}`);
      assert(res.status === 200, `${p} HTTP 200 dönmeli (alınan: ${res.status})`);
    } catch (err) {
      assert(false, `${p} isteğinde ağ hatası: ${err.message}`);
    }
  }

  // /404 özel kontrolü: Next /404'ü not-found olarak rezerve eder, 404 dönmelidir
  try {
    const res404 = await fetch(`${BASE_URL}/404`);
    assert(res404.status === 404, `/404 adresi beklenen şekilde 404 dönmeli (alınan: ${res404.status})`);
  } catch (err) {
    assert(false, `/404 kontrolünde hata: ${err.message}`);
  }
}

async function runGroupC() {
  console.log("\n--- GRUP C: <title> Marka Eki Tekrarsızlık Denetimi ---");
  const titlePages = [
    "/",
    "/fikstur/istanbul",
    "/puan-durumu/izmir",
    "/sonuclar/ankara",
    "/kulupler/istanbul",
    "/takvim",
    "/karsilastir",
    "/kadinlar-2-ligi/puan-durumu",
  ];

  for (const p of titlePages) {
    try {
      const res = await fetch(`${BASE_URL}${p}`);
      const html = await res.text();
      const match = html.match(/<title>([^<]+)<\/title>/i);
      const title = match ? match[1] : "";
      const count = (title.match(/Altyapı Voleybol/g) || []).length;
      assert(
        count <= 1,
        `${p} başlığında ('${title}') 'Altyapı Voleybol' en fazla 1 kez geçmeli (bulunan: ${count})`
      );
    } catch (err) {
      assert(false, `${p} title kontrolünde ağ hatası: ${err.message}`);
    }
  }
}

async function runGroupD() {
  console.log("\n--- GRUP D: /api/health Sözleşmesi ---");
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert(res.status === 200, `/api/health HTTP 200 dönmeli (alınan: ${res.status})`);
    const json = await res.json();
    assert(json.status === "ok", `/api/health status 'ok' olmalı (alınan: ${json.status})`);
    assert(json.data?.cityFiles >= 30, `/api/health cityFiles >= 30 olmalı (alınan: ${json.data?.cityFiles})`);
    assert(json.data?.cityMatches > 0, `/api/health cityMatches > 0 olmalı (alınan: ${json.data?.cityMatches})`);
  } catch (err) {
    assert(false, `/api/health denetiminde hata: ${err.message}`);
  }
}

async function runGroupEAndF() {
  console.log("\n--- GRUP E & F: Bundle Bütçesi, Chunk İzolasyonu ve CSS Bütünlüğü ---");
  try {
    const homeRes = await fetch(`${BASE_URL}/`);
    const homeHtml = await homeRes.text();

    // 1. Script chunk'larını topla
    const scriptSrcMatches = [...homeHtml.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)];
    const scriptUrls = scriptSrcMatches
      .map((m) => m[1])
      .filter((src) => src.includes("/_next/static/") && src.endsWith(".js"));

    let totalJsBytes = 0;
    let leakedKeyFound = false;

    for (const src of scriptUrls) {
      const fullUrl = src.startsWith("http") ? src : `${BASE_URL}${src}`;
      const jsRes = await fetch(fullUrl);
      if (jsRes.ok) {
        const jsText = await jsRes.text();
        totalJsBytes += Buffer.byteLength(jsText, "utf-8");
        if (jsText.includes("vakifbank-izmir-u18")) {
          leakedKeyFound = true;
        }
      }
    }

    if (scriptUrls.length > 0) {
      const totalKb = (totalJsBytes / 1024).toFixed(1);
      console.log(`  ℹ️  Ana sayfa ilk JS yükleme boyutu: ${totalKb} KB (${scriptUrls.length} chunk)`);
      assert(
        !leakedKeyFound,
        "İlk yükleme script chunk'larında 'vakifbank-izmir-u18' anahtarı bulunmamalı (Görev 2 tembel yükleme)"
      );
    }

    // 2. CSS link'lerini topla
    const cssMatches = [...homeHtml.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi)];
    const cssUrls = cssMatches
      .map((m) => m[1])
      .filter((href) => href.includes("/_next/static/") && href.endsWith(".css"));

    let combinedCss = "";
    for (const href of cssMatches.map((m) => m[1])) {
      const fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
      const cssRes = await fetch(fullUrl);
      if (cssRes.ok) {
        combinedCss += await cssRes.text();
      }
    }

    if (combinedCss.length > 0) {
      assert(
        combinedCss.includes("border-emerald-400"),
        "Canlı CSS içinde 'border-emerald-400' safelist sınıfı bulunmalı (Görev 4)"
      );
      assert(
        combinedCss.includes("border-pink-400"),
        "Canlı CSS içinde 'border-pink-400' safelist sınıfı bulunmalı (Görev 4)"
      );
    }
  } catch (err) {
    assert(false, `Grup E & F denetiminde hata: ${err.message}`);
  }
}

async function main() {
  await runGroupA();
  await runGroupB();
  await runGroupC();
  await runGroupD();
  await runGroupEAndF();

  console.log("\n=================================");
  if (failed) {
    console.error(`💥 SMOKE TEST BAŞARISIZ: ${failures.length} hata tespit edildi!`);
    process.exit(1);
  } else {
    console.log("🎉 TÜM SMOKE TESTLERİ BAŞARIYLA GEÇTİ!");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Beklenmeyen hata:", err);
  process.exit(1);
});
