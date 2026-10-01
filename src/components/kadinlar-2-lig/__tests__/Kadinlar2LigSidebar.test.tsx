import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Kadinlar2LigSidebar } from "../Kadinlar2LigSidebar";
import { Kadinlar2LigGroup } from "@/types/kadinlar2Lig";

const mockGroups: Kadinlar2LigGroup[] = [
  {
    grup_no: 1,
    grup_adi: "1. Grup",
    takim_sayisi: 10,
    mac_sayisi: 45,
    puan_durumu: [],
    fikstur: [],
  },
  {
    grup_no: 2,
    grup_adi: "2. Grup",
    takim_sayisi: 12,
    mac_sayisi: 66,
    puan_durumu: [],
    fikstur: [],
  },
];

describe("Kadinlar2LigSidebar Component (Stage 2 Integration)", () => {
  it("renders header with total match count and title", () => {
    render(
      <Kadinlar2LigSidebar
        groups={mockGroups}
        selectedGroup={1}
        activeTab="standings"
        favoritesCount={3}
        onSelectGroup={vi.fn()}
        onSelectTab={vi.fn()}
      />
    );

    expect(screen.getByText("Kadınlar 2. Lig")).toBeDefined();
    expect(screen.getByText("16 Grup Hiyerarşisi")).toBeDefined();
    expect(screen.getByText("111 Maç")).toBeDefined();
  });

  it("renders bridge navigation link to TVF Altyapı Ligleri (81 İl)", () => {
    render(
      <Kadinlar2LigSidebar
        groups={mockGroups}
        selectedGroup={1}
        activeTab="standings"
        favoritesCount={2}
        onSelectGroup={vi.fn()}
        onSelectTab={vi.fn()}
      />
    );

    const altyapiLink = screen.getByRole("link", { name: /TVF Altyapı Ligleri/i });
    expect(altyapiLink).toBeDefined();
    expect(altyapiLink.getAttribute("href")).toBe("/");
  });

  it("triggers onSelectTab when quick access items are clicked", () => {
    const handleSelectTab = vi.fn();
    render(
      <Kadinlar2LigSidebar
        groups={mockGroups}
        selectedGroup={1}
        activeTab="standings"
        favoritesCount={0}
        onSelectGroup={vi.fn()}
        onSelectTab={handleSelectTab}
      />
    );

    const leadersBtn = screen.getByRole("button", { name: /16 Grup Durumu/i });
    fireEvent.click(leadersBtn);
    expect(handleSelectTab).toHaveBeenCalledWith("leaders");

    const teamsBtn = screen.getByRole("button", { name: /Kulüpler/i });
    fireEvent.click(teamsBtn);
    expect(handleSelectTab).toHaveBeenCalledWith("teams");
  });

  it("triggers onSelectGroup and onSelectTab when a group button is clicked", () => {
    const handleSelectGroup = vi.fn();
    const handleSelectTab = vi.fn();

    render(
      <Kadinlar2LigSidebar
        groups={mockGroups}
        selectedGroup={1}
        activeTab="fixtures"
        favoritesCount={1}
        onSelectGroup={handleSelectGroup}
        onSelectTab={handleSelectTab}
      />
    );

    const group2Btn = screen.getByRole("button", { name: /Grup 2/i });
    fireEvent.click(group2Btn);

    expect(handleSelectGroup).toHaveBeenCalledWith(2);
    expect(handleSelectTab).toHaveBeenCalledWith("standings");
  });
});
