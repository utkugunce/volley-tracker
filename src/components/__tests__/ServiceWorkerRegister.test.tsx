import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { ServiceWorkerRegister } from "../ServiceWorkerRegister";

describe("ServiceWorkerRegister Component", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    // Mock window.location.reload
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, reload: vi.fn() },
    });
  });

  afterEach(() => {
    sessionStorage.clear();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("reloads the page when a ChunkLoadError occurs", () => {
    render(<ServiceWorkerRegister />);

    const errorEvent = new ErrorEvent("error", {
      message: "Uncaught ChunkLoadError: Loading chunk 370 failed.",
    });
    window.dispatchEvent(errorEvent);

    expect(window.location.reload).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem("chunk_load_failed_reload")).not.toBeNull();
  });

  it("does not reload continuously if another ChunkLoadError occurs within cooldown", () => {
    // Simulate a recent reload 2 seconds ago
    sessionStorage.setItem("chunk_load_failed_reload", (Date.now() - 2000).toString());

    render(<ServiceWorkerRegister />);

    const errorEvent = new ErrorEvent("error", {
      message: "Uncaught ChunkLoadError: Loading chunk 370 failed.",
    });
    window.dispatchEvent(errorEvent);

    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it("reloads if cooldown period (15s) has passed", () => {
    // Simulate a reload 20 seconds ago
    sessionStorage.setItem("chunk_load_failed_reload", (Date.now() - 20000).toString());

    render(<ServiceWorkerRegister />);

    const errorEvent = new ErrorEvent("error", {
      message: "Uncaught ChunkLoadError: Loading chunk 370 failed.",
    });
    window.dispatchEvent(errorEvent);

    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  describe("service worker kaydı", () => {
    const registerMock = vi.fn();
    const originalSw = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");

    beforeEach(() => {
      registerMock.mockReset();
      registerMock.mockResolvedValue({ scope: "/", addEventListener: vi.fn() });
      Object.defineProperty(navigator, "serviceWorker", {
        configurable: true,
        value: { register: registerMock, addEventListener: vi.fn(), controller: null },
      });
    });

    afterEach(() => {
      delete (document as unknown as Record<string, unknown>).readyState;
      if (originalSw) Object.defineProperty(navigator, "serviceWorker", originalSw);
      else delete (navigator as unknown as Record<string, unknown>).serviceWorker;
    });

    it("sayfa zaten yüklenmişse (load olayı geçmişse) hemen kaydeder", () => {
      Object.defineProperty(document, "readyState", { configurable: true, get: () => "complete" });
      render(<ServiceWorkerRegister />);
      expect(registerMock).toHaveBeenCalledWith("/sw.js");
    });

    it("sayfa henüz yüklenmemişse load olayını bekler", () => {
      Object.defineProperty(document, "readyState", { configurable: true, get: () => "loading" });
      render(<ServiceWorkerRegister />);
      expect(registerMock).not.toHaveBeenCalled();
      window.dispatchEvent(new Event("load"));
      expect(registerMock).toHaveBeenCalledWith("/sw.js");
    });
  });
});
