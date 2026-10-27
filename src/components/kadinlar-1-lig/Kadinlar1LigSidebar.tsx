"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Star,
  Trophy,
  PanelLeftClose,
  CalendarDays,
} from "lucide-react";
import { Kadinlar2LigGroup } from "@/types/kadinlar2Lig";
import { Kadinlar1LigTabType } from "@/utils/kadinlar1LigRoutes";

interface Kadinlar1LigSidebarProps {
  groups: Kadinlar2LigGroup[];
  selectedGroup: number | "all";
  activeTab: Kadinlar1LigTabType;
  favoritesCount: number;
  showOnlyFavorites?: boolean;
  onToggleFavoritesOnly?: () => void;
  onSelectGroup: (groupNo: number | "all") => void;
  onSelectTab: (tab: Kadinlar1LigTabType) => void;
  onToggleCollapse?: () => void;
}

export const Kadinlar1LigSidebar: React.FC<Kadinlar1LigSidebarProps> = ({
  groups,
  selectedGroup,
  activeTab,
  favoritesCount,
  showOnlyFavorites = false,
  onToggleFavoritesOnly,
  onSelectGroup,
  onSelectTab,
  onToggleCollapse,
}) => {
  const totalMatches = groups.reduce((sum, group) => sum + group.mac_sayisi, 0);
  const totalTeams = groups.reduce((sum, group) => sum + group.takim_sayisi, 0);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({
    1: true,
    2: true,
  });

  const toggleGroupExpand = (gNo: number) => {
    setExpandedGroups((prev) => ({ ...prev, [gNo]: !prev[gNo] }));
  };

  return (
    <div className="flex h-full flex-col bg-surface text-xs">
      {/* 1. Üst Başlık (Altyapı Standart Lig Ağacı) */}
      <div className="sticky top-0 z-10 border-b border-line/60 bg-surface px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Trophy size={14} className="text-primary shrink-0" />
            <div className="min-w-0">
              <h2 className="font-bold leading-tight tracking-tight text-white text-[13px] truncate">
                Lig Ağacı
              </h2>
              <p className="text-[10px] text-ink-3 truncate">KFC Kadınlar 1. Ligi</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono tabular-nums text-[11px] font-medium text-ink-3">
              {totalTeams} Takım
            </span>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-raised/80 hover:bg-surface-raised text-ink-2 hover:text-white border border-line/60 transition-all cursor-pointer text-[11px] font-semibold active:scale-95"
                title="Lig Ağacını Daralt"
                aria-label="Lig Ağacını Daralt"
              >
                <PanelLeftClose size={13} className="text-primary" />
                <span>Daralt</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-2.5">
        {/* 1. BÖLÜM: HIZLI ERİŞİM & LİGLER */}
        <div className="space-y-1 pb-2 border-b border-line/50">
          <button
            type="button"
            onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
            className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-3 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Star size={12} className="text-warn" />
              <span>Ligler & Rehberler</span>
            </span>
            <ChevronDown
              size={12}
              className={`transform transition-transform duration-200 ${
                isFavoritesOpen ? "rotate-0" : "-rotate-90"
              }`}
            />
          </button>

          {isFavoritesOpen && (
            <div className="space-y-0.5 pt-0.5">
              <Link
                prefetch={false}
                href="/sultanlar-ligi"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-raised/60 text-ink-2 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="font-medium text-[11px] truncate">Vodafone Sultanlar Ligi</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono shrink-0">Süper Lig →</span>
              </Link>

              <Link
                prefetch={false}
                href="/kadinlar-2-ligi"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-raised/60 text-ink-2 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="font-medium text-[11px] truncate">Uzman Posta 2. Lig</span>
                </span>
                <span className="text-[10px] text-ink-3 font-mono shrink-0">16 Grup →</span>
              </Link>

              <Link
                prefetch={false}
                href="/"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-raised/60 text-ink-2 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                  <span className="font-medium text-[11px] truncate">TVF Altyapı Ligleri</span>
                </span>
                <span className="text-[10px] text-ink-3 font-mono shrink-0">81 İl →</span>
              </Link>

              <Link
                prefetch={false}
                href="/takvim"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-raised/60 text-ink-2 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-2 truncate">
                  <CalendarDays size={13} className="text-primary shrink-0" />
                  <span className="font-medium text-[11px] truncate">Voleybol Takvimi</span>
                </span>
                <span className="text-[10px] text-ink-3 font-mono shrink-0">Ajanda →</span>
              </Link>

              {/* Favori Filtresi Kısayolu */}
              {onToggleFavoritesOnly && (
                <button
                  type="button"
                  onClick={onToggleFavoritesOnly}
                  className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    showOnlyFavorites
                      ? "bg-warn/15 text-warn font-semibold border border-warn/30"
                      : "hover:bg-surface-raised/60 text-ink-2 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Star
                      size={12}
                      className={showOnlyFavorites ? "fill-warn text-warn" : "text-warn"}
                    />
                    <span className="text-[11px]">
                      {showOnlyFavorites ? "Sadece Favoriler Açık" : "Favorileri Filtrele"}
                    </span>
                  </span>
                  {favoritesCount > 0 && (
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        showOnlyFavorites ? "bg-warn text-black" : "bg-surface-raised text-ink-3"
                      }`}
                    >
                      {favoritesCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. BÖLÜM: LİG AĞACI & GRUPLAR (A & B Grubu) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-3">
            <span>Lig Grupları</span>
            <span className="font-mono text-[10px]">{totalMatches} Maç</span>
          </div>

          {/* Tüm Gruplar Butonu */}
          <button
            type="button"
            onClick={() => {
              onSelectGroup("all");
              if (activeTab !== "standings" && activeTab !== "fixtures") {
                onSelectTab("standings");
              }
            }}
            className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              selectedGroup === "all"
                ? "bg-primary text-primary-fg font-semibold shadow-xs"
                : "hover:bg-surface-raised/60 text-ink-2 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
              <span className="font-medium text-[11px] truncate">Tüm Gruplar (A & B)</span>
            </span>
            <span className="font-mono text-[10px] tabular-nums opacity-80">
              {totalTeams}T
            </span>
          </button>

          {/* A Grubu ve B Grubu Kartları */}
          {groups.map((group) => {
            const isSelected = selectedGroup === group.grup_no;
            const isExpanded = expandedGroups[group.grup_no] !== false;
            const label = group.grup_adi || (group.grup_no === 1 ? "A Grubu" : "B Grubu");
            const teamsList = group.puan_durumu || [];

            return (
              <div
                key={group.grup_no}
                className="rounded-xl border border-line/60 bg-surface-muted/30 overflow-hidden"
              >
                {/* Grup Başlığı */}
                <div
                  className={`flex items-center justify-between px-2.5 py-2 cursor-pointer transition-colors ${
                    isSelected ? "bg-primary/15 text-primary" : "hover:bg-surface-raised/60 text-white"
                  }`}
                  onClick={() => {
                    onSelectGroup(group.grup_no);
                    if (activeTab !== "standings" && activeTab !== "fixtures") {
                      onSelectTab("standings");
                    }
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isSelected ? "bg-primary ring-2 ring-primary/30" : "bg-ink-3"
                      }`}
                    />
                    <span className="font-bold text-[12px] truncate">{label}</span>
                    <span className="text-[10px] font-mono text-ink-3">
                      ({group.takim_sayisi} Takım)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroupExpand(group.grup_no);
                    }}
                    className="p-1 text-ink-3 hover:text-white cursor-pointer"
                  >
                    <ChevronDown
                      size={13}
                      className={`transform transition-transform duration-200 ${
                        isExpanded ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                  </button>
                </div>

                {/* Takımlar Listesi */}
                {isExpanded && teamsList.length > 0 && (
                  <div className="px-1.5 py-1 space-y-0.5 border-t border-line/40 bg-surface/50">
                    {teamsList.map((t, idx) => (
                      <div
                        key={t.takim_adi}
                        className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-surface-raised/60 text-ink-2 hover:text-white transition-colors"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`w-3.5 text-center font-mono text-[9px] font-bold shrink-0 ${
                              idx < 4 ? "text-primary" : idx >= 12 ? "text-live" : "text-ink-3"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-[10.5px] truncate text-ink">
                            {t.takim_adi}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono tabular-nums text-primary font-bold shrink-0 ml-1">
                          {t.p}P
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
