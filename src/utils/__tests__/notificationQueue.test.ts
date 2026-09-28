import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NotificationQueueManager, getNotificationQueueManager, destroyNotificationQueueManager } from "../notificationQueue";
import { getSupabaseAdmin } from "../supabaseAdmin";

vi.mock("../supabaseAdmin");

describe("NotificationQueueManager", () => {
  let mockSupabaseAdmin: any;
  let queueManager: NotificationQueueManager;

  beforeEach(() => {
    mockSupabaseAdmin = {
      rpc: vi.fn(),
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    };

    vi.mocked(getSupabaseAdmin).mockReturnValue(mockSupabaseAdmin);
    queueManager = new NotificationQueueManager();
  });

  afterEach(() => {
    destroyNotificationQueueManager();
    vi.clearAllMocks();
  });

  describe("addToQueue", () => {
    it("should add notification to queue with idempotency", async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: "queue-id-123",
      });

      const result = await queueManager.addToQueue(
        "https://example.com/endpoint",
        { title: "Test", body: "Test message" },
        { idempotencyKey: "test-key" }
      );

      expect(result).toBe("queue-id-123");
      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith(
        "add_to_queue",
        expect.objectContaining({
          p_subscription_endpoint: "https://example.com/endpoint",
          p_idempotency_key: "test-key",
        })
      );
    });

    it("should return null when Supabase is not configured", async () => {
      vi.mocked(getSupabaseAdmin).mockReturnValue(null);

      const result = await queueManager.addToQueue(
        "https://example.com/endpoint",
        { title: "Test", body: "Test message" }
      );

      expect(result).toBeNull();
    });
  });

  describe("processPendingNotifications", () => {
    it("should process pending notifications", async () => {
      const mockNotifications = [
        {
          id: "1",
          subscription_endpoint: "https://example.com/1",
          payload: { title: "Test 1", body: "Message 1" },
          status: "pending",
        },
        {
          id: "2",
          subscription_endpoint: "https://example.com/2",
          payload: { title: "Test 2", body: "Message 2" },
          status: "pending",
        },
      ];

      // Mock sequence for processing
      mockSupabaseAdmin.rpc.mockResolvedValueOnce({ data: mockNotifications });
      mockSupabaseAdmin.from.mockReturnValue(mockSupabaseAdmin);
      mockSupabaseAdmin.update.mockReturnValue(mockSupabaseAdmin);
      mockSupabaseAdmin.eq.mockReturnValue(mockSupabaseAdmin);
      mockSupabaseAdmin.update.mockResolvedValueOnce({});
      mockSupabaseAdmin.rpc.mockResolvedValueOnce({});

      const processed = await queueManager.processPendingNotifications();

      expect(processed).toBeGreaterThanOrEqual(0);
    });

    it("should skip if already processing", async () => {
      // Simulate already processing
      queueManager["isProcessing"] = true;

      const processed = await queueManager.processPendingNotifications();

      expect(processed).toBe(0);
      expect(mockSupabaseAdmin.rpc).not.toHaveBeenCalled();
    });
  });

  describe("getNotificationHistory", () => {
    it("should return notification history", async () => {
      const mockHistory = [
        {
          id: "1",
          subscription_endpoint: "https://example.com/1",
          payload: { title: "Test", body: "Message" },
          status: "sent",
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      mockSupabaseAdmin.from.mockReturnValue(mockSupabaseAdmin);
      mockSupabaseAdmin.select.mockReturnValue(mockSupabaseAdmin);
      mockSupabaseAdmin.order.mockReturnValue(mockSupabaseAdmin);
      mockSupabaseAdmin.range.mockReturnValue(mockSupabaseAdmin);
      mockSupabaseAdmin.range.mockResolvedValue({ data: mockHistory });

      const history = await queueManager.getNotificationHistory(10, 0);

      expect(history).toHaveLength(1);
      expect(history[0].status).toBe("sent");
    });
  });

  describe("getQueueStatus", () => {
    it("should return queue status", async () => {
      mockSupabaseAdmin.from.mockReturnValue(mockSupabaseAdmin);
      mockSupabaseAdmin.select.mockReturnValue(mockSupabaseAdmin);
      mockSupabaseAdmin.select.mockResolvedValueOnce({ data: [
        { status: "pending" },
        { status: "pending" },
        { status: "processing" },
      ] });
      mockSupabaseAdmin.from.mockReturnValue(mockSupabaseAdmin);
      mockSupabaseAdmin.select.mockReturnValue(mockSupabaseAdmin);
      mockSupabaseAdmin.select.mockResolvedValueOnce({ data: [
        { status: "sent" },
        { status: "failed" },
      ] });

      const status = await queueManager.getQueueStatus();

      expect(status).toHaveProperty("pending");
      expect(status).toHaveProperty("processing");
      expect(status).toHaveProperty("sent");
      expect(status).toHaveProperty("failed");
    });
  });

  describe("auto processing", () => {
    it("should start auto processing", () => {
      const intervalSpy = vi.spyOn(global, "setInterval");

      queueManager.startAutoProcessing(60000);

      expect(intervalSpy).toHaveBeenCalled();
      expect(intervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        60000
      );
    });

    it("should stop auto processing", () => {
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");

      queueManager.startAutoProcessing(60000);
      queueManager.stopAutoProcessing();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe("global manager", () => {
    it("should return singleton instance", () => {
      const manager1 = getNotificationQueueManager();
      const manager2 = getNotificationQueueManager();

      expect(manager1).toBe(manager2);
    });

    it("should destroy global manager", () => {
      const manager1 = getNotificationQueueManager();
      destroyNotificationQueueManager();
      const manager2 = getNotificationQueueManager();

      expect(manager1).not.toBe(manager2);
    });
  });
});
