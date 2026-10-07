"use client";

import React from "react";
import { RefreshCw, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { type AdminSyncStatus } from "./types";

export interface SyncStatusBannerProps {
  setSyncStatus: React.Dispatch<React.SetStateAction<AdminSyncStatus | null>>;
  syncStatus: AdminSyncStatus;
}

export function SyncStatusBanner({ setSyncStatus, syncStatus }: SyncStatusBannerProps) {
  return (
    <div
      className={`px-4 py-2 text-xs font-medium border-b animate-in fade-in duration-150 ${
        syncStatus.type === "success"
          ? "bg-emerald-950/90 text-emerald-300 border-emerald-800"
          : syncStatus.type === "info"
          ? "bg-sky-950/90 text-sky-300 border-sky-800"
          : "bg-rose-950/90 text-rose-300 border-rose-800"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {syncStatus.inProgress ? (
            <RefreshCw size={13} className="animate-spin text-sky-400 shrink-0" />
          ) : syncStatus.type === "success" ? (
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle size={14} className="text-rose-400 shrink-0" />
          )}
          <span>{syncStatus.message}</span>
          {syncStatus.inProgress && typeof syncStatus.remainingSeconds === "number" && (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold bg-sky-500/20 text-sky-200 border border-sky-400/40 px-2 py-0.5 rounded-full">
              <Clock size={10} className="text-sky-300 shrink-0" />
              <span>~{syncStatus.remainingSeconds} sn kaldı</span>
            </span>
          )}
        </div>
        <button
          onClick={() => setSyncStatus(null)}
          className="text-xs opacity-70 hover:opacity-100 transition-opacity px-1 cursor-pointer"
          title="Bildirimi Kapat"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
