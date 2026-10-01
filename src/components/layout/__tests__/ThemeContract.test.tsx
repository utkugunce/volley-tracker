import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { AppShell } from "../AppShell";
import { ThemeTokens } from "../ThemeTokens";
import tailwindConfig from "../../../../tailwind.config";
import fs from "fs";
import path from "path";

describe("Fileönü Tasarım Sistemi Sözleşmesi", () => {
  it("ThemeTokens doğru Fileönü hex değerlerini içerir", () => {
    expect(ThemeTokens.background).toBe("#07131F");
    expect(ThemeTokens.panel).toBe("#0E2033");
    expect(ThemeTokens.border).toBe("#1B3550");
  });

  it("tailwind.config.ts anlamsal Fileönü token'larını tanımlar", () => {
    const colors = tailwindConfig.theme?.extend?.colors as any;
    expect(colors).toBeDefined();
    expect(colors.canvas).toBe("#07131F");
    expect(colors.surface.DEFAULT).toBe("#0E2033");
    expect(colors.surface.muted).toBe("#0A1A2B");
    expect(colors.surface.raised).toBe("#13293F");
    expect(colors.panel).toBe("#0E2033");
    expect(colors.line).toBe("#1B3550");
    expect(colors.ink.DEFAULT).toBe("#EAF6FA");
    expect(colors.ink[2]).toBe("#A9C3D1");
    expect(colors.ink[3]).toBe("#8CA8B8");
    expect(colors.live).toBe("#FF6E82");
    expect(colors.done).toBe("#9BE15D");
    expect(colors.warn).toBe("#FFC24D");
    expect(colors.selected.DEFAULT).toBe("#5B9DFF");
    expect(colors.selected.strong).toBe("#2A63BD");
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
