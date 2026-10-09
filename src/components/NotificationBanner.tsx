"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellRing, X, Info, Check } from "lucide-react";
import { Button } from "@/components/arc/button/button";
import { Badge } from "@/components/arc/badge/badge";
import {
  isNotificationSupported,
  isNotificationsEnabled,
  isBannerDismissed,
  dismissBanner,
  requestNotificationPermission,
  registerPushSubscription,
} from "@/utils/notifications";

interface NotificationBannerProps {
  favoritesCount: number;
  favoriteTeams?: string[];
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  favoritesCount,
  favoriteTeams = [],
}) => {
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
    if (granted) {
      // Arka plan web push aboneliğini kaydet
      try {
        await registerPushSubscription({ favoriteTeams });
      } catch (err) {
        console.warn("Push abonelik kaydı başarısız:", err);
      }
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setVisible(false);
      }, 2500);
    } else {
      setLoading(false);
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
              <Badge tone="info" size="sm">
                Canlı Hatırlatma
              </Badge>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Yıldızladığınız favori takımların maç saatine <strong>30 dakika kala</strong> canlı bildirim almak ister misiniz?
            </p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
              <Info size={12} className="text-blue-400 shrink-0" />
              <span>Web Push ile maç hatırlatmaları arka planda iletilir. Dilediğiniz zaman kapatabilirsiniz.</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {success ? (
            <Badge tone="success" size="md" icon={<Check size={14} />}>
              Bildirimler Aktif Edildi
            </Badge>
          ) : (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={handleEnable}
                loading={loading}
                className="font-bold cursor-pointer"
              >
                <Bell size={13} className="mr-1.5" />
                <span>{loading ? "İzin İsteniyor..." : "Bildirimleri Aç"}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="font-medium text-slate-300 hover:text-white cursor-pointer"
              >
                Şimdi Değil
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                title="Kapat"
                aria-label="Bildirim uyarısını kapat"
              >
                <X size={14} aria-hidden="true" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

