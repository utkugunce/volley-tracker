"use client";

import React from "react";
import { CalendarDays, Flame, BarChart3, Layers, Star } from "lucide-react";

export type MobileTab =
  | "matches"
  | "live"
  | "standings"
  | "leagues"
  | "favorites"
  | "today"
  | "results"
  | "fixtures";

export interface MobileBottomNavProps {
  activeTab: MobileTab;
  onSelectTab: (tab: any) => void;
  favoriteCount?: number;
  liveCount?: number;
  todayMatchesCount?: number;
  resultsCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  favoriteCount = 0,
  liveCount = 0,
  todayMatchesCount = 0,
}) => {
  const navItems = [
    {
      id: "matches",
      label: "Maçlar",
      icon: CalendarDays,
      badge: todayMatchesCount > 0 ? todayMatchesCount : undefined,
    },
    {
      id: "live",
      label: "Canlı",
      icon: Flame,
      badge: liveCount > 0 ? liveCount : undefined,
      isLive: true,
    },
    {
      id: "standings",
      label: "Puan Durumu",
      icon: BarChart3,
    },
    {
      id: "leagues",
      label: "Ligler",
      icon: Layers,
    },
    {
      id: "favorites",
      label: "Favorilerim",
      icon: Star,
      badge: favoriteCount > 0 ? favoriteCount : undefined,
    },
  ];

  return (
    <nav
      aria-label="Mobil Alt Menü"
      className="fixed bottom-0 left-0 right-0 z-50 bg-panel border-t border-line lg:hidden px-1 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_20px_rgba(0,0,0,0.5)] transition-all duration-200"
    >
      <div className="flex items-center justify-between max-w-lg mx-auto w-full gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            (item.id === "matches" &&
              (activeTab === "matches" ||
                activeTab === "today" ||
                activeTab === "results" ||
                activeTab === "fixtures")) ||
            (item.id === "live" && activeTab === "live") ||
            (item.id === "standings" && activeTab === "standings") ||
            (item.id === "leagues" && activeTab === "leagues") ||
            (item.id === "favorites" && activeTab === "favorites");

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 cursor-pointer ${
                isActive
                  ? item.isLive
                    ? "text-live font-bold scale-105"
                    : "text-selected-text font-bold scale-105"
                  : "text-ink-2 hover:text-ink font-medium"
              }`}
            >
              <div className="relative">
                <Icon
                  size={20}
                  className={`transition-colors ${
                    isActive
                      ? item.isLive
                        ? "text-live fill-live/20"
                        : "text-selected-text fill-selected-text/20"
                      : "text-ink-2"
                  }`}
                />
                {item.isLive && liveCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-live" />
                  </span>
                )}
                {item.badge !== undefined && item.badge > 0 && !item.isLive && (
                  <span className="absolute -top-1.5 -right-2 min-w-[15px] h-3.5 px-0.5 text-selected-text text-[10px] font-display font-bold flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 truncate text-center w-full">
                {item.label}
              </span>
              {isActive && (
                <span
                  className={`absolute bottom-0 w-6 h-0.5 rounded-full ${
                    item.isLive ? "bg-live" : "bg-selected"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
