// @vitest-environment node
import { expect, it } from "vitest";
import { evaluateDataHealth } from "../dataHealth";

it("detects stale, absent and future-dated snapshots independently", () => {
  const now = Date.parse("2026-11-05T12:00:00Z");
  const file = { file: "a", exists: true, updatedAt: "2026-11-05T11:00:00Z" };
  expect(evaluateDataHealth([file], ["a"], now).healthy).toBe(true);
  expect(evaluateDataHealth([file], ["a"], now).healthState).toBe("ok");

  const withMissing = evaluateDataHealth([file], ["a", "b"], now);
  expect(withMissing.missing).toEqual(["b"]);
  expect(withMissing.healthState).toBe("missing");

  const staleAll = evaluateDataHealth([{ ...file, updatedAt: "2026-11-03T11:00:00Z" }], ["a"], now);
  expect(staleAll.healthy).toBe(false);
  expect(staleAll.healthState).toBe("stale");

  expect(evaluateDataHealth([{ ...file, updatedAt: "2026-11-06T11:00:00Z" }], ["a"], now).healthy).toBe(false);
});

it("reports upstream_partial when index and some snapshots are fresh while other cities are stale", () => {
  const now = Date.parse("2026-11-05T12:00:00Z");
  const freshAt = "2026-11-05T11:00:00Z";
  const staleAt = "2026-11-03T11:00:00Z";
  const files = [
    { file: "data/fixtures.json", exists: true, updatedAt: freshAt },
    { file: "data/cities.json", exists: true, updatedAt: freshAt },
    { file: "data/cities/istanbul.json", exists: true, updatedAt: freshAt },
    { file: "data/cities/bilecik.json", exists: true, updatedAt: staleAt },
  ];
  const expected = files.map((f) => f.file);
  const result = evaluateDataHealth(files, expected, now);
  expect(result.healthy).toBe(false);
  expect(result.healthState).toBe("upstream_partial");
  expect(result.freshCount).toBe(3);
  expect(result.stale).toEqual(["data/cities/bilecik.json"]);
});
