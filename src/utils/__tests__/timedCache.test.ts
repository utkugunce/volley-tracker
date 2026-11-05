// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { TimedCache } from "../timedCache";
afterEach(() => vi.useRealTimers());
it("expires stale entries and bounds retained cities", () => {
  vi.useFakeTimers();
  const cache = new TimedCache<number>(1000, 2);
  cache.set("a", 1); cache.set("b", 2); cache.set("c", 3);
  expect(cache.get("a")).toBeUndefined();
  expect(cache.get("b")).toBe(2);
  vi.advanceTimersByTime(1000);
  expect(cache.get("b")).toBeUndefined();
});
