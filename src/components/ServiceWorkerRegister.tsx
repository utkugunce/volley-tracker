"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Sayfa yüklendikten sonra service worker'ı kaydet
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            // Başarıyla kaydedildi
            if (process.env.NODE_ENV === "development") {
              console.log("Service Worker başarıyla kaydedildi:", registration.scope);
            }
          })
          .catch((error) => {
            console.warn("Service Worker kayıt hatası:", error);
          });
      });
    }
  }, []);

  return null;
}
