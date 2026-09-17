import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Header } from "../Header";

describe("Header Component", () => {
  it("renders SONUÇLAR tab to the left of GÜNÜN MAÇLARI with results count badge", () => {
    const onSelectTab = vi.fn();
    render(
      <Header
        totalMatches={151}
        todayMatchesCount={4}
        resultsCount={29}
        favoritesCount={0}
        showOnlyFavorites={false}
        onToggleFavoritesOnly={vi.fn()}
        activeTab="home"
        onSelectTab={onSelectTab}
        onRefresh={vi.fn()}
        isLoading={false}
      />
    );

    // 1. SONUÇLAR ve GÜNÜN MAÇLARI sekmeleri mevcut mu?
    const resultsSpan = screen.getByText("SONUÇLAR");
    const todaySpan = screen.getByText("GÜNÜN MAÇLARI");
    const fixturesSpan = screen.getByText("FİKSTÜR");
    const standingsSpan = screen.getByText("PUAN DURUMU");

    expect(resultsSpan).toBeInTheDocument();
    expect(todaySpan).toBeInTheDocument();
    expect(fixturesSpan).toBeInTheDocument();
    expect(standingsSpan).toBeInTheDocument();

    const resultsButton = resultsSpan.closest("button")!;
    const todayButton = todaySpan.closest("button")!;
    const fixturesButton = fixturesSpan.closest("button")!;
    const standingsButton = standingsSpan.closest("button")!;

    expect(resultsButton).toBeInTheDocument();
    expect(todayButton).toBeInTheDocument();
    expect(fixturesButton).toBeInTheDocument();
    expect(standingsButton).toBeInTheDocument();

    // 2. Sıralama kontrolü: SONUÇLAR, GÜNÜN MAÇLARI'ndan önce (solunda) yer almalıdır
    const allButtons = screen.getAllByRole("button");
    const resultsIdx = allButtons.indexOf(resultsButton);
    const todayIdx = allButtons.indexOf(todayButton);
    expect(resultsIdx).toBeLessThan(todayIdx);

    // 3. Rozet sayısı: 29 sonuç
    expect(screen.getByText("29")).toBeInTheDocument();

    // 4. Tıklama aksiyonu: onSelectTab("results") tetiklenmeli
    fireEvent.click(resultsButton);
    expect(onSelectTab).toHaveBeenCalledWith("results");
  });

  it("activeTab='results' olduğunda SONUÇLAR sekmesini aktif stilde gösterir", () => {
    render(
      <Header
        totalMatches={151}
        todayMatchesCount={0}
        resultsCount={29}
        favoritesCount={0}
        showOnlyFavorites={false}
        onToggleFavoritesOnly={vi.fn()}
        activeTab="results"
        onSelectTab={vi.fn()}
        onRefresh={vi.fn()}
        isLoading={false}
      />
    );

    const resultsButton = screen.getByText("SONUÇLAR").closest("button")!;
    expect(resultsButton.className).toContain("border-primary text-white");
  });
});
