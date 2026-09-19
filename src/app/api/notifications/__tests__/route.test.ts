import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as subscribePost, DELETE as subscribeDelete } from "../subscribe/route";
import { POST as dispatchPost } from "../dispatch/route";
import * as webPushUtils from "@/utils/webPush";
import { urlBase64ToUint8Array } from "@/utils/notifications";

// Mock web-push
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({ statusCode: 201 }),
  },
}));

// Mock @vercel/blob
vi.mock("@vercel/blob", () => ({
  put: vi.fn().mockResolvedValue({ url: "https://blob.vercel-storage.com/test.json" }),
  list: vi.fn().mockResolvedValue({ blobs: [] }),
}));

describe("Web Push API Routes (GÖREV 5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("urlBase64ToUint8Array", () => {
    it("base64 URL karakter dizisini Uint8Array'e çevirir", () => {
      // Mock window.atob if needed in node/jsdom environment
      if (typeof window === "undefined" || !window.atob) {
        (globalThis as any).window = {
          atob: (str: string) => Buffer.from(str, "base64").toString("binary"),
        };
      }
      const testKey = "BLxQQh-7VlGxSjDSc7qC1-ABcTkrU7ha6JStAFPy6y04LDetsGvMjpyihmZyPY1d44jp5_A4D8rV4n1uLetyuZs";
      const arr = urlBase64ToUint8Array(testKey);
      expect(arr).toBeInstanceOf(Uint8Array);
      expect(arr.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/notifications/subscribe", () => {
    it("eksik veya geçersiz abonelik verisinde 400 döner", async () => {
      const req = new NextRequest("http://localhost:3000/api/notifications/subscribe", {
        method: "POST",
        body: JSON.stringify({ subscription: null }),
      });

      const res = await subscribePost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Geçersiz push abonelik verisi");
    });

    it("eksik VAPID anahtarlarında 400 döner", async () => {
      const req = new NextRequest("http://localhost:3000/api/notifications/subscribe", {
        method: "POST",
        body: JSON.stringify({
          subscription: {
            endpoint: "https://fcm.googleapis.com/fcm/send/test",
            keys: {},
          },
        }),
      });

      const res = await subscribePost(req);
      expect(res.status).toBe(400);
    });

    it("geçerli aboneliği kaydeder ve 200 ok döner", async () => {
      const saveSpy = vi.spyOn(webPushUtils, "savePushSubscription").mockResolvedValue();

      const req = new NextRequest("http://localhost:3000/api/notifications/subscribe", {
        method: "POST",
        body: JSON.stringify({
          subscription: {
            endpoint: "https://fcm.googleapis.com/fcm/send/abc-123",
            keys: {
              p256dh: "key-p256dh-abc",
              auth: "key-auth-xyz",
            },
          },
          favoriteTeams: ["VakıfBank"],
          favoriteMatches: ["match-1"],
        }),
      });

      const res = await subscribePost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "https://fcm.googleapis.com/fcm/send/abc-123",
          favoriteTeams: ["VakıfBank"],
          favoriteMatches: ["match-1"],
        })
      );
    });
  });

  describe("DELETE /api/notifications/subscribe", () => {
    it("endpoint eksikse 400 döner", async () => {
      const req = new NextRequest("http://localhost:3000/api/notifications/subscribe", {
        method: "DELETE",
        body: JSON.stringify({}),
      });

      const res = await subscribeDelete(req);
      expect(res.status).toBe(400);
    });

    it("geçerli endpoint ile aboneliği siler ve 200 döner", async () => {
      const removeSpy = vi.spyOn(webPushUtils, "removePushSubscription").mockResolvedValue();

      const req = new NextRequest("http://localhost:3000/api/notifications/subscribe", {
        method: "DELETE",
        body: JSON.stringify({ endpoint: "https://fcm.googleapis.com/fcm/send/abc-123" }),
      });

      const res = await subscribeDelete(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(removeSpy).toHaveBeenCalledWith("https://fcm.googleapis.com/fcm/send/abc-123");
    });
  });

  describe("POST /api/notifications/dispatch", () => {
    it("CRON_SECRET tanımlıysa ve yetkisizse 401 döner", async () => {
      process.env.CRON_SECRET = "super-secret-cron-token";

      const req = new NextRequest("http://localhost:3000/api/notifications/dispatch", {
        method: "POST",
      });

      const res = await dispatchPost(req);
      expect(res.status).toBe(401);
      delete process.env.CRON_SECRET;
    });

    it("hiç abone yoksa bildirim göndermeden başarı döner", async () => {
      vi.spyOn(webPushUtils, "getPushSubscriptions").mockResolvedValue([]);

      const req = new NextRequest("http://localhost:3000/api/notifications/dispatch", {
        method: "POST",
      });

      const res = await dispatchPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.sent).toBe(0);
      expect(data.message).toContain("Aktif bildirim abonesi bulunamadı");
    });

    it("aboneler varsa ve maç eşleşiyorsa push bildirimini tetikler", async () => {
      vi.spyOn(webPushUtils, "getPushSubscriptions").mockResolvedValue([
        {
          endpoint: "https://fcm.googleapis.com/fcm/send/sub-1",
          keys: { p256dh: "p1", auth: "a1" },
          favoriteTeams: ["VakıfBank"],
          createdAt: new Date().toISOString(),
        },
      ]);

      const sendSpy = vi.spyOn(webPushUtils, "sendWebPush").mockResolvedValue({
        success: true,
        statusCode: 201,
      });

      // Maç saatini şimdiden 15 dk sonraya simüle et (leadMinutes=30 penceresine girsin)
      const req = new NextRequest("http://localhost:3000/api/notifications/dispatch?leadMinutes=120", {
        method: "POST",
      });

      const res = await dispatchPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.totalSubscribers).toBe(1);
    });
  });
});
