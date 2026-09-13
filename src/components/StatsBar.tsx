"use client";

import React from "react";
import { Match } from "@/types/fixture";
import { Calendar, Clock, CheckCircle2, MapPin } from "lucide-react";

interface StatsBarProps {
  matches: Match[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ matches }) => {
  const total = matches.length;
  const upcoming = matches.filter((m) => m.status === "upcoming").length;
  const finished = matches.filter((m) => m.status === "finished").length;
  const activeHalls = new Set(matches.map((m) => m.hall)).size;

  const items = [
    {
      label: "Toplam Maç Sayısı",
      value: total,
      sub: "Bültendeki Karşılaşmalar",
      icon: Calendar,
      color: "text-navy",
    },
    {
      label: "Oynanacak Maçlar",
      value: upcoming,
      sub: "Bekleyen Program",
      icon: Clock,
      color: "text-primary font-bold",
    },
    {
      label: "Tamamlanan Maçlar",
      value: finished,
      sub: "Sonuçlanan Skorlar",
      icon: CheckCircle2,
      color: "text-emerald-700",
    },
    {
      label: "Görevli Salonlar",
      value: activeHalls,
      sub: "Müsabaka Merkezleri",
      icon: MapPin,
      color: "text-slate-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-6xl mx-auto mb-6">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="bg-white border border-border rounded-lg p-3.5 shadow-sm hover:border-border-dark transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {item.label}
              </span>
              <Icon size={16} className="text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold tracking-tight ${item.color}`}>
                {item.value}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {item.sub}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
