"use client";

import { RefreshCw } from "lucide-react";
import { toErrorLike } from "@/utils/errors";
import { AuditLogEntry, MatchOverride } from "@/utils/overrides";
import { Match } from "@/types/fixture";
import { type AdminUser } from "./types";

export interface SyncTabProps {
  auditLogs: AuditLogEntry[];
  matches: Match[];
  overrides: Record<string, MatchOverride>;
  users: AdminUser[];
}

export function SyncTab({ auditLogs, matches, overrides, users }: SyncTabProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <RefreshCw size={18} className="text-emerald-400" />
          Sync Geçmişi
        </h2>
        <button
          onClick={async () => {
            try {
              const res = await fetch("/api/sync/status");
              const data = await res.json();
              alert(`Son sync: ${data.lastSync ? new Date(data.lastSync).toLocaleString("tr-TR") : "Henüz sync yok"}`);
            } catch (error) {
              alert(`Hata: ${toErrorLike(error).message}`);
            }
          }}
          className="px-3 py-1.5 bg-done hover:bg-done/90 text-done-fg rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw size={13} />
          Durum Sorgula
        </button>
      </div>

      <div className="bg-slate-800/30 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-slate-300 mb-3">Son Sync İşlemleri</h4>
        {auditLogs.filter(log => log.action.includes("sync") || log.action.includes("import")).length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-4">
            Henüz sync geçmişi yok
          </div>
        ) : (
          <div className="space-y-2">
            {auditLogs
              .filter(log => log.action.includes("sync") || log.action.includes("import"))
              .slice(0, 10)
              .map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">
                      {log.action}
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      {log.updated_by} • {new Date(log.timestamp).toLocaleString("tr-TR")}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-medium ${
                    log.action.includes("success") || log.action.includes("tamamlandı")
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {log.action.includes("success") || log.action.includes("tamamlandı") ? "Başarılı" : "Hata"}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="mt-4 bg-slate-800/30 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-slate-300 mb-2">Veri Sağlığı İstatistikleri</h4>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-xl font-bold text-white">{matches.length}</div>
            <div className="text-xs text-slate-400">Toplam Maç</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-emerald-400">
              {matches.filter(m => m.status === "finished").length}
            </div>
            <div className="text-xs text-slate-400">Tamamlanan</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-400">
              {matches.filter(m => m.status === "upcoming").length}
            </div>
            <div className="text-xs text-slate-400">Yaklaşan</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-red-400">
              {matches.filter(m => m.status === "live").length}
            </div>
            <div className="text-xs text-slate-400">Canlı</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">{auditLogs.length}</div>
            <div className="text-xs text-slate-400">Audit Log</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">{users.length}</div>
            <div className="text-xs text-slate-400">Kullanıcı</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-warn">
              {Object.keys(overrides).length}
            </div>
            <div className="text-xs text-slate-400">Override</div>
          </div>
        </div>
      </div>
    </div>
  );
}
