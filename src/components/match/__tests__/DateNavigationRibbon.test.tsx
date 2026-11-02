import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DateNavigationRibbon } from "../DateNavigationRibbon";

describe("DateNavigationRibbon", () => {
  const defaultCounts = { all: 100, live: 2, finished: 80, upcoming: 18 };

  it("availableDates sağlandığında 5 tarih sınırına takılmadan tüm hedef tarihleri (26-31 Ekim, 1 Kasım) gösterir", () => {
    const targetDates = [
      "2026-11-02",
      "2026-11-01",
      "2026-10-31",
      "2026-10-30",
      "2026-10-29",
      "2026-10-28",
      "2026-10-27",
      "2026-10-26",
    ];

    const onSelectDate = vi.fn();
    render(
      <DateNavigationRibbon
        selectedDate="all"
        onSelectDate={onSelectDate}
        todayStr="2026-11-02"
        statusFilter="all"
        onSelectStatusFilter={vi.fn()}
        counts={defaultCounts}
        availableDates={targetDates}
      />
    );

    // Tüm 8 hedef tarih ribbon içinde buton olarak bulunmalı
    for (const dt of targetDates) {
      const btn = screen.getByRole("button", { name: new RegExp(dt.slice(8, 10)) });
      expect(btn).toBeInTheDocument();
    }

    // 26 Ekim butonuna tıklandığında onSelectDate('2026-10-26') çağrılmalı
    const oct26Btn = screen.getByRole("button", { name: /26/ });
    fireEvent.click(oct26Btn);
    expect(onSelectDate).toHaveBeenCalledWith("2026-10-26");
  });

  it("availableDates verilmediğinde en az 28 günlük kayan pencere sunar ve 26 Ekim - 1 Kasım dahil edilir", () => {
    const onSelectDate = vi.fn();
    render(
      <DateNavigationRibbon
        selectedDate="2026-11-02"
        onSelectDate={onSelectDate}
        todayStr="2026-11-02"
        statusFilter="all"
        onSelectStatusFilter={vi.fn()}
        counts={defaultCounts}
      />
    );

    // 26, 27, 28, 29, 30, 31 Ekim ve 1 Kasım gün butonları bulunmalı
    for (const day of ["26", "27", "28", "29", "30", "31", "01"]) {
      const btn = screen.getByRole("button", { name: new RegExp(day) });
      expect(btn).toBeInTheDocument();
    }
  });

  it("sol ve sağ kaydırma ok butonları mevcuttur ve tıklandığında hata vermez", () => {
    render(
      <DateNavigationRibbon
        selectedDate="all"
        onSelectDate={vi.fn()}
        todayStr="2026-11-02"
        statusFilter="all"
        onSelectStatusFilter={vi.fn()}
        counts={defaultCounts}
      />
    );

    const prevBtn = screen.getByRole("button", { name: "Önceki tarihler" });
    const nextBtn = screen.getByRole("button", { name: "Sonraki tarihler" });
    expect(prevBtn).toBeInTheDocument();
    expect(nextBtn).toBeInTheDocument();

    fireEvent.click(prevBtn);
    fireEvent.click(nextBtn);
  });
});
