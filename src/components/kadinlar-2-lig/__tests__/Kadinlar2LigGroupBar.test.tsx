import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Kadinlar2LigGroupBar } from "../Kadinlar2LigGroupBar";
import { Kadinlar2LigGroup } from "@/types/kadinlar2Lig";

describe("Kadinlar2LigGroupBar Component", () => {
  const mockGroups: Kadinlar2LigGroup[] = [
    {
      grup_no: 1,
      grup_adi: "1. Grup",
      takim_sayisi: 12,
      mac_sayisi: 132,
      puan_durumu: [],
      fikstur: [],
    },
    {
      grup_no: 2,
      grup_adi: "2. Grup",
      takim_sayisi: 11,
      mac_sayisi: 110,
      puan_durumu: [],
      fikstur: [],
    },
    {
      grup_no: 11,
      grup_adi: "11. Grup",
      takim_sayisi: 10,
      mac_sayisi: 90,
      puan_durumu: [],
      fikstur: [],
    },
  ];

  it("başlangıçta seçili grubun dropdown menü butonunu ve hızlı grup butonlarını render eder", () => {
    const handleSelect = vi.fn();
    render(
      <Kadinlar2LigGroupBar
        groups={mockGroups}
        selectedGroup={1}
        onSelectGroup={handleSelect}
      />
    );

    // Dropdown butonu seçili 1. Grup'u göstermeli
    const dropdownBtn = screen.getByRole("button", { name: /1\. Grup/i });
    expect(dropdownBtn).toBeInTheDocument();

    // Hızlı grup butonları görünmeli
    expect(screen.getByTitle("Kadınlar 2. Ligi 1. Grup")).toBeInTheDocument();
    expect(screen.getByTitle("Kadınlar 2. Ligi 2. Grup")).toBeInTheDocument();
    expect(screen.getByTitle("Kadınlar 2. Ligi 11. Grup")).toBeInTheDocument();

    // İl seçimi veya şehir filtresi bulunmamalı
    expect(screen.queryByPlaceholderText(/İl ara/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tüm İller/i)).not.toBeInTheDocument();
  });

  it("dropdown açıldığında tüm gruplar listelenir ve grup seçildiğinde onSelectGroup tetiklenir", () => {
    const handleSelect = vi.fn();
    render(
      <Kadinlar2LigGroupBar
        groups={mockGroups}
        selectedGroup={1}
        onSelectGroup={handleSelect}
      />
    );

    const dropdownBtn = screen.getByRole("button", { name: /1\. Grup/i });
    fireEvent.click(dropdownBtn);

    // Dropdown popup başlığı ve seçenekleri görünmeli
    expect(screen.getByText("Kadınlar 2. Ligi Grupları")).toBeInTheDocument();
    const group11Option = screen.getByRole("option", { name: /11\. Grup/i });
    expect(group11Option).toBeInTheDocument();

    // 11. Grup'a tıkla
    fireEvent.click(group11Option);
    expect(handleSelect).toHaveBeenCalledWith(11);
  });

  it("hızlı grup butonuna tıklandığında onSelectGroup tetiklenir", () => {
    const handleSelect = vi.fn();
    render(
      <Kadinlar2LigGroupBar
        groups={mockGroups}
        selectedGroup={1}
        onSelectGroup={handleSelect}
      />
    );

    const group2Btn = screen.getByTitle("Kadınlar 2. Ligi 2. Grup");
    fireEvent.click(group2Btn);

    expect(handleSelect).toHaveBeenCalledWith(2);
  });

  it("Tüm Gruplar seçildiğinde ve dropdown/hap butonlarından tıklandığında onSelectGroup('all') tetiklenir", () => {
    const handleSelect = vi.fn();
    const { rerender } = render(
      <Kadinlar2LigGroupBar
        groups={mockGroups}
        selectedGroup={1}
        onSelectGroup={handleSelect}
      />
    );

    // Hızlı "Tüm Gruplar" butonuna tıkla
    const allGroupsPill = screen.getByTitle("Kadınlar 2. Ligi Tüm Gruplar");
    expect(allGroupsPill).toBeInTheDocument();
    fireEvent.click(allGroupsPill);
    expect(handleSelect).toHaveBeenCalledWith("all");

    // selectedGroup="all" olduğunda dropdown butonunda "Tüm Gruplar" görünmeli
    rerender(
      <Kadinlar2LigGroupBar
        groups={mockGroups}
        selectedGroup="all"
        onSelectGroup={handleSelect}
      />
    );
    const dropdownBtn = screen.getByRole("button", { name: "Kadınlar 2. Ligi Tüm Gruplar" });
    expect(dropdownBtn).toBeInTheDocument();

    // Dropdown açıldığında "Tüm Gruplar" seçeneği bulunmalı
    fireEvent.click(dropdownBtn);
    const allOption = screen.getByRole("option", { name: /Tüm Gruplar/i });
    expect(allOption).toBeInTheDocument();
    fireEvent.click(allOption);
    expect(handleSelect).toHaveBeenCalledWith("all");
  });
});
