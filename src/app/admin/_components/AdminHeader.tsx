"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, RefreshCw, Users, History } from "lucide-react";
import { type AdminTab, type AdminUser } from "./types";
import { AuditLogEntry } from "@/utils/overrides";
import { Match } from "@/types/fixture";

export interface AdminHeaderProps {
  activeTab: AdminTab;
  auditLogs: AuditLogEntry[];
  handleLogout: () => Promise<void>;
  handleTriggerLiveSync: () => Promise<void>;
  matches: Match[];
  setActiveTab: React.Dispatch<React.SetStateAction<AdminTab>>;
  syncLoading: boolean;
  teamsByCategory: { altyapı: string[]; lig: string[]; };
  users: AdminUser[];
}

export function AdminHeader({ activeTab, auditLogs, handleLogout, handleTriggerLiveSync, matches, setActiveTab, syncLoading, teamsByCategory, users }: AdminHeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <Link prefetch={false}
          href="/"
          className="text-xs text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
          title="Ana Sayfaya Dön"
        >
          <ChevronLeft size={16} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-base tracking-tight">Altyapı Voleybol</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              MANUEL DÜZELTME
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Veri Geçersiz Kılma ve Denetim Kaydı</p>
        </div>
      </div>

      <div className="flex items-center gap-2" role="tablist" aria-label="Yönetim sekmeleri">
        <button
          type="button"
          onClick={handleTriggerLiveSync}
          disabled={syncLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50 cursor-pointer shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          title="81 il bültenini ve Volleybox verilerini canlı tara"
        >
          <RefreshCw size={13} className={syncLoading ? "animate-spin" : ""} />
          <span>{syncLoading ? "Taranıyor..." : "Canlı Tara"}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "matches"}
          onClick={() => setActiveTab("matches")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            activeTab === "matches"
              ? "bg-selected-strong text-white font-bold shadow-glow-selected"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Maçlar ({matches.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "teams"}
          onClick={() => setActiveTab("teams")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            activeTab === "teams"
              ? "bg-selected-strong text-white font-bold shadow-glow-selected"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <Users size={13} aria-hidden="true" />
          Takımlar ({teamsByCategory.altyapı.length + teamsByCategory.lig.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "audit"}
          onClick={() => setActiveTab("audit")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            activeTab === "audit"
              ? "bg-selected-strong text-white font-bold shadow-glow-selected"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <History size={13} aria-hidden="true" />
          Denetim Günlüğü ({auditLogs.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "users"}
          onClick={() => setActiveTab("users")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            activeTab === "users"
              ? "bg-selected-strong text-white font-bold shadow-glow-selected"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <Users size={13} aria-hidden="true" />
          Kullanıcılar ({users.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "notifications"}
          onClick={() => setActiveTab("notifications")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            activeTab === "notifications"
              ? "bg-selected-strong text-white shadow-sm"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          📢 Bildirimler
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "sync"}
          onClick={() => setActiveTab("sync")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            activeTab === "sync"
              ? "bg-done text-done-fg shadow-sm"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <RefreshCw size={13} />
          Sync Geçmişi
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "clubs"}
          onClick={() => setActiveTab("clubs")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            activeTab === "clubs"
              ? "bg-done text-done-fg shadow-sm"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <Users size={13} />
          Kulüp Hesapları
        </button>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Yönetici oturumunu kapat"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/80 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          title="Oturumu Kapat"
        >
          Çıkış
        </button>
      </div>
    </header>
  );
}
