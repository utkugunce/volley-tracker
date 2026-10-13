import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Vercel Hobby 10 GB Deployment Storage kotası bekçisi (PR #38 / Görev 1).
 *
 * `data/` klasörünün (~8,9 MB) tamamı her fonksiyona kopyalanmamalıdır.
 * `next.config.mjs` içindeki outputFileTracing kuralları yanlışlıkla gevşetilirse
 * deploy başına izlenen dosya boyutu 594 MB'a fırlar ve storage kotası taşar.
 */

const ROOT = process.cwd();

describe("Vercel kota — Deployment Storage ve outputFileTracing (Görev 1 / PR #38)", () => {
  const nextConfigSrc = fs.readFileSync(path.join(ROOT, "next.config.mjs"), "utf-8");

  it("global outputFileTracingIncludes './data/**/*' genel glob'unu içermemelidir", () => {
    // Eski tehlikeli kural: "/**/*": ["./data/**/*"] veya "/api/**/*": ["./data/**/*"]
    expect(nextConfigSrc).not.toMatch(/["']\/\*\*\/\*["']\s*:\s*\[\s*["']\.\/data\/\*\*\/\*["']\s*\]/);
    expect(nextConfigSrc).not.toMatch(/["']\/api\/\*\*\/\*["']\s*:\s*\[\s*["']\.\/data\/\*\*\/\*["']\s*\]/);
  });

  it("team-rosters.json yalnızca /takim rotalarında include edilmelidir", () => {
    expect(nextConfigSrc).toMatch(/["']\/takim\/\*\*\/\*["']\s*:\s*\[\s*["']\.\/data\/team-rosters\.json["']\s*\]/);
  });

  it("outputFileTracingExcludes içinde './data/raw/**/*' yer almalıdır", () => {
    expect(nextConfigSrc).toMatch(/["']\/\*\*\/\*["']\s*:\s*\[\s*["']\.\/data\/raw\/\*\*\/\*["']\s*\]/);
  });

  it("team-rosters.json gereksiz rotalardan açıkça exclude edilmelidir", () => {
    const requiredExcludes = [
      "/api/club/teams",
      "/api/health",
      "/istatistikler",
      "/karsilastir",
      "/kulupler",
      "/sitemap.xml",
    ];

    for (const route of requiredExcludes) {
      expect(nextConfigSrc).toContain(`"${route}"`);
      expect(nextConfigSrc).toContain('"./data/team-rosters.json"');
    }
  });
});
