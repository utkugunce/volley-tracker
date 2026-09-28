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
      fikstur: [
        {
          id: "m1",
          mac_no: "101",
          grup_no: 1,
          grup_adi: "1. Grup",
          hafta: 1,
          devre: 1,
          tarih: "11.10.2026",
          gun: "Pazar",
          saat: "14:00",
          sehir: "İSTANBUL",
          salon: "50. Yıl Deniz Esinduy",
          takim_a: "VakıfBank 2",
          takim_b: "Eczacıbaşı 2",
          takim_a_id: "t1",
          takim_b_id: "t2",
          takim_a_logo: "",
          takim_b_logo: "",
          set_a: "",
          set_b: "",
          skor: "",
          set_sonuclari: "",
          durum: "OYNANACAK",
          mac_durumu_kod: "0",
        },
      ],
    },
    {
      grup_no: 2,
      grup_adi: "2. Grup",
      takim_sayisi: 11,
      mac_sayisi: 110,
      puan_durumu: [],
      fikstur: [
        {
          id: "m2",
          mac_no: "201",
          grup_no: 2,
          grup_adi: "2. Grup",
          hafta: 1,
          devre: 1,
          tarih: "11.10.2026",
          gun: "Pazar",
          saat: "16:00",
          sehir: "İSTANBUL",
          salon: "Burhan Felek",
          takim_a: "Fenerbahçe 2",
          takim_b: "Galatasaray 2",
          takim_a_id: "t3",
          takim_b_id: "t4",
          takim_a_logo: "",
          takim_b_logo: "",
          set_a: "",
          set_b: "",
          skor: "",
          set_sonuclari: "",
          durum: "OYNANACAK",
          mac_durumu_kod: "0",
        },
      ],
    },
    {
      grup_no: 11,
      grup_adi: "11. Grup",
      takim_sayisi: 10,
      mac_sayisi: 90,
      puan_durumu: [],
      fikstur: [
        {
          id: "m3",
          mac_no: "1101",
          grup_no: 11,
          grup_adi: "11. Grup",
          hafta: 1,
          devre: 1,
          tarih: "11.10.2026",
          gun: "Pazar",
          saat: "13:00",
          sehir: "ANKARA",
          salon: "Beştepe",
          takim_a: "Karayolları",
          takim_b: "TED Ankara",
          takim_a_id: "t5",
          takim_b_id: "t6",
          takim_a_logo: "",
          takim_b_logo: "",
          set_a: "",
          set_b: "",
          skor: "",
          set_sonuclari: "",
          durum: "OYNANACAK",
          mac_durumu_kod: "0",
        },
      ],
    },
  ];

  it("başlangıçta dropdown menü butonunu ve seçili ilin gruplarını render eder", () => {
    const handleSelect = vi.fn();
    render(
      <Kadinlar2LigGroupBar
        groups={mockGroups}
        selectedGroup={1}
        onSelectGroup={handleSelect}
      />
    );

    // Dropdown butonu İstanbul'u göstermeli (Grup 1 İstanbul'a ait)
    const dropdownBtn = screen.getByRole("button", { name: /İstanbul/i });
    expect(dropdownBtn).toBeInTheDocument();

    // İstanbul'a ait Grup 1 ve Grup 2 butonları görünmeli
    expect(screen.getByTitle("Kadınlar 2. Ligi 1. Grup")).toBeInTheDocument();
    expect(screen.getByTitle("Kadınlar 2. Ligi 2. Grup")).toBeInTheDocument();

    // Ankara'ya ait Grup 11 başlangıçta görünmemeli (çünkü İstanbul seçili)
    expect(screen.queryByTitle("Kadınlar 2. Ligi 11. Grup")).not.toBeInTheDocument();
  });

  it("dropdown açıldığında şehir araması yapılabilir ve Ankara seçilince 11. grup açılır", () => {
    const handleSelect = vi.fn();
    render(
      <Kadinlar2LigGroupBar
        groups={mockGroups}
        selectedGroup={1}
        onSelectGroup={handleSelect}
      />
    );

    const dropdownBtn = screen.getByRole("button", { name: /İstanbul/i });
    fireEvent.click(dropdownBtn);

    // Arama inputu görünmeli
    const searchInput = screen.getByPlaceholderText(/İl ara/i);
    expect(searchInput).toBeInTheDocument();

    // Ankara opsiyonu görünmeli ve tıklanmalı
    const ankaraOption = screen.getByRole("option", { name: /Ankara/i });
    expect(ankaraOption).toBeInTheDocument();
    fireEvent.click(ankaraOption);

    // handleSelect 11 için çağrılmış olmalı
    expect(handleSelect).toHaveBeenCalledWith(11);
  });

  it("Tüm İller seçildiğinde tüm gruplar listelenir", () => {
    const handleSelect = vi.fn();
    render(
      <Kadinlar2LigGroupBar
        groups={mockGroups}
        selectedGroup={1}
        onSelectGroup={handleSelect}
      />
    );

    const dropdownBtn = screen.getByRole("button", { name: /İstanbul/i });
    fireEvent.click(dropdownBtn);

    const tumIllerOption = screen.getByRole("option", { name: /Tüm İller/i });
    fireEvent.click(tumIllerOption);

    // Tüm gruplar görünmeli
    expect(screen.getByTitle("Kadınlar 2. Ligi 1. Grup")).toBeInTheDocument();
    expect(screen.getByTitle("Kadınlar 2. Ligi 2. Grup")).toBeInTheDocument();
    expect(screen.getByTitle("Kadınlar 2. Ligi 11. Grup")).toBeInTheDocument();
  });

  it("Filtreleri Gizle / Aç butonu ile kategori ve grup bölümü açılıp kapatılabilir", () => {
    const handleSelect = vi.fn();
    render(
      <Kadinlar2LigGroupBar
        groups={mockGroups}
        selectedGroup={1}
        onSelectGroup={handleSelect}
      />
    );

    const toggleBtn = screen.getByRole("button", { name: /Filtreleri Gizle/i });
    expect(toggleBtn).toBeInTheDocument();

    // Gizle'ye bas
    fireEvent.click(toggleBtn);
    expect(screen.getByRole("button", { name: /Kategori & Grupları Aç/i })).toBeInTheDocument();
    expect(screen.queryByTitle("Kadınlar 2. Ligi 1. Grup")).not.toBeInTheDocument();

    // Tekrar Aç'a bas
    const openBtn = screen.getByRole("button", { name: /Kategori & Grupları Aç/i });
    fireEvent.click(openBtn);
    expect(screen.getByTitle("Kadınlar 2. Ligi 1. Grup")).toBeInTheDocument();
  });
});
