import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { AppShell } from "../AppShell";
import { ThemeTokens } from "../ThemeTokens";
import tailwindConfig from "../../../../tailwind.config";
import { buildThemeVarsCss } from "@/theme/palettes";

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
});
