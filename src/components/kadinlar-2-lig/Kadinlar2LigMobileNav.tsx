"use client";

import React from "react";
import { Flame, CalendarDays, Trophy, Star, CheckCircle2, Layers, Users } from "lucide-react";
import { triggerHaptic } from "@/utils/haptics";

export type Kadinlar2LigTab = "today" | "results" | "fixtures" | "standings" | "leaders" | "teams";

interface Kadinlar2LigMobileNavProps {
  activeTab: Kadinlar2LigTab;
  onSelectTab: (tab: Kadinlar2LigTab) => void;
  showOnlyFavorites: boolean;
  onToggleFavorites: () => void;
  favoriteCount?: number;
  todayMatchesCount?: number;
  resultsCount?: number;
}

export const Kadinlar2LigMobileNav: React.FC<Kadinlar2LigMobileNavProps> = ({
  activeTab,
  onSelectTab,
  showOnlyFavorites,
  onToggleFavorites,
  favoriteCount = 0,
  todayMatchesCount = 0,
  resultsCount = 0,
}) => {
  const navItems = [
    {
      id: "today" as const,
      label: "Günün Maçı",
      icon: Flame,
      badge: todayMatchesCount > 0 ? todayMatchesCount : undefined,
      badgeColor: "bg-pink-600",
    },
    {
      id: "results" as const,
      label: "Sonuçlar",
      icon: CheckCircle2,
      badge: resultsCount > 0 ? resultsCount : undefined,
      badgeColor: "bg-emerald-600",
    },
    {
      id: "standings" as const,
      label: "Puan Cetveli",
      icon: Trophy,
    },
    {
      id: "fixtures" as const,
      label: "Fikstür",
      icon: CalendarDays,
    },
    {
      id: "leaders" as const,
      label: "16 Grup",
      icon: Layers,
    },
    {
      id: "teams" as const,
      label: "Kulüpler",
      icon: Users,
    },
  ];

  return (
    <nav
      aria-label="Kadınlar 2. Ligi Mobil Alt Menü"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-[#0b0818]/95 border-t border-purple-900/60 px-1 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_25px_rgba(88,28,135,0.35)] transition-all duration-200"
    >
      <div className="flex items-center justify-between max-w-lg mx-auto w-full gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                triggerHaptic();
                onSelectTab(item.id);
              }}
              className={`relative flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-150 cursor-pointer ${
                isActive
                  ? "text-pink-300 font-extrabold scale-105"
                  : "text-purple-300/70 hover:text-purple-100 font-medium"
              }`}
            >
              <div className="relative">
                <Icon
                  size={18}
                  className={`transition-colors ${
                    isActive ? "text-pink-400 stroke-[2.4]" : "text-purple-400/80"
                  }`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[15px] h-3.5 px-0.5 rounded-full ${item.badgeColor} text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-xs`}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] tracking-tight mt-0.5 truncate text-center w-full">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 shadow-sm" />
              )}
            </button>
          );
        })}

        {/* Favoriler Toggle Butonu */}
        <button
          onClick={() => {
            triggerHaptic();
            onToggleFavorites();
          }}
          className={`relative flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-150 cursor-pointer ${
            showOnlyFavorites
              ? "text-amber-300 font-extrabold scale-105"
              : "text-purple-300/70 hover:text-purple-100 font-medium"
          }`}
          title={showOnlyFavorites ? "Tümünü Göster" : "Sadece Favorilerimi Göster"}
        >
          <div className="relative">
            <Star
              size={18}
              className={`transition-colors ${
                showOnlyFavorites
                  ? "fill-amber-400 text-amber-400"
                  : "text-purple-400/80"
              }`}
            />
            {favoriteCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[15px] h-3.5 px-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-mono font-black flex items-center justify-center shadow-xs">
                {favoriteCount}
              </span>
            )}
          </div>
          <span className="text-[9px] tracking-tight mt-0.5 truncate text-center w-full">
            Favoriler
          </span>
          {showOnlyFavorites && (
            <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
          )}
        </button>
      </div>
    </nav>
  );
};
