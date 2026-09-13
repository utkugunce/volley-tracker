"use client";

import React from "react";
import { Calendar, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface DateItem {
  date: string;
  label: string;
  count: number;
  dayName?: string;
  isToday?: boolean;
}

interface DateNavigatorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  dates: DateItem[];
  totalMatches: number;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  selectedDate,
  onSelectDate,
  dates,
  totalMatches,
}) => {
  return (
    <div className="bg-[#0f172a] border-y border-slate-800 py-2 sticky top-[57px] sm:top-[65px] z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
        
        {/* Sol Sabit: Tümü Butonu */}
        <button
          onClick={() => onSelectDate("all")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shrink-0 transition-all ${
            selectedDate === "all"
              ? "bg-brand-500 text-white shadow-glow"
              : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Tüm Günler ({totalMatches})</span>
        </button>

        {/* Günler Yatay Bandı */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth flex-1 px-1">
          {dates.map((d) => {
            const isSelected = selectedDate === d.date;
            // 2026-09-12 bugün kabulü
            const isToday = d.date === "2026-09-12";
            const isTomorrow = d.date === "2026-09-13";

            return (
              <button
                key={d.date}
                onClick={() => onSelectDate(d.date)}
                className={`flex flex-col items-center justify-center min-w-[76px] py-1 px-2.5 rounded-lg text-xs font-bold transition-all shrink-0 border ${
                  isSelected
                    ? "bg-gradient-to-b from-brand-500 to-brand-600 text-white border-brand-400 shadow-glow"
                    : isToday
                    ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/40"
                    : "bg-slate-850 bg-[#141d33] text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white"
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wider block font-bold ${
                  isSelected ? "text-white" : isToday ? "text-emerald-400 font-black" : "text-slate-400"
                }`}>
                  {isToday ? "Bugün" : isTomorrow ? "Yarın" : d.dayName || d.label.split(" ")[2] || "Gün"}
                </span>

                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs font-black">{d.date.slice(8, 10)} Eyl</span>
                  <span
                    className={`text-[9px] font-black px-1 rounded-full ${
                      isSelected
                        ? "bg-black/40 text-white"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {d.count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
