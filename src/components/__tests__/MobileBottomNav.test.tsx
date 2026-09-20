import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileBottomNav } from "../MobileBottomNav";

describe("MobileBottomNav Component", () => {
  it("renders all 5 navigation tabs", () => {
    const onSelectTab = vi.fn();
    render(
      <MobileBottomNav
        activeTab="today"
        onSelectTab={onSelectTab}
        favoriteCount={3}
        todayMatchesCount={5}
        resultsCount={12}
      />
    );

    expect(screen.getByText("Sonuçlar")).toBeInTheDocument();
    expect(screen.getByText("Günün Maçı")).toBeInTheDocument();
    expect(screen.getByText("Fikstür")).toBeInTheDocument();
    expect(screen.getByText("Puan Durumu")).toBeInTheDocument();
    expect(screen.getByText("Favoriler")).toBeInTheDocument();
  });

  it("calls onSelectTab with 'results' when Sonuçlar is clicked", () => {
    const onSelectTab = vi.fn();
    render(
      <MobileBottomNav
        activeTab="today"
        onSelectTab={onSelectTab}
      />
    );

    fireEvent.click(screen.getByText("Sonuçlar"));
    expect(onSelectTab).toHaveBeenCalledWith("results");
  });

  it("calls onSelectTab when other tabs are clicked", () => {
    const onSelectTab = vi.fn();
    render(
      <MobileBottomNav
        activeTab="results"
        onSelectTab={onSelectTab}
      />
    );

    fireEvent.click(screen.getByText("Günün Maçı"));
    expect(onSelectTab).toHaveBeenCalledWith("today");

    fireEvent.click(screen.getByText("Fikstür"));
    expect(onSelectTab).toHaveBeenCalledWith("fixtures");

    fireEvent.click(screen.getByText("Puan Durumu"));
    expect(onSelectTab).toHaveBeenCalledWith("standings");

    fireEvent.click(screen.getByText("Favoriler"));
    expect(onSelectTab).toHaveBeenCalledWith("favorites");
  });

  it("displays badges with counts and handles 99+", () => {
    const { rerender } = render(
      <MobileBottomNav
        activeTab="results"
        onSelectTab={vi.fn()}
        favoriteCount={2}
        todayMatchesCount={4}
        resultsCount={15}
      />
    );

    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    // Test > 99 badge format
    rerender(
      <MobileBottomNav
        activeTab="results"
        onSelectTab={vi.fn()}
        resultsCount={120}
      />
    );

    expect(screen.getByText("99+")).toBeInTheDocument();
  });
});
