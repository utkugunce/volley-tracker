"use client";

import React from "react";
import {
  Home,
  Flame,
  CalendarDays,
  BarChart3,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Kadinlar2LigTabType } from "./Kadinlar2LigHeader";

interface Kadinlar2LigMobileNavProps {
  activeTab: Kadinlar2LigTabType;
  onSelectTab: (tab: Kadinlar2LigTabType) => void;
  showOnlyFavorites?: boolean;
  onToggleFavorites?: () => void;
  favoriteCount?: number;
  todayMatchesCount?: number;
  resultsCount?: number;
}

export const Kadinlar2LigMobileNav: React.FC<Kadinlar2LigMobileNavProps> = ({
  activeTab,
  onSelectTab,
  todayMatchesCount = 0,
  resultsCount = 0,
}) => {
  const navItems = [
    {
      id: "home" as const,
      label: "Anasayfa",
      icon: Home,
    },
    {
      id: "today" as const,
      label: "Günün Maçı",
      icon: Flame,
      badge: todayMatchesCount > 0 ? todayMatchesCount : undefined,
    },
    {
      id: "results" as const,
      label: "Sonuçlar",
      icon: CheckCircle2,
      badge: resultsCount > 0 ? resultsCount : undefined,
    },
    {
      id: "fixtures" as const,
      label: "Fikstür",
      icon: CalendarDays,
    },
    {
      id: "standings" as const,
      label: "Puan Durumu",
      icon: BarChart3,
    },
    {
      id: "statu" as const,
      label: "Statü",
      icon: FileText,
    },
  ];

  return (
    <nav
      aria-label="Mobil Alt Menü"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-line px-1 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]"
    >
      <div className="flex items-center justify-between max-w-2xl mx-auto w-full gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? "text-ink font-bold"
                  : "text-ink-3 hover:text-ink-2 font-medium"
              }`}
            >
              <div className="relative">
                <Icon
                  size={18}
                  className={`transition-colors ${
                    isActive ? "text-primary" : "text-ink-3"
                  }`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[14px] h-3.5 px-0.5 text-primary text-[9px] font-mono tabular-nums font-bold flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9.5px] xs:text-[10px] tracking-tight mt-0.5 truncate text-center w-full">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-0 w-6 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
