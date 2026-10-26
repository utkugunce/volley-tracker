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
              <h2 className="font-bold leading-tight tracking-tight text-white text-[13px]">
                Kadınlar 1. Ligi
              </h2>
              <p className="text-[10px] text-ink-3">A & B Grubu Hiyerarşisi</p>
            </div>
          </div>
          <span className="font-mono tabular-nums text-[11px] font-medium text-ink-3">
            {totalMatches} Maç
          </span>
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

        {/* 2. BÖLÜM: 1. LİG ANA MENÜSÜ */}
        <div className="space-y-1 pb-2 border-b border-line/50">
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-3">
            1. Lig Menüsü
          </p>

          <button
            type="button"
            onClick={() => onSelectTab("home")}
            className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "home"
                ? "bg-primary text-primary-fg font-semibold"
                : "text-ink-2 hover:text-white hover:bg-surface-raised/60"
            }`}
          >
            <span className="flex items-center gap-2">
              <Trophy size={13} />
              <span className="text-[11px]">Genel Bakış (Portal)</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("standings")}
            className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "standings"
                ? "bg-primary text-primary-fg font-semibold"
                : "text-ink-2 hover:text-white hover:bg-surface-raised/60"
            }`}
          >
            <span className="flex items-center gap-2">
              <BarChart3 size={13} />
              <span className="text-[11px]">Puan Cetveli</span>
            </span>
            <span className="text-[10px] font-mono text-ink-3">
              {selectedGroup === "all" ? "Tümü" : selectedGroup === 1 ? "A Grubu" : "B Grubu"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("fixtures")}
            className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "fixtures"
                ? "bg-primary text-primary-fg font-semibold"
                : "text-ink-2 hover:text-white hover:bg-surface-raised/60"
            }`}
          >
            <span className="flex items-center gap-2">
              <CalendarDays size={13} />
              <span className="text-[11px]">Fikstür & Maçlar</span>
            </span>
            <span className="text-[10px] font-mono text-ink-3">{totalMatches}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("leaders")}
            className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "leaders"
                ? "bg-primary text-primary-fg font-semibold"
                : "text-ink-2 hover:text-white hover:bg-surface-raised/60"
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers size={13} />
              <span className="text-[11px]">2 Grup Durumu & Liderler</span>
            </span>
            <span className="text-[10px] font-mono text-ink-3">A & B</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("teams")}
            className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "teams"
                ? "bg-primary text-primary-fg font-semibold"
                : "text-ink-2 hover:text-white hover:bg-surface-raised/60"
            }`}
          >
            <span className="flex items-center gap-2">
              <Users size={13} />
              <span className="text-[11px]">Kulüpler & Kadrolar</span>
            </span>
            <span className="text-[10px] font-mono text-ink-3">28</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("karsilastir")}
            className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "karsilastir"
                ? "bg-primary text-primary-fg font-semibold"
                : "text-ink-2 hover:text-white hover:bg-surface-raised/60"
            }`}
          >
            <span className="flex items-center gap-2">
              <Swords size={13} />
              <span className="text-[11px]">H2H Takım Karşılaştır</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("statu")}
            className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "statu"
                ? "bg-primary text-primary-fg font-semibold"
                : "text-ink-2 hover:text-white hover:bg-surface-raised/60"
            }`}
          >
            <span className="flex items-center gap-2">
              <FileText size={13} />
              <span className="text-[11px]">Resmi Lig Statüsü</span>
            </span>
            <ChevronRight size={11} className="text-ink-3" />
          </button>
        </div>

        {/* 3. BÖLÜM: 2 GRUP LİSTESİ */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setIsGroupsOpen(!isGroupsOpen)}
            className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-3 hover:text-white transition-colors cursor-pointer"
          >
            <span>Gruplar ({groups.length})</span>
            <ChevronDown
              size={12}
              className={`transform transition-transform duration-200 ${
                isGroupsOpen ? "rotate-0" : "-rotate-90"
              }`}
            />
          </button>

          {isGroupsOpen && (
            <div className="space-y-0.5 pt-0.5">
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
                    ? "bg-primary/20 text-white font-semibold border border-primary/40"
                    : "hover:bg-surface-raised/60 text-ink-2 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                  <span className="font-medium text-[11px] truncate">Tüm Gruplar</span>
                </span>
                <span className="font-mono text-[10px] text-ink-3 tabular-nums">
                  {totalMatches} Maç
                </span>
              </button>

              {groups.map((group) => {
                const isSelected = selectedGroup === group.grup_no;
                const label = group.grup_adi || (group.grup_no === 1 ? "A Grubu" : "B Grubu");
                const leader = group.puan_durumu?.[0]?.takim_adi || "";

                return (
                  <button
                    key={group.grup_no}
                    type="button"
                    onClick={() => {
                      onSelectGroup(group.grup_no);
                      if (activeTab !== "standings" && activeTab !== "fixtures") {
                        onSelectTab("standings");
                      }
                    }}
                    className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary/20 text-white font-semibold border border-primary/40"
                        : "hover:bg-surface-raised/60 text-ink-2 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isSelected ? "bg-primary" : "bg-ink-3"
                        }`}
                      />
                      <div className="truncate text-left">
                        <span className="font-medium text-[11px] block leading-tight">
                          {label}
                        </span>
                        {leader && (
                          <span className="text-[9px] text-ink-3 truncate block leading-none mt-0.5">
                            Lider: {leader}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-ink-3 tabular-nums shrink-0 ml-1">
                      {group.takim_sayisi}T
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
