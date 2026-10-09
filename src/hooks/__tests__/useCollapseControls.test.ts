import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useCollapseControls } from "../useCollapseControls";

describe("useCollapseControls", () => {
  it("defaults to all keys collapsed (true) when defaultCollapsed is true", () => {
    const keys = ["istanbul", "ankara", "izmir"];
    const { result } = renderHook(() => useCollapseControls(keys, true));

    expect(result.current.areAllCollapsed).toBe(true);
    expect(result.current.collapsed["istanbul"]).toBe(true);
    expect(result.current.collapsed["ankara"]).toBe(true);
    expect(result.current.collapsed["izmir"]).toBe(true);
    // Unlisted key also defaults to collapsed via proxy
    expect(result.current.collapsed["bursa"]).toBe(true);
  });

  it("defaults to all keys collapsed by default when parameter is omitted", () => {
    const keys = ["lig-1", "lig-2"];
    const { result } = renderHook(() => useCollapseControls(keys));

    expect(result.current.areAllCollapsed).toBe(true);
    expect(result.current.collapsed["lig-1"]).toBe(true);
    expect(result.current.collapsed["lig-2"]).toBe(true);
  });

  it("allows toggling a single key from collapsed to expanded", () => {
    const keys = ["istanbul", "ankara"];
    const { result } = renderHook(() => useCollapseControls(keys, true));

    // Initially collapsed
    expect(result.current.collapsed["istanbul"]).toBe(true);
    expect(result.current.areAllCollapsed).toBe(true);

    // Toggle istanbul -> expanded
    act(() => {
      result.current.toggle("istanbul");
    });

    expect(result.current.collapsed["istanbul"]).toBe(false);
    expect(result.current.collapsed["ankara"]).toBe(true);
    expect(result.current.areAllCollapsed).toBe(false);

    // Toggle istanbul again -> collapsed
    act(() => {
      result.current.toggle("istanbul");
    });
    expect(result.current.collapsed["istanbul"]).toBe(true);
    expect(result.current.areAllCollapsed).toBe(true);
  });

  it("handles expandAll and collapseAll correctly", () => {
    const keys = ["istanbul", "ankara", "izmir"];
    const { result } = renderHook(() => useCollapseControls(keys, true));

    // Expand all
    act(() => {
      result.current.expandAll();
    });

    expect(result.current.areAllCollapsed).toBe(false);
    expect(result.current.collapsed["istanbul"]).toBe(false);
    expect(result.current.collapsed["ankara"]).toBe(false);
    expect(result.current.collapsed["izmir"]).toBe(false);

    // Collapse all
    act(() => {
      result.current.collapseAll();
    });

    expect(result.current.areAllCollapsed).toBe(true);
    expect(result.current.collapsed["istanbul"]).toBe(true);
    expect(result.current.collapsed["ankara"]).toBe(true);
    expect(result.current.collapsed["izmir"]).toBe(true);
  });

  it("supports defaultCollapsed: false if explicitly specified", () => {
    const keys = ["a", "b"];
    const { result } = renderHook(() => useCollapseControls(keys, false));

    expect(result.current.areAllCollapsed).toBe(false);
    expect(result.current.collapsed["a"]).toBe(false);
    expect(result.current.collapsed["b"]).toBe(false);
  });
});
