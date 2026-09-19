import { describe, it, expect, beforeEach, vi } from "vitest";
import { normalizeFavoriteKey, getStoredFavorites } from "../useFavorites";

describe("useFavorites Utility Functions", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("normalizes team names consistently regardless of casing and accents", () => {
    expect(normalizeFavoriteKey("Eryaman Gelişim SK")).toBe("eryaman-gelisim-sk");
    expect(normalizeFavoriteKey("eryaman gelisim sk")).toBe("eryaman-gelisim-sk");
    expect(normalizeFavoriteKey("  FENERBAHÇE  ")).toBe("fenerbahce");
  });

  it("returns empty array if no favorites in localStorage", () => {
    expect(getStoredFavorites()).toEqual([]);
  });

  it("parses valid json array from localStorage", () => {
    localStorage.setItem("volley_favorite_teams", JSON.stringify(["Eryaman Gelişim SK", "Vakıfbank"]));
    expect(getStoredFavorites()).toEqual(["Eryaman Gelişim SK", "Vakıfbank"]);
  });

  it("safely handles corrupted localStorage content", () => {
    localStorage.setItem("volley_favorite_teams", "{corrupt_json");
    expect(getStoredFavorites()).toEqual([]);
  });
});
