// public/sw.js — Altyapı Voleybol Service Worker
const CACHE_NAME = "altyapi-voleybol-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/fonts/museo-sans-500.woff",
  "/fonts/museo-sans-700.woff",
];

// 1. Kurulum (Install): Statik çekirdek dosyaları önbelleğe al
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

// 2. Etkinleştirme (Activate): Eski önbellekleri temizle
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

// 3. İstekleri Karşılama (Fetch)
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API veya dinamik POST/DELETE isteklerini önbelleğe alma
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Ağdan çek, başarılı olursa önbelleği güncelle
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
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

// 4. Web Push Bildirimlerini Karşılama (Push Event — GÖREV 5 Entegrasyonu)
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

// 5. Bildirime Tıklama (Notification Click Event)
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
