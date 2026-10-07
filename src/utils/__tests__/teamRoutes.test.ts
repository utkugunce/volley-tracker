import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { teamPagePath } from "../teamRoutes";

describe("teamPagePath", () => {
  it("il verilmezse /takim/<slug>", () => {
    expect(teamPagePath("eczacibasi-u18")).toBe("/takim/eczacibasi-u18");
    expect(teamPagePath("eczacibasi-u18", "")).toBe("/takim/eczacibasi-u18");
    expect(teamPagePath("eczacibasi-u18", null)).toBe("/takim/eczacibasi-u18");
  });

  it("il verilirse rewrite gerektirmeyen kanonik /takim/<slug>/<il> yolunu üretir (Türkçe karakterler normalize edilir)", () => {
    expect(teamPagePath("eczacibasi-u18", "İstanbul")).toBe("/takim/eczacibasi-u18/istanbul");
    expect(teamPagePath("istek-afyon-spor-kulubu", "Afyonkarahisar")).toBe("/takim/istek-afyon-spor-kulubu/afyonkarahisar");
    expect(teamPagePath("x", "Kahramanmaraş")).toBe("/takim/x/kahramanmaras");
    expect(teamPagePath("x", "ankara")).toBe("/takim/x/ankara");
  });

  it("asla ?sehir= / ?city= sorgu parametresi üretmez", () => {
    expect(teamPagePath("x", "İzmir")).not.toMatch(/[?&](sehir|city)=/);
  });
});

/**
 * Gerileme koruması: site içi bağlantılar rewrite edilen `/takim/<slug>?sehir=` biçimini kullanırsa
 * Next.js istemci yönlendiricisi Vercel'de bu adresleri sonsuz döngüde önceden getiriyor (saniyede ~900 istek,
 * tüm tarayıcıyı kilitleyen yavaşlama). Kaynakta bu biçimde adres üreten kod kalmamalı.
 */
describe("site içi takım bağlantıları", () => {
  const SRC = path.resolve(__dirname, "../..");
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "__tests__" || entry.name === "api") continue;
        walk(full);
      } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        files.push(full);
      }
    }
  };
  walk(SRC);

  it("hiçbir bileşen/yardımcı /takim/... adresine ?sehir= veya ?city= eklemez", () => {
    const offenders: string[] = [];
    // `?sehir=` yalnızca takım sayfası rewrite'ında kullanılır; `?city=` ise /takim/ ile birlikte yakalanır
    // (ör. /api/group-status?city= gibi API istekleri serbesttir).
    const pattern = /\/takim\/[^"'\s]*\?(sehir|city)=|[?&]sehir=/;
    for (const file of files) {
      const lines = fs.readFileSync(file, "utf-8").split("\n");
      lines.forEach((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) return; // yorumlar
        if (pattern.test(line)) offenders.push(`${path.relative(SRC, file)}:${i + 1}: ${trimmed}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});
