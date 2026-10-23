import { describe, it, expect } from "vitest";
import { formatSyncDateTime } from "../formatSyncDate";

describe("formatSyncDateTime", () => {
  it("UTC ISO string'i Europe/Istanbul saat dilimine göre tarih ve saat olarak biçimlendirir", () => {
    const res = formatSyncDateTime("2026-01-01T00:00:00.000Z");
    expect(res.date).toBe("01.01.2026");
    expect(res.time).toBe("03:00");
    expect(res.full).toBe("01.01.2026 03:00");
  });

  it("boş veya tanımsız değerde varsayılan yer tutucuları döner", () => {
    expect(formatSyncDateTime(null)).toEqual({
      date: "--.--.----",
      time: "--:--",
      full: "--:--",
    });
    expect(formatSyncDateTime("")).toEqual({
      date: "--.--.----",
      time: "--:--",
      full: "--:--",
    });
  });
});
