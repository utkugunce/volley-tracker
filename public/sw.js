// public/sw.js — Altyapı Voleybol Service Worker
const CACHE_NAME = "altyapi-voleybol-v6";
// Ziyaret edilen HTML sayfaları (çevrimdışı gösterim için) ayrı ve boyutu sınırlı bir önbellekte tutulur.
const PAGE_CACHE_NAME = "altyapi-voleybol-pages-v1";
const PAGE_CACHE_MAX_ENTRIES = 20;
// Son görülen fikstür/il verisi ayrı bir önbellekte tutulur (çevrimdışıyken gösterilir).
const DATA_CACHE_NAME = "altyapi-voleybol-data-v1";
const DATA_CACHE_MAX_ENTRIES = 40;
const STATIC_CACHE_MAX_ENTRIES = 60;
const OFFLINE_URL = "/offline.html";

// Önbellek boyutunu sınırlamak için en eski kayıtları temizler
async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - maxEntries; i++) {
      await cache.delete(keys[i]);
    }
  } catch {
    // ignore
  }
}
// Yalnızca herkese açık, salt okunur veri uçları önbelleğe alınır. Bildirim, kimlik doğrulama,
// yönetim ve senkronizasyon uçları (/api/notifications, /api/auth, /api/admin, /api/sync) asla.
const CACHEABLE_API_PATHS = ["/api/fixtures", "/api/cities"];
// Kimlik doğrulamalı alanlar (kulüp paneli, giriş, auth callback) asla önbelleğe alınmaz / SW'den geçirilmez.
const BYPASS_PATH_PREFIXES = ["/panel", "/giris", "/auth"];
const STATIC_ASSETS = [
  OFFLINE_URL,
  "/manifest.json",
  "/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// 1. Kurulum (Install): Sabit statik çekirdek dosyaları önbelleğe al (HTML sayfaları dinamik alınır)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache
        .addAll(STATIC_ASSETS)
        .catch((err) => {
          console.warn("Service worker cache.addAll uyarısı:", err);
        })
        // Uygulama kabuğu (ana sayfa) en iyi çabayla önceden alınır; başarısız olursa kurulum bozulmaz.
        .then(() => cache.add("/").catch(() => undefined));
    })
  );
  self.skipWaiting();
});

// 2. Etkinleştirme (Activate): Eski önbellekleri (v1 vb.) tamamen temizle ve yeni istemcileri hemen devral
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== DATA_CACHE_NAME && key !== PAGE_CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. Mesaj Dinleyicisi: SKIP_WAITING sinyali
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Yardımcılar: önbelleğe alınabilir veri isteği mi?
function isCacheableDataRequest(request, url) {
  if (!CACHEABLE_API_PATHS.includes(url.pathname)) return false;
  // Yönetici yenilemesi (?refresh=) ve yetkili (Authorization) istekler asla önbelleğe alınmaz.
  if (url.searchParams.has("refresh")) return false;
  if (request.headers.has("Authorization")) return false;
  return true;
}

// Ağ öncelikli: başarılı (200) yanıtı önbelleğe yazar; yalnızca ağ hatasında (çevrimdışı) önbellekten döner.
async function networkFirstData(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const copy = networkResponse.clone();
      caches
        .open(DATA_CACHE_NAME)
        .then(async (cache) => {
          await cache.put(request, copy);
          const keys = await cache.keys();
          // En eski kayıtları sil (Cache API ekleme sırasını korur).
          for (let i = 0; i < keys.length - DATA_CACHE_MAX_ENTRIES; i++) {
            await cache.delete(keys[i]);
          }
        })
        .catch(() => undefined);
    }
    return networkResponse;
  } catch (err) {
    const cached = await caches.match(request, { cacheName: DATA_CACHE_NAME });
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "Çevrimdışı: kayıtlı veri bulunamadı" }), {
      status: 503,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}

// 4. İstekleri Karşılama (Fetch)
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Yalnızca GET isteklerini ele al
  if (request.method !== "GET") {
    return;
  }

  // (-) Harici etki alanları (Google Analytics, Vercel Insights, CDN'ler vb.)
  // Asla SW tarafından ele alınmaz, doğrudan ağa bırakılır (Opera AdBlocker engellemeleriyle çatışmaz).
  if (url.origin !== self.location.origin) {
    return;
  }

  // (-) Next.js istemci yönlendiricisinin RSC / prefetch istekleri (`?_rsc=`, `RSC: 1`, `Next-Router-Prefetch`):
  // asla SW'den geçirilmez ve önbelleğe yazılmaz. Bunlar sayfa başına yüzlerce olabilir; eskiden "stale-while-revalidate"
  // dalına düşüp her biri Cache Storage'a yazılıyor (+ trim için keys() taranıyor), bayat RSC verisi de döndürülebiliyordu.
  if (
    url.searchParams.has("_rsc") ||
    request.headers.get("RSC") === "1" ||
    request.headers.has("Next-Router-Prefetch") ||
    request.headers.has("Next-Router-State-Tree")
  ) {
    return;
  }

  // (-) Oturumlu sayfalar: tarayıcıya bırak (önbellek yok).
  if (BYPASS_PATH_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) {
    return;
  }

  // (0) API: yalnızca açık veri uçları "ağ öncelikli" (çevrimdışıyken son kayıtlı veri); diğer tüm /api/ istekleri es geçilir.
  if (url.pathname.startsWith("/api/")) {
    if (isCacheableDataRequest(request, url)) {
      event.respondWith(networkFirstData(request));
    }
    return;
  }

  // (A) Sayfa Gezinme İstekleri (HTML Document) -> Her zaman Network-First!
  // Bu strateji sayesinde yeni dağıtımlarda kullanıcı asla eski HTML ve artık sunucuda olmayan
  // eski chunk hash'lerine (404 ChunkLoadError) takılmaz.
  const isNavigation =
    request.mode === "navigate" ||
    request.destination === "document" ||
    request.headers.get("accept")?.includes("text/html");

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches
              .open(PAGE_CACHE_NAME)
              .then(async (cache) => {
                await cache.put(request, responseToCache);
                await trimCache(PAGE_CACHE_NAME, PAGE_CACHE_MAX_ENTRIES);
              })
              .catch(() => undefined);
          }
          return networkResponse;
        })
        .catch(async () => {
          // İnternet tamamen kesildiğinde (çevrimdışı modu) önbellekteki sayfaya dön
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          // Önbellekte olmayan sayfa: Türkçe çevrimdışı sayfası (ana sayfaya bağlantısı vardır)
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) return offlinePage;
          const fallbackHome = await caches.match("/");
          if (fallbackHome) return fallbackHome;
          return new Response("Çevrimdışı mod: Bu sayfa henüz önbelleğe kaydedilmemiş.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        })
    );
    return;
  }

  // (B) Next.js Statik Dosyaları (/_next/static/...) -> Cache-First
  // Next.js statik dosyaları içerik hash'i içerdiğinden değişmezdir.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // (C) Diğer Statik Varlıklar (Font, İkon vb.) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(async (cache) => {
              await cache.put(request, responseToCache);
              trimCache(CACHE_NAME, STATIC_CACHE_MAX_ENTRIES);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse || Response.error());

      return cachedResponse || fetchPromise;
    })
  );
});

// 5. Web Push Bildirimlerini Karşılama (Push Event)
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || "Altyapı Voleybol";
    const options = {
      body: payload.body || "Favori takımınızın maçı yaklaşıyor!",
      icon: payload.icon || "/icons/icon-192.png",
      badge: payload.badge || "/icon.svg",
      tag: payload.tag || "match-reminder",
      data: payload.data || { url: "/" },
      vibrate: [200, 100, 200],
      actions: [
        { action: "open", title: "Maçı İncele" },
        { action: "close", title: "Kapat" },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error("Push bildirimi işlenirken hata:", err);
  }
});

// 6. Bildirime Tıklama (Notification Click Event)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Açık bir sekme varsa ona odaklan
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Açık sekme yoksa yeni sekme aç
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
