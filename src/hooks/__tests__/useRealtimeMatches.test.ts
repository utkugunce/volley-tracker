import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRealtimeMatches, useRealtimeMatch } from "../useRealtimeMatches";
import { getRealtimeManager, destroyRealtimeManager } from "@/utils/supabaseRealtime";

vi.mock("@/utils/supabaseRealtime");

describe("useRealtimeMatches", () => {
  let mockManager: any;

  beforeEach(() => {
    mockManager = {
      subscribeToMatches: vi.fn().mockResolvedValue(undefined),
      subscribeToAllMatches: vi.fn().mockResolvedValue(undefined),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(getRealtimeManager).mockReturnValue(mockManager);
  });

  afterEach(() => {
    destroyRealtimeManager();
    vi.clearAllMocks();
  });

  describe("basic functionality", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useRealtimeMatches());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.lastUpdate).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it("should subscribe to specific matches when matchIds provided", () => {
      const matchIds = ["match1", "match2"];
      renderHook(() => useRealtimeMatches(matchIds));

      expect(mockManager.subscribeToMatches).toHaveBeenCalledWith(matchIds);
      expect(mockManager.subscribeToAllMatches).not.toHaveBeenCalled();
    });

    it("should subscribe to all matches when no matchIds provided", () => {
      renderHook(() => useRealtimeMatches([]));

      expect(mockManager.subscribeToAllMatches).toHaveBeenCalled();
      expect(mockManager.subscribeToMatches).not.toHaveBeenCalled();
    });
  });

  describe("connection status", () => {
    it("should update connection status when changed", () => {
      const { result } = renderHook(() => useRealtimeMatches());

      // Get the options object passed to getRealtimeManager
      const options = vi.mocked(getRealtimeManager).mock.calls[0][0];
      
      if (!options) {
        throw new Error("Options should be defined");
      }

      expect(options.onConnectionChange).toBeTypeOf("function");
      act(() => {
        options.onConnectionChange?.(true);
      });

      expect(result.current.isConnected).toBe(true);
    });
  });

  describe("match updates", () => {
    it("should update lastUpdate when match is updated", () => {
      const { result } = renderHook(() => useRealtimeMatches());

      const matchUpdate = { id: "match1", home_score: 2, away_score: 1, set_scores: ["25-18", "22-25"], status: "live", updated_at: new Date().toISOString() };

      // Get the options object passed to getRealtimeManager
      const options = vi.mocked(getRealtimeManager).mock.calls[0][0];
      
      if (!options) {
        throw new Error("Options should be defined");
      }

      expect(options.onMatchUpdate).toBeTypeOf("function");
      act(() => {
        options.onMatchUpdate?.(matchUpdate);
      });

      expect(result.current.lastUpdate).toEqual(matchUpdate);
    });

    it("should clear error when match is updated", () => {
      const { result } = renderHook(() => useRealtimeMatches());

      // Get the options object passed to getRealtimeManager
      const options = vi.mocked(getRealtimeManager).mock.calls[0][0];

      expect(options?.onError).toBeTypeOf("function");
      if (options) {
        act(() => {
          options.onError?.(new Error("Test error"));
        });
      }

      expect(result.current.error).not.toBeNull();

      // Then update match
      expect(options?.onMatchUpdate).toBeTypeOf("function");
      act(() => {
        options?.onMatchUpdate?.({ id: "match1", home_score: 2, away_score: 1, set_scores: [], status: "live", updated_at: new Date().toISOString() });
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("error handling", () => {
    it("should update error when error occurs", () => {
      const { result } = renderHook(() => useRealtimeMatches());

      const testError = new Error("Test error");

      // Get the options object passed to getRealtimeManager
      const options = vi.mocked(getRealtimeManager).mock.calls[0][0];
      
      if (!options) {
        throw new Error("Options should be defined");
      }

      expect(options.onError).toBeTypeOf("function");
      act(() => {
        options.onError?.(testError);
      });

      expect(result.current.error).toEqual(testError);
    });
  });

  describe("manual refresh", () => {
    it("should unsubscribe and resubscribe on manual refresh", async () => {
      const { result } = renderHook(() => useRealtimeMatches(["match1"]));

      await act(async () => {
        await result.current.manualRefresh();
      });

      expect(mockManager.unsubscribe).toHaveBeenCalled();
      expect(mockManager.subscribeToMatches).toHaveBeenCalledWith(["match1"]);
    });
  });

  describe("cleanup", () => {
    it("should unsubscribe on unmount", () => {
      const { unmount } = renderHook(() => useRealtimeMatches(["match1"]));

      unmount();

      expect(mockManager.unsubscribe).toHaveBeenCalled();
    });
  });
});

describe("useRealtimeMatch", () => {
  let mockManager: any;

  beforeEach(() => {
    mockManager = {
      subscribeToMatches: vi.fn().mockResolvedValue(undefined),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(getRealtimeManager).mockReturnValue(mockManager);
  });

  afterEach(() => {
    destroyRealtimeManager();
    vi.clearAllMocks();
  });

  describe("basic functionality", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useRealtimeMatch("match1"));

      expect(result.current.match).toBe(null);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it("should subscribe to specific match", () => {
      renderHook(() => useRealtimeMatch("match1"));

      expect(mockManager.subscribeToMatches).toHaveBeenCalledWith(["match1"]);
    });

    it("should not subscribe when matchId is empty", () => {
      renderHook(() => useRealtimeMatch(""));

      expect(mockManager.subscribeToMatches).not.toHaveBeenCalled();
    });
  });

  describe("match updates", () => {
    it("should update match when specific match is updated", () => {
      const { result } = renderHook(() => useRealtimeMatch("match1"));

      const matchUpdate = { id: "match1", home_score: 2, away_score: 1, set_scores: [], status: "live", updated_at: new Date().toISOString() };

      // Get the options object passed to getRealtimeManager
      const options = vi.mocked(getRealtimeManager).mock.calls[0][0];
      
      if (!options) {
        throw new Error("Options should be defined");
      }

      expect(options.onMatchUpdate).toBeTypeOf("function");
      act(() => {
        options.onMatchUpdate?.(matchUpdate);
      });

      expect(result.current.match).toEqual(matchUpdate);
    });

    it("should not update match when different match is updated", () => {
      const { result } = renderHook(() => useRealtimeMatch("match1"));

      const matchUpdate = { id: "match2", home_score: 2, away_score: 1, set_scores: [], status: "live", updated_at: new Date().toISOString() };

      // Get the options object passed to getRealtimeManager
      const options = vi.mocked(getRealtimeManager).mock.calls[0][0];
      
      if (!options) {
        throw new Error("Options should be defined");
      }

      expect(options.onMatchUpdate).toBeTypeOf("function");
      act(() => {
        options.onMatchUpdate?.(matchUpdate);
      });

      expect(result.current.match).toBeNull();
    });

    it("should clear match when specific match is deleted", () => {
      const { result } = renderHook(() => useRealtimeMatch("match1"));

      // Get the options object passed to getRealtimeManager
      const options = vi.mocked(getRealtimeManager).mock.calls[0][0];

      // First set a match
      if (options) {
        expect(options.onMatchUpdate).toBeTypeOf("function");
        act(() => {
          options.onMatchUpdate?.({ id: "match1", home_score: 2, away_score: 1, set_scores: [], status: "live", updated_at: new Date().toISOString() });
        });
      } else {
        throw new Error("Options should be defined");
      }

      expect(result.current.match).not.toBeNull();

      // Then delete it
      expect(options?.onMatchDeleted).toBeTypeOf("function");
      act(() => {
        options?.onMatchDeleted?.("match1");
      });

      expect(result.current.match).toBeNull();
    });
  });

  describe("cleanup", () => {
    it("should unsubscribe on unmount", () => {
      const { unmount } = renderHook(() => useRealtimeMatch("match1"));

      unmount();

      expect(mockManager.unsubscribe).toHaveBeenCalled();
    });

    it("should unsubscribe on matchId change", () => {
      const { rerender } = renderHook(
        ({ matchId }) => useRealtimeMatch(matchId),
        { initialProps: { matchId: "match1" } }
      );

      rerender({ matchId: "match2" });

      expect(mockManager.unsubscribe).toHaveBeenCalled();
    });
  });
});
