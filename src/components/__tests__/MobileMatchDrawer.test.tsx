import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileMatchDrawer } from "../MobileMatchDrawer";
import { Match } from "@/types/fixture";

describe("MobileMatchDrawer Component", () => {
  const mockMatch: Match = {
    id: "m-mob-1",
    date: "2026-10-25",
    time: "16:00",
    hall: "TVF Burhan Felek",
    category: "Genç Kızlar Süper Lig",
    age_group: "Genç",
    gender: "Kız",
    group: "A Grubu",
    match_no: "305",
    home_team: "Fenerbahçe",
    away_team: "VakıfBank",
    home_score: 3,
    away_score: 2,
    set_scores: ["25-23", "20-25", "25-21", "22-25", "15-12"],
    status: "finished",
  };

  it("isOpen false olduğunda veya maç seçili değilken hiçbir şey render etmez", () => {
    const { container: c1 } = render(
      <MobileMatchDrawer isOpen={false} match={mockMatch} onClose={vi.fn()} />
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <MobileMatchDrawer isOpen={true} match={null} onClose={vi.fn()} />
    );
    expect(c2.firstChild).toBeNull();
  });

  it("isOpen true olduğunda çekmeceyi, başlığı ve maç detaylarını render eder", () => {
    const onClose = vi.fn();
    render(
      <MobileMatchDrawer
        isOpen={true}
        match={mockMatch}
        onClose={onClose}
      />
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveClass("max-h-[85vh]");

    // Maç takımları ve skor
    expect(screen.getAllByText("Fenerbahçe").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("VakıfBank").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("3 : 2")).toBeInTheDocument();
  });

  it("arka plan karartmasına tıklandığında onClose tetiklenir", () => {
    const onClose = vi.fn();
    const { container } = render(
      <MobileMatchDrawer
        isOpen={true}
        match={mockMatch}
        onClose={onClose}
      />
    );

    const backdrop = container.querySelector("[aria-hidden='true']");
    expect(backdrop).toBeInTheDocument();
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it("Escape tuşuna basıldığında onClose tetiklenir", () => {
    const onClose = vi.fn();
    render(
      <MobileMatchDrawer
        isOpen={true}
        match={mockMatch}
        onClose={onClose}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("aşağı doğru kaydırma (swipe down) eşiği aşıldığında onClose tetiklenir", () => {
    const onClose = vi.fn();
    const { container } = render(
      <MobileMatchDrawer
        isOpen={true}
        match={mockMatch}
        onClose={onClose}
      />
    );

    const dragHandle = container.querySelector(".cursor-grab");
    expect(dragHandle).toBeInTheDocument();

    if (dragHandle) {
      // 150px aşağı çekme simülasyonu
      fireEvent.touchStart(dragHandle, {
        touches: [{ clientY: 100 }],
      });
      fireEvent.touchMove(dragHandle, {
        touches: [{ clientY: 250 }],
      });
      fireEvent.touchEnd(dragHandle);

      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });
});
