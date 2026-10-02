import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Kadinlar2LigTeams } from "../Kadinlar2LigTeams";
import { Kadinlar2LigStandings } from "../Kadinlar2LigStandings";
import { Kadinlar2LigGroup, Kadinlar2LigTeam } from "@/types/kadinlar2Lig";

function team(overrides: Partial<Kadinlar2LigTeam>): Kadinlar2LigTeam {
  return {
    sira: 1,
    takim_id: "1",
    takim_adi: "",
    o: 0,
    g: 0,
    m: 0,
    p: 0,
    as: 0,
    vs: 0,
    sav: "0",
    asp: 0,
    vsp: 0,
    spav: "0",
    a3_0: 0,
    a3_1: 0,
    a3_2: 0,
    v2_3: 0,
    v1_3: 0,
    v0_3: 0,
    logo: "",
    sezon: "2026-2027",
    grup_no: 1,
    ...overrides,
  };
}

// 1) volleybox_name boş ama eşleme dosyasında var → Volleybox adı gösterilir
// 2) hiçbir yerde yok → TVF adı kalır (hata yok)
const teams: Kadinlar2LigTeam[] = [
  team({ takim_id: "1", takim_adi: "ARNAVUTKÖY BLD. SPOR", volleybox_name: null, volleybox_url: null }),
  team({ takim_id: "2", sira: 2, takim_adi: "BİLİNMEYEN TAKIM XYZ", volleybox_name: null, volleybox_url: null }),
];

describe("Kadınlar 2. Lig takım adları (Volleybox eşlemesi + güvenli geri dönüş)", () => {
  it("Takımlar sekmesi eşleşenleri Volleybox adıyla, eşleşmeyeni TVF adıyla gösterir", () => {
    render(<Kadinlar2LigTeams teams={teams} />);
    expect(screen.getAllByText("Arnavutköy Belediyesi SK").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BİLİNMEYEN TAKIM XYZ").length).toBeGreaterThan(0);
  });

  it("Puan durumu aynı adları kullanır", () => {
    const group: Kadinlar2LigGroup = {
      grup_no: 1,
      grup_adi: "Grup 1",
      takim_sayisi: 2,
      mac_sayisi: 0,
      puan_durumu: teams,
      fikstur: [],
    };
    render(<Kadinlar2LigStandings group={group} />);
    expect(screen.getAllByText("Arnavutköy Belediyesi SK").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BİLİNMEYEN TAKIM XYZ").length).toBeGreaterThan(0);
  });

  it("arama Volleybox adıyla da TVF adıyla da bulur", () => {
    const { unmount } = render(<Kadinlar2LigTeams teams={teams} searchQuery="belediyesi sk" />);
    expect(screen.getAllByText("Arnavutköy Belediyesi SK").length).toBeGreaterThan(0);
    expect(screen.queryByText("BİLİNMEYEN TAKIM XYZ")).not.toBeInTheDocument();
    unmount();
    render(<Kadinlar2LigTeams teams={teams} searchQuery="bld. spor" />);
    expect(screen.getAllByText("Arnavutköy Belediyesi SK").length).toBeGreaterThan(0);
  });
});
