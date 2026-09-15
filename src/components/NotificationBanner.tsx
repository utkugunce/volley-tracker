"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellRing, X, Info, Check } from "lucide-react";
import {
  isNotificationSupported,
  isNotificationsEnabled,
  isBannerDismissed,
  dismissBanner,
  requestNotificationPermission,
} from "@/utils/notifications";

interface NotificationBannerProps {
  favoritesCount: number;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ favoritesCount }) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Sadece favori eklendiğinde, daha önce reddedilmemişse ve henüz izin verilmemişse göster
    if (
      favoritesCount > 0 &&
      isNotificationSupported() &&
      !isNotificationsEnabled() &&
      !isBannerDismissed()
    ) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [favoritesCount]);

  if (!mounted || !visible) return null;

  const handleEnable = async () => {
    setLoading(true);
    const granted = await requestNotificationPermission();
    setLoading(false);
    if (granted) {
      setSuccess(true);
      setTimeout(() => {
        setVisible(false);
      }, 2000);
    } else {
      // Reddedildi veya engellendi
      dismissBanner();
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    dismissBanner();
    setVisible(false);
  };

  return (
    <div className="bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-slate-900/95 border-b border-blue-500/30 text-white px-4 py-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0 mt-0.5 md:mt-0">
            {success ? <Check size={18} className="text-emerald-400" /> : <BellRing size={18} className="animate-bounce" />}
          </div>
          <div>
            <div className="text-sm font-semibold flex items-center gap-2">
              <span>Favori Takım Maç Hatırlatıcısı</span>
              <span className="text-[10px] uppercase tracking-wider font-bold bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded">
                Canlı Hatırlatma
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Yıldızladığınız favori takımların maç saatine <strong>30 dakika kala</strong> tarayıcınızdan canlı bildirim almak ister misiniz?
            </p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
              <Info size={12} className="text-blue-400 shrink-0" />
              <span>Bildirimler tarayıcı sekmeniz açıkken iletilir. Dilediğiniz zaman kapatabilirsiniz.</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {success ? (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 px-3 py-1.5 bg-emerald-950/60 rounded-lg border border-emerald-500/30">
              <Check size={14} />
              Bildirimler Aktif Edildi
            </span>
          ) : (
            <>
              <button
                onClick={handleEnable}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow transition-all cursor-pointer disabled:opacity-50"
              >
                <Bell size={13} />
                {loading ? "İzin İsteniyor..." : "Bildirimleri Aç"}
              </button>
              <button
                onClick={handleDismiss}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Şimdi Değil
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                title="Kapat"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
