import { describe, it, expect } from "vitest";
import { parseScanTimestamp } from "../dataTimestamps";

describe("parseScanTimestamp", () => {
  it("cities.json biçimini (12 saat + UTC ofseti) ayrıştırır", () => {
    expect(parseScanTimestamp("Wed 2026-10-07 7:43 PM (UTC+03:00)")?.toISOString()).toBe(
      "2026-10-07T16:43:00.000Z"
    );
    expect(parseScanTimestamp("Thu 2026-10-08 12:05 AM (UTC+03:00)")?.toISOString()).toBe(
      "2026-10-07T21:05:00.000Z"
    );
  });

  it("saat dilimsiz ISO değeri UTC kabul eder", () => {
    expect(parseScanTimestamp("2026-10-07T16:44:39.501935")?.toISOString()).toBe("2026-10-07T16:44:39.501Z");
  });

  it("geçersiz değerlerde undefined döner", () => {
    expect(parseScanTimestamp(undefined)).toBeUndefined();
    expect(parseScanTimestamp("")).toBeUndefined();
    expect(parseScanTimestamp("bozuk")).toBeUndefined();
  });
});
