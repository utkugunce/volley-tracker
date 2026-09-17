import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodayMatchesView } from "../TodayMatchesView";
import { CitySelector } from "../CitySelector";
import fs from "fs";
import path from "path";

describe("No Silent Fallbacks Regression Tests", () => {
  it("TodayMatchesView renders 0 for active cities when no matches exist, never falling back to 4", () => {
    render(
      <TodayMatchesView
        matches={[]}
        city="Tüm İller"
        todayStr="2026-09-15"
        favorites={[]}
        onToggleFavorite={vi.fn()}
        onNavigateToFullFixtures={vi.fn()}
      />
    );

    // Aktif il KPI alt yazısı 0 olmalı, asla 4 olmamalı
    expect(screen.getByText("0 Aktif İl Bütünü")).toBeInTheDocument();
    expect(screen.queryByText("4 Aktif İl Bütünü")).toBeNull();
  });

  it("TodayMatchesView does not render hardcoded city counts (24, 44, 20) when citiesList is empty", () => {
    render(
      <TodayMatchesView
        matches={[]}
        city="Tüm İller"
        currentCitySlug="all"
        onSelectCity={vi.fn()}
        citiesList={[]}
        todayStr="2026-09-15"
        favorites={[]}
        onToggleFavorite={vi.fn()}
        onNavigateToFullFixtures={vi.fn()}
      />
    );

    // defaultList içindeki sahte sayılar bulunmamalı
    expect(screen.queryByText("24")).toBeNull();
    expect(screen.queryByText("44")).toBeNull();
    expect(screen.queryByText("20")).toBeNull();
  });

  it("CitySelector renders 0 when cities list is empty, never falling back to 81 or Istanbul 24", () => {
    render(
      <CitySelector
        currentCitySlug="all"
        onSelectCity={vi.fn()}
        cities={[]}
      />
    );

    // Başlık butonunda sahte 24 veya İstanbul yer almamalı
    expect(screen.queryByText("İstanbul")).toBeNull();
    expect(screen.queryByText("24")).toBeNull();

    // Açılır menü butonuna tıklandığında sekmede Tüm İller (0) yazmalı (81 değil!)
    const selectBtn = screen.getByRole("button");
    fireEvent.click(selectBtn);
    expect(screen.getByText("Tüm İller (0)")).toBeInTheDocument();
    expect(screen.queryByText("Tüm İller (81)")).toBeNull();
  });

  it("Codebase audit: no non-zero hardcoded fallbacks for metrics in src components", () => {
    const srcDir = path.resolve(__dirname, "../../");
    const filesToCheck: string[] = [];

    function traverse(dir: string) {
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) {
          if (item !== "__tests__" && item !== "node_modules") {
            traverse(full);
          }
        } else if (item.endsWith(".tsx") || item.endsWith(".ts")) {
          filesToCheck.push(full);
        }
      }
    }

    traverse(srcDir);

    const violations: string[] = [];
    const forbiddenPatterns = [
      /activeCities\s*\|\|\s*[1-9]\d*/,
      /cities\.length\s*\|\|\s*[1-9]\d*/,
      /matches_count\s*\|\|\s*[1-9]\d*/,
    ];

    for (const filePath of filesToCheck) {
      const content = fs.readFileSync(filePath, "utf-8");
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(content)) {
          violations.push(`${path.basename(filePath)} matches forbidden fallback pattern ${pattern}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
