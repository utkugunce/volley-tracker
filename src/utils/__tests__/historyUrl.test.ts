import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { replaceUrlIfChanged } from "../historyUrl";

describe("replaceUrlIfChanged", () => {
  beforeEach(() => {
    window.history.replaceState({ __NA: true, keep: 1 }, "", "/puan-durumu/istanbul?match=a");
  });
  afterEach(() => vi.restoreAllMocks());

  it("adres aynıysa history.replaceState çağrılmaz", () => {
    const spy = vi.spyOn(window.history, "replaceState");
    expect(replaceUrlIfChanged("/puan-durumu/istanbul?match=a")).toBe(false);
    expect(replaceUrlIfChanged(new URL(window.location.href))).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("adres değişince bir kez değiştirir ve mevcut history.state'i (Next.js iç durumu) korur", () => {
    const spy = vi.spyOn(window.history, "replaceState");
    expect(replaceUrlIfChanged("/puan-durumu/istanbul?match=b")).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("?match=b");
    expect(window.history.state).toEqual({ __NA: true, keep: 1 });
  });

  it("art arda aynı adres yazılırsa yalnızca ilki tarayıcıya gider", () => {
    const spy = vi.spyOn(window.history, "replaceState");
    for (let i = 0; i < 100; i++) replaceUrlIfChanged("/puan-durumu/istanbul?match=c");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("başka origin'e yazmaz", () => {
    const spy = vi.spyOn(window.history, "replaceState");
    expect(replaceUrlIfChanged("https://example.com/x")).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});
