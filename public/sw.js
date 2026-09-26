// public/sw.js — Altyapı Voleybol Service Worker
const CACHE_NAME = "altyapi-voleybol-v3";
const STATIC_ASSETS = [
  "/manifest.json",
  "/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/fonts/museo-sans-500.woff",
  "/fonts/museo-sans-700.woff",
];

// 1. Kurulum (Install): Sabit statik çekirdek dosyaları önbelleğe al (HTML sayfaları dinamik alınır)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Service worker cache.addAll uyarısı:", err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Etkinleştirme (Activate): Eski önbellekleri (v1 vb.) tamamen temizle ve yeni istemcileri hemen devral
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
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

// 4. İstekleri Karşılama (Fetch)
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Yalnızca GET isteklerini ele al, API ve telemetry isteklerini es geç
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) {
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
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // İnternet tamamen kesildiğinde (çevrimdışı modu) önbellekteki sayfaya dön
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
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
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

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
