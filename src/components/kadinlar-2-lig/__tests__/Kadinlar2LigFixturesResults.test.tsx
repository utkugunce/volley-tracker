import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Kadinlar2LigFixtures } from "../Kadinlar2LigFixtures";
import { Kadinlar2LigResults } from "../Kadinlar2LigResults";
import { Kadinlar2LigTodayMatches } from "../Kadinlar2LigTodayMatches";
import { Kadinlar2LigGroup, Kadinlar2LigMatch } from "@/types/kadinlar2Lig";

describe("Kadinlar2LigFixtures and Results Altyapı UI Tests", () => {
  const mockMatches: Kadinlar2LigMatch[] = [
    {
      id: "k2-1",
      mac_no: "101",
      grup_no: 1,
      grup_adi: "1. Grup",
      hafta: 1,
      devre: 1,
      tarih: "26.09.2026",
      gun: "Cumartesi",
      saat: "14:00",
      sehir: "İSTANBUL",
      salon: "50. Yıl Deniz Esinduy",
      takim_a: "VakıfBank 2",
      takim_b: "Eczacıbaşı 2",
      takim_a_id: "t1",
      takim_b_id: "t2",
      takim_a_logo: "",
      takim_b_logo: "",
      set_a: "3",
      set_b: "1",
      skor: "3-1",
      set_sonuclari: "(25-20) (22-25) (25-18) (25-15)",
      durum: "BİTTİ",
      mac_durumu_kod: "3",
      takim_a_volleybox_url: "https://women.volleybox.net/tr/vakifbank",
      takim_b_volleybox_url: "https://women.volleybox.net/tr/eczacibasi",
    },
    {
      id: "k2-2",
      mac_no: "102",
      grup_no: 1,
      grup_adi: "1. Grup",
      hafta: 1,
      devre: 1,
      tarih: "27.09.2026",
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
      skor: "- : -",
      set_sonuclari: "",
      durum: "OYNANACAK",
      mac_durumu_kod: "0",
    },
  ];

  const mockGroup: Kadinlar2LigGroup = {
    grup_no: 1,
    grup_adi: "1. Grup",
    takim_sayisi: 12,
    mac_sayisi: 132,
    puan_durumu: [],
    fikstur: mockMatches,
  };

  it("Kadinlar2LigFixtures altyapı tarih şeridi ve kompakt maç akışını render eder", () => {
    const handleSelectMatch = vi.fn();
    render(
      <Kadinlar2LigFixtures
        group={mockGroup}
        onSelectMatch={handleSelectMatch}
      />
    );

    // Hafta filtre butonu
    expect(screen.getByRole("button", { name: /Tüm Haftalar/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /1\. Hafta/i }).length).toBeGreaterThan(0);

    // Volleybox filtreleri
    expect(screen.getByRole("button", { name: /Skorlu/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Skorsuz/i })).toBeInTheDocument();

    // Takımlar FixtureTable içinde görünmeli
    expect(screen.getByText("VakıfBank 2")).toBeInTheDocument();
    expect(screen.getByText("Eczacıbaşı 2")).toBeInTheDocument();
    expect(screen.getByText("Fenerbahçe 2")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "TÜMÜ" })).toBeInTheDocument();
  });

  it("Kadinlar2LigResults altyapı tarih şeridi ve kompakt maç akışını listeler", () => {
    const handleSelectMatch = vi.fn();
    render(
      <Kadinlar2LigResults
        allMatches={mockMatches}
        groups={[mockGroup]}
        onSelectMatch={handleSelectMatch}
      />
    );

    // Tamamlanan Maç Sonuçları başlığı
    expect(screen.getByText("Tamamlanan Maç Sonuçları")).toBeInTheDocument();

    // Biten maç (VakıfBank 2 vs Eczacıbaşı 2) görünmeli
    expect(screen.getByText("VakıfBank 2")).toBeInTheDocument();
    expect(screen.getByText("Eczacıbaşı 2")).toBeInTheDocument();
    expect(screen.getAllByText("3", { exact: true }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("25", { exact: true }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("20", { exact: true }).length).toBeGreaterThan(0);

    // Henüz oynanmamış maç sonuçlar sayfasında görünmemeli
    expect(screen.queryByText("Fenerbahçe 2")).not.toBeInTheDocument();
  });

  it("Kadinlar2LigTodayMatches altyapı tarih şeridi ve kompakt maç akışını kullanır", () => {
    render(
      <Kadinlar2LigTodayMatches
        allMatches={mockMatches}
        groups={[mockGroup]}
        onSelectMatch={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "TÜMÜ" }));

    expect(screen.getByRole("button", { name: /Tümü\(2\)/ })).toBeInTheDocument();
    expect(screen.getByText("VakıfBank 2")).toBeInTheDocument();
    expect(screen.getByText("Fenerbahçe 2")).toBeInTheDocument();
  });

  it("Kadinlar2LigFixtures tüm gruplar seçildiğinde tüm grupların maçlarını listeler", () => {
    const mockGroup2: Kadinlar2LigGroup = {
      grup_no: 2,
      grup_adi: "2. Grup",
      takim_sayisi: 10,
      mac_sayisi: 90,
      puan_durumu: [],
      fikstur: [
        {
          id: "k2-g2-1",
          mac_no: "201",
          grup_no: 2,
          grup_adi: "2. Grup",
          hafta: 1,
          devre: 1,
          tarih: "28.09.2026",
          gun: "Pazartesi",
          saat: "18:00",
          sehir: "İSTANBUL",
          salon: "50. Yıl",
          takim_a: "Beşiktaş 2",
          takim_b: "Sarıyer 2",
          takim_a_id: "t7",
          takim_b_id: "t8",
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
    };

    render(
      <Kadinlar2LigFixtures
        groups={[mockGroup, mockGroup2]}
        isAllGroups={true}
        onSelectMatch={vi.fn()}
      />
    );

    // Her iki gruptan takımlar görünmeli
    expect(screen.getByText("VakıfBank 2")).toBeInTheDocument();
    expect(screen.getByText("Beşiktaş 2")).toBeInTheDocument();
    expect(screen.getAllByText(/1\. Grup/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2\. Grup/i).length).toBeGreaterThan(0);
  });

  it("Kadinlar2LigFixtures Değişenler butonuna tıklandığında değişen maçı filtreleyip gösterir", () => {
    const discrepancyMatch: Kadinlar2LigMatch = {
      id: "k2-disc-1",
      mac_no: "109",
      grup_no: 10,
      grup_adi: "10. Grup",
      hafta: 3,
      devre: 1,
      tarih: "04.10.2026",
      gun: "Pazar",
      saat: "14:00",
      sehir: "KOCAELİ",
      salon: "Gölcük",
      takim_a: "CADENCE BOYA GÖLCÜK İHSANİYE",
      takim_b: "BOLU ATATÜRK ANADOLU LİSESİ",
      takim_a_id: "t9",
      takim_b_id: "t10",
      takim_a_logo: "",
      takim_b_logo: "",
      set_a: "",
      set_b: "",
      skor: "",
      set_sonuclari: "",
      durum: "OYNANACAK",
      mac_durumu_kod: "0",
      discrepancy: {
        has_diff: true,
        details: "Tarih veya saat Volleybox ile farklı",
      },
    };

    render(
      <Kadinlar2LigFixtures
        group={{
          grup_no: 10,
          grup_adi: "10. Grup",
          takim_sayisi: 11,
          mac_sayisi: 50,
          puan_durumu: [],
          fikstur: [discrepancyMatch, mockMatches[0]],
        }}
        onSelectMatch={vi.fn()}
      />
    );

    // Değişenler butonunda (1) yazmalı
    const discBtn = screen.getByRole("button", { name: /Değişenler \(1\)/i });
    expect(discBtn).toBeInTheDocument();

    // Değişenler butonuna tıkla
    fireEvent.click(discBtn);

    // Değişen maç görünmeli ve diğer normal maç filtrelenmeli
    expect(screen.getByText(/Cadence Boya/i)).toBeInTheDocument();
    expect(screen.queryByText("VakıfBank 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Karşılaşma Bulunamadı")).not.toBeInTheDocument();
  });
});
