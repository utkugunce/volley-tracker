import { describe, it, expect } from "vitest";
import {
  getKadinlar2LigRoute,
  parseKadinlar2LigRoute,
} from "../kadinlar2LigRoutes";

describe("kadinlar2LigRoutes", () => {
  describe("getKadinlar2LigRoute", () => {
    it("returns /kadinlar-2-ligi for home tab", () => {
      expect(getKadinlar2LigRoute("home")).toBe("/kadinlar-2-ligi");
      expect(getKadinlar2LigRoute("home", 1)).toBe("/kadinlar-2-ligi");
    });

    it("returns /kadinlar-2-ligi/puan-durumu for standings without group or group 1", () => {
      expect(getKadinlar2LigRoute("standings")).toBe("/kadinlar-2-ligi/puan-durumu");
      expect(getKadinlar2LigRoute("standings", 1)).toBe("/kadinlar-2-ligi/puan-durumu");
    });

    it("appends group slug for standings with group > 1", () => {
      expect(getKadinlar2LigRoute("standings", 2)).toBe("/kadinlar-2-ligi/puan-durumu/grup-2");
      expect(getKadinlar2LigRoute("standings", 16)).toBe("/kadinlar-2-ligi/puan-durumu/grup-16");
    });

    it("returns /kadinlar-2-ligi/fikstur for fixtures without group or group 1", () => {
      expect(getKadinlar2LigRoute("fixtures")).toBe("/kadinlar-2-ligi/fikstur");
      expect(getKadinlar2LigRoute("fixtures", 1)).toBe("/kadinlar-2-ligi/fikstur");
    });

    it("appends group slug for fixtures with group > 1", () => {
      expect(getKadinlar2LigRoute("fixtures", 5)).toBe("/kadinlar-2-ligi/fikstur/grup-5");
    });

    it("returns subpaths for other tabs", () => {
      expect(getKadinlar2LigRoute("results")).toBe("/kadinlar-2-ligi/sonuclar");
      expect(getKadinlar2LigRoute("today")).toBe("/kadinlar-2-ligi/gunun-maclari");
      expect(getKadinlar2LigRoute("leaders")).toBe("/kadinlar-2-ligi/grup-durumu");
      expect(getKadinlar2LigRoute("teams")).toBe("/kadinlar-2-ligi/takimlar");
      expect(getKadinlar2LigRoute("statu")).toBe("/kadinlar-2-ligi/statu");
    });
  });

  describe("parseKadinlar2LigRoute", () => {
    it("parses base route as home tab", () => {
      expect(parseKadinlar2LigRoute("/kadinlar-2-ligi")).toEqual({
        tab: "home",
        groupNo: 1,
      });
      expect(parseKadinlar2LigRoute("/kadinlar-2-ligi/anasayfa")).toEqual({
        tab: "home",
        groupNo: 1,
      });
      expect(parseKadinlar2LigRoute("")).toEqual({
        tab: "home",
        groupNo: 1,
      });
    });

    it("parses standings and groups correctly", () => {
      expect(parseKadinlar2LigRoute("/kadinlar-2-ligi/puan-durumu")).toEqual({
        tab: "standings",
        groupNo: 1,
      });
      expect(
        parseKadinlar2LigRoute("/kadinlar-2-ligi/puan-durumu/grup-3")
      ).toEqual({
        tab: "standings",
        groupNo: 3,
      });
      expect(
        parseKadinlar2LigRoute("/kadinlar-2-ligi/puan-durumu/grup-16")
      ).toEqual({
        tab: "standings",
        groupNo: 16,
      });
    });

    it("parses fixtures and groups correctly", () => {
      expect(parseKadinlar2LigRoute("/kadinlar-2-ligi/fikstur")).toEqual({
        tab: "fixtures",
        groupNo: 1,
      });
      expect(
        parseKadinlar2LigRoute("/kadinlar-2-ligi/fikstur/grup-8")
      ).toEqual({
        tab: "fixtures",
        groupNo: 8,
      });
    });

    it("parses results, today, leaders, teams and statu tabs", () => {
      expect(parseKadinlar2LigRoute("/kadinlar-2-ligi/sonuclar")).toEqual({
        tab: "results",
        groupNo: 1,
      });
      expect(parseKadinlar2LigRoute("/kadinlar-2-ligi/gunun-maclari")).toEqual({
        tab: "today",
        groupNo: 1,
      });
      expect(parseKadinlar2LigRoute("/kadinlar-2-ligi/grup-durumu")).toEqual({
        tab: "leaders",
        groupNo: 1,
      });
      expect(parseKadinlar2LigRoute("/kadinlar-2-ligi/liderler")).toEqual({
        tab: "leaders",
        groupNo: 1,
      });
      expect(parseKadinlar2LigRoute("/kadinlar-2-ligi/takimlar")).toEqual({
        tab: "teams",
        groupNo: 1,
      });
      expect(parseKadinlar2LigRoute("/kadinlar-2-ligi/statu")).toEqual({
        tab: "statu",
        groupNo: 1,
      });
    });
  });
});
