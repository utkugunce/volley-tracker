import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
  nextThemePreference,
  parseThemePreference,
  resolveTheme,
} from "../theme";
import { PALETTES, SEMANTIC_TOKENS, SHADES, buildThemeVarsCss, hexToChannels, lightShade } from "../palettes";

describe("tema tercihi mantığı", () => {
  it("geçersiz değerler 'system' olur", () => {
    expect(parseThemePreference(null)).toBe("system");
    expect(parseThemePreference("blue")).toBe("system");
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
  });

  it("sistem tercihi sistem temasını izler, açık/koyu seçimi ezer", () => {
    expect(resolveTheme("system", true)).toBe("light");
    expect(resolveTheme("system", false)).toBe("dark");
    expect(resolveTheme("light", false)).toBe("light");
    expect(resolveTheme("dark", true)).toBe("dark");
  });

  it("düğme sistem → açık → koyu → sistem döngüsünde ilerler", () => {
    expect(nextThemePreference("system")).toBe("light");
    expect(nextThemePreference("light")).toBe("dark");
    expect(nextThemePreference("dark")).toBe("system");
  });
});

describe("yanıp sönmeyi önleyen başlangıç betiği", () => {
  const run = (stored: string | null, systemLight: boolean, lang: string | null = null) => {
    const attrs: Record<string, string> = {};
    const doc = { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } };
    const win = {
      localStorage: { getItem: (k: string) => (k === THEME_STORAGE_KEY ? stored : k === "av-lang" ? lang : null) },
      matchMedia: () => ({ matches: systemLight }),
    };
    new Function("document", "window", "localStorage", THEME_INIT_SCRIPT.replace(/window\./g, "window.")).call(
      null,
      doc,
      win,
      win.localStorage,
    );
    return attrs;
  };

  it("kayıtlı tercih yoksa sistem temasını uygular", () => {
    expect(run(null, true)["data-theme"]).toBe("light");
    expect(run(null, false)["data-theme"]).toBe("dark");
  });
  it("kayıtlı tercih sistem temasını ezer", () => {
    expect(run("dark", true)["data-theme"]).toBe("dark");
    expect(run("light", false)["data-theme"]).toBe("light");
  });
  it("kayıtlı dil İngilizce ise lang özniteliğini ayarlar", () => {
    expect(run(null, false, "en").lang).toBe("en");
    expect(run(null, false, null).lang).toBeUndefined();
  });
  it("depolama hatasında sessizce varsayılanda kalır", () => {
    const doc = { documentElement: { setAttribute: () => undefined } };
    const win = {
      localStorage: {
        getItem: () => {
          throw new Error("denied");
        },
      },
      matchMedia: () => ({ matches: true }),
    };
    expect(() => new Function("document", "window", "localStorage", THEME_INIT_SCRIPT)(doc, win, win.localStorage)).not.toThrow();
  });
});

describe("palet ve CSS değişkenleri", () => {
  it("hexToChannels kanal üçlüsü üretir ve geçersiz girdiyi reddeder", () => {
    expect(hexToChannels("#07131F")).toBe("7 19 31");
    expect(() => hexToChannels("#fff")).toThrow();
  });

  it("açık temada slate ölçeği tersine çevrilir (50 koyu metin, 950 açık zemin)", () => {
    expect(lightShade("slate", "50")).not.toBe(PALETTES.slate[50]);
    expect(lightShade("slate", "950")).toBe("#F4F8FB");
  });

  it("canlı dolgu tonları (500/600) iki temada aynıdır, diğerleri aynalanır", () => {
    expect(lightShade("emerald", "500")).toBe(PALETTES.emerald[500]);
    expect(lightShade("blue", "600")).toBe(PALETTES.blue[600]);
    expect(lightShade("emerald", "400")).toBe(PALETTES.emerald[600]);
    expect(lightShade("red", "950")).toBe(PALETTES.red[50]);
  });

  it("her palet tonu ve anlamsal token iki temada da tanımlıdır", () => {
    const css = buildThemeVarsCss();
    const dark = css.slice(0, css.indexOf('html[data-theme="light"]'));
    const light = css.slice(css.indexOf('html[data-theme="light"]'));
    for (const name of Object.keys(PALETTES)) {
      for (const shade of SHADES) {
        expect(dark).toContain(`--c-${name}-${shade}:`);
        expect(light).toContain(`--c-${name}-${shade}:`);
      }
    }
    for (const token of Object.keys(SEMANTIC_TOKENS)) {
      expect(dark).toContain(`--c-${token}:`);
      expect(light).toContain(`--c-${token}:`);
    }
  });

  it("src/theme/theme-vars.css üretici çıktısıyla senkron (node scripts/gen-theme-vars.mjs)", () => {
    const file = fs.readFileSync(path.resolve(__dirname, "../theme-vars.css"), "utf-8");
    expect(file).toBe(buildThemeVarsCss());
  });
});
