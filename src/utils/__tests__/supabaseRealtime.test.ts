import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SupabaseRealtimeManager, getRealtimeManager, destroyRealtimeManager } from "../supabaseRealtime";
import { getSupabaseClient } from "../supabaseClient";

vi.mock("../supabaseClient");

describe("SupabaseRealtimeManager", () => {
  let mockSupabaseClient: any;
  let mockChannel: any;

  beforeEach(() => {
    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    };

    mockSupabaseClient = {
      channel: vi.fn().mockReturnValue(mockChannel),
    };

    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabaseClient);
  });

  afterEach(() => {
    destroyRealtimeManager();
    vi.clearAllMocks();
  });

  describe("subscribeToMatches", () => {
    it("should create channel and subscribe to specific matches", async () => {
      const manager = new SupabaseRealtimeManager();
      const matchIds = ["match1", "match2"];

      await manager.subscribeToMatches(matchIds);

      expect(mockSupabaseClient.channel).toHaveBeenCalled();
      expect(mockChannel.on).toHaveBeenCalledTimes(3); // UPDATE, INSERT, DELETE
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it("should set up update event listener", async () => {
      const onMatchUpdate = vi.fn();
      const manager = new SupabaseRealtimeManager({ onMatchUpdate });
      const matchIds = ["match1"];

      await manager.subscribeToMatches(matchIds);

      // Verify that channel.on was called with UPDATE event
      expect(mockChannel.on).toHaveBeenCalledWith(
        "postgres_changes",
        expect.objectContaining({
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=in.(${matchIds.join(",")})`,
        }),
        expect.any(Function)
      );
    });

    it("should handle empty match ids array", async () => {
      const manager = new SupabaseRealtimeManager();
      
      await manager.subscribeToMatches([]);

      expect(mockSupabaseClient.channel).toHaveBeenCalled();
    });
  });

  describe("subscribeToAllMatches", () => {
    it("should subscribe to all matches without filter", async () => {
      const manager = new SupabaseRealtimeManager();

      await manager.subscribeToAllMatches();

      expect(mockSupabaseClient.channel).toHaveBeenCalled();
      expect(mockChannel.on).toHaveBeenCalledTimes(3);
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });
  });

  describe("unsubscribe", () => {
    it("should unsubscribe and cleanup", async () => {
      const manager = new SupabaseRealtimeManager();
      await manager.subscribeToMatches(["match1"]);

      await manager.unsubscribe();

      expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });

    it("should handle unsubscribe when no channel exists", async () => {
      const manager = new SupabaseRealtimeManager();

      await manager.unsubscribe();

      expect(mockChannel.unsubscribe).not.toHaveBeenCalled();
    });
  });

  describe("reconnection logic", () => {
    it("should handle connection errors and attempt reconnection", async () => {
      const onConnectionChange = vi.fn();
      const manager = new SupabaseRealtimeManager({ onConnectionChange });
      
      await manager.subscribeToMatches(["match1"]);

      // Simulate SUBSCRIBED status
      const subscribeCallback = mockChannel.subscribe.mock.calls[0][0];
      subscribeCallback("SUBSCRIBED");

      expect(onConnectionChange).toHaveBeenCalledWith(true);

      // Simulate CHANNEL_ERROR
      subscribeCallback("CHANNEL_ERROR");

      expect(onConnectionChange).toHaveBeenCalledWith(false);
    });
  });

  describe("isRealtimeConnected", () => {
    it("should return connection status", async () => {
      const manager = new SupabaseRealtimeManager();

      expect(manager.isRealtimeConnected()).toBe(false);

      await manager.subscribeToMatches(["match1"]);

      // Simulate SUBSCRIBED
      const subscribeCallback = mockChannel.subscribe.mock.calls[0][0];
      subscribeCallback("SUBSCRIBED");

      expect(manager.isRealtimeConnected()).toBe(true);
    });
  });

  describe("global manager", () => {
    it("should return singleton instance", () => {
      const manager1 = getRealtimeManager();
      const manager2 = getRealtimeManager();

      expect(manager1).toBe(manager2);
    });

    it("should destroy global manager", () => {
      const manager1 = getRealtimeManager();
      destroyRealtimeManager();
      const manager2 = getRealtimeManager();

      expect(manager1).not.toBe(manager2);
    });
  });
});
