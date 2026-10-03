import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { TeamStatsSection } from "@/components/team/TeamStatsSection";
import { CompareStatsTable } from "../CompareStatsTable";
import { PlayoffSummary } from "../PlayoffSummary";
import { LeaderboardCard } from "../LeaderboardCard";
import { computeTeamStats, type StatsMatchInput } from "@/utils/performanceStats";
import type { TeamPlayoffInfo } from "@/utils/teamStatsBundle";
import type { CompareStatsData } from "@/utils/compareStats";
import type { LeagueLists, MetricEntry } from "@/utils/leagueAnalytics";

const mk = (i: number, teamScore: number, opponentScore: number, isHome: boolean, sets?: string[]): StatsMatchInput => ({
  id: `m${i}`,
  date: `2026-09-${String(10 + i).padStart(2, "0")}`,
  status: "finished",
  isHome,
  teamScore,
  opponentScore,
  set_scores: sets,
});

const richStats = computeTeamStats([
  mk(1, 3, 0, true, ["25-10", "25-12", "25-20"]),
  mk(2, 3, 2, false, ["20-25", "25-22", "18-25", "25-20", "12-15"]),
  mk(3, 1, 3, true, ["20-25", "25-22", "18-25", "15-25"]),
]);

const playoffInfo = (over: Partial<TeamPlayoffInfo> = {}): TeamPlayoffInfo => ({
  category: "Genç Kızlar Süper Lig",
  groupName: "Genç Kızlar Süper Lig - A Grubu",
  rank: 2,
  points: 12,
  played: 5,
  groupSize: 8,
  cutoff: 4,
  remaining: 2,
  maxPoints: 18,
  status: "open",
  scheduleComplete: true,
  ...over,
});

describe("TeamStatsSection", () => {
  it("hiç biten maç ve play-off verisi yoksa hiçbir şey çizmez", () => {
    const { container } = render(<TeamStatsSection stats={computeTeamStats([])} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("istatistik kartlarını, ev/deplasman ve sonuç dağılımını gösterir", () => {
    render(<TeamStatsSection stats={richStats} />);
    expect(screen.getByRole("heading", { name: "İstatistikler" })).toBeInTheDocument();
    expect(screen.getByText("Galibiyet Oranı")).toBeInTheDocument();
    expect(screen.getByText("%67")).toBeInTheDocument();
    expect(screen.getByText("Sayı Ortalaması")).toBeInTheDocument();
    expect(screen.getByText("Ev / Deplasman")).toBeInTheDocument();
    expect(screen.getByText("Sonuç Dağılımı")).toBeInTheDocument();
    expect(screen.getByText("Güncel Seri")).toBeInTheDocument();
  });

  it("set skoru olmayan takımda sayı ortalaması kartı gizlenir (veri yok → bölüm yok)", () => {
    const noSets = computeTeamStats([mk(1, 3, 0, true), mk(2, 3, 1, true)]);
    render(<TeamStatsSection stats={noSets} />);
    expect(screen.queryByText("Sayı Ortalaması")).not.toBeInTheDocument();
    // Deplasman maçı yok → yalnızca ev satırı
    expect(screen.getByText("Ev sahibi")).toBeInTheDocument();
    expect(screen.queryByText("Deplasman")).not.toBeInTheDocument();
  });

  it("play-off kartı durumu, kuralı ve açıklanan kalan maçı gösterir", () => {
    render(<TeamStatsSection stats={richStats} playoff={[playoffInfo({ status: "qualified" })]} />);
    const card = screen.getByTestId("team-playoff-card");
    expect(within(card).getByText("Garanti")).toBeInTheDocument();
    expect(within(card).getByText(/nasıl biterse bitsin ilk 4 içinde kalacak/)).toBeInTheDocument();
    expect(within(card).getByText("Bu durum nasıl hesaplanıyor?")).toBeInTheDocument();
    expect(within(card).getByText("Ulaşabileceği en çok puan")).toBeInTheDocument();
  });

  it("fikstür tamam değilse 'Belirsiz' gösterir ve en çok puanı saklar", () => {
    render(<TeamStatsSection stats={richStats} playoff={[playoffInfo({ status: "unknown", scheduleComplete: false })]} />);
    const card = screen.getByTestId("team-playoff-card");
    expect(within(card).getByText("Belirsiz")).toBeInTheDocument();
    expect(within(card).getByText(/henüz tamamlanmadığı için kesin durum hesaplanamıyor/)).toBeInTheDocument();
    expect(within(card).queryByText("Ulaşabileceği en çok puan")).not.toBeInTheDocument();
  });

  it("elenmiş durumu metni", () => {
    render(<TeamStatsSection stats={richStats} playoff={[playoffInfo({ status: "eliminated", cutoff: 2 })]} />);
    expect(screen.getByText("Elenmiş")).toBeInTheDocument();
    expect(screen.getByText(/ilk 2'e giremez/)).toBeInTheDocument();
  });
});

describe("CompareStatsTable", () => {
  const entry = (stats = richStats): CompareStatsData["team1"] => ({
    stats,
    form: { results: ["W", "L"], matches: 2, wins: 1, points: 3, maxPoints: 6 },
    standing: { groupName: "A Grubu", category: "Genç", rank: 1, played: 3, won: 2, lost: 1, points: 7, setsWon: 7, setsLost: 5 },
    playoff: null,
  });

  it("iki takımın satırlarını yan yana gösterir ve üstün tarafı vurgular", () => {
    const weaker = computeTeamStats([mk(1, 0, 3, true), mk(2, 1, 3, false)]);
    render(<CompareStatsTable data={{ team1: entry(), team2: entry(weaker), sameGroup: true }} name1="Alfa" name2="Beta" />);
    const rows = screen.getByTestId("compare-stats-rows");
    expect(within(rows).getByText("Galibiyet Oranı")).toBeInTheDocument();
    expect(within(rows).getByText("%67 (2/3)")).toHaveClass("text-primary");
    expect(within(rows).getByText("%0 (0/2)")).not.toHaveClass("text-selected-text");
    expect(within(rows).getByText("Puan Durumu")).toBeInTheDocument();
  });

  it("her iki takımda da verisi olmayan satırlar çizilmez", () => {
    const empty = computeTeamStats([]);
    const e: CompareStatsData["team1"] = { stats: empty, form: { results: [], matches: 0, wins: 0, points: 0, maxPoints: 0 }, standing: null, playoff: null };
    const { container } = render(<CompareStatsTable data={{ team1: e, team2: e, sameGroup: false }} name1="A" name2="B" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("sayı ortalaması yalnızca bir takımda varsa diğer tarafa '-' yazar", () => {
    const noPoints = computeTeamStats([mk(1, 3, 0, true), mk(2, 3, 1, true)]);
    render(<CompareStatsTable data={{ team1: entry(), team2: entry(noPoints), sameGroup: false }} name1="A" name2="B" />);
    expect(screen.getByText("Sayı Ortalaması (set başı atılan – yenen)")).toBeInTheDocument();
  });
});

describe("PlayoffSummary ve LeaderboardCard", () => {
  const ref = { team: "Alfa", slug: "alfa", city: "İzmir", category: "Genç Kızlar Süper Lig", groupName: "Genç Kızlar Süper Lig - - A Gr", href: "/takim/alfa/izmir" };

  it("kesinleşmiş grup yoksa nedenini açıklar", () => {
    const playoff: LeagueLists["playoff"] = { groupsTotal: 10, groupsCalculated: 2, groups: [] };
    render(<PlayoffSummary playoff={playoff} showCategory={false} />);
    expect(screen.getByText(/Şu an kesinleşmiş bir play-off durumu yok/)).toBeInTheDocument();
    expect(screen.getByText(/2\/10 grubun fikstürü tamamlandığı için/)).toBeInTheDocument();
  });

  it("garanti ve elenmiş takımları bağlantıyla listeler", () => {
    const playoff: LeagueLists["playoff"] = {
      groupsTotal: 1,
      groupsCalculated: 1,
      groups: [
        {
          id: "g",
          city: "İzmir",
          category: "Genç Kızlar Süper Lig",
          groupName: "Genç Kızlar Süper Lig - - A Gr",
          cutoff: 4,
          remainingMatches: 3,
          qualified: [ref],
          eliminated: [{ ...ref, team: "Beta", slug: "beta", href: "/takim/beta/izmir" }],
          openCount: 2,
        },
      ],
    };
    render(<PlayoffSummary playoff={playoff} showCategory={false} />);
    expect(screen.getByRole("link", { name: "Alfa" })).toHaveAttribute("href", "/takim/alfa/izmir");
    expect(screen.getByRole("link", { name: "Beta" })).toBeInTheDocument();
    expect(screen.getByText(/2 takımın durumu hâlâ açık/)).toBeInTheDocument();
    // Grup adındaki baştaki "- " temizlenir
    expect(screen.getByText(/A Gr/)).toBeInTheDocument();
  });

  it("LeaderboardCard: boş listede gizlenir, doluysa sıralı gösterir", () => {
    const { container, rerender } = render(
      <LeaderboardCard id="x" title="T" subtitle="S" icon={null} entries={[]} showCategory={false} renderValue={() => "v"} />
    );
    expect(container).toBeEmptyDOMElement();
    const e: MetricEntry = { ...ref, value: 3, played: 3 };
    rerender(<LeaderboardCard id="x" title="Başlık" subtitle="S" icon={null} entries={[e]} showCategory renderValue={(x) => `${x.value} galibiyet`} />);
    expect(screen.getByRole("heading", { name: "Başlık" })).toBeInTheDocument();
    expect(screen.getByText("3 galibiyet")).toBeInTheDocument();
    expect(screen.getByText(/Genç Kızlar Süper Lig • A Gr/)).toBeInTheDocument();
  });
});
