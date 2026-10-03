import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildStatsMetadata, categorySlug, getStatsStaticParams, StatsPageView } from "../stats-page";
import sitemap from "@/app/sitemap";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

describe("/istatistikler", () => {
  it("tümü görünümü başlığı, kategori sekmelerini ve bölümleri render eder", () => {
    render(<StatsPageView />);
    expect(screen.getByRole("heading", { level: 1, name: "Lig İstatistikleri ve Analiz" })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Lig kategorisi" });
    expect(nav).toHaveTextContent("Tümü");
    expect(nav).toHaveTextContent("Genç Kızlar Süper Lig");
    expect(screen.getByRole("heading", { name: "Play-off Matematiği" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "En Yüksek Set Oranı" })).toBeInTheDocument();
  });

  it("kategori sayfası o kategoriye özgü başlık verir; bilinmeyen kategori 404", () => {
    const slug = categorySlug("Genç Kızlar Süper Lig");
    render(<StatsPageView slug={slug} />);
    expect(screen.getByRole("heading", { level: 1, name: "Genç Kızlar Süper Lig İstatistikleri" })).toBeInTheDocument();
    expect(() => render(<StatsPageView slug="olmayan-kategori" />)).toThrow("NEXT_NOT_FOUND");
  });

  it("generateStaticParams kategori başına bir yol üretir; meta canonical içerir", () => {
    const params = getStatsStaticParams();
    expect(params.length).toBeGreaterThanOrEqual(3);
    expect(params.map((p) => p.kategori)).toContain("genc-kizlar-super-lig");
    const meta = buildStatsMetadata();
    expect(meta.alternates?.canonical).toBe("https://altyapivoleybol.com.tr/istatistikler");
    expect(String(meta.description)).toMatch(/play-off/);
    const catMeta = buildStatsMetadata("genc-kizlar-super-lig");
    expect(catMeta.alternates?.canonical).toBe("https://altyapivoleybol.com.tr/istatistikler/genc-kizlar-super-lig");
    expect(buildStatsMetadata("yok").robots).toEqual({ index: false, follow: true });
  });

  it("sitemap istatistik sayfalarını içerir", () => {
    const urls = sitemap().map((s) => s.url);
    expect(urls.some((u) => u.endsWith("/istatistikler"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/istatistikler/genc-kizlar-super-lig"))).toBe(true);
  });
});
