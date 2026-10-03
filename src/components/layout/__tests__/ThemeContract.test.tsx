import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { AppShell } from "../AppShell";
import { ThemeTokens } from "../ThemeTokens";
import tailwindConfig from "../../../../tailwind.config";
import { buildThemeVarsCss } from "@/theme/palettes";
import fs from "fs";
import path from "path";

describe("Fileönü Tasarım Sistemi Sözleşmesi", () => {
  it("ThemeTokens doğru Fileönü hex değerlerini içerir", () => {
    expect(ThemeTokens.background).toBe("#07131F");
    expect(ThemeTokens.panel).toBe("#0E2033");
    expect(ThemeTokens.border).toBe("#1B3550");
  });

  it("tailwind.config.ts anlamsal Fileönü token'larını CSS değişkenine bağlar; karanlık tema değerleri korunur", () => {
    const colors = tailwindConfig.theme?.extend?.colors as any;
    expect(colors).toBeDefined();

    // Karanlık tema değerlerini :root bloğundan oku (açık tema html[data-theme="light"] bloğundadır).
    const css = buildThemeVarsCss();
    const darkBlock = css.slice(css.indexOf(":root {"), css.indexOf('html[data-theme="light"]'));
    const darkHex = (colorValue: string): string => {
      const variable = /var\((--[a-z0-9-]+)\)/.exec(colorValue)?.[1];
      expect(variable, colorValue).toBeDefined();
      const channels = new RegExp(`${variable}: (\\d+) (\\d+) (\\d+);`).exec(darkBlock);
      expect(channels, `${variable} karanlık blokta tanımlı olmalı`).not.toBeNull();
      return "#" + channels!.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("").toUpperCase();
    };

    expect(darkHex(colors.canvas)).toBe("#07131F");
    expect(darkHex(colors.surface.DEFAULT)).toBe("#0E2033");
    expect(darkHex(colors.surface.muted)).toBe("#0A1A2B");
    expect(darkHex(colors.surface.raised)).toBe("#13293F");
    expect(darkHex(colors.panel)).toBe("#0E2033");
    expect(darkHex(colors.line)).toBe("#1B3550");
    expect(darkHex(colors.ink.DEFAULT)).toBe("#EAF6FA");
    expect(darkHex(colors.ink[2])).toBe("#A9C3D1");
    expect(darkHex(colors.ink[3])).toBe("#8CA8B8");
    expect(darkHex(colors.live)).toBe("#FF6E82");
    expect(darkHex(colors.done)).toBe("#9BE15D");
    expect(darkHex(colors.warn)).toBe("#FFC24D");
    expect(darkHex(colors.selected.DEFAULT)).toBe("#5B9DFF");
    expect(darkHex(colors.selected.strong)).toBe("#2A63BD");
    expect(darkHex(colors.slate[900])).toBe("#0E2033");
    expect(darkHex(colors.emerald[400])).toBe("#9BE15D");
  });

  it("AppShell varsayılan olarak data-section='altyapi' atar", () => {
    const { container } = render(
      <AppShell header={<div>Header</div>}>
        <div>İçerik</div>
      </AppShell>
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-section")).toBe("altyapi");
  });

  it("AppShell section='kadinlar-2-lig' verildiğinde data-section özniteliğini günceller", () => {
    const { container } = render(
      <AppShell header={<div>Header</div>} section="kadinlar-2-lig">
        <div>İçerik</div>
      </AppShell>
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-section")).toBe("kadinlar-2-lig");
  });

  it("globals.css dosyasında Fileönü kök ve Kadınlar 2. Lig token tanımları mevcuttur", () => {
    const cssPath = path.resolve(__dirname, "../../../app/globals.css");
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toContain("--canvas: #07131f;");
    expect(css).toContain('--primary: #2dd4c0;');
    expect(css).toContain('[data-section="kadinlar-2-lig"]');
    expect(css).toContain('--primary: #d98bff;');
  });
});

describe("Kadınlar 2. Lig orkide kapsamı", () => {
  it("Kadınlar 2. Lig bölümü kırmızı/pembe marka sınıfı taşımaz", () => {
    const dir = path.resolve(__dirname, "../../kadinlar-2-lig");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".tsx"));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const src = fs.readFileSync(path.join(dir, f), "utf-8");
      expect(src, f).not.toMatch(/shadow-glow-red|from-red-600|to-rose-600|bg-pink-500|bg-rose-500\b/);
    }
  });

  it("bölüm token bloğu rank-mid'i maviye çevirir", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../../../app/globals.css"), "utf-8");
    const block = css.slice(css.indexOf('[data-section="kadinlar-2-lig"]'));
    expect(block).toContain("--rank-mid-rgb: 127 180 255;");
  });
});
