import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Kadinlar2LigFixtures } from "../Kadinlar2LigFixtures";
import { Kadinlar2LigResults } from "../Kadinlar2LigResults";
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
      set_sonuclari: "25-20, 22-25, 25-18, 25-15",
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

  it("Kadinlar2LigFixtures Altyapı FixtureTable bileşenini ve kontrollerini render eder", () => {
    const handleSelectMatch = vi.fn();
    render(
      <Kadinlar2LigFixtures
        group={mockGroup}
        onSelectMatch={handleSelectMatch}
      />
    );

    // Hafta filtre butonu
    expect(screen.getByRole("button", { name: /Tüm Haftalar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /1\. Hafta/i })).toBeInTheDocument();

    // Volleybox filtreleri
    expect(screen.getByRole("button", { name: /Skorlu/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Skorsuz/i })).toBeInTheDocument();

    // Takımlar FixtureTable içinde görünmeli
    expect(screen.getByText("VakıfBank 2")).toBeInTheDocument();
    expect(screen.getByText("Eczacıbaşı 2")).toBeInTheDocument();
    expect(screen.getByText("Fenerbahçe 2")).toBeInTheDocument();

    // Görünüm seçici butonları (Liste & Grid)
    expect(screen.getByLabelText("Liste Görünümü")).toBeInTheDocument();
    expect(screen.getByLabelText("Yayın Kartı Görünümü")).toBeInTheDocument();
  });

  it("Kadinlar2LigResults DateRibbon ve FixtureTable ile tamamlanan maçları listeler", () => {
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
    expect(screen.getByText(/3\s*-\s*1/)).toBeInTheDocument();

    // Henüz oynanmamış maç sonuçlar sayfasında görünmemeli
    expect(screen.queryByText("Fenerbahçe 2")).not.toBeInTheDocument();
  });
});
