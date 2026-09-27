"use client";

import React, { useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

export type StatusFilterType = "all" | "live" | "finished" | "upcoming";

interface DateNavigationRibbonProps {
  selectedDate: string; // YYYY-MM-DD or "all"
  onSelectDate: (date: string) => void;
  todayStr: string; // YYYY-MM-DD
  statusFilter: StatusFilterType;
  onSelectStatusFilter: (status: StatusFilterType) => void;
  counts: {
    all: number;
    live: number;
    finished: number;
    upcoming: number;
  };
}

export const DateNavigationRibbon: React.FC<DateNavigationRibbonProps> = ({
  selectedDate,
  onSelectDate,
  todayStr,
  statusFilter,
  onSelectStatusFilter,
  counts,
}) => {
  // [-2 Gün, Dün, Bugün, Yarın, +2 Gün] hesapla
  const daysCarousel = useMemo(() => {
    const base = todayStr ? new Date(todayStr + "T00:00:00") : new Date();
    const offsets = [-2, -1, 0, 1, 2];

    const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

    return offsets.map((offset) => {
      const d = new Date(base);
      d.setDate(base.getDate() + offset);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      let label = "";
      if (offset === 0) label = "BUGÜN";
      else if (offset === -1) label = "DÜN";
      else if (offset === 1) label = "YARIN";
      else label = `${dd} ${dayNames[d.getDay()]}`;

      const shortDay = offset === 0 || offset === -1 || offset === 1 ? `${dd}.${mm}` : "";

      return {
        dateStr,
        label,
        shortDay,
        isToday: offset === 0,
      };
    });
  }, [todayStr]);

  return (
    <div className="sticky top-0 z-20 bg-[#1E222D]/95 backdrop-blur-md border border-[#2A2E3D] rounded-xl p-2 shadow-md space-y-2 mb-3">
      {/* 1. Tarih Şeridi: [-2, Dün, Bugün, Yarın, +2] + DatePicker */}
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {/* Tümü Butonu */}
        <button
          type="button"
          onClick={() => onSelectDate("all")}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            selectedDate === "all"
              ? "bg-blue-600 text-white shadow-md shadow-blue-900/50"
              : "bg-[#181A20] text-[#94A3B8] hover:text-white border border-[#2A2E3D]"
          }`}
        >
          TÜMÜ
        </button>

        {/* Günler Bandı */}
        <div className="flex-1 flex items-center justify-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {daysCarousel.map((item) => {
            const isSelected = selectedDate === item.dateStr;

            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => onSelectDate(item.dateStr)}
                className={`flex flex-col items-center justify-center px-2 sm:px-3 py-1 rounded-lg text-xs transition-all cursor-pointer min-w-[54px] ${
                  isSelected
                    ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-900/50 scale-102"
                    : item.isToday
                    ? "bg-[#181A20] text-blue-400 border border-blue-500/40 font-bold"
                    : "bg-[#181A20] text-[#94A3B8] hover:text-white border border-[#2A2E3D]"
                }`}
              >
                <span className="text-[11px] leading-tight">{item.label}</span>
                {item.shortDay && (
                  <span className="text-[9px] font-mono opacity-80 leading-none mt-0.5">
                    {item.shortDay}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Takvim İkonu ve Date Picker */}
        <label className="relative p-2 rounded-lg bg-[#181A20] border border-[#2A2E3D] hover:border-blue-500/50 text-[#94A3B8] hover:text-white transition-colors cursor-pointer shrink-0">
          <Calendar size={15} />
          <input
            type="date"
            value={selectedDate === "all" ? "" : selectedDate}
            onChange={(e) => {
              if (e.target.value) onSelectDate(e.target.value);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            title="Tarih Seç"
          />
        </label>
      </div>

      {/* 2. Durum Filtre Hapları */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-[#2A2E3D]/50 text-[11px]">
        {/* Tümü */}
        <button
          type="button"
          onClick={() => onSelectStatusFilter("all")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
            statusFilter === "all"
              ? "bg-blue-600 text-white"
              : "bg-[#181A20] text-[#94A3B8] hover:text-white border border-[#2A2E3D]"
          }`}
        >
          <span>Tümü</span>
          <span className="font-mono text-[10px] opacity-80 font-normal">({counts.all})</span>
        </button>

        {/* Canlı */}
        <button
          type="button"
          onClick={() => onSelectStatusFilter("live")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
            statusFilter === "live"
              ? "bg-[#EF4444] text-white animate-pulse"
              : "bg-[#181A20] text-[#EF4444] hover:bg-red-950/30 border border-red-900/40"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0" />
          <span>Canlı</span>
          <span className="font-mono text-[10px] opacity-90">({counts.live})</span>
        </button>

        {/* Biten */}
        <button
          type="button"
          onClick={() => onSelectStatusFilter("finished")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
            statusFilter === "finished"
              ? "bg-emerald-600 text-white"
              : "bg-[#181A20] text-emerald-400 hover:bg-emerald-950/30 border border-emerald-900/40"
          }`}
        >
          <span>Biten</span>
          <span className="font-mono text-[10px] opacity-90">({counts.finished})</span>
        </button>

        {/* Program (Oynanacak) */}
        <button
          type="button"
          onClick={() => onSelectStatusFilter("upcoming")}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
            statusFilter === "upcoming"
              ? "bg-slate-700 text-white"
              : "bg-[#181A20] text-slate-300 hover:text-white border border-[#2A2E3D]"
          }`}
        >
          <span>Program</span>
          <span className="font-mono text-[10px] opacity-90">({counts.upcoming})</span>
        </button>
      </div>
    </div>
  );
};
