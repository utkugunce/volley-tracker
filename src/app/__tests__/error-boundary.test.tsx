import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "../error";
import GlobalError from "../global-error";

describe("ErrorBoundary & GlobalError Components", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    sessionStorage.clear();
    delete (window as unknown as { location?: unknown }).location;
    (window as unknown as { location: unknown }).location = {
      ...originalLocation,
      reload: vi.fn(),
      href: "http://localhost:3000",
    };
  });

  afterEach(() => {
    (window as unknown as { location: unknown }).location = originalLocation;
    vi.restoreAllMocks();
  });

  it("ErrorBoundary renders title, description, and action buttons with inline styles", () => {
    const reset = vi.fn();
    const error = new Error("Test generic error") as Error & { digest?: string };
    error.digest = "ABC-123";

    render(<ErrorBoundary error={error} reset={reset} />);

    expect(screen.getByText("Teknik Mola!")).toBeDefined();
    expect(
      screen.getByText(/Bu sayfa yüklenirken beklenmeyen bir aksaklık oluştu/)
    ).toBeDefined();
    expect(screen.getByText("Referans Kodu: ABC-123")).toBeDefined();

    const retryBtn = screen.getByRole("button", { name: /Tekrar Dene/i });
    expect(retryBtn).toBeDefined();

    fireEvent.click(retryBtn);
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  it("ErrorBoundary automatically reloads when ChunkLoadError occurs", () => {
    const reset = vi.fn();
    const chunkError = new Error("ChunkLoadError: Loading chunk 123 failed");

    render(<ErrorBoundary error={chunkError} reset={reset} />);

    expect(window.location.reload).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem("chunk_load_failed_reload")).toBeTruthy();
  });

  it("GlobalError renders root html/body with inline styles and retry button", () => {
    const reset = vi.fn();
    const error = new Error("Root crash");

    render(<GlobalError error={error} reset={reset} />);

    expect(screen.getByText("Teknik Mola!")).toBeDefined();
    expect(screen.getByText(/Uygulama yüklenirken beklenmedik bir aksaklık oluştu/)).toBeDefined();

    const retryBtn = screen.getByRole("button", { name: /Tekrar Dene/i });
    fireEvent.click(retryBtn);
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });
});
