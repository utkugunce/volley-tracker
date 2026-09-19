import { describe, it, expect } from "vitest";
import { getHallNavigationUrl, getHallDetails } from "../halls";

describe("Hall Navigation & Transit Utilities", () => {
  it("generates correct Google Maps search URL with hall and city", () => {
    const url = getHallNavigationUrl("50. Yıl Deniz Esinduy", "İstanbul");
    expect(url).toContain("https://www.google.com/maps/search/?api=1&query=");
    expect(decodeURIComponent(url)).toContain("50. Yıl Deniz Esinduy Spor Salonu İstanbul");
  });

  it("handles empty or TBD hall safely", () => {
    expect(getHallNavigationUrl("")).toBe("https://www.google.com/maps");
    expect(getHallNavigationUrl("TBD")).toBe("https://www.google.com/maps");
  });

  it("identifies known popular halls like Burhan Felek and Baskent", () => {
    const bf = getHallDetails("TVF Burhan Felek");
    expect(bf).not.toBeNull();
    expect(bf?.city).toBe("İstanbul");
    expect(bf?.metroTips).toBeDefined();

    const baskent = getHallDetails("Başkent Spor Salonu");
    expect(baskent).not.toBeNull();
    expect(baskent?.city).toBe("Ankara");
  });

  it("returns null for generic or unlisted halls", () => {
    expect(getHallDetails("Rastgele Bir Okul Salonu")).toBeNull();
  });
});
