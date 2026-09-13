"use client";

import React from "react";
import { Trophy, Users, Star, Flame, Building2 } from "lucide-react";
import { FixtureMetadata } from "../types";

interface StatsCardsProps {
  metadata?: FixtureMetadata;
  activeCityCount: number;
  activeCategoryCount?: Record<string, number>;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  metadata,
  activeCityCount,
  activeCategoryCount,
}) => {
  const stats = metadata?.stats;
  const gencCount = activeCategoryCount?.["Genç"] ?? stats?.by_category?.["Genç Kız"] ?? 0;
  const yildizCount = activeCategoryCount?.["Yıldız"] ?? stats?.by_category?.["Yıldız Kız"] ?? 0;
  const superLigCount = stats?.by_tier?.["Süper Lig"] ?? 0;
  const venuesCount = stats?.total_venues ?? 0;

  const cards = [
    {
      label: "Filtrelenen Kadın Maçı",
      value: activeCityCount,
      icon: Trophy,
      accent: "from-brand-500/20 to-brand-500/5",
      border: "border-brand-500/30",
      textColor: "text-brand-400",
      subtext: "Genç & Yıldız Şampiyonası",
    },
    {
      label: "Genç Kız Maçları",
      value: gencCount,
      icon: Users,
      accent: "from-accent-cyan/20 to-accent-cyan/5",
      border: "border-accent-cyan/30",
      textColor: "text-accent-cyan",
      subtext: "U18 Gençler Kategorisi",
    },
    {
      label: "Yıldız Kız Maçları",
      value: yildizCount,
      icon: Star,
      accent: "from-accent-purple/20 to-accent-purple/5",
      border: "border-accent-purple/30",
      textColor: "text-accent-purple",
      subtext: "U16 Yıldızlar Kategorisi",
    },
    {
      label: "Süper Lig Maçları",
      value: superLigCount,
      icon: Flame,
      accent: "from-accent-amber/20 to-accent-amber/5",
      border: "border-accent-amber/30",
      textColor: "text-amber-400",
      subtext: "En Üst Düzey Karşılaşmalar",
    },
    {
      label: "Aktif Spor Salonları",
      value: venuesCount,
      icon: Building2,
      accent: "from-accent-emerald/20 to-accent-emerald/5",
      border: "border-accent-emerald/30",
      textColor: "text-accent-emerald",
      subtext: "İstanbul & Ankara Merkezleri",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl p-4 bg-court-panel/80 border ${card.border} backdrop-blur-sm transition-all hover:scale-[1.02] shadow-sm`}
          >
            {/* Background glow gradient */}
            <div className={`absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-gradient-to-br ${card.accent} blur-xl pointer-events-none`} />

            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-400 truncate">
                {card.label}
              </span>
              <div className={`p-1.5 rounded-lg bg-court-card border border-white/5 ${card.textColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {card.value}
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">maç</span>
            </div>

            <p className="mt-1 text-[11px] text-slate-400 truncate font-medium">
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
};
