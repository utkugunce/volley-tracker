import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

type Listener = (event: any) => void;

const swSource = fs.readFileSync(path.resolve(__dirname, "../../public/sw.js"), "utf-8");

function makeCaches() {
  const stores = new Map<string, Map<string, Response>>();
  const keyOf = (r: any) => (typeof r === "string" ? r : r.url);
  const open = async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    return {
      put: async (req: any, res: Response) => void store.set(keyOf(req), res),
      add: async (req: any) => void store.set(keyOf(req), new Response("shell:" + keyOf(req))),
      addAll: async (reqs: string[]) => reqs.forEach((r) => store.set(r, new Response("asset:" + r))),
      keys: async () => [...store.keys()].map((url) => ({ url })),
      delete: async (req: any) => store.delete(keyOf(req)),
    };
  };
  const match = async (req: any, opts?: { cacheName?: string }) => {
    const names = opts?.cacheName ? [opts.cacheName] : [...stores.keys()];
    for (const n of names) {
      const hit = stores.get(n)?.get(keyOf(req));
      if (hit) return hit.clone();
    }
    return undefined;
  };
  return { stores, caches: { open, match, keys: async () => [...stores.keys()], delete: async (n: string) => stores.delete(n) } };
}

function loadWorker(fetchImpl: (req: any) => Promise<Response>) {
  const listeners: Record<string, Listener> = {};
  const { stores, caches } = makeCaches();
  const self = {
    addEventListener: (type: string, fn: Listener) => (listeners[type] = fn),
    skipWaiting: () => undefined,
    clients: { claim: () => undefined },
    registration: { showNotification: () => Promise.resolve() },
    location: { origin: "https://altyapivoleybol.com.tr" },
  };
  new Function("self", "caches", "fetch", "clients", "Response", "URL", swSource)(
    self,
    caches,
    fetchImpl,
    { matchAll: async () => [], openWindow: async () => undefined },
    Response,
    URL,
  );
  return { listeners, stores, caches };
}

function req(url: string, init: { method?: string; mode?: string; auth?: boolean; headers?: Record<string, string> } = {}) {
  const headers = new Map<string, string>();
  if (init.auth) headers.set("authorization", "Bearer x");
  for (const [k, v] of Object.entries(init.headers ?? {})) headers.set(k.toLowerCase(), v);
  if (init.mode === "navigate") headers.set("accept", "text/html");
  return {
    url: "https://altyapivoleybol.com.tr" + url,
    method: init.method ?? "GET",
    mode: init.mode ?? "cors",
    destination: init.mode === "navigate" ? "document" : "",
    headers: {
      get: (k: string) => headers.get(k.toLowerCase()) ?? null,
      has: (k: string) => headers.has(k.toLowerCase()),
    },
  };
}

async function dispatchFetch(listeners: Record<string, Listener>, request: any) {
  let responded: Promise<Response> | null = null;
  listeners.fetch({ request, respondWith: (p: Promise<Response>) => (responded = Promise.resolve(p)) });
  return responded as Promise<Response> | null;
}

describe("service worker (public/sw.js)", () => {
  let online = true;
  const network = async (r: any) => {
    if (!online) throw new TypeError("offline");
    return new Response(JSON.stringify({ url: r.url }), { status: 200 });
  };

  beforeEach(() => {
    online = true;
  });

  it("mevcut push ve bildirim tıklama dinleyicileri korunur", () => {
    const { listeners } = loadWorker(network);
    expect(typeof listeners.push).toBe("function");
    expect(typeof listeners.notificationclick).toBe("function");
    expect(typeof listeners.message).toBe("function");
  });

  it("kurulumda Türkçe çevrimdışı sayfasını ve ana sayfa kabuğunu önbelleğe alır", async () => {
    const { listeners, stores } = loadWorker(network);
    let p: Promise<unknown> = Promise.resolve();
    listeners.install({ waitUntil: (x: Promise<unknown>) => (p = x) });
    await p;
    const cache = [...stores.values()][0];
    expect(cache.has("/offline.html")).toBe(true);
    expect(cache.has("/")).toBe(true);
  });

  it("etkinleştirmede eski önbellekleri siler, güncel ve veri önbelleğini korur", async () => {
    const { listeners, stores } = loadWorker(network);
    stores.set("altyapi-voleybol-v4", new Map());
    stores.set("altyapi-voleybol-v5", new Map());
    stores.set("altyapi-voleybol-v6", new Map());
    stores.set("altyapi-voleybol-data-v1", new Map());
    stores.set("altyapi-voleybol-pages-v1", new Map());
    let p: Promise<unknown> = Promise.resolve();
    listeners.activate({ waitUntil: (x: Promise<unknown>) => (p = x) });
    await p;
    expect([...stores.keys()].sort()).toEqual(["altyapi-voleybol-data-v1", "altyapi-voleybol-pages-v1", "altyapi-voleybol-v6"]);
  });

  it("bildirim, kimlik doğrulama, yönetim ve POST istekleri ele alınmaz", async () => {
    const { listeners } = loadWorker(network);
    for (const r of [
      req("/api/notifications/subscribe"),
      req("/api/auth/me"),
      req("/api/admin/users"),
      req("/api/sync/status"),
      req("/api/fixtures?city=all&refresh=1"),
      req("/api/fixtures?city=all", { auth: true }),
      req("/api/fixtures?city=all", { method: "POST" }),
    ]) {
      expect(await dispatchFetch(listeners, r)).toBeNull();
    }
  });

  it("oturumlu sayfalar (/panel, /giris, /auth) service worker tarafından önbelleğe alınmaz", async () => {
    const { listeners, stores } = loadWorker(network);
    for (const r of [
      req("/panel", { mode: "navigate" }),
      req("/panel/yonetim", { mode: "navigate" }),
      req("/giris", { mode: "navigate" }),
      req("/auth/callback?code=abc", { mode: "navigate" }),
    ]) {
      expect(await dispatchFetch(listeners, r)).toBeNull();
    }
    expect([...stores.values()].every((s) => s.size === 0)).toBe(true);
  });

  it("/api/fixtures çevrimiçiyken ağ yanıtını döndürür, çevrimdışıyken son kayıtlı veriyi verir", async () => {
    const { listeners } = loadWorker(network);
    const request = req("/api/fixtures?city=istanbul");
    const live = await (await dispatchFetch(listeners, request))!;
    expect(live.status).toBe(200);
    await new Promise((r) => setTimeout(r, 10)); // önbelleğe yazma arka planda

    online = false;
    const offline = await (await dispatchFetch(listeners, request))!;
    expect(offline.status).toBe(200);
    expect(await offline.json()).toEqual({ url: request.url });
  });

  it("/api/fixtures çevrimdışı ve kayıt yoksa 503 JSON döner", async () => {
    const { listeners } = loadWorker(network);
    online = false;
    const res = await (await dispatchFetch(listeners, req("/api/cities")))!;
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/Çevrimdışı/);
  });

  it("sayfa gezintisi çevrimdışıyken: önbellekteki sayfa, yoksa çevrimdışı sayfası", async () => {
    const { listeners, stores } = loadWorker(network);
    let p: Promise<unknown> = Promise.resolve();
    listeners.install({ waitUntil: (x: Promise<unknown>) => (p = x) });
    await p;

    const visited = req("/istatistikler", { mode: "navigate" });
    await (await dispatchFetch(listeners, visited))!;
    await new Promise((r) => setTimeout(r, 10));

    online = false;
    const cachedPage = await (await dispatchFetch(listeners, visited))!;
    expect(await cachedPage.json()).toEqual({ url: visited.url });

    const unknown = await (await dispatchFetch(listeners, req("/takim/yok", { mode: "navigate" })))!;
    expect(await unknown.text()).toBe("asset:/offline.html");
    expect([...stores.keys()]).toContain("altyapi-voleybol-pages-v1");
  });

  it("veri önbelleği en fazla 40 kayıt tutar", async () => {
    const { listeners, stores } = loadWorker(network);
    for (let i = 0; i < 45; i++) {
      await dispatchFetch(listeners, req(`/api/fixtures?city=c${i}`));
      await new Promise((r) => setTimeout(r, 2));
    }
    await new Promise((r) => setTimeout(r, 30));
    expect(stores.get("altyapi-voleybol-data-v1")!.size).toBeLessThanOrEqual(40);
  });

  it("Next.js RSC / prefetch istekleri SW tarafından ele alınmaz ve önbelleğe yazılmaz", async () => {
    let calls = 0;
    const { listeners, stores } = loadWorker(async (r) => {
      calls++;
      return network(r);
    });
    for (const r of [
      req("/takim/eczacibasi-u18/istanbul?_rsc=abc"),
      req("/takim/eczacibasi-u18?sehir=istanbul&_rsc=abc"),
      req("/fikstur", { headers: { RSC: "1" } }),
      req("/sonuclar/afyon", { headers: { "Next-Router-Prefetch": "1" } }),
      req("/puan-durumu", { headers: { "Next-Router-State-Tree": "x" } }),
    ]) {
      expect(await dispatchFetch(listeners, r)).toBeNull();
    }
    await new Promise((r) => setTimeout(r, 10));
    expect(calls).toBe(0);
    expect([...stores.values()].every((s) => s.size === 0)).toBe(true);
  });

  it("ziyaret edilen sayfa önbelleği en fazla 20 kayıt tutar", async () => {
    const { listeners, stores } = loadWorker(network);
    for (let i = 0; i < 30; i++) {
      await (await dispatchFetch(listeners, req(`/puan-durumu/il${i}`, { mode: "navigate" })))!;
      await new Promise((r) => setTimeout(r, 2));
    }
    await new Promise((r) => setTimeout(r, 30));
    expect(stores.get("altyapi-voleybol-pages-v1")!.size).toBeLessThanOrEqual(20);
  });
});
