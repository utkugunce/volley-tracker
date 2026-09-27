import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileBottomNav } from "../MobileBottomNav";

describe("MobileBottomNav Component", () => {
  it("renders all 5 Sofascore navigation tabs", () => {
    const onSelectTab = vi.fn();
    render(
      <MobileBottomNav
        activeTab="matches"
        onSelectTab={onSelectTab}
        favoriteCount={3}
        liveCount={2}
        todayMatchesCount={5}
        resultsCount={12}
      />
    );

    expect(screen.getByText("Maçlar")).toBeInTheDocument();
    expect(screen.getByText("Canlı")).toBeInTheDocument();
    expect(screen.getByText("Puan Durumu")).toBeInTheDocument();
    expect(screen.getByText("Ligler")).toBeInTheDocument();
    expect(screen.getByText("Favorilerim")).toBeInTheDocument();
  });

  it("calls onSelectTab with 'matches' when Maçlar is clicked", () => {
    const onSelectTab = vi.fn();
    render(
      <MobileBottomNav
        activeTab="standings"
        onSelectTab={onSelectTab}
      />
    );

    fireEvent.click(screen.getByText("Maçlar"));
    expect(onSelectTab).toHaveBeenCalledWith("matches");
  });

  it("calls onSelectTab when other tabs are clicked", () => {
    const onSelectTab = vi.fn();
    render(
      <MobileBottomNav
        activeTab="matches"
        onSelectTab={onSelectTab}
      />
    );

    fireEvent.click(screen.getByText("Canlı"));
    expect(onSelectTab).toHaveBeenCalledWith("live");

    fireEvent.click(screen.getByText("Puan Durumu"));
    expect(onSelectTab).toHaveBeenCalledWith("standings");

    fireEvent.click(screen.getByText("Ligler"));
    expect(onSelectTab).toHaveBeenCalledWith("leagues");

    fireEvent.click(screen.getByText("Favorilerim"));
    expect(onSelectTab).toHaveBeenCalledWith("favorites");
  });

  it("displays badges with counts and handles 99+", () => {
    const { rerender } = render(
      <MobileBottomNav
        activeTab="matches"
        onSelectTab={vi.fn()}
        favoriteCount={2}
        todayMatchesCount={4}
      />
    );

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    // Test > 99 badge format
    rerender(
      <MobileBottomNav
        activeTab="matches"
        onSelectTab={vi.fn()}
        todayMatchesCount={120}
      />
    );

    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("includes fixed styling and iOS safe-area bottom inset padding", () => {
    const { container } = render(
      <MobileBottomNav
        activeTab="matches"
        onSelectTab={vi.fn()}
      />
    );

    const nav = container.querySelector("nav");
    expect(nav).toBeInTheDocument();
    expect(nav?.className).toContain("fixed bottom-0 left-0 right-0 z-50 bg-[#1E222D] border-t border-[#2A2E3D]");
    expect(nav?.className).toContain("pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]");
  });
});
