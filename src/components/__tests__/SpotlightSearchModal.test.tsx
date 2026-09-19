import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SpotlightSearchModal } from "../SpotlightSearchModal";

// Next/navigation mock
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("SpotlightSearchModal Component", () => {
  it("açık olduğunda arama kutusunu ve takım önerilerini listeler", () => {
    const onClose = vi.fn();
    render(
      <SpotlightSearchModal
        isOpen={true}
        onClose={onClose}
        teams={["VakıfBank", "Fenerbahçe", "Eczacıbaşı"]}
        halls={["50. Yıl", "Burhan Felek"]}
        cities={[{ name: "İstanbul", slug: "istanbul" }]}
      />
    );

    expect(screen.getByPlaceholderText(/Takım, salon veya şehir ara/i)).toBeInTheDocument();
    expect(screen.getByText("VakıfBank")).toBeInTheDocument();
    expect(screen.getByText("Fenerbahçe")).toBeInTheDocument();
  });

  it("arama yapıldığında eşleşen sonuçları filtreler", () => {
    render(
      <SpotlightSearchModal
        isOpen={true}
        onClose={vi.fn()}
        teams={["VakıfBank", "Fenerbahçe", "Eczacıbaşı"]}
        halls={["50. Yıl", "Burhan Felek"]}
        cities={[{ name: "İzmir", slug: "izmir" }]}
      />
    );

    const input = screen.getByPlaceholderText(/Takım, salon veya şehir ara/i);
    fireEvent.change(input, { target: { value: "Fener" } });

    expect(screen.getByText("Fenerbahçe")).toBeInTheDocument();
    expect(screen.queryByText("VakıfBank")).not.toBeInTheDocument();
  });

  it("ESC veya kapat butonuna basıldığında onClose tetiklenir", () => {
    const onClose = vi.fn();
    render(
      <SpotlightSearchModal
        isOpen={true}
        onClose={onClose}
        teams={["VakıfBank"]}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
