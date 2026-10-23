import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SyncRefreshButton } from "../SyncRefreshButton";

describe("SyncRefreshButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("opens password modal when Yenile button is clicked", () => {
    render(<SyncRefreshButton />);
    const btn = screen.getByRole("button", { name: "Verileri Yenile" });
    fireEvent.click(btn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("İşlem Şifresi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Çekimi Başlat" })).toBeDisabled();
  });

  it("shows error when wrong password is entered", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: false, error: "Hatalı şifre! İşlem başlatılamadı." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(<SyncRefreshButton />);
    fireEvent.click(screen.getByRole("button", { name: "Verileri Yenile" }));

    const input = screen.getByLabelText("İşlem Şifresi");
    fireEvent.change(input, { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Çekimi Başlat" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Hatalı şifre! İşlem başlatılamadı.");
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/sync/trigger",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ password: "000000" }),
      })
    );
  });

  it("starts sync with correct password (845780) and allows cancelling the running sync", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            mode: "github_actions",
            message: "81 İl ve Kadınlar 2. Ligi çekimi başlatıldı.",
            activeStep: "81 İl TVF bültenleri taranıyor...",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            mode: "github_actions",
            runId: 999,
            message: "Çekim işlemi iptal edildi.",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

    render(<SyncRefreshButton />);
    fireEvent.click(screen.getByRole("button", { name: "Verileri Yenile" }));

    const input = screen.getByLabelText("İşlem Şifresi");
    fireEvent.change(input, { target: { value: "845780" } });
    fireEvent.click(screen.getByRole("button", { name: "Çekimi Başlat" }));

    await waitFor(() => {
      expect(screen.getByText("Çekim İşlemi Devam Ediyor")).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole("button", { name: "Çekimi İptal Et" });
    expect(cancelBtn).toBeInTheDocument();

    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.getByText("İşlem İptal Edildi")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/sync/cancel",
      expect.objectContaining({
        method: "POST",
      })
    );
  });
});
