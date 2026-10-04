import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { TakvimCalendar } from "../takvim/TakvimCalendar";
import { TakvimeEkle, webcalUrl } from "../takvim/TakvimeEkle";
import type { CalendarMatch } from "@/utils/takvim";

function m(id: string, date: string, time: string, extra: Partial<CalendarMatch> = {}): CalendarMatch {
  return {
    id,
    date,
    time,
    week: "1",
    home: "Fenerbahçe Medicana",
    away: "Manisa Büyükşehir Belediye Spor",
    venue: "TVF Burhan Felek Vestel Voleybol Salonu",
    city: "İstanbul",
    broadcaster: "TVF Voleybol TV",
    homeSets: null,
    awaySets: null,
    setScores: "",
    ...extra,
  };
}

const MATCHES: CalendarMatch[] = [
  m("1", "2026-10-03", "14:00", { home: "VakıfBank", away: "Beşiktaş", homeSets: 3, awaySets: 1, setScores: "(25-16) (25-18) (23-25) (25-19)", broadcaster: "TRT Spor" }),
  m("2", "2026-10-04", "13:00"),
  m("3", "2026-10-04", "16:00", { home: "Aras Kargo", away: "Zeren Spor", venue: "TVF Atatürk Voleybol Spor Kompleksi", city: "İzmir" }),
  m("4", "2026-10-18", "15:00", { home: "Zeren Spor", away: "Fenerbahçe Medicana", city: "Ankara", week: "4" }),
  m("5", "2026-11-08", ""),
];

const cell = (date: string) => document.querySelector<HTMLButtonElement>(`button[data-date="${date}"]`)!;

beforeEach(() => {
  window.history.replaceState(null, "", "/takvim");
});

describe("TakvimCalendar", () => {
  it("bugün maç varsa bugünü seçer; ay başlığı, rozetler ve maç listesi görünür", () => {
    render(<TakvimCalendar matches={MATCHES} todayOverride="2026-10-04" />);

    expect(screen.getByRole("heading", { name: "Ekim 2026" })).toBeInTheDocument();
    expect(screen.getByTestId("selected-day-label")).toHaveTextContent("4 Ekim 2026 Pazar");
    expect(cell("2026-10-04")).toHaveAttribute("aria-pressed", "true");
    expect(cell("2026-10-04")).toHaveAttribute("aria-current", "date");

    // Rozetler: 3 Ekim (1), 4 Ekim (2), 18 Ekim (1); ay dışı Kasım 8 de ızgarada görünür (sonraki ay taşması değil)
    expect(within(cell("2026-10-04")).getByTestId("match-badge")).toHaveTextContent("2");
    expect(within(cell("2026-10-03")).getByTestId("match-badge")).toHaveTextContent("1");
    expect(cell("2026-10-18")).toHaveAttribute("data-has-matches", "true");
    expect(cell("2026-10-05")).toHaveAttribute("data-has-matches", "false");
    expect(within(cell("2026-10-05")).queryByTestId("match-badge")).toBeNull();

    const rows = screen.getAllByTestId("match-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("13:00");
    expect(rows[0]).toHaveTextContent("Fenerbahçe Medicana");
    expect(rows[0]).toHaveTextContent("TVF Burhan Felek Vestel Voleybol Salonu · İstanbul");
    expect(rows[0]).toHaveTextContent("TVF Voleybol TV");
    expect(rows[1]).toHaveTextContent("16:00");
    expect(rows[1]).toHaveTextContent("Aras Kargo");
    expect(rows[1]).toHaveTextContent("Zeren Spor");
  });

  it("bugün maç yoksa bir sonraki maç gününü seçer ve o ayı açar", () => {
    render(<TakvimCalendar matches={MATCHES} todayOverride="2026-10-05" />);
    expect(screen.getByTestId("selected-day-label")).toHaveTextContent("18 Ekim 2026 Pazar");
    expect(cell("2026-10-18")).toHaveAttribute("aria-pressed", "true");
    expect(cell("2026-10-05")).toHaveAttribute("aria-current", "date");
  });

  it("bir güne tıklamak o günün maçlarını gösterir ve URL'yi ?gun= ile günceller", () => {
    render(<TakvimCalendar matches={MATCHES} todayOverride="2026-10-04" />);
    fireEvent.click(cell("2026-10-18"));
    expect(screen.getByTestId("selected-day-label")).toHaveTextContent("18 Ekim 2026 Pazar");
    expect(cell("2026-10-18")).toHaveAttribute("aria-pressed", "true");
    expect(cell("2026-10-04")).toHaveAttribute("aria-pressed", "false");
    const rows = screen.getAllByTestId("match-row");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent("4. hafta");
    expect(rows[0]).toHaveTextContent("Ankara");
    expect(window.location.search).toBe("?gun=2026-10-18");
  });

  it("oynanmış maçta skoru ve set sonuçlarını gösterir; oynanmamışta göstermez", () => {
    render(<TakvimCalendar matches={MATCHES} todayOverride="2026-10-04" />);
    expect(screen.queryByTestId("set-scores")).toBeNull();
    expect(screen.queryByText("Bitti")).toBeNull();

    fireEvent.click(cell("2026-10-03"));
    expect(screen.getByTestId("home-score")).toHaveTextContent("3");
    expect(screen.getByTestId("away-score")).toHaveTextContent("1");
    expect(screen.getByTestId("set-scores")).toHaveTextContent("(25-16) (25-18) (23-25) (25-19)");
    expect(screen.getByText("Bitti")).toBeInTheDocument();
    expect(screen.getByTestId("match-row")).toHaveTextContent("TRT Spor");
  });

  it("maçsız günü seçince boş durum gösterir", () => {
    render(<TakvimCalendar matches={MATCHES} todayOverride="2026-10-04" />);
    fireEvent.click(cell("2026-10-06"));
    expect(screen.getByTestId("empty-state")).toHaveTextContent("Bu günde Sultanlar Ligi maçı yok");
    expect(screen.queryAllByTestId("match-row")).toHaveLength(0);
    expect(screen.getByTestId("selected-day-label")).toHaveTextContent("6 Ekim 2026 Salı");
  });

  it("saati açıklanmamış maçı belirtir", () => {
    render(<TakvimCalendar matches={MATCHES} todayOverride="2026-11-08" />);
    expect(screen.getByTestId("match-row")).toHaveTextContent("Saat açıklanmadı");
  });

  it("önceki/sonraki ay düğmeleri ayı değiştirir, seçili günü değiştirmez; Bugün düğmesi geri döner", () => {
    render(<TakvimCalendar matches={MATCHES} todayOverride="2026-10-04" />);
    fireEvent.click(screen.getByRole("button", { name: "Sonraki ay" }));
    expect(screen.getByRole("heading", { name: "Kasım 2026" })).toBeInTheDocument();
    expect(cell("2026-11-08")).toHaveAttribute("data-has-matches", "true");
    expect(screen.getByTestId("selected-day-label")).toHaveTextContent("4 Ekim 2026");

    fireEvent.click(screen.getByRole("button", { name: "Sonraki ay" }));
    expect(screen.getByRole("heading", { name: "Aralık 2026" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Önceki ay" }));
    fireEvent.click(screen.getByRole("button", { name: "Önceki ay" }));
    fireEvent.click(screen.getByRole("button", { name: "Önceki ay" }));
    expect(screen.getByRole("heading", { name: "Eylül 2026" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Bugün" }));
    expect(screen.getByRole("heading", { name: "Ekim 2026" })).toBeInTheDocument();
    expect(screen.getByTestId("selected-day-label")).toHaveTextContent("4 Ekim 2026");
    expect(window.location.search).toBe("?gun=2026-10-04");
  });

  it("ay dışı (komşu ay) bir güne tıklamak o aya geçer", () => {
    render(<TakvimCalendar matches={MATCHES} todayOverride="2026-10-04" />);
    fireEvent.click(cell("2026-11-01"));
    expect(screen.getByRole("heading", { name: "Kasım 2026" })).toBeInTheDocument();
    expect(cell("2026-11-01")).toHaveAttribute("aria-pressed", "true");
  });

  it("geçerli ?gun= değeri varsayılanı geçersiz kılar; geçersiz değer yok sayılır", () => {
    const { unmount } = render(<TakvimCalendar matches={MATCHES} todayOverride="2026-10-04" initialDateOverride="2026-11-08" />);
    expect(screen.getByTestId("selected-day-label")).toHaveTextContent("8 Kasım 2026");
    expect(screen.getByRole("heading", { name: "Kasım 2026" })).toBeInTheDocument();
    unmount();

    render(<TakvimCalendar matches={MATCHES} todayOverride="2026-10-04" initialDateOverride="2026-02-31" />);
    expect(screen.getByTestId("selected-day-label")).toHaveTextContent("4 Ekim 2026");
  });

  it("URL'deki ?gun= değerini okur", () => {
    window.history.replaceState(null, "", "/takvim?gun=2026-10-18");
    render(<TakvimCalendar matches={MATCHES} todayOverride="2026-10-04" />);
    expect(screen.getByTestId("selected-day-label")).toHaveTextContent("18 Ekim 2026");
  });

  it("ızgara Pazartesi başlar ve ayın günlerini doğru haftaya yerleştirir", () => {
    render(<TakvimCalendar matches={MATCHES} todayOverride="2026-10-04" />);
    const cells = Array.from(document.querySelectorAll<HTMLButtonElement>("button[data-date]"));
    expect(cells).toHaveLength(35);
    expect(cells[0].dataset.date).toBe("2026-09-28");
    expect(cells[3].dataset.date).toBe("2026-10-01");
    expect(screen.getByText("Pzt")).toBeInTheDocument();
    expect(screen.getByText("Paz")).toBeInTheDocument();
  });

  it("veri alınamadıysa uyarı gösterir ve ızgara boş çalışır", () => {
    render(<TakvimCalendar matches={[]} loadError todayOverride="2026-10-04" />);
    expect(screen.getByRole("alert")).toHaveTextContent("TVF fikstürü şu an alınamadı");
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.queryAllByTestId("match-badge")).toHaveLength(0);
  });
});

describe("TakvimeEkle", () => {
  it("üç abonelik adresini webcal:// bağlantısı olarak gösterir", () => {
    render(
      <TakvimeEkle
        subscriptions={[
          { slug: "fenerbahce-medicana", label: "Fenerbahçe Medicana" },
          { slug: "zeren-spor", label: "Zeren Spor" },
          { slug: "fenerbahce-medicana-zeren-spor", label: "İkisi birlikte" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: /Fenerbahçe Medicana/ })).toHaveAttribute("href", "webcal://altyapivoleybol.com.tr/takvim/fenerbahce-medicana.ics");
    expect(screen.getByRole("link", { name: /Zeren Spor/ })).toHaveAttribute("href", "webcal://altyapivoleybol.com.tr/takvim/zeren-spor.ics");
    expect(screen.getByRole("link", { name: /İkisi birlikte/ })).toHaveAttribute("href", webcalUrl("fenerbahce-medicana-zeren-spor"));
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });
});
