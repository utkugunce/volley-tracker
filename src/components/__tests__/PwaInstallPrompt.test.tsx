import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PwaInstallPrompt, STORAGE_KEY, DISMISS_COOLDOWN_DAYS } from "../PwaInstallPrompt";

describe("PwaInstallPrompt Component", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("does not render install prompt initially on desktop if no beforeinstallprompt event fired", () => {
    render(<PwaInstallPrompt />);
    expect(screen.queryByText("Uygulamayı Yükle")).not.toBeInTheDocument();
  });

  it("renders install prompt when beforeinstallprompt event is fired", () => {
    render(<PwaInstallPrompt />);

    act(() => {
      const event = new Event("beforeinstallprompt");
      Object.assign(event, {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: "dismissed" }),
      });
      window.dispatchEvent(event);
    });

    expect(screen.getByText("Uygulamayı Yükle")).toBeInTheDocument();
  });

  it("persists dismissal in localStorage for 14 days when dismiss button is clicked", () => {
    render(<PwaInstallPrompt />);

    act(() => {
      const event = new Event("beforeinstallprompt");
      Object.assign(event, {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: "dismissed" }),
      });
      window.dispatchEvent(event);
    });

    const dismissBtn = screen.getByLabelText("Yükleme istemini 14 gün gizle");
    expect(dismissBtn).toBeInTheDocument();

    fireEvent.click(dismissBtn);

    // Should be hidden immediately
    expect(screen.queryByText("Uygulamayı Yükle")).not.toBeInTheDocument();

    // Should be saved in localStorage
    const savedTimestamp = localStorage.getItem(STORAGE_KEY);
    expect(savedTimestamp).not.toBeNull();
    const timestampNum = parseInt(savedTimestamp!, 10);
    expect(Date.now() - timestampNum).toBeLessThan(2000);
  });

  it("does not show prompt on mount if dismissed within 14 days", () => {
    // 5 days ago
    const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, fiveDaysAgo.toString());

    render(<PwaInstallPrompt />);

    act(() => {
      const event = new Event("beforeinstallprompt");
      Object.assign(event, {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: "dismissed" }),
      });
      window.dispatchEvent(event);
    });

    // Should NOT show because 5 < 14 days
    expect(screen.queryByText("Uygulamayı Yükle")).not.toBeInTheDocument();
  });

  it("shows prompt if dismissed more than 14 days ago", () => {
    // 15 days ago
    const fifteenDaysAgo = Date.now() - (DISMISS_COOLDOWN_DAYS + 1) * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, fifteenDaysAgo.toString());

    render(<PwaInstallPrompt />);

    act(() => {
      const event = new Event("beforeinstallprompt");
      Object.assign(event, {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: "dismissed" }),
      });
      window.dispatchEvent(event);
    });

    // Should show because 15 > 14 days
    expect(screen.getByText("Uygulamayı Yükle")).toBeInTheDocument();
  });
});
