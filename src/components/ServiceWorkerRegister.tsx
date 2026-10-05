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

      // Opera yerleşik reklam / izleyici engelleyicisi ve üçüncü parti uzantılar
      // chunk hatası değildir; sayfayı yeniden yükleme döngüsüne sokmamalıdır.
      const lower = message.toLowerCase();
      const isBlockedByAdBlocker =
        lower.includes("gtag") ||
        lower.includes("analytics") ||
        lower.includes("google-analytics") ||
        lower.includes("speed-insights") ||
        lower.includes("err_blocked_by_client") ||
        lower.includes("extension");

      const isChunkError =
        !isBlockedByAdBlocker &&
        (message.includes("ChunkLoadError") ||
          message.includes("Loading chunk") ||
          (message.includes("Refused to execute script") && message.includes("/_next/static/")));

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
    let loadListener: (() => void) | null = null;
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing && navigator.serviceWorker.controller) {
          const key = "sw_controller_reload";
          const lastReload = sessionStorage.getItem(key);
          const now = Date.now();
          if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
            sessionStorage.setItem(key, now.toString());
            refreshing = true;
            window.location.reload();
          }
        }
      });

      const registerWorker = () => {
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
      };

      // "load" olayı hydration'dan önce tetiklenmiş olabilir; bu durumda dinleyici hiç çalışmazdı.
      if (document.readyState === "complete") {
        registerWorker();
      } else {
        loadListener = registerWorker;
        window.addEventListener("load", registerWorker, { once: true });
      }
    }

    return () => {
      window.removeEventListener("error", handleChunkError);
      window.removeEventListener("unhandledrejection", handleChunkError);
      if (loadListener) window.removeEventListener("load", loadListener);
    };
  }, []);

  return null;
}
