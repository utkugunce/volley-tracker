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

    // 1. ANASAYFA, SONUÇLAR ve GÜNÜN MAÇLARI sekmeleri mevcut mu?
    const homeSpan = screen.getByText("ANASAYFA");
    const resultsSpan = screen.getByText("SONUÇLAR");
    const todaySpan = screen.getByText("GÜNÜN MAÇLARI");
    const fixturesSpan = screen.getByText("FİKSTÜR");
    const standingsSpan = screen.getByText("PUAN DURUMU");

    expect(homeSpan).toBeInTheDocument();
    expect(resultsSpan).toBeInTheDocument();
    expect(todaySpan).toBeInTheDocument();
    expect(fixturesSpan).toBeInTheDocument();
    expect(standingsSpan).toBeInTheDocument();

    const homeButton = homeSpan.closest("button")!;
    const resultsButton = resultsSpan.closest("button")!;
    const todayButton = todaySpan.closest("button")!;
    const fixturesButton = fixturesSpan.closest("button")!;
    const standingsButton = standingsSpan.closest("button")!;

    expect(homeButton).toBeInTheDocument();
    expect(resultsButton).toBeInTheDocument();
    expect(todayButton).toBeInTheDocument();
    expect(fixturesButton).toBeInTheDocument();
    expect(standingsButton).toBeInTheDocument();

    // 2. Sıralama kontrolü: ANASAYFA -> SONUÇLAR -> GÜNÜN MAÇLARI
    const allButtons = screen.getAllByRole("button");
    const homeIdx = allButtons.indexOf(homeButton);
    const resultsIdx = allButtons.indexOf(resultsButton);
    const todayIdx = allButtons.indexOf(todayButton);
    expect(homeIdx).toBeLessThan(resultsIdx);
    expect(resultsIdx).toBeLessThan(todayIdx);

    // 3. Rozet sayısı: 29 sonuç
    expect(screen.getByText("29")).toBeInTheDocument();

    // 4. Tıklama aksiyonları:
    fireEvent.click(homeButton);
    expect(onSelectTab).toHaveBeenCalledWith("home");

    fireEvent.click(resultsButton);
    expect(onSelectTab).toHaveBeenCalledWith("results");

    fireEvent.click(todayButton);
    expect(onSelectTab).toHaveBeenCalledWith("today");
  });

  it("activeTab='home' olduğunda ANASAYFA sekmesini aktif stilde gösterir", () => {
    render(
      <Header
        totalMatches={151}
        todayMatchesCount={0}
        resultsCount={29}
        favoritesCount={0}
        showOnlyFavorites={false}
        onToggleFavoritesOnly={vi.fn()}
        activeTab="home"
        onSelectTab={vi.fn()}
        onRefresh={vi.fn()}
        isLoading={false}
      />
    );

    const homeButton = screen.getByText("ANASAYFA").closest("button")!;
    expect(homeButton.className).toContain("border-primary text-white");
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

  it("includes iOS safe-area top inset padding in header container", () => {
    const { container } = render(
      <Header
        totalMatches={10}
        todayMatchesCount={0}
        resultsCount={0}
        favoritesCount={0}
        showOnlyFavorites={false}
        onToggleFavoritesOnly={vi.fn()}
        activeTab="home"
        onSelectTab={vi.fn()}
        onRefresh={vi.fn()}
        isLoading={false}
      />
    );

    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();
    expect(header?.className).toContain("pt-[env(safe-area-inset-top,0px)]");
  });
});
