"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    // 1. ChunkLoadError Otomatik İyileştirme (Auto-Recovery)
    // Yeni bir dağıtım yapıldığında veya eski chunk hash'i 404 verdiğinde
    // sayfayı döngüye girmeden güvenle bir kez tam yeniler.
    const handleChunkError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = "error" in event ? event.error : event.reason;
      const message =
        error?.message ||
        ("message" in event ? (event as ErrorEvent).message : "") ||
        "";

      const isChunkError =
        message.includes("ChunkLoadError") ||
        message.includes("Loading chunk") ||
        message.includes("Refused to execute script");

      if (isChunkError && typeof window !== "undefined") {
        const key = "chunk_load_failed_reload";
        const lastReload = sessionStorage.getItem(key);
        const now = Date.now();

        // 15 saniye içinde yalnızca 1 kez otomatik yenile (sonsuz döngüyü engeller)
        if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
          sessionStorage.setItem(key, now.toString());
          console.warn(
            "Eski sürüm chunk yükleme hatası tespit edildi, sayfa güncel sürüm için yenileniyor..."
          );
          window.location.reload();
        }
      }
    };

    window.addEventListener("error", handleChunkError);
    window.addEventListener("unhandledrejection", handleChunkError);

    // 2. Service Worker Kayıt ve Yaşam Döngüsü
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            // Service worker güncellemelerini anında kontrol et
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (
                    newWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    // Yeni sürüm geldiğinde beklemeyi atlat
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                  }
                });
              }
            });

            if (process.env.NODE_ENV === "development") {
              console.log("Service Worker başarıyla kaydedildi:", registration.scope);
            }
          })
          .catch((error) => {
            console.warn("Service Worker kayıt hatası:", error);
          });
      });
    }

    return () => {
      window.removeEventListener("error", handleChunkError);
      window.removeEventListener("unhandledrejection", handleChunkError);
    };
  }, []);

  return null;
}
