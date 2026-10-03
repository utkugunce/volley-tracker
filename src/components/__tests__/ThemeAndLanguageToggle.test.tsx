import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeToggle } from "../ThemeToggle";
import { LanguageToggle } from "../LanguageToggle";
import { T } from "../T";
import { THEME_STORAGE_KEY } from "@/theme/theme";
import { LANGUAGE_STORAGE_KEY } from "@/i18n/dictionary";

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.lang = "tr";
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
});

describe("ThemeToggle", () => {
  it("Sistem → Açık → Koyu döngüsünde ilerler, html'e uygular ve tercihi saklar", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("data-theme-preference")).toBe("system");

    fireEvent.click(button);
    expect(button.getAttribute("data-theme-preference")).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");

    fireEvent.click(button);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    fireEvent.click(button);
    expect(button.getAttribute("data-theme-preference")).toBe("system");
  });

  it("kayıtlı tercihi mount sonrası okur", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    render(<ThemeToggle />);
    expect(screen.getByRole("button").getAttribute("data-theme-preference")).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});

describe("LanguageToggle", () => {
  it("varsayılan Türkçe; tıklayınca İngilizceye geçer, kalıcıdır ve metinleri çevirir", () => {
    render(
      <>
        <LanguageToggle />
        <p data-testid="nav">
          <T k="nav.standings" />
        </p>
      </>,
    );
    expect(screen.getByTestId("nav").textContent).toBe("PUAN DURUMU");
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByTestId("nav").textContent).toBe("STANDINGS");
    expect(document.documentElement.lang).toBe("en");
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByTestId("nav").textContent).toBe("PUAN DURUMU");
    expect(document.documentElement.lang).toBe("tr");
  });
});
