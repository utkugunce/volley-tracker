import { describe, it, expect } from "vitest";
import {
  getKadinlar1LigRoute,
  isValidKadinlar1LigSlug,
  parseKadinlar1LigRoute,
} from "../kadinlar1LigRoutes";

describe("kadinlar1LigRoutes", () => {
  describe("getKadinlar1LigRoute", () => {
    it("returns /kadinlar-1-ligi for home tab", () => {
      expect(getKadinlar1LigRoute("home")).toBe("/kadinlar-1-ligi");
      expect(getKadinlar1LigRoute("home", 1)).toBe("/kadinlar-1-ligi");
    });

    it("returns /kadinlar-1-ligi/puan-durumu for group 1 (A Grubu)", () => {
      expect(getKadinlar1LigRoute("standings")).toBe("/kadinlar-1-ligi/puan-durumu");
      expect(getKadinlar1LigRoute("standings", 1)).toBe("/kadinlar-1-ligi/puan-durumu");
    });

    it("returns /kadinlar-1-ligi/puan-durumu/grup-b for group 2", () => {
      expect(getKadinlar1LigRoute("standings", 2)).toBe("/kadinlar-1-ligi/puan-durumu/grup-b");
    });

    it("returns /kadinlar-1-ligi/puan-durumu/tum-gruplar for all groups", () => {
      expect(getKadinlar1LigRoute("standings", "all")).toBe("/kadinlar-1-ligi/puan-durumu/tum-gruplar");
    });

    it("returns /kadinlar-1-ligi/fikstur for group 1 and /grup-b for group 2", () => {
      expect(getKadinlar1LigRoute("fixtures", 1)).toBe("/kadinlar-1-ligi/fikstur");
      expect(getKadinlar1LigRoute("fixtures", 2)).toBe("/kadinlar-1-ligi/fikstur/grup-b");
      expect(getKadinlar1LigRoute("fixtures", "all")).toBe("/kadinlar-1-ligi/fikstur/tum-gruplar");
    });

    it("returns other tab routes", () => {
      expect(getKadinlar1LigRoute("results")).toBe("/kadinlar-1-ligi/sonuclar");
      expect(getKadinlar1LigRoute("today")).toBe("/kadinlar-1-ligi/gunun-maclari");
      expect(getKadinlar1LigRoute("leaders")).toBe("/kadinlar-1-ligi/grup-durumu");
      expect(getKadinlar1LigRoute("teams")).toBe("/kadinlar-1-ligi/takimlar");
      expect(getKadinlar1LigRoute("karsilastir")).toBe("/kadinlar-1-ligi/karsilastir");
      expect(getKadinlar1LigRoute("statu")).toBe("/kadinlar-1-ligi/statu");
    });
  });

  describe("parseKadinlar1LigRoute", () => {
    it("parses base route as home tab", () => {
      expect(parseKadinlar1LigRoute("/kadinlar-1-ligi")).toEqual({
        tab: "home",
        groupNo: 1,
      });
      expect(parseKadinlar1LigRoute("/kadinlar-1-ligi/anasayfa")).toEqual({
        tab: "home",
        groupNo: 1,
      });
    });

    it("parses groups correctly", () => {
      expect(parseKadinlar1LigRoute("/kadinlar-1-ligi/puan-durumu")).toEqual({
        tab: "standings",
        groupNo: 1,
      });
      expect(parseKadinlar1LigRoute("/kadinlar-1-ligi/puan-durumu/grup-b")).toEqual({
        tab: "standings",
        groupNo: 2,
      });
      expect(parseKadinlar1LigRoute("/kadinlar-1-ligi/puan-durumu/tum-gruplar")).toEqual({
        tab: "standings",
        groupNo: "all",
      });
    });

    it("parses fixtures and other tabs correctly", () => {
      expect(parseKadinlar1LigRoute("/kadinlar-1-ligi/fikstur/grup-b")).toEqual({
        tab: "fixtures",
        groupNo: 2,
      });
      expect(parseKadinlar1LigRoute("/kadinlar-1-ligi/sonuclar")).toEqual({
        tab: "results",
        groupNo: 1,
      });
      expect(parseKadinlar1LigRoute("/kadinlar-1-ligi/grup-durumu")).toEqual({
        tab: "leaders",
        groupNo: 1,
      });
    });
  });

  describe("isValidKadinlar1LigSlug", () => {
    it("validates valid slugs", () => {
      expect(isValidKadinlar1LigSlug([])).toBe(true);
      expect(isValidKadinlar1LigSlug(["puan-durumu"])).toBe(true);
      expect(isValidKadinlar1LigSlug(["puan-durumu", "grup-a"])).toBe(true);
      expect(isValidKadinlar1LigSlug(["puan-durumu", "grup-b"])).toBe(true);
      expect(isValidKadinlar1LigSlug(["puan-durumu", "tum-gruplar"])).toBe(true);
      expect(isValidKadinlar1LigSlug(["fikstur", "grup-b"])).toBe(true);
      expect(isValidKadinlar1LigSlug(["grup-durumu"])).toBe(true);
    });

    it("rejects invalid slugs", () => {
      expect(isValidKadinlar1LigSlug(["gecersiz"])).toBe(false);
      expect(isValidKadinlar1LigSlug(["puan-durumu", "grup-c"])).toBe(false);
      expect(isValidKadinlar1LigSlug(["puan-durumu", "grup-a", "fazla"])).toBe(false);
    });
  });
});
