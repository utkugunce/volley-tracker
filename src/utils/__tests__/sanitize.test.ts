import { describe, it, expect } from "vitest";
import {
  sanitizeString,
  sanitizeMatchId,
  sanitizeSetScores,
  sanitizeStatus,
} from "../sanitize";

describe("Input Sanitization utilities", () => {
  it("strips HTML tags and script injections", () => {
    expect(sanitizeString("<script>alert(1)</script>Hello")).toBe("alert(1)Hello");
    expect(sanitizeString("<b>Bold</b> text")).toBe("Bold text");
    expect(sanitizeString("Normal text")).toBe("Normal text");
  });

  it("limits maximum length", () => {
    const longStr = "a".repeat(300);
    expect(sanitizeString(longStr, 50).length).toBe(50);
  });

  it("validates match IDs strictly", () => {
    expect(sanitizeMatchId("istanbul-20260920-001")).toBe("istanbul-20260920-001");
    expect(sanitizeMatchId("match_123_xyz")).toBe("match_123_xyz");
    expect(sanitizeMatchId("<script>")).toBeNull();
    expect(sanitizeMatchId("match id with spaces")).toBeNull();
    expect(sanitizeMatchId("match;DROP TABLE")).toBeNull();
  });

  it("validates set scores strictly", () => {
    const valid = ["25-18", "21-25", "15-12"];
    expect(sanitizeSetScores(valid)).toEqual(["25-18", "21-25", "15-12"]);

    const mixed = ["25-18", "<script>", "25:20", "invalid", "1000-0"];
    expect(sanitizeSetScores(mixed)).toEqual(["25-18", "25-20"]);

    expect(sanitizeSetScores("not an array")).toBeUndefined();
    expect(sanitizeSetScores([])).toBeUndefined();
  });

  it("sanitizes match status to allowed enum", () => {
    expect(sanitizeStatus("finished")).toBe("finished");
    expect(sanitizeStatus("upcoming")).toBe("upcoming");
    expect(sanitizeStatus("live")).toBe("live");
    expect(sanitizeStatus("postponed")).toBe("postponed");
    expect(sanitizeStatus("invalid_val")).toBe("finished");
    expect(sanitizeStatus("hacked")).toBe("finished");
  });
});
