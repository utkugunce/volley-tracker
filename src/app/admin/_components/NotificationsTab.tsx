"use client";

import { toErrorLike } from "@/utils/errors";
import { RefreshCw } from "lucide-react";
import { type NotificationHistory } from "@/utils/notificationQueue";
import { type NotificationQueueStatus } from "./types";

export interface NotificationsTabProps {
  fetchNotificationStatus: () => Promise<void>;
  notificationHistory: NotificationHistory[];
  notificationStatus: NotificationQueueStatus | null;
  token: string;
}

export function NotificationsTab({ fetchNotificationStatus, notificationHistory, notificationStatus, token }: NotificationsTabProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          📢 Bildirim Yönetimi
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                const res = await fetch("/api/notifications/queue?action=process", {
                  method: "POST",
                  headers: { "x-admin-token": token },
                });
                const data = await res.json();
                if (data.success) {
                  alert(`${data.processed} bildirim işlendi`);
                  await fetchNotificationStatus();
                }
              } catch (error) {
                alert(`Hata: ${toErrorLike(error).message}`);
              }
            }}
            className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-fg font-bold rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={13} />
            İşle
          </button>
        </div>
      </div>

      {/* Kuyruk Durumu */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-white">{notificationStatus?.pending || 0}</div>
          <div className="text-xs text-slate-400">Bekleyen</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{notificationStatus?.processing || 0}</div>
          <div className="text-xs text-slate-400">İşleniyor</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">{notificationStatus?.sent || 0}</div>
          <div className="text-xs text-slate-400">Gönderildi</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{notificationStatus?.failed || 0}</div>
          <div className="text-xs text-slate-400">Başarısız</div>
        </div>
      </div>

      {/* Son Bildirimler */}
      <div className="bg-slate-800/30 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-slate-300 mb-3">Son Bildirimler</h4>
        {notificationHistory.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-4">
            Henüz bildirim geçmişi yok
          </div>
        ) : (
          <div className="space-y-2">
            {notificationHistory.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">
                    {item.payload.title}
                  </div>
                  <div className="text-slate-400 truncate">
                    {item.subscription_endpoint.substring(0, 30)}...
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-[10px] font-medium ${
                      item.status === "sent"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {item.status === "sent" ? "Gönderildi" : "Başarısız"}
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {new Date(item.created_at).toLocaleTimeString("tr-TR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
