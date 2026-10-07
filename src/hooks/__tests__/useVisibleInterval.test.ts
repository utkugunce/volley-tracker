import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useVisibleInterval } from "../useVisibleInterval";

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("useVisibleInterval", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setHidden(false);
  });
  afterEach(() => {
    vi.useRealTimers();
    setHidden(false);
  });

  it("görünürken düzenli çalışır", () => {
    const cb = vi.fn();
    renderHook(() => useVisibleInterval(cb, 1000));
    vi.advanceTimersByTime(3000);
    expect(cb).toHaveBeenCalledTimes(3);
  });

  it("sekme gizliyken durur, görünür olunca hemen bir kez çalışıp devam eder", () => {
    const cb = vi.fn();
    renderHook(() => useVisibleInterval(cb, 1000));
    setHidden(true);
    vi.advanceTimersByTime(10_000);
    expect(cb).toHaveBeenCalledTimes(0);
    setHidden(false);
    expect(cb).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(2000);
    expect(cb).toHaveBeenCalledTimes(3);
  });

  it("kaldırılınca zamanlayıcıyı ve dinleyiciyi temizler", () => {
    const cb = vi.fn();
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderHook(() => useVisibleInterval(cb, 1000));
    unmount();
    vi.advanceTimersByTime(5000);
    expect(cb).not.toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("enabled=false iken hiç zamanlayıcı kurmaz", () => {
    const cb = vi.fn();
    renderHook(() => useVisibleInterval(cb, 1000, false));
    expect(vi.getTimerCount()).toBe(0);
  });
});
