import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  MatchRowSkeleton,
  MatchCardSkeleton,
  MatchFeedSkeleton,
  StandingsTableSkeleton,
  HomePortalSkeleton,
  TabViewSkeleton,
} from "../SkeletonLoaders";

describe("SkeletonLoaders Components (GÖREV 7: Sıfır CLS & İskelet Yükleme)", () => {
  it("MatchRowSkeleton renders accessible role='status' with aria-label", () => {
    render(<MatchRowSkeleton />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute("aria-label", "Maç bilgisi yükleniyor");
    expect(skeleton.className).toContain("animate-pulse");
  });

  it("MatchCardSkeleton renders accessible role='status' for broadcast cards", () => {
    render(<MatchCardSkeleton />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute("aria-label", "Maç kartı yükleniyor");
    expect(skeleton.className).toContain("animate-pulse");
  });

  it("MatchFeedSkeleton renders specified number of row skeletons", () => {
    render(<MatchFeedSkeleton rows={4} />);
    const skeletons = screen.getAllByRole("status");
    expect(skeletons.length).toBe(4);
  });

  it("StandingsTableSkeleton renders table headers and requested number of row placeholders", () => {
    render(<StandingsTableSkeleton rows={6} />);
    const tableSkeleton = screen.getByRole("status");
    expect(tableSkeleton).toBeInTheDocument();
    expect(screen.getByText("Takım")).toBeInTheDocument();
    expect(screen.getByText("Puan")).toBeInTheDocument();
    expect(screen.getByText("Form")).toBeInTheDocument();
  });

  it("HomePortalSkeleton renders portal placeholder with accessible label", () => {
    render(<HomePortalSkeleton />);
    const portalSkeleton = screen.getByRole("status", { name: "Ana sayfa portali yükleniyor" });
    expect(portalSkeleton).toBeInTheDocument();
  });

  it("TabViewSkeleton renders matching skeleton for standings, fixtures, today and home tabs", () => {
    const { unmount: u1 } = render(<TabViewSkeleton tab="standings" />);
    expect(screen.getByLabelText("Puan durumu tablosu yükleniyor")).toBeInTheDocument();
    u1();

    const { unmount: u2 } = render(<TabViewSkeleton tab="fixtures" />);
    expect(screen.getAllByLabelText("Maç bilgisi yükleniyor").length).toBe(6);
    u2();

    const { unmount: u3 } = render(<TabViewSkeleton tab="today" />);
    expect(screen.getAllByLabelText("Maç kartı yükleniyor").length).toBe(4);
    u3();

    render(<TabViewSkeleton tab="home" />);
    expect(screen.getByLabelText("Ana sayfa portali yükleniyor")).toBeInTheDocument();
  });
});
