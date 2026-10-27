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
  it("renders header with total team count and title", () => {
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

    expect(screen.getByText("Lig Ağacı")).toBeDefined();
    expect(screen.getByText("Uzman Posta Kadınlar 2. Ligi")).toBeDefined();
    expect(screen.getByText("22 Takım")).toBeDefined();
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

  it("renders bridge navigation links to Sultanlar and 1. Lig", () => {
    render(
      <Kadinlar2LigSidebar
        groups={mockGroups}
        selectedGroup={1}
        activeTab="standings"
        favoritesCount={0}
        onSelectGroup={vi.fn()}
        onSelectTab={vi.fn()}
      />
    );

    const sultanlarLink = screen.getByRole("link", { name: /Vodafone Sultanlar Ligi/i });
    expect(sultanlarLink).toBeDefined();
    expect(sultanlarLink.getAttribute("href")).toBe("/sultanlar-ligi");

    const lig1Link = screen.getByRole("link", { name: /KFC Kadınlar 1. Ligi/i });
    expect(lig1Link).toBeDefined();
    expect(lig1Link.getAttribute("href")).toBe("/kadinlar-1-ligi");
  });

  it("triggers onSelectGroup when a group button is clicked", () => {
    const handleSelectGroup = vi.fn();
    const handleSelectTab = vi.fn();

    render(
      <Kadinlar2LigSidebar
        groups={mockGroups}
        selectedGroup={1}
        activeTab="home"
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

  it("calls onToggleCollapse when collapse button is clicked", () => {
    const handleToggleCollapse = vi.fn();

    render(
      <Kadinlar2LigSidebar
        groups={mockGroups}
        selectedGroup={1}
        activeTab="standings"
        favoritesCount={1}
        onSelectGroup={vi.fn()}
        onSelectTab={vi.fn()}
        onToggleCollapse={handleToggleCollapse}
      />
    );

    const collapseBtn = screen.getByRole("button", { name: /Lig Ağacını Daralt/i });
    fireEvent.click(collapseBtn);

    expect(handleToggleCollapse).toHaveBeenCalledTimes(1);
  });
});
