import { describe, it, expect } from "vitest";
import {
  getSultanlarLigiRoute,
  isValidSultanlarLigiSlug,
  parseSultanlarLigiRoute,
} from "../sultanlarLigiRoutes";

describe("sultanlarLigiRoutes", () => {
  describe("getSultanlarLigiRoute", () => {
    it("returns /sultanlar-ligi for home tab", () => {
      expect(getSultanlarLigiRoute("home")).toBe("/sultanlar-ligi");
    });

    it("returns /sultanlar-ligi/puan-durumu for standings", () => {
      expect(getSultanlarLigiRoute("standings")).toBe("/sultanlar-ligi/puan-durumu");
    });

    it("returns /sultanlar-ligi/fikstur for fixtures", () => {
      expect(getSultanlarLigiRoute("fixtures")).toBe("/sultanlar-ligi/fikstur");
    });

    it("returns /sultanlar-ligi/sonuclar for results", () => {
      expect(getSultanlarLigiRoute("results")).toBe("/sultanlar-ligi/sonuclar");
    });

    it("returns /sultanlar-ligi/gunun-maclari for today", () => {
      expect(getSultanlarLigiRoute("today")).toBe("/sultanlar-ligi/gunun-maclari");
    });

    it("returns /sultanlar-ligi/takimlar for teams", () => {
      expect(getSultanlarLigiRoute("teams")).toBe("/sultanlar-ligi/takimlar");
    });

    it("returns /sultanlar-ligi/karsilastir for karsilastir", () => {
      expect(getSultanlarLigiRoute("karsilastir")).toBe("/sultanlar-ligi/karsilastir");
    });

    it("returns /sultanlar-ligi/statu for statu", () => {
      expect(getSultanlarLigiRoute("statu")).toBe("/sultanlar-ligi/statu");
    });
  });

  describe("parseSultanlarLigiRoute", () => {
    it("parses base route as home tab", () => {
      expect(parseSultanlarLigiRoute("/sultanlar-ligi")).toEqual({
        tab: "home",
        groupNo: 1,
      });
      expect(parseSultanlarLigiRoute("/sultanlar-ligi/anasayfa")).toEqual({
        tab: "home",
        groupNo: 1,
      });
    });

    it("parses tabs correctly", () => {
      expect(parseSultanlarLigiRoute("/sultanlar-ligi/puan-durumu")).toEqual({
        tab: "standings",
        groupNo: 1,
      });
      expect(parseSultanlarLigiRoute("/sultanlar-ligi/fikstur")).toEqual({
        tab: "fixtures",
        groupNo: 1,
      });
      expect(parseSultanlarLigiRoute("/sultanlar-ligi/sonuclar")).toEqual({
        tab: "results",
        groupNo: 1,
      });
      expect(parseSultanlarLigiRoute("/sultanlar-ligi/gunun-maclari")).toEqual({
        tab: "today",
        groupNo: 1,
      });
      expect(parseSultanlarLigiRoute("/sultanlar-ligi/takimlar")).toEqual({
        tab: "teams",
        groupNo: 1,
      });
      expect(parseSultanlarLigiRoute("/sultanlar-ligi/karsilastir")).toEqual({
        tab: "karsilastir",
        groupNo: 1,
      });
      expect(parseSultanlarLigiRoute("/sultanlar-ligi/statu")).toEqual({
        tab: "statu",
        groupNo: 1,
      });
    });
  });

  describe("isValidSultanlarLigiSlug", () => {
    it("validates valid slugs", () => {
      expect(isValidSultanlarLigiSlug([])).toBe(true);
      expect(isValidSultanlarLigiSlug(["puan-durumu"])).toBe(true);
      expect(isValidSultanlarLigiSlug(["fikstur"])).toBe(true);
      expect(isValidSultanlarLigiSlug(["sonuclar"])).toBe(true);
      expect(isValidSultanlarLigiSlug(["gunun-maclari"])).toBe(true);
      expect(isValidSultanlarLigiSlug(["takimlar"])).toBe(true);
      expect(isValidSultanlarLigiSlug(["karsilastir"])).toBe(true);
      expect(isValidSultanlarLigiSlug(["statu"])).toBe(true);
    });

    it("rejects invalid slugs", () => {
      expect(isValidSultanlarLigiSlug(["gecersiz-sekme"])).toBe(false);
      expect(isValidSultanlarLigiSlug(["puan-durumu", "grup-1", "fazla"])).toBe(false);
    });
  });
});
