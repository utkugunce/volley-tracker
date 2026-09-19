"use client";

import React from "react";
import { Flame, CalendarDays, BarChart3, Star, Trophy } from "lucide-react";

interface MobileBottomNavProps {
  activeTab: "today" | "results" | "fixtures" | "standings" | "favorites";
  onSelectTab: (tab: "today" | "results" | "fixtures" | "standings" | "favorites") => void;
  favoriteCount?: number;
  todayMatchesCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  favoriteCount = 0,
  todayMatchesCount = 0,
}) => {
  const navItems = [
    {
      id: "today" as const,
      label: "Günün Maçı",
      icon: Flame,
      badge: todayMatchesCount > 0 ? todayMatchesCount : undefined,
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
      id: "favorites" as const,
      label: "Favoriler",
      icon: Star,
      badge: favoriteCount > 0 ? favoriteCount : undefined,
    },
  ];

  return (
    <nav
      aria-label="Mobil Alt Menü"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-slate-950/90 border-t border-slate-800/80 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] transition-all duration-200"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 cursor-pointer ${
                isActive
                  ? "text-primary font-black scale-105"
                  : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              <div className="relative">
                <Icon
                  size={20}
                  className={`transition-colors ${
                    isActive ? "text-primary fill-primary/20" : "text-slate-400"
                  }`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-xs">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-primary shadow-glow-red" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
