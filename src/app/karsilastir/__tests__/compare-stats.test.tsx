import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompareClient } from "../CompareClient";
import { getAllTeamsList, getHeadToHeadComparison, getTeamDetailsBySlug } from "@/utils/teamData";
import { buildCompareStats, slimComparison } from "@/utils/compareStats";
import { TeamPageView } from "@/app/takim/team-page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (p: { alt: string; src: string }) => <img alt={p.alt} src={p.src} />,
}));

/** Aynı puan durumu grubunda ve en az bir maçı bitmiş iki gerçek takım bulur. */
function findPair() {
  const teams = getAllTeamsList();
  for (const t of teams.slice(0, 400)) {
    const d = getTeamDetailsBySlug(t.slug);
    if (!d || d.stats.played < 2 || d.standingsContexts.length === 0) continue;
    const ctx = d.standingsContexts[0];
    const other = ctx.fullGroupTable.find((r) => r.team !== ctx.standingRow.team && r.played > 0);
    if (!other) continue;
    const cmp = getHeadToHeadComparison(d.slug, other.team.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    if (cmp) return cmp;
  }
  return null;
}

describe("karşılaştırma: istatistik ve hafifletme", () => {
  const cmp = findPair() ?? (() => {
    const teams = getAllTeamsList().filter((t) => (getTeamDetailsBySlug(t.slug)?.stats.played ?? 0) >= 2);
    return getHeadToHeadComparison(teams[0].slug, teams[1].slug);
  })();

  it("iki takım için istatistik verisi üretir", () => {
    expect(cmp).not.toBeNull();
    const data = buildCompareStats(cmp!);
    expect(data.team1.stats.played).toBe(cmp!.team1.stats.played);
    expect(data.team2.stats.played).toBe(cmp!.team2.stats.played);
    expect(data.team1.form.matches).toBeLessThanOrEqual(5);
    expect(typeof data.sameGroup).toBe("boolean");
  });

  it("slimComparison ağır alanları ayıklar ve JSON boyutunu küçültür", () => {
    const slim = slimComparison(cmp!);
    expect(slim.team1.matches).toEqual([]);
    expect(slim.team1.roster).toBeUndefined();
    expect(slim.team1.standingsContexts.every((c) => c.fullGroupTable.length === 0)).toBe(true);
    expect(slim.team1.standingsContexts.length).toBe(cmp!.team1.standingsContexts.length);
    expect(slim.matches).toEqual(cmp!.matches);
    expect(JSON.stringify(slim).length).toBeLessThan(JSON.stringify(cmp).length);
  });

  it("CompareClient statsData ile 'Sezon İstatistikleri Karşılaştırması' bölümünü gösterir", () => {
    const data = buildCompareStats(cmp!);
    render(
      <CompareClient
        teamsList={getAllTeamsList().slice(0, 5)}
        initialSlug1={cmp!.team1.slug}
        initialSlug2={cmp!.team2.slug}
        comparison={slimComparison(cmp!)}
        statsData={data}
      />
    );
    expect(screen.getByRole("heading", { name: "Sezon İstatistikleri Karşılaştırması" })).toBeInTheDocument();
  });

  it("statsData verilmezse bölüm hiç çizilmez", () => {
    render(
      <CompareClient
        teamsList={getAllTeamsList().slice(0, 5)}
        initialSlug1={cmp!.team1.slug}
        initialSlug2={cmp!.team2.slug}
        comparison={slimComparison(cmp!)}
      />
    );
    expect(screen.queryByRole("heading", { name: "Sezon İstatistikleri Karşılaştırması" })).not.toBeInTheDocument();
  });
});

describe("takım sayfası İstatistikler bölümü", () => {
  it("bitmiş maçı olan gerçek takımda bölüm görünür", () => {
    // Canlı veri 30 dakikada bir değiştiği için sabit bir takım yerine, oynanmış maçı olan ilk takım seçilir.
    const slug = getAllTeamsList().find((t) => (getTeamDetailsBySlug(t.slug)?.stats.played ?? 0) >= 1)!.slug;
    render(<TeamPageView slug={slug} />);
    expect(screen.getByRole("heading", { name: "İstatistikler" })).toBeInTheDocument();
    expect(screen.getByText("Galibiyet Oranı")).toBeInTheDocument();
  });
});
