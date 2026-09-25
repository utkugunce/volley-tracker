import { describe, it, expect } from "vitest";
import { getAppRoute, parseAppRoute } from "@/components/DashboardClient";
import { getCityNameFromSlug, isValidCitySlug } from "@/utils/cityHelper";

describe("Route Sync & City URL Mapping", () => {
  describe("getAppRoute", () => {
    it("generates correct clean routes when no city is selected (all)", () => {
      expect(getAppRoute("standings", "all")).toBe("/puan-durumu");
      expect(getAppRoute("fixtures", "all")).toBe("/fikstur");
      expect(getAppRoute("results", "all")).toBe("/sonuclar");
      expect(getAppRoute("today", "all")).toBe("/gunun-maclari");
      expect(getAppRoute("home", "all")).toBe("/");
      expect(getAppRoute("standings", "Tüm İller")).toBe("/puan-durumu");
      expect(getAppRoute("standings", undefined)).toBe("/puan-durumu");
    });

    it("generates city-scoped routes when a city is selected", () => {
      expect(getAppRoute("standings", "istanbul")).toBe("/puan-durumu/istanbul");
      expect(getAppRoute("fixtures", "ankara")).toBe("/fikstur/ankara");
      expect(getAppRoute("results", "izmir")).toBe("/sonuclar/izmir");
      expect(getAppRoute("today", "bursa")).toBe("/gunun-maclari/bursa");
      expect(getAppRoute("home", "bursa")).toBe("/bursa");
    });

    it("handles uppercase and mixed case city slugs gracefully", () => {
      expect(getAppRoute("standings", "ISTANBUL")).toBe("/puan-durumu/istanbul");
      expect(getAppRoute("fixtures", "Ankara")).toBe("/fikstur/ankara");
    });
  });

  describe("parseAppRoute", () => {
    it("parses root and standard routes correctly without city", () => {
      expect(parseAppRoute("/")).toEqual({ tab: "home", city: "all" });
      expect(parseAppRoute("")).toEqual({ tab: "home", city: "all" });
      expect(parseAppRoute("/puan-durumu")).toEqual({ tab: "standings", city: "all" });
      expect(parseAppRoute("/fikstur")).toEqual({ tab: "fixtures", city: "all" });
      expect(parseAppRoute("/sonuclar")).toEqual({ tab: "results", city: "all" });
      expect(parseAppRoute("/gunun-maclari")).toEqual({ tab: "today", city: "all" });
    });

    it("parses canonical /tab/city routes correctly", () => {
      expect(parseAppRoute("/puan-durumu/istanbul")).toEqual({ tab: "standings", city: "istanbul" });
      expect(parseAppRoute("/fikstur/ankara")).toEqual({ tab: "fixtures", city: "ankara" });
      expect(parseAppRoute("/sonuclar/izmir")).toEqual({ tab: "results", city: "izmir" });
      expect(parseAppRoute("/gunun-maclari/bursa")).toEqual({ tab: "today", city: "bursa" });
    });

    it("parses /city/tab alternative friendly routes correctly", () => {
      expect(parseAppRoute("/istanbul/puan-durumu")).toEqual({ tab: "standings", city: "istanbul" });
      expect(parseAppRoute("/ankara/fikstur")).toEqual({ tab: "fixtures", city: "ankara" });
      expect(parseAppRoute("/izmir/sonuclar")).toEqual({ tab: "results", city: "izmir" });
      expect(parseAppRoute("/bursa/gunun-maclari")).toEqual({ tab: "today", city: "bursa" });
    });

    it("parses direct city landing routes (/city)", () => {
      expect(parseAppRoute("/istanbul")).toEqual({ tab: "home", city: "istanbul" });
      expect(parseAppRoute("/ankara")).toEqual({ tab: "home", city: "ankara" });
    });
  });

  describe("cityHelper", () => {
    it("retrieves proper Turkish display names for known cities", () => {
      expect(getCityNameFromSlug("istanbul")).toBe("İstanbul");
      expect(getCityNameFromSlug("canakkale")).toBe("Çanakkale");
      expect(getCityNameFromSlug("ankara")).toBe("Ankara");
      expect(getCityNameFromSlug("all")).toBe("Tüm İller");
    });

    it("validates city slugs correctly", () => {
      expect(isValidCitySlug("istanbul")).toBe(true);
      expect(isValidCitySlug("ankara")).toBe(true);
      expect(isValidCitySlug("canakkale")).toBe(true);
      expect(isValidCitySlug("hayali-sehir-xyz-123")).toBe(false);
    });
  });
});
