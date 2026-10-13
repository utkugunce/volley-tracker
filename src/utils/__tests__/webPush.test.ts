import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { put, list, get, del } from "@vercel/blob";

vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
  list: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
}));

vi.mock("web-push", () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
}));

vi.mock("@/utils/supabaseAdmin", () => ({
  getSupabaseAdmin: () => null,
}));

type WebPushModule = typeof import("../webPush");

function makeSub(endpoint: string, createdAt = "2026-01-01T00:00:00.000Z") {
  return {
    endpoint,
    keys: { p256dh: `p256-${endpoint}`, auth: `auth-${endpoint}` },
    favoriteTeams: ["VakıfBank"],
    favoriteMatches: [],
    createdAt,
  };
}

function streamOf(value: unknown): ReadableStream<Uint8Array> {
  return new Response(JSON.stringify(value)).body as ReadableStream<Uint8Array>;
}

describe("webPush abonelik deposu (private Blob fallback)", () => {
  // Bellek içi sahte private store: pathname -> JSON
  let privateStore: Map<string, unknown>;
  let webPush: WebPushModule;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    privateStore = new Map();
    process.env.PUSH_SUBSCRIPTIONS_BLOB_TOKEN = "private-token";
    delete process.env.BLOB_READ_WRITE_TOKEN;

    vi.mocked(put).mockImplementation(async (pathname, body, options) => {
      expect(options?.access).toBe("private");
      expect(options?.token).toBe("private-token");
      privateStore.set(pathname, JSON.parse(String(body)));
      return { pathname } as Awaited<ReturnType<typeof put>>;
    });
    vi.mocked(list).mockImplementation(async (options) => {
      const prefix = options?.prefix || "";
      const blobs = [...privateStore.keys()]
        .filter((pathname) => pathname.startsWith(prefix))
        .map((pathname) => ({ pathname, url: `https://x.private.blob.vercel-storage.com/${pathname}` }));
      return { blobs, hasMore: false } as unknown as Awaited<ReturnType<typeof list>>;
    });
    vi.mocked(get).mockImplementation(async (pathname) => {
      if (!privateStore.has(pathname)) return null;
      return {
        statusCode: 200,
        stream: streamOf(privateStore.get(pathname)),
      } as unknown as Awaited<ReturnType<typeof get>>;
    });
    vi.mocked(del).mockImplementation(async (pathname) => {
      privateStore.delete(String(pathname));
    });

    webPush = await import("../webPush");
  });

  afterEach(() => {
    delete process.env.PUSH_SUBSCRIPTIONS_BLOB_TOKEN;
    delete process.env.BLOB_READ_WRITE_TOKEN;
  });

  it("her aboneliği sha256(endpoint) anahtarlı ayrı private nesneye yazar", async () => {
    await webPush.savePushSubscription(makeSub("https://push.example.com/a"));
    await webPush.savePushSubscription(makeSub("https://push.example.com/b"));

    const keys = [...privateStore.keys()];
    expect(keys).toHaveLength(2);
    for (const key of keys) {
      expect(key).toMatch(/^push-subscriptions\/[0-9a-f]{64}\.json$/);
    }
    expect(keys).toContain(webPush.subscriptionBlobPath("https://push.example.com/a"));
    // Tüm listeyi tek dosyaya yeniden yazmaz
    expect(vi.mocked(put)).toHaveBeenCalledTimes(2);
  });

  it("list + get ile tüm abonelikleri okur", async () => {
    await webPush.savePushSubscription(makeSub("https://push.example.com/a", "2026-01-01T00:00:00.000Z"));
    await webPush.savePushSubscription(makeSub("https://push.example.com/b", "2026-02-01T00:00:00.000Z"));

    const subs = await webPush.getPushSubscriptions();
    expect(subs.map((s) => s.endpoint)).toEqual([
      "https://push.example.com/b",
      "https://push.example.com/a",
    ]);
  });

  it("güncellemede orijinal oluşturma tarihini korur", async () => {
    await webPush.savePushSubscription(makeSub("https://push.example.com/a", "2026-01-01T00:00:00.000Z"));
    await webPush.savePushSubscription({
      ...makeSub("https://push.example.com/a", "2026-05-05T00:00:00.000Z"),
      favoriteTeams: ["Eczacıbaşı"],
    });

    const stored = privateStore.get(webPush.subscriptionBlobPath("https://push.example.com/a")) as {
      createdAt: string;
      favoriteTeams: string[];
    };
    expect(stored.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(stored.favoriteTeams).toEqual(["Eczacıbaşı"]);
  });

  it("silmede yalnızca ilgili nesneyi kaldırır", async () => {
    await webPush.savePushSubscription(makeSub("https://push.example.com/a"));
    await webPush.savePushSubscription(makeSub("https://push.example.com/b"));
    await webPush.removePushSubscription("https://push.example.com/a");

    expect(vi.mocked(del)).toHaveBeenCalledWith(
      webPush.subscriptionBlobPath("https://push.example.com/a"),
      { token: "private-token" }
    );
    const subs = await webPush.getPushSubscriptions();
    expect(subs.map((s) => s.endpoint)).toEqual(["https://push.example.com/b"]);
  });

  it("eski herkese açık push-subscriptions.json dosyasını private store'a taşıyıp siler", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "public-token";
    const legacyUrl = "https://x.public.blob.vercel-storage.com/push-subscriptions.json";
    const legacySubs = [makeSub("https://push.example.com/legacy")];

    vi.mocked(list).mockImplementation(async (options) => {
      if (options?.token === "public-token") {
        return {
          blobs: [{ pathname: "push-subscriptions.json", url: legacyUrl }],
          hasMore: false,
        } as unknown as Awaited<ReturnType<typeof list>>;
      }
      const blobs = [...privateStore.keys()].map((pathname) => ({ pathname, url: pathname }));
      return { blobs, hasMore: false } as unknown as Awaited<ReturnType<typeof list>>;
    });
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(legacySubs), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const subs = await webPush.getPushSubscriptions();
    vi.unstubAllGlobals();

    expect(fetchMock).toHaveBeenCalledWith(legacyUrl, expect.anything());
    expect(vi.mocked(del)).toHaveBeenCalledWith(legacyUrl, { token: "public-token" });
    expect(subs.map((s) => s.endpoint)).toEqual(["https://push.example.com/legacy"]);
  });

  it("private token yoksa hiçbir zaman Blob'a yazmaz", async () => {
    delete process.env.PUSH_SUBSCRIPTIONS_BLOB_TOKEN;
    process.env.BLOB_READ_WRITE_TOKEN = "public-token";
    vi.mocked(list).mockResolvedValue({ blobs: [], hasMore: false } as unknown as Awaited<
      ReturnType<typeof list>
    >);

    await webPush.savePushSubscription(makeSub("https://push.example.com/a"));
    expect(vi.mocked(put)).not.toHaveBeenCalled();
  });

  it("removePushSubscriptionsBatch ile birden çok aboneliği tek seferde siler", async () => {
    await webPush.savePushSubscription(makeSub("https://push.example.com/a"));
    await webPush.savePushSubscription(makeSub("https://push.example.com/b"));
    await webPush.savePushSubscription(makeSub("https://push.example.com/c"));

    await webPush.removePushSubscriptionsBatch([
      "https://push.example.com/a",
      "https://push.example.com/c",
    ]);

    const remaining = await webPush.getPushSubscriptions();
    expect(remaining.map((s) => s.endpoint)).toEqual(["https://push.example.com/b"]);
  });

  it("sendWebPushBatch 410 Gone veya 404 dönen ölü abonelikleri otomatik temizler", async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "test-pub-key";
    process.env.VAPID_PRIVATE_KEY = "test-priv-key";

    const subGood = makeSub("https://push.example.com/good");
    const subGone = makeSub("https://push.example.com/gone");
    const sub404 = makeSub("https://push.example.com/notfound");

    await webPush.savePushSubscription(subGood);
    await webPush.savePushSubscription(subGone);
    await webPush.savePushSubscription(sub404);

    const webpushMock = (await import("web-push")).default;
    vi.mocked(webpushMock.sendNotification).mockImplementation(async (subscription) => {
      const ep = (subscription as { endpoint: string }).endpoint;
      if (ep.includes("gone")) {
        const err = new Error("Subscription expired") as Error & { statusCode: number };
        err.statusCode = 410;
        throw err;
      }
      if (ep.includes("notfound")) {
        const err = new Error("Subscription not found") as Error & { statusCode: number };
        err.statusCode = 404;
        throw err;
      }
      return { statusCode: 201, body: "", headers: {} };
    });

    const result = await webPush.sendWebPushBatch(
      [subGood, subGone, sub404],
      { title: "Test", body: "Mesaj" }
    );

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(2);
    expect(result.expiredEndpoints).toEqual([
      "https://push.example.com/gone",
      "https://push.example.com/notfound",
    ]);

    const remaining = await webPush.getPushSubscriptions();
    expect(remaining.map((s) => s.endpoint)).toEqual(["https://push.example.com/good"]);
  });
});
