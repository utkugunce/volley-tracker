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
});
