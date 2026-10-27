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
import { SultanlarTabType } from "@/utils/sultanlarLigiRoutes";

interface SultanlarLigiSidebarProps {
  groups: Kadinlar2LigGroup[];
  activeTab: SultanlarTabType;
  favoritesCount: number;
  showOnlyFavorites?: boolean;
  onToggleFavoritesOnly?: () => void;
  onSelectTab: (tab: SultanlarTabType) => void;
  onToggleCollapse?: () => void;
}

export const SultanlarLigiSidebar: React.FC<SultanlarLigiSidebarProps> = ({
  groups,
  activeTab,
  favoritesCount,
  showOnlyFavorites = false,
  onToggleFavoritesOnly,
  onSelectTab,
  onToggleCollapse,
}) => {
  const totalMatches = groups.reduce((sum, group) => sum + group.mac_sayisi, 0);
  const teams = groups[0]?.puan_durumu || [];
  const totalTeams = teams.length || 14;
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(true);

  return (
    <div className="flex h-full flex-col bg-surface text-xs">
      {/* 1. Üst Başlık (Altyapı Standart Lig Ağacı) */}
      <div className="sticky top-0 z-10 border-b border-line/60 bg-surface px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Trophy size={14} className="text-amber-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-bold leading-tight tracking-tight text-white text-[13px] truncate">
                Lig Ağacı
              </h2>
              <p className="text-[10px] text-ink-3 truncate">Vodafone Sultanlar Ligi</p>
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
        {/* 1. BÖLÜM: HIZLI ERİŞİM & DİĞER LİGLER */}
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
                href="/kadinlar-1-ligi"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-raised/60 text-ink-2 hover:text-white transition-colors group"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="font-medium text-[11px] truncate">KFC Kadınlar 1. Ligi</span>
                </span>
                <span className="text-[10px] text-ink-3 font-mono shrink-0">A & B Grubu →</span>
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

        {/* 2. BÖLÜM: LİG AĞACI & TAKIMLAR */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-3">
            <span>Sultanlar Ligi Takımları</span>
            <span className="font-mono text-[10px]">{teams.length} Takım</span>
          </div>

          <div className="space-y-0.5">
            {teams.map((t, idx) => (
              <button
                key={t.takim_adi}
                type="button"
                onClick={() => onSelectTab("standings")}
                className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-raised/60 text-ink-2 hover:text-white transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-4 text-center font-mono text-[10px] font-bold shrink-0 ${
                      idx < 4
                        ? "text-amber-400"
                        : idx >= 12
                        ? "text-live"
                        : "text-ink-3"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-[11px] font-medium text-white truncate">
                    {t.takim_adi}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-1">
                  <span className="text-[10px] font-mono tabular-nums text-primary font-bold">
                    {t.p}P
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
