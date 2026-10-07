"use client";

import { History } from "lucide-react";
import { AuditLogEntry } from "@/utils/overrides";

export interface AuditLogTabProps {
  auditLogs: AuditLogEntry[];
}

export function AuditLogTab({ auditLogs }: AuditLogTabProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <History size={18} className="text-ink-2" />
        Manuel Düzenleme Geçmişi (Audit Log)
      </h2>

      {auditLogs.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Henüz kaydedilmiş bir manuel düzeltme bulunmuyor.
        </div>
      ) : (
        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-1.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      log.action === "create"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : log.action === "update"
                        ? "bg-blue-950 text-blue-400 border border-blue-800"
                        : "bg-red-950 text-red-400 border border-red-800"
                    }`}
                  >
                    {log.action}
                  </span>
                  <span className="font-mono text-slate-300 font-bold">
                    Maç #{log.match_id}
                  </span>
                  <span className="text-slate-400">({log.updated_by})</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {new Date(log.timestamp).toLocaleString("tr-TR")}
                </span>
              </div>

              <p className="text-slate-300">
                <strong>Gerekçe:</strong> {log.reason}
              </p>

              {log.new_value && (
                <div className="text-[11px] text-slate-400 font-mono">
                  Yeni Değer: Skor {log.new_value.home_score} - {log.new_value.away_score} | Durum: {log.new_value.status}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
