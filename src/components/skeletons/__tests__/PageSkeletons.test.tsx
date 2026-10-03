import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComparePageSkeleton, DashboardSkeleton, StatsPageSkeleton, TeamPageSkeleton } from "../PageSkeletons";
import Loading from "@/app/loading";
import TeamLoading from "@/app/takim/loading";
import StatsLoading from "@/app/istatistikler/loading";
import CompareLoading from "@/app/karsilastir/loading";

describe("sayfa iskeletleri", () => {
  it.each([
    ["ana sayfa", DashboardSkeleton, /Maç verileri yükleniyor/],
    ["takım", TeamPageSkeleton, /Takım sayfası yükleniyor/],
    ["istatistikler", StatsPageSkeleton, /İstatistikler yükleniyor/],
    ["karşılaştır", ComparePageSkeleton, /Karşılaştırma yükleniyor/],
  ])("%s iskeleti erişilebilir yükleniyor duyurusu içerir", (_name, Component, label) => {
    const { container } = render(<Component />);
    const region = container.querySelector('[role="status"][aria-busy="true"]');
    expect(region).not.toBeNull();
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  });

  it("loading.tsx dosyaları ilgili iskeleti döndürür", () => {
    for (const [Comp, label] of [
      [Loading, /Maç verileri yükleniyor/],
      [TeamLoading, /Takım sayfası yükleniyor/],
      [StatsLoading, /İstatistikler yükleniyor/],
      [CompareLoading, /Karşılaştırma yükleniyor/],
    ] as const) {
      const { unmount } = render(<Comp />);
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
      unmount();
    }
  });
});
