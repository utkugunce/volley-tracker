"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Layers,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
import { Kadinlar2LigTabType } from "./Kadinlar2LigHeader";

interface Kadinlar2LigSidebarProps {
  groups: Kadinlar2LigGroup[];
  selectedGroup: number;
  activeTab: Kadinlar2LigTabType;
  favoritesCount: number;
  onSelectGroup: (groupNo: number) => void;
  onSelectTab: (tab: Kadinlar2LigTabType) => void;
}

export const Kadinlar2LigSidebar: React.FC<Kadinlar2LigSidebarProps> = ({
  groups,
  selectedGroup,
  activeTab,
  favoritesCount,
  onSelectGroup,
  onSelectTab,
}) => {
  const totalMatches = groups.reduce((sum, group) => sum + group.mac_sayisi, 0);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(true);
  const [isGroupsOpen, setIsGroupsOpen] = useState(true);

  return (
    <div className="flex h-full flex-col bg-panel text-xs select-none">
      {/* 1. Üst Başlık & Sofascore Lig Sayacı */}
      <div className="sticky top-0 z-10 border-b border-line bg-panel/95 px-3.5 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-primary/40 bg-primary/15 text-ink-2 shrink-0">
              <Trophy size={13} />
            </div>
            <div>
              <h2 className="font-bold leading-tight tracking-wide text-white text-[13px]">Kadınlar 2. Lig</h2>
              <p className="text-[10px] text-ink-2">16 Grup Hiyerarşisi</p>
            </div>
          </div>
          <span className="rounded border border-line bg-canvas px-2 py-0.5 font-display tabular-nums text-[10px] font-bold text-primary">
            {totalMatches} Maç
          </span>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-2">
        {/* 1. BÖLÜM: HIZLI ERİŞİM & GEÇİŞLER */}
        <div className="space-y-1 rounded-xl border border-line bg-surface-muted p-2">
          <button
            type="button"
            onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
            className="flex w-full items-center justify-between px-1.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-2 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Star size={12} className="text-amber-400 fill-amber-400/20" />
              <span>Hızlı Erişim</span>
            </span>
            <ChevronDown
              size={12}
              className={`transform transition-transform duration-200 ${isFavoritesOpen ? "rotate-0" : "-rotate-90"}`}
            />
          </button>

          {isFavoritesOpen && (
            <div className="space-y-1 pt-1">
              {/* Altyapı Ligleri (81 İl) Dönüş Köprüsü */}
              <Link
                href="/"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-teal-950/40 hover:bg-teal-950/70 border border-teal-800/40 text-teal-200 transition-all group"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                  <span className="font-semibold text-[11px] truncate group-hover:text-white">TVF Altyapı Ligleri</span>
                </span>
                <span className="text-[10px] text-teal-300 font-display tabular-nums shrink-0">81 İl →</span>
              </Link>

              {/* Takip Edilen Kulüpler / Yıldızlı */}
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-panel/60 hover:bg-panel border border-transparent hover:border-line text-ink transition-all">
                <span className="flex items-center gap-2">
                  <Star size={12} className="text-amber-400" />
                  <span className="font-medium text-[11px]">Takip Edilenler</span>
                </span>
                <span className="font-display text-[10px] font-semibold tabular-nums text-ink-2">
                  {favoritesCount}
                </span>
              </div>

              {/* 16 Grup Durumu */}
              <button
                type="button"
                onClick={() => onSelectTab("leaders")}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-all ${
                  activeTab === "leaders"
                    ? "border-l-2 border-primary bg-primary/10 text-ink font-bold"
                    : "text-slate-200 hover:bg-panel hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2 font-medium text-[11px]">
                  <Layers size={13} className="text-ink-2" />
                  <span>16 Grup Durumu</span>
                </span>
                <ChevronRight size={12} className="text-ink-2" />
              </button>

              {/* Kulüpler Listesi */}
              <button
                type="button"
                onClick={() => onSelectTab("teams")}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-all ${
                  activeTab === "teams"
                    ? "border-l-2 border-primary bg-primary/10 text-ink font-bold"
                    : "text-slate-200 hover:bg-panel hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2 font-medium text-[11px]">
                  <Users size={13} className="text-blue-300" />
                  <span>Kulüpler</span>
                </span>
                <ChevronRight size={12} className="text-ink-2" />
              </button>
            </div>
          )}
        </div>

        {/* 2. BÖLÜM: 16 GRUP HİYERARŞİSİ */}
        <div className="space-y-1 rounded-xl border border-line bg-surface-muted p-2">
          <button
            type="button"
            onClick={() => setIsGroupsOpen(!isGroupsOpen)}
            className="flex w-full items-center justify-between px-1.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-2 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <BarChart3 size={12} className="text-ink-2" />
              <span>Grup Seçimi (16 Grup)</span>
            </span>
            <ChevronDown
              size={12}
              className={`transform transition-transform duration-200 ${isGroupsOpen ? "rotate-0" : "-rotate-90"}`}
            />
          </button>

          {isGroupsOpen && (
            <div className="space-y-0.5 pt-1">
              {groups.map((group) => {
                const isActive =
                  selectedGroup === group.grup_no &&
                  (activeTab === "standings" || activeTab === "fixtures");
                return (
                  <div key={group.grup_no} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectGroup(group.grup_no);
                        onSelectTab("standings");
                      }}
                      className={`flex min-w-0 flex-1 items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-all cursor-pointer ${
                        isActive
                          ? "border-l-2 border-primary bg-primary/15 text-ink-2 font-bold"
                          : "text-ink-2 hover:bg-panel hover:text-white"
                      }`}
                    >
                      <span className="truncate text-xs font-semibold">Grup {group.grup_no}</span>
                      <span className="font-mono text-[10px] text-ink-2 bg-canvas px-1.5 py-0.2 rounded border border-line">
                        {group.takim_sayisi} Takım
                      </span>
                    </button>
                    <Link
                      href={`/kadinlar-2-ligi/fikstur${group.grup_no > 1 ? `/grup-${group.grup_no}` : ""}`}
                      onClick={() => {
                        onSelectGroup(group.grup_no);
                        onSelectTab("fixtures");
                      }}
                      className={`rounded-lg p-1.5 transition ${
                        selectedGroup === group.grup_no && activeTab === "fixtures"
                          ? "bg-primary/20 text-ink-2 border border-primary/40"
                          : "text-ink-2 hover:bg-panel hover:text-ink"
                      }`}
                      title={`Grup ${group.grup_no} fikstürü`}
                      aria-label={`Grup ${group.grup_no} fikstürü`}
                    >
                      <CalendarDays size={13} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};