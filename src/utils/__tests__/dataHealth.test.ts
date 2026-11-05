// @vitest-environment node
import { expect, it } from "vitest";
import { evaluateDataHealth } from "../dataHealth";
it("detects stale, absent and future-dated snapshots independently", () => {
  const now = Date.parse("2026-11-05T12:00:00Z");
  const file = { file: "a", exists: true, updatedAt: "2026-11-05T11:00:00Z" };
  expect(evaluateDataHealth([file], ["a"], now).healthy).toBe(true);
  expect(evaluateDataHealth([file], ["a", "b"], now).missing).toEqual(["b"]);
  expect(evaluateDataHealth([{ ...file, updatedAt: "2026-11-03T11:00:00Z" }], ["a"], now).healthy).toBe(false);
  expect(evaluateDataHealth([{ ...file, updatedAt: "2026-11-06T11:00:00Z" }], ["a"], now).healthy).toBe(false);
});
