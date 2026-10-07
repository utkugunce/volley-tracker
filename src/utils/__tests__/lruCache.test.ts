import { describe, expect, it } from "vitest";
import { createLruCache } from "../lruCache";

describe("createLruCache", () => {
  it("en fazla maxEntries kayıt tutar, en eski kaydı atar", () => {
    const c = createLruCache<number>(3);
    for (let i = 0; i < 10; i++) c.set(`k${i}`, i);
    expect(c.size).toBe(3);
    expect(c.get("k0")).toBeUndefined();
    expect(c.get("k9")).toBe(9);
  });

  it("okunan kayıt en yeni sayılır", () => {
    const c = createLruCache<number>(2);
    c.set("a", 1);
    c.set("b", 2);
    expect(c.get("a")).toBe(1);
    c.set("c", 3);
    expect(c.get("a")).toBe(1);
    expect(c.get("b")).toBeUndefined();
  });
});
