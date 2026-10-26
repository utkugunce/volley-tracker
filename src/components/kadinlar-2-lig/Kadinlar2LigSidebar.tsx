"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FileText,
  Layers,
  Star,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
import { Kadinlar2LigTabType } from "./Kadinlar2LigHeader";

interface Kadinlar2LigSidebarProps {
  groups: Kadinlar2LigGroup[];
  selectedGroup: number | "all";
  activeTab: Kadinlar2LigTabType;
  favoritesCount: number;
  showOnlyFavorites?: boolean;
  onToggleFavoritesOnly?: () => void;
  onSelectGroup: (groupNo: number | "all") => void;
  onSelectTab: (tab: Kadinlar2LigTabType) => void;
}

export const Kadinlar2LigSidebar: React.FC<Kadinlar2LigSidebarProps> = ({
  groups,
  selectedGroup,
  activeTab,
  favoritesCount,
  showOnlyFavorites = false,
  onToggleFavoritesOnly,
  onSelectGroup,
  onSelectTab,
}) => {
  const totalMatches = groups.reduce((sum, group) => sum + group.mac_sayisi, 0);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(true);
  const [isGroupsOpen, setIsGroupsOpen] = useState(true);

  return (
    <div className="flex h-full flex-col bg-surface text-xs">
      {/* 1. Üst Başlık */}
      <div className="sticky top-0 z-10 border-b border-line/60 bg-surface px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-primary shrink-0" />
            <div>
              <h2 className="font-bold leading-tight tracking-tight text-white text-[13px]">Kadınlar 2. Lig</h2>
              <p className="text-[10px] text-ink-3">16 Grup Hiyerarşisi</p>
            </div>
          </div>
          <span className="font-mono tabular-nums text-[11px] font-medium text-ink-3">
            {totalMatches} Maç
          </span>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-2.5">
        {/* 1. BÖLÜM: HIZLI ERİŞİM & GEÇİŞLER */}
        <div className="space-y-1 pb-2 border-b border-line/50">
          <button
            type="button"
            onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
            className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-3 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Star size={12} className="text-warn" />
              <span>Hızlı Erişim</span>
            </span>
            <ChevronDown
              size={12}
              className={`transform transition-transform duration-200 ${isFavoritesOpen ? "rotate-0" : "-rotate-90"}`}
            />
          </button>

          {isFavoritesOpen && (
            <div className="space-y-0.5 pt-0.5">
              <Link
                prefetch={false}
                href="/"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-raised/60 text-ink-2 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="font-medium text-[11px] truncate">TVF Altyapı Ligleri</span>
                </span>
                <span className="text-[10px] text-ink-3 font-display tabular-nums shrink-0">81 İl →</span>
              </Link>

              <button
                type="button"
                onClick={() => onToggleFavoritesOnly?.()}
                className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  showOnlyFavorites
                    ? "bg-warn/15 text-warn font-bold"
                    : "hover:bg-surface-raised/60 text-ink-2 hover:text-white"
                }`}
                title="Sadece takip ettiğim favori kulüpleri filtrele"
              >
                <span className="flex items-center gap-2">
                  <Star size={12} className={showOnlyFavorites ? "text-warn fill-warn" : "text-warn"} />
                  <span className="font-medium text-[11px]">Takip Edilenler</span>
                </span>
                <span className="font-display text-[10px] font-semibold tabular-nums text-ink-3">
                  {favoritesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab("leaders")}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors cursor-pointer ${
                  activeTab === "leaders"
                    ? "bg-primary/15 text-primary font-bold"
                    : "text-ink-2 hover:bg-surface-raised/60 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2 font-medium text-[11px]">
                  <Layers size={13} className="text-current opacity-80" />
                  <span>16 Grup Durumu</span>
                </span>
                <ChevronRight size={12} className="text-ink-3" />
              </button>

              <button
                type="button"
                onClick={() => onSelectTab("teams")}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors cursor-pointer ${
                  activeTab === "teams"
                    ? "bg-primary/15 text-primary font-bold"
                    : "text-ink-2 hover:bg-surface-raised/60 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2 font-medium text-[11px]">
                  <Users size={13} className="text-current opacity-80" />
                  <span>Kulüpler</span>
                </span>
                <ChevronRight size={12} className="text-ink-3" />
              </button>

              <button
                type="button"
                onClick={() => onSelectTab("karsilastir")}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors cursor-pointer ${
                  activeTab === "karsilastir"
                    ? "bg-primary/15 text-primary font-bold"
                    : "text-ink-2 hover:bg-surface-raised/60 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2 font-medium text-[11px]">
                  <Swords size={13} className="text-current opacity-80" />
                  <span>Karşılaştır (H2H)</span>
                </span>
                <ChevronRight size={12} className="text-ink-3" />
              </button>

              <button
                type="button"
                onClick={() => onSelectTab("statu")}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors cursor-pointer ${
                  activeTab === "statu"
                    ? "bg-primary/15 text-primary font-bold"
                    : "text-ink-2 hover:bg-surface-raised/60 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2 font-medium text-[11px]">
                  <FileText size={13} className="text-current opacity-80" />
                  <span>Resmi Statü & Rehber</span>
                </span>
                <ChevronRight size={12} className="text-ink-3" />
              </button>
            </div>
          )}
        </div>

        {/* 2. BÖLÜM: 16 GRUP HİYERARŞİSİ */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setIsGroupsOpen(!isGroupsOpen)}
            className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-3 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <BarChart3 size={12} className="text-primary" />
              <span>Grup Seçimi (16 Grup)</span>
            </span>
            <ChevronDown
              size={12}
              className={`transform transition-transform duration-200 ${isGroupsOpen ? "rotate-0" : "-rotate-90"}`}
            />
          </button>

          {isGroupsOpen && (
            <div className="space-y-0.5 pt-0.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectGroup("all");
                    onSelectTab(activeTab === "standings" ? "standings" : "fixtures");
                  }}
                  className={`flex min-w-0 flex-1 items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors cursor-pointer ${
                    selectedGroup === "all" &&
                    (activeTab === "standings" || activeTab === "fixtures")
                      ? "bg-primary/15 text-white font-bold"
                      : "text-ink-2 hover:bg-surface-raised/50 hover:text-white"
                  }`}
                >
                  <span className="truncate text-xs font-medium">Tüm Gruplar (1-16)</span>
                  <span className="font-mono tabular-nums text-[10px] text-ink-3">
                    {groups.length} Grup
                  </span>
                </button>
                <Link
                  prefetch={false}
                  href="/kadinlar-2-ligi/fikstur/tum-gruplar"
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectGroup("all");
                    onSelectTab("fixtures");
                  }}
                  className={`rounded-lg p-1.5 transition-colors ${
                    selectedGroup === "all" && activeTab === "fixtures"
                      ? "bg-primary/15 text-primary"
                      : "text-ink-3 hover:bg-surface-raised/50 hover:text-white"
                  }`}
                  title="Tüm Gruplar fikstürü"
                  aria-label="Tüm Gruplar fikstürü"
                >
                  <CalendarDays size={13} />
                </Link>
              </div>

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
                      className={`flex min-w-0 flex-1 items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors cursor-pointer ${
                        isActive
                          ? "bg-primary/15 text-white font-bold"
                          : "text-ink-2 hover:bg-surface-raised/50 hover:text-white"
                      }`}
                    >
                      <span className="truncate text-xs font-medium">Grup {group.grup_no}</span>
                      <span className="font-mono tabular-nums text-[10px] text-ink-3">
                        {group.takim_sayisi} Takım
                      </span>
                    </button>
                    <Link
                      prefetch={false}
                      href={`/kadinlar-2-ligi/fikstur${group.grup_no > 1 ? `/grup-${group.grup_no}` : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectGroup(group.grup_no);
                        onSelectTab("fixtures");
                      }}
                      className={`rounded-lg p-1.5 transition-colors ${
                        selectedGroup === group.grup_no && activeTab === "fixtures"
                          ? "bg-primary/15 text-primary"
                          : "text-ink-3 hover:bg-surface-raised/50 hover:text-white"
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
