"use client";

import React, { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
import { useLanguage } from "@/i18n/useLanguage";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

const getSnapshot = () => navigator.onLine;
// Sunucuda ve hydration sırasında çevrimiçi varsayılır (içerik değişmez).
const getServerSnapshot = () => true;

/** Bağlantı koptuğunda küçük bir bilgi çubuğu gösterir; çevrimiçiyken hiçbir şey render etmez. */
export const OfflineBanner: React.FC = () => {
  const online = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { t } = useLanguage();
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print fixed left-1/2 -translate-x-1/2 bottom-20 lg:bottom-4 z-[60] max-w-[92vw] flex items-center gap-2 rounded-full border border-warn/60 bg-panel text-ink px-4 py-2 text-xs font-semibold shadow-2xl"
    >
      <WifiOff size={14} className="text-warn shrink-0" aria-hidden="true" />
      <span>{t("offline.banner")}</span>
    </div>
  );
};
