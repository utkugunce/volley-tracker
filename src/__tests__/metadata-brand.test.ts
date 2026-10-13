import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

/**
 * P0-2 regresyon testi: `<title>` içinde marka eki İKİ KEZ geçmemeli.
 *
 * Kök şablon (src/app/layout.tsx) zaten "%s | Altyapı Voleybol" ekini uyguluyor.
 * Sayfa metadata'ları başlığa bir kez daha "— Altyapı Voleybol" gömdüğünde canlıda
 * şu çıkıyordu:
 *   "İstanbul Voleybol Fikstürü ve Maç Takvimi — Altyapı Voleybol | Altyapı Voleybol"
 *
 * Bu test, projenin diğer kaynak-tarayıcı bekçileri (isr-kota.test.ts,
 * no-silent-fallbacks.test.tsx) ile aynı üslupta: tüm page.tsx dosyalarını okur,
 * DOKÜMAN başlığı atamalarını bulur ve marka eki içermediklerini doğrular.
 *
 * Not: `openGraph.title` ve `twitter.title` şablondan etkilenmez, bu yüzden
 * bu test onları bilinçli olarak taramaz.
 */

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, "src", "app");

/** Marka ekini kök layout'tan oku; şablon değişirse test otomatik uyum sağlar. */
function readTitleTemplate(): { prefix: string; suffix: string } {
  const src = fs.readFileSync(path.join(APP_DIR, "layout.tsx"), "utf-8");
  const m = src.match(/template:\s*["'`]([^"'`]*)["'`]/);
  expect(m, "layout.tsx içinde title.template bulunamadı").not.toBeNull();
  const parts = m![1].split("%s");
  expect(parts.length, "title.template '%s' içermiyor").toBe(2);
  return { prefix: parts[0].trim(), suffix: parts[1].trim() };
}

function listPageFiles(dir: string = APP_DIR): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "__tests__" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listPageFiles(full));
    else if (entry.name === "page.tsx") out.push(full);
  }
  return out;
}

/** `openGraph: {...}` / `twitter: {...}` bloklarını (iç içe olsa da) söker. */
function stripSocialBlocks(src: string, keys: string[]): string {
  let out = src;
  for (const key of keys) {
    let idx = out.indexOf(`${key}:`);
    while (idx !== -1) {
      const open = out.indexOf("{", idx);
      if (open === -1) break;
      let depth = 0;
      let close = -1;
      for (let i = open; i < out.length; i++) {
        if (out[i] === "{") depth++;
        else if (out[i] === "}") {
          depth--;
          if (depth === 0) {
            close = i;
            break;
          }
        }
      }
      if (close === -1) break;
      out = out.slice(0, idx) + out.slice(close + 1);
      idx = out.indexOf(`${key}:`);
    }
  }
  return out;
}

/** Doküman başlığı atamalarını toplar: `title: "..."`, `const title = ...`, `title = ...` */
function findTitleAssignments(src: string): { line: number; text: string }[] {
  const found: { line: number; text: string }[] = [];
  const lines = src.split("\n");
  const re = /^\s*(?:(?:export\s+)?(?:const|let|var)\s+title\s*=|title\s*:)\s*(.+)$/;
  lines.forEach((raw, i) => {
    const m = raw.match(re);
    if (m) found.push({ line: i + 1, text: m[1].trim() });
  });
  return found;
}

/**
 * Marka ekini meşru şekilde taşıyabilen dosyalar: başlığı `title: { absolute }`
 * ile verenler (şablon uygulanmaz). İstisnanın çürümemesi için dosyada gerçekten
 * `absolute` kullanıldığı da doğrulanır.
 */
const ABSOLUTE_TITLE_EXCEPTIONS = new Set(["src/app/page.tsx"]);

describe("metadata — <title> içinde marka eki çift geçmemeli", () => {
  const { prefix, suffix } = readTitleTemplate();
  const pageFiles = listPageFiles().map((f) => path.relative(ROOT, f).split(path.sep).join("/"));

  it("kök layout bir title.template tanımlıyor (testin ön koşulu)", () => {
    expect(suffix.length).toBeGreaterThan(0);
    expect(pageFiles.length).toBeGreaterThan(20);
  });

  it("hiçbir doküman başlığı marka ekini içermez", () => {
    const violations: string[] = [];

    for (const rel of pageFiles) {
      const raw = fs.readFileSync(path.join(ROOT, rel), "utf-8");

      if (ABSOLUTE_TITLE_EXCEPTIONS.has(rel)) {
        expect(raw, `${rel} istisnası çürümüş: 'absolute' kullanılmıyor`).toContain("absolute");
        continue;
      }

      const scan = stripSocialBlocks(raw, ["openGraph", "twitter"]);
      for (const assignment of findTitleAssignments(scan)) {
        const hitsBrand =
          (suffix && assignment.text.includes(suffix)) ||
          (prefix && assignment.text.includes(prefix));
        if (hitsBrand) violations.push(`${rel}:${assignment.line} -> ${assignment.text.slice(0, 96)}`);
      }
    }

    expect(
      violations,
      [
        "Aşağıdaki başlıklar marka ekini kendisi de ekliyor; layout.tsx'teki",
        `template ("%s | ${suffix}") ile birleşince başlıkta ÇİFT marka oluşur.`,
        "Eki başlıktan silin ya da title: { absolute: ... } kullanın.",
        ...violations,
      ].join("\n"),
    ).toEqual([]);
  });

  it("istisna listesi yalnızca gerçekten absolute kullanan dosyaları içerir", () => {
    for (const rel of ABSOLUTE_TITLE_EXCEPTIONS) {
      const raw = fs.readFileSync(path.join(ROOT, rel), "utf-8");
      expect(raw).toMatch(/title:\s*\{\s*absolute/);
    }
  });

  it("404 rotası da absolute başlık kullanır (şablonla '404 | ...' olmasın)", () => {
    const raw = fs.readFileSync(path.join(APP_DIR, "404", "page.tsx"), "utf-8");
    expect(raw).toMatch(/title:\s*\{\s*absolute/);
    expect(raw).toMatch(/robots:\s*\{[^}]*index:\s*false/);
  });
});
